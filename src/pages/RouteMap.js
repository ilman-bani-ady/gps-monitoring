import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RouteMap.css';

const createStopIcon = () => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `<div class="stop-dot"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
  });
};

function RouteMap({ darkMode }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [center, setCenter] = useState([-6.306393, 106.888775]);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('http://localhost:3013/api/routes');
      if (!response.ok) throw new Error('Failed to fetch routes');
      
      const result = await response.json();
      if (result.status === 'success') {
        // Group routes by rute_trip_id
        const groupedRoutes = groupRoutesByTripId(result.data);
        setRoutes(groupedRoutes);
        
        // Set center to first stop if available
        if (result.data.length > 0) {
          setCenter([result.data[0].latitude, result.data[0].longitude]);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const groupRoutesByTripId = (data) => {
    return data.reduce((acc, stop) => {
      if (!acc[stop.rute_trip_id]) {
        acc[stop.rute_trip_id] = [];
      }
      acc[stop.rute_trip_id].push(stop);
      // Sort stops by rute_sort
      acc[stop.rute_trip_id].sort((a, b) => a.rute_sort - b.rute_sort);
      return acc;
    }, {});
  };

  if (loading) {
    return <div className="route-loading">Loading routes...</div>;
  }

  if (error) {
    return <div className="route-error">Error: {error}</div>;
  }

  return (
    <div className="route-map-container">
      <div className="route-selector">
        <h3>Available Routes</h3>
        <div className="route-list">
          {Object.keys(routes).map((tripId) => (
            <button
              key={tripId}
              className={`route-button ${selectedRoute === tripId ? 'active' : ''}`}
              onClick={() => setSelectedRoute(tripId)}
            >
              Route {tripId}
            </button>
          ))}
        </div>
      </div>

      <MapContainer 
        center={center} 
        zoom={13} 
        className="route-map"
      >
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

        {selectedRoute && routes[selectedRoute] && (
          <>
            {/* Draw route line */}
            <Polyline
              positions={routes[selectedRoute].map(stop => [stop.latitude, stop.longitude])}
              color="#4CAF50"
              weight={3}
              opacity={0.8}
            />

            {/* Draw stops */}
            {routes[selectedRoute].map((stop, index) => (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={createStopIcon()}
              >
                <Popup>
                  <div className={`stop-popup ${darkMode ? 'dark' : 'light'}`}>
                    <h3>Stop #{index + 1}</h3>
                    <p>Name: {stop.halte_name}</p>
                    <p>Location: {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default RouteMap;