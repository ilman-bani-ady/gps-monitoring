import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Map from './components/Map';
import ListArmada from './pages/ListArmada';
import RouteMap from './pages/RouteMap';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Router>
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        {/* Header trigger */}
        <div className="header-trigger"></div>
        
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <h1>GPS Monitoring</h1>
          </div>
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Sidebar trigger */}
        <div className="sidebar-trigger"></div>
        
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-content">
            <Link to="/" className="sidebar-button">
              <span className="icon">🗺️</span>
              Peta
            </Link>
            <Link to="/routes" className="sidebar-button">
              <span className="icon">🛣️</span>
              Rute
            </Link>
            <Link to="/armada" className="sidebar-button">
              <span className="icon">🚗</span>
              List Armada
            </Link>
            <Link to="/user" className="sidebar-button">
              <span className="icon">👤</span>
              User
            </Link>
            <button className="sidebar-button logout">
              <span className="icon">🚪</span>
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Map darkMode={darkMode} />} />
            <Route path="/routes" element={<RouteMap darkMode={darkMode} />} />
            <Route path="/armada" element={<ListArmada />} />
            {/* Add other routes here */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
