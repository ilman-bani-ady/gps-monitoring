import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Map from './components/Map';
import ListArmada from './pages/ListArmada';
import RouteMap from './pages/RouteMap';
import History from './pages/History';
import User from './pages/User';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  return children;
};

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const { isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {isLoggedIn && (
        <>
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1>GPS Monitoring</h1>
            </div>
            <div className="header-right">
              <button 
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
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
              <Link to="/history" className="sidebar-button">
                <span className="icon">📜</span>
                History
              </Link>
              <Link to="/armada" className="sidebar-button">
                <span className="icon">🚗</span>
                List Armada
              </Link>
              <Link to="/user" className="sidebar-button">
                <span className="icon">👤</span>
                User
              </Link>
              <button className="sidebar-button logout" onClick={handleLogout}>
                <span className="icon">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Map darkMode={darkMode} />
            </ProtectedRoute>
          } />
          <Route path="/routes" element={
            <ProtectedRoute>
              <RouteMap darkMode={darkMode} />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <History darkMode={darkMode} />
            </ProtectedRoute>
          } />
          <Route path="/armada" element={
            <ProtectedRoute>
              <ListArmada />
            </ProtectedRoute>
          } />
          <Route path="/user" element={
            <ProtectedRoute>
              <User />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
