import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parentService, notificationService } from '../../services/api';
import { Bell, CheckCheck } from 'lucide-react';

const ParentNotifications = () => {
  const { user } = useAuth();
  const [parent, setParent] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      parentService.getByEmail(user.email).then(res => {
        if (res.success && res.data) {
          setParent(res.data);
          loadNotifications(res.data.id);
        }
      });
    }
  }, [user]);

  const loadNotifications = async (parentId) => {
    const res = await notificationService.getParentNotifications(parentId);
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  const handleMarkAllRead = async () => {
    if (parent) {
      await notificationService.markAllAsRead(parent.id);
      loadNotifications(parent.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Parent Notification Center</h2>
        <button onClick={handleMarkAllRead} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <CheckCheck size={16} /> Mark All as Read
        </button>
      </div>

      <div className="glass-card">
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No notifications found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                padding: '1rem',
                borderRadius: '12px',
                background: n.isRead ? 'rgba(15, 23, 42, 0.4)' : 'rgba(99, 102, 241, 0.12)',
                borderLeft: n.isRead ? '4px solid #64748b' : '4px solid #10b981',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.3rem', color: '#fff', fontSize: '0.95rem' }}>{n.message}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Type: {n.notificationType} | {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                {!n.isRead && (
                  <span className="badge badge-success">NEW</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentNotifications;
