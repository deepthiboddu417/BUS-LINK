import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/api';
import { User, Phone, Mail, GraduationCap, ShieldCheck, Bus } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    if (user) {
      studentService.getByEmail(user.email).then(res => {
        if (res.success && res.data) setStudent(res.data);
      });
    }
  }, [user]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Student Profile</h2>

      <div className="glass-card" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <h3 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>{user.name}</h3>
          <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem' }}>ID: {student?.studentIdCode || 'STU1001'}</span>
          <p style={{ color: '#94a3b8', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>{student?.collegeName || 'BUS-LINK College of Technology'}</p>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem' }}>Personal & Transport Details</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Email Address</span>
            <p style={{ color: '#fff', fontWeight: 600, margin: '0.2rem 0' }}>{user.email}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Phone Number</span>
            <p style={{ color: '#fff', fontWeight: 600, margin: '0.2rem 0' }}>{user.phone || '9123456789'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Assigned Bus</span>
            <p style={{ color: '#818cf8', fontWeight: 700, margin: '0.2rem 0' }}>{student?.bus?.busNumber || 'BUS-01'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Linked Parent Guardian</span>
            <p style={{ color: '#34d399', fontWeight: 600, margin: '0.2rem 0' }}>{student?.parent?.user?.name || 'Not Linked'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
