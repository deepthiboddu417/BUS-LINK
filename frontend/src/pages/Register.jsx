import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bus, UserCheck, ShieldCheck } from 'lucide-react';

const Register = () => {
  const { loginWithUserData } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'ROLE_STUDENT',
    studentIdCode: '',
    collegeName: '',
    licenseNumber: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.register(formData);
      setLoading(false);
      if (res.success && res.data) {
        loginWithUserData(res.data);
        const role = res.data.role;
        if (role === 'ROLE_STUDENT') navigate('/student/dashboard');
        else if (role === 'ROLE_PARENT') navigate('/parent/dashboard');
        else if (role === 'ROLE_DRIVER') navigate('/driver/dashboard');
        else navigate('/admin/dashboard');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      const backendMsg = err?.message || (typeof err === 'string' ? err : 'Error occurred during registration');
      setError(backendMsg);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Create BUS-LINK Account</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Join our college bus management platform</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" className="form-input" placeholder="Enter Full Name" value={formData.name} onChange={handleChange} autoComplete="off" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" className="form-input" placeholder="Enter Email" value={formData.email} onChange={handleChange} autoComplete="off" required />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input type="text" name="phone" className="form-input" placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} autoComplete="off" required />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-input" placeholder="Enter Password" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
          </div>

          <div className="form-group">
            <label>User Role</label>
            <select name="role" className="form-input" value={formData.role} onChange={handleChange}>
              <option value="ROLE_STUDENT" style={{ background: '#121a2b' }}>Student</option>
              <option value="ROLE_PARENT" style={{ background: '#121a2b' }}>Parent</option>
              <option value="ROLE_DRIVER" style={{ background: '#121a2b' }}>Bus Driver</option>
            </select>
          </div>

          {/* Role specific fields */}
          {formData.role === 'ROLE_STUDENT' && (
            <>
              <div className="form-group">
                <label>Student ID Code</label>
                <input type="text" name="studentIdCode" className="form-input" placeholder="Enter Student ID Code" value={formData.studentIdCode} onChange={handleChange} autoComplete="off" />
              </div>
              <div className="form-group">
                <label>College Name</label>
                <input type="text" name="collegeName" className="form-input" placeholder="Enter College Name" value={formData.collegeName} onChange={handleChange} autoComplete="off" />
              </div>
            </>
          )}

          {formData.role === 'ROLE_DRIVER' && (
            <div className="form-group">
              <label>Driver License Number</label>
              <input type="text" name="licenseNumber" className="form-input" placeholder="Enter License Number" value={formData.licenseNumber} onChange={handleChange} autoComplete="off" />
            </div>
          )}

          {formData.role === 'ROLE_PARENT' && (
            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" className="form-input" placeholder="Residential Address" value={formData.address} onChange={handleChange} autoComplete="off" />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Already registered? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
