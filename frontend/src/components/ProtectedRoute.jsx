import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#6366f1' }}>
        <h3>Loading BUS-LINK...</h3>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role dashboard if attempting unauthorized route
    switch (user.role) {
      case 'ROLE_STUDENT':
        return <Navigate to="/student/dashboard" replace />;
      case 'ROLE_PARENT':
        return <Navigate to="/parent/dashboard" replace />;
      case 'ROLE_DRIVER':
        return <Navigate to="/driver/dashboard" replace />;
      case 'ROLE_ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
