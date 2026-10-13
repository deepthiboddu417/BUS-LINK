import React, { useState, useEffect } from 'react';
import { emergencyService } from '../../services/api';
import { ShieldAlert, CheckCircle2, MapPin } from 'lucide-react';

const EmergencyAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const res = await emergencyService.getAllAlerts();
    if (res.success && res.data) setAlerts(res.data);
  };

  const handleResolve = async (id) => {
    await emergencyService.resolveAlert(id);
    loadAlerts();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Emergency Alerts Console</h2>

      <div className="glass-card">
        {alerts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No emergency alerts reported.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map(a => (
              <div key={a.id} style={{
                padding: '1.25rem',
                borderRadius: '14px',
                background: a.status === 'PENDING' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: a.status === 'PENDING' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <ShieldAlert color={a.status === 'PENDING' ? '#ef4444' : '#64748b'} size={20} />
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{a.message}</h4>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Student: {a.student?.user?.name || 'N/A'} | Bus: {a.bus?.busNumber || 'BUS-01'} | Reported: {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  {a.status === 'PENDING' ? (
                    <button onClick={() => handleResolve(a.id)} className="btn btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Mark Resolved
                    </button>
                  ) : (
                    <span className="badge badge-info">RESOLVED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyAlerts;
