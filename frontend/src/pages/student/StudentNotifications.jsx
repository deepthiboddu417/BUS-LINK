import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Info, AlertTriangle } from 'lucide-react';

const StudentNotifications = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Notifications & Alerts</h2>

      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
          <Bell size={24} color="#6366f1" />
          <div>
            <h4 style={{ margin: '0 0 0.3rem', color: '#fff' }}>College Bus Service Active</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Bus BUS-01 is operating normally on route Karedu → College today.</p>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Today at 07:30 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNotifications;
