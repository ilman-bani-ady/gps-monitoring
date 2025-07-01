import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

// Component untuk mengupdate tile layer saat mode berubah
function TileLayerComponent({ darkMode }) {
  return (
    <TileLayer
      attribution={
        darkMode
          ? '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
      url={
        darkMode
          ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      }
    />
  );
}

const createCustomIcon = (status) => {
  return L.divIcon({
    className: `custom-marker ${status}`,
    html: `<div class="marker-dot"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

function Map({ darkMode }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState([-6.306393, 106.888775]);

  useEffect(() => {
    fetchLastLocations();
    const interval = setInterval(fetchLastLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLastLocations = async () => {
    try {
      const response = await fetch('http://103.245.39.149:3013/api/tracking/fleet');
      if (!response.ok) throw new Error('Failed to fetch vehicle locations');
      
      const result = await response.json();
      if (result.status === 'success') {
        // Filter dan validasi data
        const validVehicles = result.data.filter(vehicle => 
          vehicle && 
          !isNaN(parseFloat(vehicle.last_latitude)) && 
          !isNaN(parseFloat(vehicle.last_longitude))
        );
        
        setVehicles(validVehicles);
        
        // Update center ke kendaraan pertama jika ada
        if (validVehicles.length > 0) {
          setCenter([
            parseFloat(validVehicles[0].last_latitude),
            parseFloat(validVehicles[0].last_longitude)
          ]);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vehicle locations:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getVehicleStatus = (vehicle) => {
    if (!vehicle.last_update) return 'stopped';
    
    const lastUpdate = new Date(vehicle.last_update);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    
    if (diffMinutes <= 1) return 'active';
    if (parseFloat(vehicle.last_speed) > 0) return 'moving';
    return 'stopped';
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('id-ID');
    } catch {
      return 'N/A';
    }
  };

  const formatCoordinate = (coord) => {
    const num = parseFloat(coord);
    return !isNaN(num) ? num.toFixed(6) : 'N/A';
  };

  const formatSpeed = (speed) => {
    const num = parseFloat(speed);
    return !isNaN(num) ? `${num.toFixed(1)} km/h` : '0 km/h';
  };

  if (loading && vehicles.length === 0) {
    return <div className="map-loading">Loading map data...</div>;
  }

  if (error) {
    return <div className="map-error">Error: {error}</div>;
  }

  return (
    <div className={`map-wrapper ${darkMode ? 'dark' : 'light'}`}>
      <MapContainer 
        center={center} 
        zoom={13} 
        className="map-container"
        zoomControl={false}
      >
        <TileLayerComponent darkMode={darkMode} />
        
        {vehicles.map((vehicle) => {
          const lat = parseFloat(vehicle.last_latitude);
          const lng = parseFloat(vehicle.last_longitude);
          
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={vehicle.device_id}
              position={[lat, lng]}
              icon={createCustomIcon(getVehicleStatus(vehicle))}
            >
              <Popup className={darkMode ? 'dark-popup' : 'light-popup'}>
                <div className="vehicle-popup">
                  <h3>ID: {vehicle.device_id}</h3>
                  <p>Status: {getVehicleStatus(vehicle)}</p>
                  <p>Speed: {formatSpeed(vehicle.last_speed)}</p>
                  <p>Last Update: {formatDateTime(vehicle.last_update)}</p>
                  <p>
                    Location: {formatCoordinate(vehicle.last_latitude)}, 
                    {formatCoordinate(vehicle.last_longitude)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default Map;