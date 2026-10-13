import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService, emergencyService } from '../services/api';
import { Bus, Bell, LogOut, ShieldAlert, UserCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && user.role === 'ROLE_PARENT' && user.parentId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 4000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      if (user && user.parentId) {
        const res = await notificationService.getParentNotifications(user.parentId);
        if (res.success && res.data) {
          setNotifications(res.data);
          const unread = res.data.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      }
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  const handleMarkAllRead = async () => {
    if (user && user.parentId) {
      await notificationService.markAllAsRead(user.parentId);
      fetchNotifications();
    }
  };

  const handleEmergencyClick = async () => {
    if (window.confirm("🚨 Are you sure you want to send an EMERGENCY ALERT to College Admin and Bus Authorities?")) {
      try {
        await emergencyService.raiseEmergency(user.userId, user.busId || 1, "EMERGENCY: Urgent assistance requested by user!", 15.5050, 80.0490);
        alert("🚨 Emergency alert dispatched successfully! Admin & Emergency contacts notified.");
      } catch (err) {
        alert("Emergency alert sent.");
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '0.85rem 2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            padding: '0.6rem',
            borderRadius: '14px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bus color="#ffffff" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>
              BUS-LINK
            </h1>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              Connected Buses. Safer Journeys.
            </span>
          </div>
        </Link>

        {/* User Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Emergency Button */}
            <button 
              onClick={handleEmergencyClick}
              className="btn btn-danger"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <ShieldAlert size={16} /> EMERGENCY
            </button>

            {/* Parent Notification Bell */}
            {user.role === 'ROLE_PARENT' && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '0.6rem',
                    color: '#fff',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <Bell size={20} color="#cbd5e1" />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Drawer */}
                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '52px',
                    width: '360px',
                    background: '#111827',
                    border: '1px solid var(--border-focus)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 2000,
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>Notifications</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '0.5rem' }}>
                      {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#64748b', padding: '1rem', fontSize: '0.85rem' }}>No notifications yet</p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            style={{
                              padding: '0.75rem',
                              borderRadius: '10px',
                              marginBottom: '0.4rem',
                              background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.12)',
                              borderLeft: n.isRead ? '3px solid transparent' : '3px solid #6366f1'
                            }}
                          >
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#f8fafc', lineHeight: 1.4 }}>{n.message}</p>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Info */}
            {(() => {
              const displayName = (user && user.name && user.name !== 'Rahul Kumar') ? user.name : 'Veeru';
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>{displayName}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', marginTop: '1px' }}>
                      {user.role ? user.role.replace('ROLE_', '') : 'STUDENT'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Logout */}
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div>
            <Link to="/login" className="btn btn-primary">Login</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
