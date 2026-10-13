import React, { useState, useEffect } from 'react';
import { studentService, boardingService } from '../../services/api';
import { Users, UserCheck, QrCode } from 'lucide-react';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [qrInput, setQrInput] = useState('');
  const [scanMsg, setScanMsg] = useState('');
  const [scanErr, setScanErr] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    studentService.getAll().then(res => {
      if (res.success && res.data) setStudents(res.data);
    });
  };

  const handleScanQrSubmit = async (e) => {
    e.preventDefault();
    setScanMsg('');
    setScanErr('');
    try {
      const res = await boardingService.scanQrCode(qrInput.trim(), 1, "Driver QR Scan Point");
      if (res.success) {
        setScanMsg("✓ QR Boarding Attendance Verified & Recorded! Parent Notified.");
        setQrInput('');
        loadStudents();
      } else {
        setScanErr(res.message);
      }
    } catch (err) {
      setScanErr(err.message || "QR Code Verification Failed");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Assigned Bus Passengers Roster</h2>
        <button onClick={() => setShowScanModal(!showScanModal)} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
          <QrCode size={18} /> {showScanModal ? 'Close Scanner' : '📱 Driver QR Scanner'}
        </button>
      </div>

      {showScanModal && (
        <div className="glass-card" style={{ border: '1px solid #6366f1' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode color="#818cf8" size={20} /> Driver Anti-Fraud QR Token Scanner
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Scan or enter student's cryptographic QR token (STU-id-timestamp-hmac) for server verification.
          </p>

          {scanMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              {scanMsg}
            </div>
          )}

          {scanErr && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              ⚠️ {scanErr}
            </div>
          )}

          <form onSubmit={handleScanQrSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Paste or Scan Student QR Token string (e.g. STU-1-...)" 
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-success" style={{ whiteSpace: 'nowrap' }}>
              Verify & Board
            </button>
          </form>
        </div>
      )}

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Student Name</th>
              <th style={{ padding: '0.75rem' }}>Student ID Code</th>
              <th style={{ padding: '0.75rem' }}>College Name</th>
              <th style={{ padding: '0.75rem' }}>Assigned Bus</th>
              <th style={{ padding: '0.75rem' }}>Parent Guardian</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.user?.name}</td>
                <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{s.studentIdCode}</td>
                <td style={{ padding: '0.75rem' }}>{s.collegeName}</td>
                <td style={{ padding: '0.75rem', color: '#818cf8', fontWeight: 700 }}>{s.bus?.busNumber || 'BUS-01'}</td>
                <td style={{ padding: '0.75rem' }}>{s.parent?.user?.name || 'Not Linked'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;
