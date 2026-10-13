import React, { useState, useEffect } from 'react';
import { adminSecurityService } from '../../services/api';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

const AdminSecurity = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await adminSecurityService.getMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (e) {
      console.error("Error loading security metrics", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={28} color="#6366f1" /> Admin Security Center (BUS-LINK 2.0)
          </h2>
          <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
            Real-time Threat Monitoring, Rate Limiting & Location Integrity Protection
          </p>
        </div>
        <button onClick={loadMetrics} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}>
          <RefreshCw size={16} /> Refresh Security Stream
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Failed Logins</span>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '0.3rem 0' }}>
            {metrics?.totalFailedLogins || 0}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Brute-force protected</span>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Account Lockouts</span>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '0.3rem 0' }}>
            {metrics?.totalAccountLocks || 0}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>15-min temp locks</span>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Rate Limit Blocks</span>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '0.3rem 0' }}>
            {metrics?.totalRateLimitExceeded || 0}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>HTTP 429 triggered</span>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #a855f7' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Suspicious Location</span>
          <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: '0.3rem 0' }}>
            {metrics?.activeSuspiciousLocations || 0}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>GPS speed anomalies</span>
        </div>
      </div>

      {/* Security Event Feeds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Security Threat Feed */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#ef4444" /> Live Security Threat Stream
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
            {(metrics?.recentSecurityEvents || []).length > 0 ? (
              metrics.recentSecurityEvents.map((ev, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ev.severity === 'HIGH' ? '#ef4444' : '#f59e0b' }}>
                      [{ev.eventType}]
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>{ev.details}</p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>IP: {ev.ipAddress || '127.0.0.1'}</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>No active security alerts recorded.</p>
            )}
          </div>
        </div>

        {/* Suspicious GPS Movement Logs */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#f59e0b" /> GPS Speed & Distance Anomalies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
            {(metrics?.recentSuspiciousLocations || []).length > 0 ? (
              metrics.recentSuspiciousLocations.map((loc, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>
                      Bus #{loc.busId} • Driver #{loc.driverId}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(loc.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>{loc.reason}</p>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                    Speed: {loc.calculatedSpeedKmh} km/h • Dist: {loc.distanceKm} km
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>All bus GPS location updates meet strict integrity checks.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
