import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, KeyRound, Mail, ShieldCheck, UserCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success && res.user) {
      redirectUser(res.user.role);
    } else {
      setError(res.message || 'Login failed. Check email and password.');
    }
  };

  const redirectUser = (role) => {
    switch (role) {
      case 'ROLE_STUDENT':
        navigate('/student/dashboard');
        break;
      case 'ROLE_PARENT':
        navigate('/parent/dashboard');
        break;
      case 'ROLE_DRIVER':
        navigate('/driver/dashboard');
        break;
      case 'ROLE_ADMIN':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    const res = await login({ email: demoEmail, password: demoPassword });
    setLoading(false);
    if (res.success && res.user) {
      redirectUser(res.user.role);
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.85rem',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: '16px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            marginBottom: '1rem'
          }}>
            <Bus size={36} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0 0 0.4rem' }}>
            Welcome to BUS-LINK
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            College Bus Tracking & Boarding Attendance System
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <KeyRound size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Accounts Quick Login */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', textAlign: 'center', marginBottom: '1rem' }}>
            Quick Demo Accounts (One-Click)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
            <button 
              type="button"
              onClick={() => handleDemoLogin('student@buslink.com', 'Student@123')}
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '0.5rem' }}
            >
              🎓 Student
            </button>
            <button 
              type="button"
              onClick={() => handleDemoLogin('parent@buslink.com', 'Parent@123')}
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '0.5rem' }}
            >
              👨‍👩‍👦 Parent
            </button>
            <button 
              type="button"
              onClick={() => handleDemoLogin('driver@buslink.com', 'Driver@123')}
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '0.5rem' }}
            >
              🚌 Driver
            </button>
            <button 
              type="button"
              onClick={() => handleDemoLogin('admin@buslink.com', 'Admin@123')}
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '0.5rem' }}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account? <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Register Here</Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
