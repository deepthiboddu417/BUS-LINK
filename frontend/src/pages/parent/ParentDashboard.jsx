import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parentService, locationService, notificationService, boardingService, trackingService } from '../../services/api';
import MapView from '../../components/MapView';
import { ShieldCheck, UserCheck, Bus, Clock, MapPin, Bell, Phone, CheckCircle2 } from 'lucide-react';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [parent, setParent] = useState(null);
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive genuine busLocation dynamically from verified live child bus telemetry
  const busLocation = (selectedChild?.bus && typeof selectedChild.bus.currentLat === 'number' && typeof selectedChild.bus.currentLng === 'number' && !isNaN(selectedChild.bus.currentLat) && !isNaN(selectedChild.bus.currentLng)) 
    ? { lat: selectedChild.bus.currentLat, lng: selectedChild.bus.currentLng } 
    : null;

  const selectedChildRef = useRef(null);
  selectedChildRef.current = selectedChild;

  useEffect(() => {
    fetchParentData();
    const interval = setInterval(fetchBusPosition, 3500);
    return () => clearInterval(interval);
  }, [user]);

  const fetchParentData = async () => {
    try {
      if (!user) return;
      const parentRes = await parentService.getByEmail(user.email);
      if (parentRes.success && parentRes.data) {
        setParent(parentRes.data);
        const childrenRes = await parentService.getChildren(parentRes.data.id);
        if (childrenRes.success && childrenRes.data && childrenRes.data.length > 0) {
          setChildrenList(childrenRes.data);
          const child = childrenRes.data[0];
          setSelectedChild(child);

          if (child.bus?.id) {
            try {
              const bRes = await trackingService.getLatest(child.bus.id);
              if (bRes.success && bRes.data) {
                child.bus = { ...child.bus, ...bRes.data };
                setSelectedChild({ ...child });
              }
            } catch (ignored) {}
          }

          // Fetch attendance for child
          const attRes = await boardingService.getStudentHistory(child.id);
          if (attRes.success && attRes.data) {
            const today = attRes.data.find(a => new Date(a.date).toDateString() === new Date().toDateString());
            setTodayAttendance(today);
          }
        }

        // Fetch notifications
        const notifRes = await notificationService.getParentNotifications(parentRes.data.id);
        if (notifRes.success && notifRes.data) {
          setRecentNotifications(notifRes.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusPosition = async () => {
    const currentChild = selectedChildRef.current;
    if (currentChild && currentChild.bus && currentChild.bus.id) {
      try {
        const locRes = await trackingService.getLatest(currentChild.bus.id);
        if (locRes.success && locRes.data) {
          // Update selected child bus status
          setSelectedChild(prev => prev ? { ...prev, bus: { ...prev.bus, ...locRes.data } } : prev);
        }
      } catch (e) {}
    }
  };

  if (loading) return <div style={{ color: '#6366f1', padding: '2rem' }}>Loading Parent Dashboard...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(14, 165, 233, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PARENT GUARDIAN CONSOLE
          </span>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: '0.2rem 0' }}>
            Welcome, {user.name}
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Tracking Safety & Journey Progress of Your Child
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={36} color="#34d399" />
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>CHILD PROTECTION</span>
            <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 700 }}>ACTIVE MONITORING</span>
          </div>
        </div>
      </div>

      {/* Child Information Card */}
      {selectedChild ? (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>YOUR CHILD PROFILE</span>
              <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '0.2rem 0' }}>
                {selectedChild.user?.name || 'Student'}
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Student ID: {selectedChild.studentIdCode || 'STU1001'} | {selectedChild.collegeName}</span>
            </div>

            <div>
              {todayAttendance ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '0.6rem 1.2rem', borderRadius: '12px', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, display: 'block' }}>
                    ✓ Successfully Boarded
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Boarding Time: {new Date(todayAttendance.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', padding: '0.6rem 1.2rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
                    ⏳ Boarding Pending
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid-cols-4">
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bus Assigned</span>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#818cf8', margin: '0.2rem 0' }}>
                {selectedChild.bus?.busNumber || 'BUS-01'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Route</span>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: '0.2rem 0' }}>
                {selectedChild.bus?.route?.routeName || 'Karedu → College'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bus Trip Status</span>
              <p style={{ margin: '0.2rem 0' }}>
                <span className={`badge ${selectedChild.bus?.status === 'IN_TRANSIT' ? 'badge-success' : 'badge-info'}`}>
                  🚌 {selectedChild.bus?.status || 'NOT_STARTED'}
                </span>
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Driver Contact</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8', margin: '0.2rem 0' }}>
                {selectedChild.bus?.driver?.user?.name || 'Ramesh Driver'} ({selectedChild.bus?.driver?.user?.phone || '9440112233'})
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card"><p style={{ color: '#94a3b8' }}>No linked student found.</p></div>
      )}

      {/* Live Map Section */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin color="#10b981" size={22} /> Track Live Child Bus Journey
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Updated live position from bus GPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {busLocation ? (
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                ● Live Sync ({selectedChild?.bus?.trackingSource || 'REAL_GPS'})
              </span>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>
                ⏳ Awaiting Live GPS
              </span>
            )}
          </div>
        </div>

        <MapView 
          busLocation={busLocation} 
          routeStops={selectedChild?.bus?.route?.stops || []} 
          busNumber={selectedChild?.bus?.busNumber || 'BUS-01'} 
          status={selectedChild?.bus?.status || 'IN_TRANSIT'} 
          trackingSource={selectedChild?.bus?.trackingSource || 'REAL_GPS'}
          lastUpdated={selectedChild?.bus?.lastLocationUpdate}
          lastLocationUpdateEpoch={selectedChild?.bus?.lastLocationUpdateEpoch}
          accuracy={selectedChild?.bus?.currentAccuracy}
        />
      </div>

      {/* In-App Notifications Feed */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} color="#6366f1" /> Recent Parent Notifications
        </h3>

        {recentNotifications.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No notifications received yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentNotifications.slice(0, 5).map(n => (
              <div key={n.id} style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '1rem',
                borderRadius: '12px',
                borderLeft: '4px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{ margin: 0, color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>{n.message}</p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Type: {n.notificationType} | {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="badge badge-success">DELIVERED</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ParentDashboard;
