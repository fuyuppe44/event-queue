const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { google } = require('googleapis');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Replace with your MySQL username
  password: 'P@ssw0rd',        // Replace with your MySQL password
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
  setupDatabase();
});

function setupDatabase() {
  db.query('CREATE DATABASE IF NOT EXISTS event_queue_db', (err) => {
    if (err) console.error('Error creating database:', err);
    else {
      console.log('Database event_queue_db created or exists');
      db.query('USE event_queue_db', (err) => {
        if (err) console.error('Error selecting database:', err);
        else {
          db.query(`
            CREATE TABLE IF NOT EXISTS queue (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              queueNumber INT NOT NULL,
              status ENUM('waiting', 'admitted') DEFAULT 'waiting',
              was_admitted BOOLEAN DEFAULT FALSE,
              last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating table:', err);
            else console.log('Table queue created or exists');
          });
        }
      });
    }
  });
}

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  keyFile: './credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// WebSocket Server Setup
const wss = new WebSocket.Server({ noServer: true });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });
});

// Broadcast queue update with action type to all connected clients
function broadcastQueueUpdate(action) {
  db.query('SELECT * FROM queue', (err, results) => {
    if (err) {
      console.error('Error fetching queue for broadcast:', err);
      return;
    }
    const message = JSON.stringify({ action, queue: results });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}

// API to get all queue entries
app.get('/api/queue', (req, res) => {
  db.query('SELECT * FROM queue', (err, results) => {
    if (err) {
      console.error('Error fetching queue:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// API to add a user to the queue
app.post('/api/queue', (req, res) => {
  const { name, email } = req.body;
  db.query('SELECT MAX(queueNumber) as maxNum FROM queue', (err, result) => {
    if (err) {
      console.error('Error getting max queueNumber:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const queueNumber = (result[0].maxNum || 0) + 1;
    db.query(
      'INSERT INTO queue (name, email, queueNumber, status) VALUES (?, ?, ?, ?)',
      [name, email, queueNumber, 'waiting'],
      (err) => {
        if (err) {
          console.error('Error inserting user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        broadcastQueueUpdate('add');
        res.json({ name, email, queueNumber, status: 'waiting' });
      }
    );
  });
});

// API to admit the next person
app.post('/api/admit', (req, res) => {
  db.query(
    'UPDATE queue SET status = "admitted", was_admitted = TRUE, last_updated = NOW() WHERE status = "waiting" ORDER BY queueNumber LIMIT 1',
    (err, result) => {
      if (err) {
        console.error('Error admitting next:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'No one to admit' });
      }
      broadcastQueueUpdate('admit');
      res.json({ message: 'Next person admitted' });
    }
  );
});

// API to admit a specific user by ID
app.post('/api/admit/:id', (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE queue SET status = "admitted", was_admitted = TRUE, last_updated = NOW() WHERE id = ? AND status = "waiting"',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error admitting specific user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found or not waiting' });
      }
      broadcastQueueUpdate('admit');
      res.json({ message: `User ${id} admitted` });
    }
  );
});

// API to recall an admitted user
app.post('/api/recall/:id', (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE queue SET status = "waiting", last_updated = NOW() WHERE id = ? AND status = "admitted"',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error recalling:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found or not admitted' });
      }
      broadcastQueueUpdate('recall');
      res.json({ message: 'User recalled to waiting queue' });
    }
  );
});

// API to remove a specific queue entry (updated to delete from Google Spreadsheet "Sheet1")
app.delete('/api/queue/:id', async (req, res) => {
  const { id } = req.params;

  // First, get the email of the entry to delete from MySQL
  db.query('SELECT email FROM queue WHERE id = ?', [id], async (err, results) => {
    if (err) {
      console.error('Error fetching email for deletion:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    const emailToDelete = results[0].email;

    // Delete from MySQL
    db.query('DELETE FROM queue WHERE id = ?', [id], async (err, result) => {
      if (err) {
        console.error('Error deleting queue entry from MySQL:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Queue entry not found' });
      }

      // Delete from Google Spreadsheet "Sheet1"
      try {
        const spreadsheetId = '1pK4NG7gHKmpZmessgJ452S6NWnUVxT4NuoiMZ0vDz7E';

        // Get all sheets to find "Sheet1" sheetId
        const sheetResponse = await sheets.spreadsheets.get({
          spreadsheetId,
        });
        const sheet = sheetResponse.data.sheets.find(s => s.properties.title === 'Sheet1');
        if (!sheet) {
          throw new Error('Sheet1 not found in spreadsheet');
        }
        const sheetId = sheet.properties.sheetId;

        // Fetch all data to find the row with matching email
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `Sheet1!A2:C`, // Adjust range based on your sheet structure
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[2] === emailToDelete); // Assuming email is in column C

        if (rowIndex !== -1) {
          const rowToDelete = rowIndex + 2; // +2 because A2:C starts at row 2, and findIndex is 0-based
          
          // Delete the row from the spreadsheet
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetId, // Dynamically fetched sheetId for "Sheet1"
                    dimension: 'ROWS',
                    startIndex: rowToDelete - 1, // 0-based index
                    endIndex: rowToDelete
                  }
                }
              }]
            }
          });
          console.log(`Deleted row ${rowToDelete} from Google Spreadsheet Sheet1`);
        } else {
          console.log('Row not found in Google Spreadsheet Sheet1');
        }

        // Broadcast update after both deletions
        broadcastQueueUpdate('remove');
        res.json({ message: 'Queue entry removed from database and Sheet1' });
      } catch (error) {
        console.error('Error deleting from Google Spreadsheet:', error);
        // Proceed with response even if spreadsheet deletion fails
        broadcastQueueUpdate('remove');
        res.json({ message: 'Queue entry removed from database (Sheet1 deletion failed)' });
      }
    });
  });
});

// API to reset the entire queue
app.delete('/api/queue', (req, res) => {
  db.query('TRUNCATE TABLE queue', (err) => {
    if (err) {
      console.error('Error resetting queue:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    broadcastQueueUpdate('reset');
    res.json({ message: 'Queue reset' });
  });
});

// Sync only new records from Google Form sheet to MySQL
app.post('/api/sync-google-sheet', async (req, res) => {
  const { formSpreadsheetId, newRecords } = req.body;

  try {
    // If newRecords is provided (from Apps Script), use it directly
    if (newRecords && Array.isArray(newRecords)) {
      db.query('SELECT email FROM queue', (err, results) => {
        if (err) {
          console.error('Error fetching existing emails:', err);
          throw err;
        }
        const existingEmails = new Set(results.map(row => row.email));
        const filteredNewRecords = newRecords.filter(record => record.email && !existingEmails.has(record.email));

        if (filteredNewRecords.length > 0) {
          db.query('SELECT MAX(queueNumber) as maxNum FROM queue', (err, result) => {
            if (err) {
              console.error('Error getting max queueNumber:', err);
              throw err;
            }
            let queueNumber = (result[0].maxNum || 0) + 1;

            const values = filteredNewRecords.map(record => [record.name, record.email, queueNumber++, 'waiting']);
            db.query(
              'INSERT INTO queue (name, email, queueNumber, status) VALUES ?',
              [values],
              (err) => {
                if (err) {
                  console.error('Error inserting new records:', err);
                  throw err;
                }
                console.log(`Synced ${filteredNewRecords.length} new records`);
                broadcastQueueUpdate('sync');
                res.json({ message: `Synced ${filteredNewRecords.length} new records` });
              }
            );
          });
        } else {
          console.log('No new records to sync');
          res.json({ message: 'No new records to sync' });
        }
      });
    } else {
      // Fallback to previous logic if no newRecords (for manual sync compatibility)
      db.query('SELECT email FROM queue', (err, results) => {
        if (err) {
          console.error('Error fetching existing emails:', err);
          throw err;
        }
        const existingEmails = new Set(results.map(row => row.email));

        const startRow = 2; // Default to A2 if no lastSyncedRow
        sheets.spreadsheets.values.get({
          spreadsheetId: formSpreadsheetId,
          range: `Sheet1!B${startRow}:C`, // B:Name, C:Email
        }, (err, response) => {
          if (err) {
            console.error('Error fetching Google Sheet:', err);
            throw err;
          }

          const rows = response.data.values || [];
          const newEntries = [];

          rows.forEach(row => {
            const [name, email] = row;
            if (name && email && !existingEmails.has(email)) {
              newEntries.push([name, email]);
              existingEmails.add(email);
            }
          });

          if (newEntries.length > 0) {
            db.query('SELECT MAX(queueNumber) as maxNum FROM queue', (err, result) => {
              if (err) {
                console.error('Error getting max queueNumber:', err);
                throw err;
              }
              let queueNumber = (result[0].maxNum || 0) + 1;

              const values = newEntries.map(([name, email]) => [name, email, queueNumber++, 'waiting']);
              db.query(
                'INSERT INTO queue (name, email, queueNumber, status) VALUES ?',
                [values],
                (err) => {
                  if (err) {
                    console.error('Error inserting new records:', err);
                    throw err;
                  }
                  console.log(`Synced ${newEntries.length} new records`);
                  broadcastQueueUpdate('sync');
                  res.json({ message: `Synced ${newEntries.length} new records` });
                }
              );
            });
          } else {
            console.log('No new records to sync');
            res.json({ message: 'No new records to sync' });
          }
        });
      });
    }
  } catch (error) {
    console.error('Error syncing Google Form sheet:', error);
    res.status(500).json({ error: 'Failed to sync' });
  }
});

// Start Express and WebSocket servers
const PORT = 5000;
const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});