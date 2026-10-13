import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parentService } from '../../services/api';
import { ShieldCheck, UserCheck, MapPin, Clock, Bell } from 'lucide-react';

const ParentSafetyTimeline = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    parentService.getByEmail(user.email).then(res => {
      if (res.success && res.data) {
        const parentId = res.data.id;
        parentService.getChildren(parentId).then(cRes => {
          if (cRes.success && cRes.data) {
            setChildren(cRes.data);
            if (cRes.data.length > 0) {
              setSelectedChild(cRes.data[0]);
              loadHistory(parentId, cRes.data[0].id);
            }
          }
        });
      }
    });
  }, [user]);

  const loadHistory = async (parentId, childId) => {
    try {
      const res = await parentService.getChildBoardingHistory(parentId, childId);
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={26} color="#34d399" /> Child Journey Safety Timeline
          </h2>
          <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
            Isolated, Verified Boarding Logs & Live Safety Verification for your Linked Children
          </p>
        </div>
      </div>

      {/* Child Switcher */}
      <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Select Linked Child:</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => { setSelectedChild(child); loadHistory(user.parentId || 1, child.id); }}
              className={`btn ${selectedChild?.id === child.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              {child.user?.name} ({child.studentIdCode})
            </button>
          ))}
        </div>
      </div>

      {/* Timeline view */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={20} color="#34d399" /> Verified Boarding & Safety Milestones for {selectedChild?.user?.name || 'Child'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.length > 0 ? (
            history.map((item, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                borderLeft: '4px solid #34d399',
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-success">✓ VERIFIED BOARDED</span>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>Bus {item.bus?.busNumber || 'BUS-01'}</span>
                  </div>
                  <h4 style={{ margin: '0.2rem 0', color: '#fff', fontSize: '1rem' }}>
                    Boarded at {item.boardingLocation || 'Karedu Main Stop'}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> Timestamp: {new Date(item.timestamp || item.boardingTime).toLocaleString()}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <ShieldCheck size={14} /> Parent Notified
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              No boarding history recorded for today yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentSafetyTimeline;
