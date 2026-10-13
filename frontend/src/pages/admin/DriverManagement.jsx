import React, { useState, useEffect } from 'react';
import { driverService } from '../../services/api';
import { Users, Trash2 } from 'lucide-react';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    const res = await driverService.getAll();
    if (res.success && res.data) setDrivers(res.data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      await driverService.delete(id);
      loadDrivers();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Driver Management</h2>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>ID</th>
              <th style={{ padding: '0.75rem' }}>Driver Name</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>License No</th>
              <th style={{ padding: '0.75rem' }}>Phone</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{d.id}</td>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.user?.name}</td>
                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{d.user?.email}</td>
                <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{d.licenseNumber}</td>
                <td style={{ padding: '0.75rem' }}>{d.user?.phone || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => handleDelete(d.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverManagement;
