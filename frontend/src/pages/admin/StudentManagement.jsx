import React, { useState, useEffect } from 'react';
import { studentService, busService, parentService } from '../../services/api';
import { Users, UserPlus, Trash2, Edit, Link2 } from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [parents, setParents] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const sRes = await studentService.getAll();
    if (sRes.success && sRes.data) setStudents(sRes.data);

    const bRes = await busService.getAll();
    if (bRes.success && bRes.data) setBuses(bRes.data);

    const pRes = await parentService.getAll();
    if (pRes.success && pRes.data) setParents(pRes.data);
  };

  const handleAssignBus = async (studentId, busId) => {
    if (!busId) return;
    await studentService.assignBus(studentId, busId);
    loadAllData();
  };

  const handleLinkParent = async (studentId, parentId) => {
    if (!parentId) return;
    await studentService.linkParent(studentId, parentId);
    loadAllData();
  };

  const handleDelete = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      await studentService.delete(studentId);
      loadAllData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Student Management</h2>
      </div>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>ID Code</th>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Assigned Bus</th>
              <th style={{ padding: '0.75rem' }}>Linked Parent</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>{s.studentIdCode}</td>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.user?.name}</td>
                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{s.user?.email}</td>
                <td style={{ padding: '0.75rem' }}>
                  <select 
                    className="form-input" 
                    style={{ padding: '0.35rem', fontSize: '0.82rem', width: '140px' }}
                    value={s.bus?.id || ''} 
                    onChange={(e) => handleAssignBus(s.id, e.target.value)}
                  >
                    <option value="">Select Bus</option>
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>{b.busNumber}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <select 
                    className="form-input" 
                    style={{ padding: '0.35rem', fontSize: '0.82rem', width: '150px' }}
                    value={s.parent?.id || ''} 
                    onChange={(e) => handleLinkParent(s.id, e.target.value)}
                  >
                    <option value="">Link Parent</option>
                    {parents.map(p => (
                      <option key={p.id} value={p.id}>{p.user?.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => handleDelete(s.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
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

export default StudentManagement;
