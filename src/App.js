import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink } from 'react-router-dom';
import ListArmada from './pages/ListArmada';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';
import Map from './components/Map';

// Fix untuk icon marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const position = [-6.200000, 106.816666];

  return (
    <Router>
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="header-trigger"></div>
        
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

        <div className="sidebar-trigger"></div>
        <div className="sidebar">
          <div className="sidebar-content">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive ? "sidebar-button active" : "sidebar-button"
              }
              end
            >
              <span className="icon">🗺️</span>
              Peta
            </NavLink>
            <NavLink 
              to="/history" 
              className={({ isActive }) => 
                isActive ? "sidebar-button active" : "sidebar-button"
              }
            >
              <span className="icon">📜</span>
              History
            </NavLink>
            <NavLink 
              to="/armada" 
              className={({ isActive }) => 
                isActive ? "sidebar-button active" : "sidebar-button"
              }
            >
              <span className="icon">🚗</span>
              List Armada
            </NavLink>
            <NavLink 
              to="/user" 
              className={({ isActive }) => 
                isActive ? "sidebar-button active" : "sidebar-button"
              }
            >
              <span className="icon">👤</span>
              User
            </NavLink>
            <button className="sidebar-button logout">
              <span className="icon">🚪</span>
              Logout
            </button>
          </div>
        </div>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Map />} />
            <Route path="/armada" element={<ListArmada />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
