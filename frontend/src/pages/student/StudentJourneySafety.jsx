import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/api';
import { ShieldCheck, Bus, MapPin, CheckCircle2 } from 'lucide-react';

const StudentJourneySafety = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    if (!user) return;
    studentService.getByEmail(user.email).then(res => {
      if (res.success && res.data) setStudent(res.data);
    });
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={26} color="#6366f1" /> My Journey Safety & Verification Status
        </h2>
        <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
          BUS-LINK 2.0 Encrypted Passenger Tracking & Automated Security Safeguards
        </p>
      </div>

      <div className="glass-card" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
          {user?.name?.charAt(0) || 'S'}
        </div>

        <div>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>{user?.name}</h3>
          <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.88rem' }}>ID Code: {student?.studentIdCode || '23551A4601'}</span>
          <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
            Assigned Bus: <strong style={{ color: '#818cf8' }}>{student?.bus?.busNumber || 'BUS-01'}</strong>
          </p>
        </div>
      </div>

      {/* Safety Verification Features */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} color="#34d399" /> Active Journey Safety Controls
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>✓ AUTOMATED NOTIFICATION</span>
            <h4 style={{ margin: '0.3rem 0 0', color: '#fff', fontSize: '0.95rem' }}>Instant Boarding Alerts to Parent</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Linked parent ({student?.parent?.user?.name || 'Linked Parent'}) automatically notified upon tap-boarding.</p>
          </div>

          <div style={{ padding: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>✓ GPS INTEGRITY MONITORED</span>
            <h4 style={{ margin: '0.3rem 0 0', color: '#fff', fontSize: '0.95rem' }}>Real-time Route & Geofencing</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Bus location evaluated via speed integrity checks and live geofences.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentJourneySafety;
