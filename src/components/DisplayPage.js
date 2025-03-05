import React, { useState, useEffect } from 'react';
import '../App.css';

function DisplayPage({ queue, user, lastAction }) {
  const [highlight, setHighlight] = useState(false);

  const waitingQueue = queue.filter(person => person.status === 'waiting');
  const nextQueue = waitingQueue.length > 0 ? waitingQueue[0] : null; // First in waiting queue
  const displayedWaitingQueue = waitingQueue.slice(1, 11); // Rest of queue, limit to 5

  // Find the most recently admitted user
  const currentlyAdmitted = queue.filter(person => person.status === 'admitted' && person.was_admitted);
  const lastAdmitted = currentlyAdmitted.length > 0 
    ? currentlyAdmitted.reduce((latest, current) => 
        new Date(current.last_updated) > new Date(latest.last_updated) ? current : latest
      )
    : null;

  // Highlight effect for "Now Serving"
  useEffect(() => {
    if (lastAction === 'admit' && lastAdmitted) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAction, lastAdmitted]);

  return (
    <div className="queue-display-page">
      {/* Header */}
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

      {/* Main Content */}
      <div className="queue-content">
        {/* Left Section: Now Serving */}
        <div className="now-serving-section">
          <h2>Now Serving / กำลังเข้าพบ</h2>
          {lastAdmitted ? (
            <div className={`now-serving-box ${highlight ? 'highlight' : ''}`}>
              <div className="queue-number">คิวที่ {lastAdmitted.queueNumber}</div>
              <div className="queue-name">{lastAdmitted.name}</div>
            </div>
          ) : (
            <p>No one currently being served / ไม่มีผู้เข้าพบอยู่ในขณะนี้</p>
          )}
        </div>

        {/* Right Section: Next Queue and Queue List */}
        <div className="queue-list-container">
          {/* Next Queue List */}
          <div className="next-queue-section">
            <h2>Next Queue / คิวถัดไป</h2>
            {nextQueue ? (
              <div className="next-queue-box">
                <div className="queue-number-next">คิวที่ {nextQueue.queueNumber}</div>
                <div className="queue-name-next">{nextQueue.name}</div>
              </div>
            ) : (
              <p>No next queue / ไม่มีคิวถัดไป</p>
            )}
          </div>

          {/* Queue List */}
          <div className="queue-list-section">
            <h2>Queue List / รายการคิว</h2>
            {displayedWaitingQueue.length > 0 ? (
              <ul className="queue-list">
                {displayedWaitingQueue.map(person => (
                  <li key={person.queueNumber} className="queue-item">
                    คิวที่ {person.queueNumber} - {person.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No one waiting / ไม่มีผู้รอคิว</p>
            )}
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>กระทรวงการคลัง (Ministry of Finance Thailand) | ติดต่อเรา: info@mof.go.th | อัปเดตเมื่อ: {new Date().toLocaleDateString('th-TH')}</p>
      </footer>
    </div>
    
  );
}

export default DisplayPage;