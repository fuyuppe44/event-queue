import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

function AdminPage({ queue, admitNext, admitSpecific, resetQueue, removeQueueEntry, recallQueueEntry, baseUrl, lastAction }) {
  const [waitingSearch, setWaitingSearch] = useState('');
  const [admittedSearch, setAdmittedSearch] = useState('');
  const [syncStatus, setSyncStatus] = useState('');

  const waitingQueue = queue.filter((person) => person.status === 'waiting');
  const admittedQueue = queue.filter((person) => person.status === 'admitted');

  const filteredWaitingQueue = waitingQueue.filter(person =>
    person.name.toLowerCase().includes(waitingSearch.toLowerCase()) ||
    person.email.toLowerCase().includes(waitingSearch.toLowerCase()) ||
    person.queueNumber.toString().includes(waitingSearch)
  );

  const filteredAdmittedQueue = admittedQueue.filter(person =>
    person.name.toLowerCase().includes(admittedSearch.toLowerCase()) ||
    person.email.toLowerCase().includes(admittedSearch.toLowerCase()) ||
    person.queueNumber.toString().includes(admittedSearch)
  );

  const syncGoogleSheet = async () => {
    const formSpreadsheetId = '1pK4NG7gHKmpZmessgJ452S6NWnUVxT4NuoiMZ0vDz7E';
    try {
      const response = await axios.post(`${baseUrl}/api/sync-google-sheet`, { formSpreadsheetId });
      setSyncStatus(response.data.message);
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error('Error syncing Google Sheet:', error);
      setSyncStatus('Sync failed');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  // Debug queue updates
  useEffect(() => {
    console.log('AdminPage queue updated:', queue);
  }, [queue]);

  return (
    <div className="display-page">
      <header className="header">
        <div className="header-container">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Ministry_of_Finance_of_Thailand.svg/1024px-Seal_of_the_Ministry_of_Finance_of_Thailand.svg.png"
            alt="Ministry of Finance Logo"
            className="header-logo"
            onError={(e) => e.target.src = 'https://via.placeholder.com/150x50?text=MOF+Logo'}
          />
          <h1>Queue Display / การแสดงคิว</h1>
        </div>
      </header>

      <div className="admin-page">
        <header className="admin-header">
          <h1>Admin Control Panel</h1>
          <div className="top-controls">
            {/* <button
              className="control-button"
              onClick={admitNext}
              disabled={waitingQueue.length === 0}
            >
              Admit Next Person
            </button> */}
            <button className="reset-button" onClick={resetQueue}>
              Reset All Queue
            </button>
            <button className="sync-button" onClick={syncGoogleSheet}>
              Sync Now
            </button>
          </div>
        </header>

        {syncStatus && <p className="sync-status">{syncStatus}</p>}

        <main className="admin-main">
          <section className="queue-section waiting-queue">
            <h2>คิวที่กำลังรอทั้งหมด</h2>
            <input
              type="text"
              placeholder="ค้นหาคิวที่ได้กำลังรอเข้าพบ..."
              value={waitingSearch}
              onChange={(e) => setWaitingSearch(e.target.value)}
              className="search-input"
            />
            <div className="queue-container">
              {filteredWaitingQueue.length > 0 ? (
                filteredWaitingQueue.map((person) => (
                  <div key={person.id} className="queue-card">
                    <div className="queue-info">
                      <span className="queue-number">คิวที่ - {person.queueNumber}</span>
                      <span className="queue-name">{person.name}</span>
                    </div>
                    <div className="queue-actions">
                      <button
                        className="remove-button"
                        onClick={() => removeQueueEntry(person.id)}
                      >
                        ลบ
                      </button>
                      <button
                        className="admit-button"
                        onClick={() => admitSpecific(person.id)}
                      >
                        เข้าพบ
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No one waiting in the queue matching your search!</p>
              )}
            </div>
          </section>

          <section className="queue-section admitted-queue">
            <h2>คิวที่ได้เข้าพบไปแล้ว</h2>
            <input
              type="text"
              placeholder="ค้นหาคิวที่ได้เข้าพบไปแล้ว..."
              value={admittedSearch}
              onChange={(e) => setWaitingSearch(e.target.value)}
              className="search-input"
            />
            <div className="queue-container">
              {filteredAdmittedQueue.length > 0 ? (
                filteredAdmittedQueue.map((person) => (
                  <div key={person.id} className="queue-card admitted-card">
                    <div className="queue-info">
                      <span className="queue-number">คิวที่ - {person.queueNumber}</span>
                      <span className="queue-name">{person.name}</span>
                      {/* <span className="queue-email">({person.email})</span> */}
                    </div>
                    <div className="queue-actions">
                      {/* <button
                        className="remove-button"
                        onClick={() => removeQueueEntry(person.id)}
                      >
                        ลบ
                      </button> */}
                      <button
                        className="recall-button"
                        onClick={() => recallQueueEntry(person.id)}
                      >
                        ดึงกลับคิว
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No one has been admitted matching your search!</p>
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="footer">
        <p>กระทรวงการคลัง (Ministry of Finance Thailand) | ติดต่อเรา: info@mof.go.th | อัปเดตเมื่อ: {new Date().toLocaleDateString('th-TH')}</p>
      </footer>
    </div>
  );
}

export default AdminPage;