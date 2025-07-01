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
  const [selectedRoute, setSelectedRoute] = useState('');
  const [center, setCenter] = useState([-6.306393, 106.888775]);
  const [routeDistance, setRouteDistance] = useState(0);

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate total route distance
  const calculateRouteDistance = (stops) => {
    let total = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      total += calculateDistance(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude
      );
    }
    return total;
  };

  const handleRouteChange = (tripId) => {
    setSelectedRoute(tripId);
    if (tripId && routes[tripId]) {
      const distance = calculateRouteDistance(routes[tripId]);
      setRouteDistance(distance);
      
      // Center map on first stop of selected route
      if (routes[tripId].length > 0) {
        setCenter([routes[tripId][0].latitude, routes[tripId][0].longitude]);
      }
    } else {
      setRouteDistance(0);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('http://103.245.39.149:3013/api/routes');
      if (!response.ok) throw new Error('Failed to fetch routes');
      
      const result = await response.json();
      if (result.status === 'success') {
        const groupedRoutes = groupRoutesByTripId(result.data);
        setRoutes(groupedRoutes);
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
      acc[stop.rute_trip_id].sort((a, b) => a.rute_sort - b.rute_sort);
      return acc;
    }, {});
  };

  if (loading) return <div className="route-loading">Loading routes...</div>;
  if (error) return <div className="route-error">Error: {error}</div>;

  return (
    <div className="route-map-container">
      <div className="route-selector">
        <div className="route-header">
          <select 
            value={selectedRoute}
            onChange={(e) => handleRouteChange(e.target.value)}
            className="route-dropdown"
          >
            <option value="">Select a Route</option>
            {Object.keys(routes).map((tripId) => (
              <option key={tripId} value={tripId}>
                Route {tripId} ({routes[tripId].length} stops)
              </option>
            ))}
          </select>
          {selectedRoute && (
            <div className="route-info">
              <p>Total Distance: {routeDistance.toFixed(2)} km</p>
              <p>Total Stops: {routes[selectedRoute]?.length || 0}</p>
            </div>
          )}
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