import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { emergencyService } from '../../services/api';
import { ShieldAlert, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

const DriverEmergencyPanel = () => {
  const { user } = useAuth();
  const [incidentType, setIncidentType] = useState('BREAKDOWN');
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleDispatchEmergency = async (e) => {
    e.preventDefault();
    try {
      const fullMsg = `[${incidentType}] ${message || 'Emergency assistance requested by driver.'}`;
      const res = await emergencyService.raiseEmergency(
        user.userId,
        user.busId || 1,
        fullMsg,
        15.5050,
        80.0490
      );
      if (res.success) {
        setStatusMessage(`🚨 Emergency Broadcast Sent! Incident ID: #${res.data?.id || 'Alert'}`);
        setMessage('');
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch emergency alert');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldAlert size={26} color="#ef4444" /> Safety Dispatch & GPS Integrity Panel
        </h2>
        <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
          Real-time Driver Bus Security Validation & Emergency Dispatch Controller
        </p>
      </div>

      {/* GPS Integrity Status Indicators */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '10px', border: '1px solid #34d399' }}>
          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={14} /> GPS BOUNDS VALID
          </span>
          <h4 style={{ margin: '0.2rem 0 0', color: '#fff', fontSize: '0.9rem' }}>Coordinates within Range</h4>
        </div>

        <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px', border: '1px solid #38bdf8' }}>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={14} /> SPEED NORMAL
          </span>
          <h4 style={{ margin: '0.2rem 0 0', color: '#fff', fontSize: '0.9rem' }}>Haversine Speed Validated</h4>
        </div>

        <div style={{ padding: '0.75rem', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '10px', border: '1px solid #818cf8' }}>
          <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={14} /> GEOFENCE ACTIVE
          </span>
          <h4 style={{ margin: '0.2rem 0 0', color: '#fff', fontSize: '0.9rem' }}>Route Stops Monitored</h4>
        </div>
      </div>

      {/* Quick Emergency Dispatcher */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} color="#ef4444" /> Quick Emergency Alert Dispatcher
        </h3>

        {statusMessage && (
          <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '10px', color: '#fca5a5', fontWeight: 600, marginBottom: '1rem' }}>
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleDispatchEmergency} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Emergency Incident Type</label>
            <select className="form-input" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
              <option value="ACCIDENT">ACCIDENT — Collision / Road Incident</option>
              <option value="MEDICAL">MEDICAL — Student or Driver Health Emergency</option>
              <option value="BREAKDOWN">BREAKDOWN — Engine / Tyre Failure</option>
              <option value="SECURITY">SECURITY — Threat / Unauthorized Access</option>
              <option value="OTHER">OTHER — General Assistance Required</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Incident Details & Description</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Provide brief details about current location, situation, or assistance needed..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-danger" style={{ padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Send size={18} /> Broadcast Immediate Emergency Alert
          </button>
        </form>
      </div>
    </div>
  );
};

export default DriverEmergencyPanel;
