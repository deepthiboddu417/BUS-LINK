import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parentService, boardingService } from '../../services/api';
import { History, CheckCircle2, Calendar, Clock, Bus } from 'lucide-react';

const BoardingHistory = () => {
  const { user } = useAuth();
  const [child, setChild] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  useEffect(() => {
    if (user) {
      parentService.getByEmail(user.email).then(res => {
        if (res.success && res.data) {
          parentService.getChildren(res.data.id).then(chRes => {
            if (chRes.success && chRes.data && chRes.data[0]) {
              setChild(chRes.data[0]);
              boardingService.getStudentHistory(chRes.data[0].id).then(attRes => {
                if (attRes.success && attRes.data) {
                  setAttendanceLogs(attRes.data);
                }
              });
            }
          });
        }
      });
    }
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Child Boarding & Attendance History</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
          Verification records for {child?.user?.name || 'Student'} ({child?.studentIdCode || 'STU1001'})
        </p>
      </div>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.75rem' }}>Boarding Time</th>
              <th style={{ padding: '0.75rem' }}>Bus Number</th>
              <th style={{ padding: '0.75rem' }}>Stop Location</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No boarding logs recorded yet</td>
              </tr>
            ) : (
              attendanceLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{log.date}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(log.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '0.75rem', color: '#818cf8', fontWeight: 700 }}>{log.bus?.busNumber || 'BUS-01'}</td>
                  <td style={{ padding: '0.75rem' }}>{log.location || 'Karedu Stop'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-success">✓ {log.status}</span>
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

export default BoardingHistory;
