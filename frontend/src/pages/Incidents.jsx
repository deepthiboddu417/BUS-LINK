import React, { useState, useEffect } from 'react';
import { incidentService } from '../services/api';
import { AlertCircle, PlusCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'BREAKDOWN',
    description: '',
    busNumber: 'BUS-01',
    priority: 'HIGH'
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = () => {
    incidentService.getAll().then(res => {
      if (res.success && res.data) setIncidents(res.data);
    }).catch(e => console.error(e));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await incidentService.report(formData);
      if (res.success) {
        setMsg('✓ Incident reported successfully to Admin & Fleet Authorities');
        setShowModal(false);
        setFormData({ category: 'BREAKDOWN', description: '', busNumber: 'BUS-01', priority: 'HIGH' });
        loadIncidents();
      }
    } catch (err) {
      alert("Error reporting incident");
    }
  };

  const handleStatusChange = async (id, status) => {
    await incidentService.updateStatus(id, status);
    loadIncidents();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>Transportation Incidents & Safety Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.2rem 0 0' }}>Report and track vehicle breakdowns, delays, accidents & safety concerns</p>
        </div>
        <button onClick={() => setShowModal(!showModal)} className="btn btn-danger">
          <PlusCircle size={18} /> {showModal ? 'Close Form' : '🚨 Report New Incident'}
        </button>
      </div>

      {msg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '1rem', borderRadius: '12px', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {showModal && (
        <div className="glass-card" style={{ border: '1px solid var(--rose)' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>Submit Incident Report</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="BREAKDOWN" style={{ background: '#121a2b' }}>Bus Breakdown</option>
                  <option value="ACCIDENT" style={{ background: '#121a2b' }}>Accident / Collision</option>
                  <option value="MEDICAL" style={{ background: '#121a2b' }}>Medical Emergency</option>
                  <option value="HARASSMENT" style={{ background: '#121a2b' }}>Harassment / Misbehavior</option>
                  <option value="LOST_ITEM" style={{ background: '#121a2b' }}>Lost Belongings</option>
                  <option value="ROUTE_ISSUE" style={{ background: '#121a2b' }}>Route Obstruction / Traffic</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bus Identification</label>
                <input type="text" className="form-input" value={formData.busNumber} onChange={e => setFormData({ ...formData, busNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="LOW" style={{ background: '#121a2b' }}>Low</option>
                  <option value="MEDIUM" style={{ background: '#121a2b' }}>Medium</option>
                  <option value="HIGH" style={{ background: '#121a2b' }}>High</option>
                  <option value="CRITICAL" style={{ background: '#121a2b' }}>Critical Emergency</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Description</label>
              <textarea 
                className="form-input" 
                rows="3" 
                placeholder="Describe what happened, exact location, and current situation..." 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-danger">
              Submit Formal Incident Ticket
            </button>
          </form>
        </div>
      )}

      {/* Incidents Table */}
      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Timestamp</th>
              <th style={{ padding: '0.75rem' }}>Category</th>
              <th style={{ padding: '0.75rem' }}>Bus</th>
              <th style={{ padding: '0.75rem' }}>Reporter</th>
              <th style={{ padding: '0.75rem' }}>Priority</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No transportation incidents logged</td>
              </tr>
            ) : (
              incidents.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{new Date(inc.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#f43f5e' }}>{inc.category}</td>
                  <td style={{ padding: '0.75rem', color: '#818cf8', fontWeight: 700 }}>{inc.busNumber}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{inc.reporterEmail}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${inc.priority === 'CRITICAL' ? 'badge-danger' : inc.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                      {inc.priority}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${inc.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#cbd5e1' }}>{inc.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Incidents;
