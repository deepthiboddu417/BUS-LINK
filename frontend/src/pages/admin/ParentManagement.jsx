import React, { useState, useEffect } from 'react';
import { parentService } from '../../services/api';
import { User, Trash2 } from 'lucide-react';

const ParentManagement = () => {
  const [parents, setParents] = useState([]);

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    const res = await parentService.getAll();
    if (res.success && res.data) setParents(res.data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this parent?")) {
      await parentService.delete(id);
      loadParents();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Parent Management</h2>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>ID</th>
              <th style={{ padding: '0.75rem' }}>Parent Name</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Phone</th>
              <th style={{ padding: '0.75rem' }}>Address</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parents.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{p.id}</td>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.user?.name}</td>
                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{p.user?.email}</td>
                <td style={{ padding: '0.75rem' }}>{p.user?.phone || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>{p.address || 'Main Road, Karedu'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
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

export default ParentManagement;
