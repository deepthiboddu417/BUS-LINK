import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tripService, busService } from '../../services/api';
import { Navigation, Play, Square, CheckCircle2, Clock } from 'lucide-react';

const TripManagement = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    tripService.getAll().then(res => {
      if (res.success && res.data) setTrips(res.data);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Trip Management & History</h2>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Trip ID</th>
              <th style={{ padding: '0.75rem' }}>Bus Number</th>
              <th style={{ padding: '0.75rem' }}>Route</th>
              <th style={{ padding: '0.75rem' }}>Start Time</th>
              <th style={{ padding: '0.75rem' }}>End Time</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No trip logs recorded yet</td>
              </tr>
            ) : (
              trips.map(trip => (
                <tr key={trip.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{trip.id}</td>
                  <td style={{ padding: '0.75rem', color: '#818cf8', fontWeight: 700 }}>{trip.bus?.busNumber}</td>
                  <td style={{ padding: '0.75rem' }}>{trip.route?.routeName}</td>
                  <td style={{ padding: '0.75rem' }}>{trip.startTime ? new Date(trip.startTime).toLocaleTimeString() : 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{trip.endTime ? new Date(trip.endTime).toLocaleTimeString() : 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${trip.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TripManagement;
