import React, { useState, useEffect } from 'react';
import '../App.css';

function DisplayPage({ queue, user, lastAction }) {
  const [highlight, setHighlight] = useState(false);

  const waitingQueue = queue.filter(person => person.status === 'waiting');
  const displayedWaitingQueue = waitingQueue.slice(0, 10);

  // Filter users who are currently admitted (exclude recalled users with status 'waiting')
  const currentlyAdmitted = queue.filter(person => person.status === 'admitted' && person.was_admitted);

  // Find the most recently admitted user among those currently admitted
  const lastAdmitted = currentlyAdmitted.length > 0 
    ? currentlyAdmitted.reduce((latest, current) => 
        new Date(current.last_updated) > new Date(latest.last_updated) ? current : latest
      )
    : null;

  const position = waitingQueue.findIndex(p => p.queueNumber === user?.queueNumber) + 1;

  // Trigger highlight effect only when action is 'admit'
  useEffect(() => {
    if (lastAction === 'admit' && lastAdmitted) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 3000); // 3 seconds
      return () => clearTimeout(timer); // Cleanup
    }
  }, [lastAction, lastAdmitted]); // Depend on lastAction and lastAdmitted

  return (
    <div className="display-page">
      {/* Header with MOF Logo */}
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
      <main className="main-content">
        {user && (
          <section className="status-section">
            <h2 className="section-title">สถานะของคุณ (Your Status)</h2>
            <div className="status-card">
              {user.status === 'your-turn' ? (
                <p>ถึงคิวคุณแล้ว! กรุณาดำเนินการไปยังจุดเข้า (Your turn! Please proceed to the entrance.) <br />Queue #{user.queueNumber}</p>
              ) : user.status === 'admitted' ? (
                <p>คุณได้รับการรับเข้าแล้ว! (You’ve been admitted!) <br />Queue #{user.queueNumber}</p>
              ) : (
                <div>
                  <p><strong>ชื่อ (Name):</strong> {user.name}</p>
                  <p><strong>หมายเลขคิว (Queue Number):</strong> {user.queueNumber}</p>
                  <p><strong>ตำแหน่งในคิว (Position in Line):</strong> {position > 0 ? position : 'กำลังดำเนินการ (Processing...)'}</p>
                  <p><strong>เวลาคาดการณ์ (Estimated Wait):</strong> {position > 0 ? `${position * 5} วินาที (seconds)` : 'ใกล้ถึงแล้ว! (Almost there!)'}</p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="queue-section">
          <h2 className="section-title">ลำดับคิวที่รอพบท่านปลัด</h2>
          {displayedWaitingQueue.length > 0 ? (
            <ul className="queue-list">
              {displayedWaitingQueue.map(person => (
                <li key={person.queueNumber} className="queue-item">
                  {person.queueNumber === user?.queueNumber
                    ? 'คุณ (You)'
                    : `คิวที่ - ${person.queueNumber}`} - {person.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">ไม่มีผู้รอในคิว! (No one waiting in the queue!)</p>
          )}
        </section>

        <section className="admitted-section">
          <h2 className="section-title">คิวที่กำลังเข้าพบท่านปลัด</h2>
          {lastAdmitted ? (
            <ul className="admitted-list">
              <li className={`admitted-item ${highlight ? 'blink-highlight' : ''}`}>
                {lastAdmitted.queueNumber === user?.queueNumber
                  ? 'คุณ (You)'
                  : `คิวที่ - ${lastAdmitted.queueNumber}`}
                {' - '}
                {lastAdmitted.name}
                {' (กำลังเข้าพบ)'}
              </li>
            </ul>
          ) : (
            <p className="empty-message">ยังไม่มีผู้ได้รับการเข้าพบ! (No one has been admitted yet!)</p>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>กระทรวงการคลัง (Ministry of Finance Thailand) | ติดต่อเรา: info@mof.go.th | อัปเดตเมื่อ: {new Date().toLocaleDateString('th-TH')}</p>
      </footer>
    </div>
  );
}

export default DisplayPage;