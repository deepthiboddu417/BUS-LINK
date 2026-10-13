import React, { useState, useEffect } from 'react';
import { tripService, busService } from '../../services/api';
import { Navigation, Play, Square, RefreshCw } from 'lucide-react';

const AdminTripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const tRes = await tripService.getAll();
    if (tRes.success && tRes.data) setTrips(tRes.data);

    const bRes = await busService.getAll();
    if (bRes.success && bRes.data) setBuses(bRes.data);
  };

  const handleStartTrip = async (busId) => {
    try {
      await tripService.startTrip(busId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEndTrip = async (tripId) => {
    try {
      await tripService.endTrip(tripId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Trip Dispatch & Monitoring</h2>
        <button onClick={loadData} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={16} /> Refresh Trips
        </button>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Active Fleet Trip Dispatcher</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {buses.map(b => (
            <div key={b.id} style={{
              padding: '1.25rem',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.4rem' }}>{b.status}</span>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>{b.busNumber}</h3>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Driver: {b.driver?.user?.name || 'Unassigned'} | Route: {b.route?.routeName || 'Unassigned'}
                </span>
              </div>

              <div>
                {b.status === 'NOT_STARTED' || b.status === 'COMPLETED' ? (
                  <button onClick={() => handleStartTrip(b.id)} className="btn btn-success" style={{ padding: '0.6rem 1.25rem' }}>
                    <Play size={16} /> Dispatch Trip
                  </button>
                ) : (
                  <button onClick={() => {
                    const activeTrip = trips.find(t => t.bus?.id === b.id && t.status !== 'COMPLETED');
                    if (activeTrip) handleEndTrip(activeTrip.id);
                  }} className="btn btn-danger" style={{ padding: '0.6rem 1.25rem' }}>
                    <Square size={16} /> End Trip
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trips History Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Completed & Active Trips Log</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Trip ID</th>
              <th style={{ padding: '0.75rem' }}>Bus Number</th>
              <th style={{ padding: '0.75rem' }}>Driver</th>
              <th style={{ padding: '0.75rem' }}>Route</th>
              <th style={{ padding: '0.75rem' }}>Start Time</th>
              <th style={{ padding: '0.75rem' }}>End Time</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{t.id}</td>
                <td style={{ padding: '0.75rem', color: '#818cf8', fontWeight: 700 }}>{t.bus?.busNumber}</td>
                <td style={{ padding: '0.75rem' }}>{t.driver?.user?.name}</td>
                <td style={{ padding: '0.75rem' }}>{t.route?.routeName}</td>
                <td style={{ padding: '0.75rem' }}>{t.startTime ? new Date(t.startTime).toLocaleTimeString() : 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>{t.endTime ? new Date(t.endTime).toLocaleTimeString() : 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTripManagement;
