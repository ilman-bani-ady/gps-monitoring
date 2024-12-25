import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import L from 'leaflet';
import './History.css';

function History({ darkMode }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState([-6.306393, 106.888775]);
  const [showSummary, setShowSummary] = useState(true);

  // Format tanggal untuk API
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Format tanggal untuk input
  const formatDateForInput = (date) => {
    if (!date) return ''; // Handle null/undefined
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return ''; // Handle invalid date
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  // Handle date change dengan validasi
  const handleDateChange = (type, value) => {
    try {
      if (!value) {
        // Jika input dikosongkan (clear), set default date
        const defaultDate = new Date();
        if (type === 'start') {
          defaultDate.setHours(0, 0, 0, 0);
          setStartDate(defaultDate);
        } else {
          defaultDate.setHours(23, 59, 59, 999);
          setEndDate(defaultDate);
        }
        return;
      }

      const newDate = new Date(value);
      if (isNaN(newDate.getTime())) {
        throw new Error('Invalid date');
      }

      if (type === 'start') {
        setStartDate(newDate);
        // Pastikan end date tidak lebih awal dari start date
        if (endDate < newDate) {
          setEndDate(newDate);
        }
      } else {
        setEndDate(newDate);
        // Pastikan start date tidak lebih akhir dari end date
        if (startDate > newDate) {
          setStartDate(newDate);
        }
      }
    } catch (err) {
      console.error('Error setting date:', err);
      // Set tanggal default jika terjadi error
      const defaultDate = new Date();
      if (type === 'start') {
        defaultDate.setHours(0, 0, 0, 0);
        setStartDate(defaultDate);
      } else {
        defaultDate.setHours(23, 59, 59, 999);
        setEndDate(defaultDate);
      }
    }
  };

  // Format tanggal untuk display
  const formatDateDisplay = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (err) {
      console.error('Error formatting date display:', err);
      return '-';
    }
  };

  // Fetch available vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('http://localhost:3013/api/tracking/fleet');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const result = await response.json();
      if (result.status === 'success') {
        setVehicles(result.data);
      }
    } catch (err) {
      setError('Failed to load vehicles');
    }
  };

  const fetchHistory = async () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }
    
    setLoading(true);
    setError(null);
    setHistoryData(null);
    
    try {
      // Menggunakan tanggal dari input user
      const start = formatDateForAPI(startDate);
      const end = formatDateForAPI(endDate);
      
      const url = `http://localhost:3013/api/tracking/history/${selectedVehicle}?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
      
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('API Response:', result);

      if (result.status === 'success' && result.data) {
        setHistoryData(result.data);
        if (result.data.track_points && result.data.track_points.length > 0) {
          setCenter([
            result.data.track_points[0].latitude,
            result.data.track_points[0].longitude
          ]);
        }
      } else {
        setError(result.message || 'No data found for selected period');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to fetch history data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total distance
  const calculateTotalDistance = (points) => {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      total += calculateDistance(
        p1.latitude, p1.longitude,
        p2.latitude, p2.longitude
      );
    }
    return total;
  };

  // Calculate distance between two points
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

  // Calculate total time
  const calculateTotalTime = (points) => {
    if (points.length < 2) return 0;
    const start = new Date(points[0].timestamp);
    const end = new Date(points[points.length - 1].timestamp);
    return (end - start) / 1000 / 60; // Return minutes
  };

  // Fungsi untuk format tanggal ke string yang readable
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  // Fungsi untuk format koordinat
  const formatCoordinate = (coord) => {
    return coord ? Number(coord).toFixed(6) : '-';
  };

  // Fungsi untuk format kecepatan
  const formatSpeed = (speed) => {
    return speed ? `${Number(speed).toFixed(1)} km/h` : '-';
  };

  // Fungsi untuk export ke Excel
  const exportToExcel = () => {
    if (!historyData || !historyData.track_points || historyData.track_points.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Persiapkan data untuk header laporan
      const reportHeader = [
        ['Vehicle History Report'],
        ['Vehicle ID:', historyData.device_id],
        ['Period:', `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`],
        ['Total Distance:', `${calculateTotalDistance(historyData.track_points).toFixed(2)} km`],
        ['Total Time:', `${calculateTotalTime(historyData.track_points).toFixed(0)} minutes`],
        ['Average Speed:', `${(calculateTotalDistance(historyData.track_points) / (calculateTotalTime(historyData.track_points) / 60)).toFixed(1)} km/h`],
        ['Total Points:', historyData.track_points.length],
        [''],  // Empty row for spacing
        // Header untuk data tracking
        ['No', 'Timestamp', 'Latitude', 'Longitude', 'Speed', 'Valid']
      ];

      // Persiapkan data tracking points
      const trackingData = historyData.track_points.map((point, index) => [
        index + 1,
        formatDateTime(point.timestamp),
        formatCoordinate(point.latitude),
        formatCoordinate(point.longitude),
        formatSpeed(point.speed),
        point.valid ? 'Yes' : 'No'
      ]);

      // Gabungkan semua data
      const wsData = [...reportHeader, ...trackingData];

      // Buat workbook dan worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Styling untuk header
      const headerStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center' }
      };

      // Apply styling (basic)
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 20 },  // Timestamp
        { wch: 12 },  // Latitude
        { wch: 12 },  // Longitude
        { wch: 10 },  // Speed
        { wch: 8 }    // Valid
      ];

      // Tambahkan worksheet ke workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Vehicle History');

      // Generate file Excel
      const fileName = `vehicle_history_${historyData.device_id}_${new Date().toISOString().slice(0,10)}.xlsx`;
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Save file
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, fileName);

    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError('Failed to export data');
    }
  };

  // Reset showSummary ketika data baru diambil
  useEffect(() => {
    if (historyData && historyData.track_points) {
      setShowSummary(true);
    }
  }, [historyData]);

  return (
    <div className="history-container">
      <div className="history-controls">
        <div className="control-group">
          <label>Select Vehicle:</label>
          <select 
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="vehicle-select"
          >
            <option value="">Select Vehicle</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.device_id} value={vehicle.device_id}>
                {vehicle.device_id}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Start Date:</label>
          <input
            type="datetime-local"
            value={formatDateForInput(startDate)}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="date-picker"
          />
        </div>

        <div className="control-group">
          <label>End Date:</label>
          <input
            type="datetime-local"
            value={formatDateForInput(endDate)}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="date-picker"
          />
        </div>

        <div className="button-group">
          <button 
            onClick={fetchHistory}
            disabled={!selectedVehicle || loading}
            className="fetch-button"
          >
            {loading ? 'Loading...' : 'Show History'}
          </button>

          {historyData && historyData.track_points && historyData.track_points.length > 0 && (
            <button 
              onClick={exportToExcel}
              className="export-button"
            >
              Export to Excel
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {historyData && historyData.track_points && historyData.track_points.length > 0 && showSummary && (
        <div className="history-summary">
          <div className="summary-header">
            <h3>Trip Summary</h3>
            <button 
              className="close-button"
              onClick={() => setShowSummary(false)}
              title="Close summary"
            >
              ×
            </button>
          </div>
          <div className="summary-details">
            <p>
              <span>Vehicle:</span>
              <span>{historyData.device_id}</span>
            </p>
            <p>
              <span>Period:</span>
              <span>{formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}</span>
            </p>
            <p>
              <span>Total Points:</span>
              <span>{historyData.track_points.length}</span>
            </p>
            <p>
              <span>Total Distance:</span>
              <span>{calculateTotalDistance(historyData.track_points).toFixed(2)} km</span>
            </p>
            <p>
              <span>Total Time:</span>
              <span>{calculateTotalTime(historyData.track_points).toFixed(0)} minutes</span>
            </p>
            <p>
              <span>Average Speed:</span>
              <span>
                {(calculateTotalDistance(historyData.track_points) / (calculateTotalTime(historyData.track_points) / 60)).toFixed(1)} km/h
              </span>
            </p>
          </div>
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={13} 
        className="history-map"
      >
        <TileLayer
          attribution={darkMode ? '&copy; Stadia Maps' : '&copy; OpenStreetMap'}
          url={darkMode 
            ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />

        {historyData && historyData.track_points && historyData.track_points.length > 0 && (
          <>
            <Polyline
              positions={historyData.track_points.map(point => [point.latitude, point.longitude])}
              color="#4CAF50"
              weight={3}
              opacity={0.8}
            />
            
            <Marker
              position={[
                historyData.track_points[0].latitude,
                historyData.track_points[0].longitude
              ]}
              icon={L.divIcon({
                className: 'custom-marker start',
                html: '<div class="marker-dot start"></div>',
                iconSize: [15, 15]
              })}
            >
              <Popup>
                <div>
                  <strong>Start Point</strong><br/>
                  Time: {new Date(historyData.track_points[0].timestamp).toLocaleString()}
                </div>
              </Popup>
            </Marker>

            <Marker
              position={[
                historyData.track_points[historyData.track_points.length - 1].latitude,
                historyData.track_points[historyData.track_points.length - 1].longitude
              ]}
              icon={L.divIcon({
                className: 'custom-marker end',
                html: '<div class="marker-dot end"></div>',
                iconSize: [15, 15]
              })}
            >
              <Popup>
                <div>
                  <strong>End Point</strong><br/>
                  Time: {new Date(historyData.track_points[historyData.track_points.length - 1].timestamp).toLocaleString()}
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default History;