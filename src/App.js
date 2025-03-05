import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import RegistrationForm from './components/RegistrationForm';
import AdminPage from './components/AdminPage';
import DisplayPage from './components/DisplayPage';


function App() {
  const [queue, setQueue] = useState([]);
  const [user, setUser] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const BASE_URL = 'http://172.29.42.90:5000'; // Your host PC’s IP

  useEffect(() => {
    fetchQueue();
    const ws = new WebSocket(`ws://${BASE_URL.split('http://')[1]}`);
    
    ws.onopen = () => console.log('WebSocket connected');
    
    ws.onmessage = (event) => {
      const { action, queue: updatedQueue } = JSON.parse(event.data);
      console.log('WebSocket received:', { action, queue: updatedQueue });
      setQueue(updatedQueue);
      setLastAction(action);
    };
    
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket disconnected');
    
    return () => ws.close();
  }, []);

  useEffect(() => {
    document.title = 'ระบบจัดการคิว';
  }, []); 

  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Ministry_of_Finance_of_Thailand.svg/1024px-Seal_of_the_Ministry_of_Finance_of_Thailand.svg.png'; // Path relative to public folder
    document.head.appendChild(link);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/queue`);
      setQueue(response.data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const joinQueue = async (name, email) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/queue`, { name, email });
      setUser(response.data);
    } catch (error) {
      console.error('Error joining queue:', error);
    }
  };

  const admitNext = async () => {
    try {
      await axios.post(`${BASE_URL}/api/admit`);
      if (queue[0]?.queueNumber === user?.queueNumber) {
        setUser({ ...queue[0], status: 'admitted' });
      }
    } catch (error) {
      console.error('Error admitting next:', error);
    }
  };

  const admitSpecific = async (id) => {
    try {
      await axios.post(`${BASE_URL}/api/admit/${id}`);
      const admittedUser = queue.find(q => q.id === id);
      if (admittedUser?.queueNumber === user?.queueNumber) {
        setUser({ ...admittedUser, status: 'admitted' });
      }
    } catch (error) {
      console.error('Error admitting specific user:', error);
    }
  };

  const resetQueue = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/queue`);
      setQueue([]);
      setUser(null);
    } catch (error) {
      console.error('Error resetting queue:', error);
    }
  };

  const removeQueueEntry = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/queue/${id}`);
      console.log(`Deleted queue entry with id: ${id}`); // Debug log
      // WebSocket will update queue state, no need to manually update here
      if (user?.id === id) setUser(null); // Clear user if deleted
    } catch (error) {
      console.error('Error removing queue entry:', error);
    }
  };

  const recallQueueEntry = async (id) => {
    try {
      await axios.post(`${BASE_URL}/api/recall/${id}`);
      if (user?.id === id) setUser({ ...user, status: 'waiting' });
    } catch (error) {
      console.error('Error recalling queue entry:', error);
    }
  };

  return (
    <Router>
      {/* <div className="App">
        <h1>Event Queue System</h1>
        <nav>
          <Link to="/register">Register</Link> | <Link to="/">Display</Link> | <Link to="/admin">Admin</Link>
        </nav> */}
        <Routes>
          <Route path="/" element={<DisplayPage queue={queue} user={user} lastAction={lastAction} />} />
          <Route path="/register" element={<RegistrationForm joinQueue={joinQueue} user={user} />} />
          <Route path="/admin" element={<AdminPage 
            queue={queue} 
            admitNext={admitNext} 
            admitSpecific={admitSpecific} 
            resetQueue={resetQueue} 
            removeQueueEntry={removeQueueEntry} 
            recallQueueEntry={recallQueueEntry} 
            baseUrl={BASE_URL} 
            lastAction={lastAction}
          />} />
        </Routes>
      {/* </div> */}
    </Router>
  );
}

export default App;