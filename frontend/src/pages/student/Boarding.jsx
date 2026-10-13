import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService, boardingService, tripService } from '../../services/api';
import { UserCheck, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Bus } from 'lucide-react';

const Boarding = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [boardedToday, setBoardedToday] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user) return;
      const res = await studentService.getByEmail(user.email);
      if (res.success && res.data) {
        setStudent(res.data);
        const histRes = await boardingService.getStudentHistory(res.data.id);
        if (histRes.success && histRes.data) {
          setHistory(histRes.data);
          const found = histRes.data.find(h => new Date(h.date).toDateString() === new Date().toDateString());
          if (found) {
            setBoardedToday(true);
            setTodayRecord(found);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [qrPass, setQrPass] = useState(null);
  const [qrExpiry, setQrExpiry] = useState(120);
  const [copied, setCopied] = useState(false);

  const fetchQrToken = async () => {
    if (!student) return;
    try {
      const res = await boardingService.getStudentQrPass(student.id);
      if (res.success && res.data) {
        setQrPass(res.data);
        setQrExpiry(res.data.expiresInSeconds || 120);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPassToken = () => {
    if (!qrPass || !qrPass.qrToken) return;
    const fullToken = qrPass.qrToken;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullToken)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        })
        .catch(() => fallbackCopyText(fullToken));
    } else {
      fallbackCopyText(fullToken);
    }
  };

  const fallbackCopyText = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Copy fallback notice:", err);
    }
    document.body.removeChild(textarea);
  };

  useEffect(() => {
    let timer;
    if (qrPass && qrExpiry > 0) {
      timer = setInterval(() => setQrExpiry(prev => prev - 1), 1000);
    } else if (qrExpiry === 0) {
      fetchQrToken();
    }
    return () => clearInterval(timer);
  }, [qrPass, qrExpiry]);

  if (loading) return <div style={{ color: '#6366f1', padding: '2rem' }}>Loading Boarding System...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      
      <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          padding: '1rem',
          background: boardedToday ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
          borderRadius: '50%',
          marginBottom: '1rem'
        }}>
          {boardedToday ? (
            <CheckCircle2 size={48} color="#10b981" />
          ) : (
            <UserCheck size={48} color="#6366f1" />
          )}
        </div>

        <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '0 0 0.5rem' }}>
          {boardedToday ? '✓ Boarding Verified' : 'Student Bus Boarding Pass'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
          {boardedToday 
            ? 'Your boarding attendance has been verified by the bus driver on the server and your linked parent was notified automatically.'
            : 'Your boarding attendance is confirmed by the bus driver after your QR pass is verified.'}
        </p>

        {statusMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 600 }}>
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={fetchQrToken} className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
            🔒 GENERATE QR PASS
          </button>

          {boardedToday && (
            <div className="badge badge-success" style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              ✓ Verified by Driver at {new Date(todayRecord?.boardingTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Real ZXing Generated Base64 PNG QR Code Display */}
        {qrPass && (
          <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #6366f1', borderRadius: '20px', display: 'inline-block', maxWidth: '450px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.75rem' }}>
              HMAC-SHA256 SIGNED ZXing QR PASS (MACHINE READABLE)
            </span>

            <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', display: 'inline-block', margin: '0.5rem 0', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)' }}>
              <img 
                src={qrPass.qrCodeDataUrl} 
                alt="Genuine Scannable QR Pass" 
                width="220" 
                height="220" 
                style={{ display: 'block', borderRadius: '8px' }}
              />
            </div>

            <div style={{ textAlign: 'left', background: 'rgba(30, 41, 59, 0.7)', padding: '1rem', borderRadius: '12px', marginTop: '1rem', fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '0.3rem' }}><strong>Student:</strong> <span style={{ color: '#fff' }}>{qrPass.studentName}</span></div>
              <div style={{ marginBottom: '0.3rem' }}><strong>Student ID:</strong> <span style={{ color: '#38bdf8' }}>{qrPass.studentIdCode}</span></div>
              <div style={{ marginBottom: '0.3rem' }}><strong>Assigned Bus:</strong> <span style={{ color: '#818cf8' }}>{qrPass.busNumber}</span></div>
              <div><strong>Route:</strong> <span style={{ color: '#94a3b8' }}>{qrPass.routeName}</span></div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem' }}>
              Auto-refreshes in: <strong style={{ color: '#ef4444' }}>{qrExpiry}s</strong> | Signature: <code style={{ color: '#34d399' }}>{qrPass.qrToken?.split('-')[3]?.substring(0, 10)}...</code>
            </div>

            {/* Development / Testing Button: Copy Full Pass Token for Manual Driver Fallback */}
            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={handleCopyPassToken}
                className="btn btn-secondary" 
                style={{ 
                  width: '100%', 
                  fontSize: '0.85rem', 
                  padding: '0.65rem', 
                  background: copied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(51, 65, 85, 0.7)', 
                  border: copied ? '1px solid #10b981' : '1px solid #475569', 
                  color: copied ? '#34d399' : '#e2e8f0', 
                  transition: 'all 0.2s ease',
                  fontWeight: 600
                }}
              >
                {copied ? '✓ COPIED FULL PASS TOKEN TO CLIPBOARD!' : '📋 COPY FULL PASS TOKEN (DEV TESTING)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Boarding History Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>My Boarding Attendance History</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.75rem' }}>Boarding Time</th>
              <th style={{ padding: '0.75rem' }}>Bus Number</th>
              <th style={{ padding: '0.75rem' }}>Location</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No boarding logs yet</td>
              </tr>
            ) : (
              history.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>{item.date}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(item.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#818cf8' }}>{item.bus?.busNumber || 'BUS-01'}</td>
                  <td style={{ padding: '0.75rem' }}>{item.location || 'Karedu Stop'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-success">✓ {item.status}</span>
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

export default Boarding;
