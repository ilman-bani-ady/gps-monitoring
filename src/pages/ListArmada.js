import React, { useState, useEffect } from 'react';
import './ListArmada.css';

function ListArmada() {
  const [armada, setArmada] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchArmada(); // Initial fetch
    
    // Set interval untuk refresh setiap 5 detik
    const interval = setInterval(() => {
      fetchArmada(false); // false = silent refresh (tanpa loading indicator)
    }, 5000);

    // Cleanup interval saat component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchArmada = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setIsRefreshing(true);
    }

    try {
      const response = await fetch('http://localhost:3013/api/tracking/fleet');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      
      setArmada(result.data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchArmada(true); // true = tampilkan loading indicator
  };

  // Fungsi untuk mengecek range waktu update
  const getUpdateTimeRange = (lastUpdate) => {
    try {
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const currentTime = new Date().getTime();
      const diffInMinutes = (currentTime - lastUpdateTime) / (1000 * 60);
      return diffInMinutes;
    } catch {
      return Infinity;
    }
  };

  // Fungsi untuk menentukan status armada
  const getVehicleStatus = (speed, lastUpdate) => {
    const timeDiff = getUpdateTimeRange(lastUpdate);
    
    if (timeDiff <= 2) {
      return {
        text: 'Aktif',
        class: 'active'
      };
    } else if (timeDiff <= 5) {
      return {
        text: 'Bergerak',
        class: 'moving'
      };
    } else {
      return {
        text: 'Berhenti',
        class: 'stopped'
      };
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCoordinate = (coord) => {
    if (coord === null || coord === undefined) return 'N/A';
    try {
      return parseFloat(coord).toFixed(6);
    } catch {
      return 'N/A';
    }
  };

  const formatSpeed = (speed) => {
    if (speed === null || speed === undefined) return '0 km/h';
    try {
      return `${parseFloat(speed).toFixed(1)} km/h`;
    } catch {
      return '0 km/h';
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading data armada...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <p>Error: {error}</p>
      <button onClick={fetchArmada} className="retry-button">Coba Lagi</button>
    </div>
  );

  return (
    <div className="list-armada">
      <div className="list-header">
        <h2>Daftar Armada Aktif</h2>
        <div className="header-info">
          <div className="update-info">
            <span>Total Armada: {armada.length}</span>
            {lastUpdate && (
              <span className="last-update">
                Last Update: {lastUpdate}
              </span>
            )}
          </div>
          <button 
            onClick={handleRefresh} 
            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
            disabled={isRefreshing}
          >
            <span className="refresh-icon">🔄</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="armada-table-container">
        <table className="armada-table">
          <thead>
            <tr>
              <th>No</th>
              <th>ID Kendaraan</th>
              <th>Update Terakhir</th>
              <th>Lokasi</th>
              <th>Kecepatan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {armada.map((item, index) => {
              const status = getVehicleStatus(item.last_speed, item.last_update);
              
              return (
                <tr key={item.device_id || index}>
                  <td>{index + 1}</td>
                  <td>{item.device_id || 'Unknown'}</td>
                  <td>{formatDateTime(item.last_update)}</td>
                  <td>
                    {item.last_latitude && item.last_longitude ? (
                      <a 
                        href={`https://www.google.com/maps?q=${item.last_latitude},${item.last_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="location-link"
                      >
                        {formatCoordinate(item.last_latitude)}, {formatCoordinate(item.last_longitude)}
                      </a>
                    ) : (
                      'Lokasi tidak tersedia'
                    )}
                  </td>
                  <td className={status.class}>
                    {formatSpeed(item.last_speed)}
                  </td>
                  <td>
                    <span className={`status ${status.class}`}>
                      {status.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListArmada;