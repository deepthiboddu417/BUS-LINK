import React, { useState, useEffect } from 'react';
import { adminSecurityService } from '../../services/api';
import { FileText, Filter, RefreshCw } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [roleFilter, resultFilter, actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminSecurityService.getAuditLogs({
        role: roleFilter,
        result: resultFilter,
        action: actionFilter
      });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={24} color="#38bdf8" /> Immutable System Audit Trail
        </h2>
        <button onClick={loadLogs} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Refresh Trail
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#94a3b8" />
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Filter By:</span>
        </div>

        <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="ROLE_ADMIN">ROLE_ADMIN</option>
          <option value="ROLE_DRIVER">ROLE_DRIVER</option>
          <option value="ROLE_PARENT">ROLE_PARENT</option>
          <option value="ROLE_STUDENT">ROLE_STUDENT</option>
        </select>

        <select className="form-input" value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
          <option value="">All Results</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
          <option value="DENIED">DENIED</option>
        </select>

        <select className="form-input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
          <option value="BOARDING_CREATED">BOARDING_CREATED</option>
          <option value="TRIP_STARTED">TRIP_STARTED</option>
          <option value="TRIP_COMPLETED">TRIP_COMPLETED</option>
          <option value="LOCATION_SUSPICIOUS">LOCATION_SUSPICIOUS</option>
          <option value="EMERGENCY_CREATED">EMERGENCY_CREATED</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Timestamp</th>
              <th style={{ padding: '0.75rem' }}>User / IP</th>
              <th style={{ padding: '0.75rem' }}>Role</th>
              <th style={{ padding: '0.75rem' }}>Action</th>
              <th style={{ padding: '0.75rem' }}>Result</th>
              <th style={{ padding: '0.75rem' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>{log.username || 'Anonymous'}</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.ipAddress || '127.0.0.1'}</span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: '#818cf8', fontWeight: 600 }}>
                    {log.role}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${log.result === 'SUCCESS' ? 'badge-success' : log.result === 'DENIED' ? 'badge-danger' : 'badge-warning'}`}>
                      {log.result}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {log.description}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No audit trail records found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
