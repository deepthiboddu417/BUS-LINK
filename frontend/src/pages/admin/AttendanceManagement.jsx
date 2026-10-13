import React, { useState, useEffect } from 'react';
import { boardingService } from '../../services/api';
import { UserCheck, Calendar, Clock, Bus } from 'lucide-react';

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    boardingService.getAllAttendance().then(res => {
      if (res.success && res.data) setAttendance(res.data);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Student Boarding Attendance Logs</h2>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Log ID</th>
              <th style={{ padding: '0.75rem' }}>Student Name</th>
              <th style={{ padding: '0.75rem' }}>Student ID Code</th>
              <th style={{ padding: '0.75rem' }}>Bus Number</th>
              <th style={{ padding: '0.75rem' }}>Boarding Date</th>
              <th style={{ padding: '0.75rem' }}>Boarding Time</th>
              <th style={{ padding: '0.75rem' }}>Location</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No boarding attendance records found</td>
              </tr>
            ) : (
              attendance.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{a.id}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{a.student?.user?.name}</td>
                  <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{a.student?.studentIdCode}</td>
                  <td style={{ padding: '0.75rem', color: '#818cf8', fontWeight: 700 }}>{a.bus?.busNumber}</td>
                  <td style={{ padding: '0.75rem' }}>{a.date}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(a.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '0.75rem' }}>{a.location || 'Main Stop'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-success">✓ {a.status}</span>
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

export default AttendanceManagement;
