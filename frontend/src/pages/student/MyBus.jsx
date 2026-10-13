import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService, trackingService } from '../../services/api';
import MapView from '../../components/MapView';
import { Bus, User, Route as RouteIcon, MapPin, Phone, Shield, RefreshCw } from 'lucide-react';

const MyBus = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [bus, setBus] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const busRef = useRef(null);
  busRef.current = bus;

  useEffect(() => {
    let isMounted = true;
    if (user) {
      studentService.getByEmail(user.email).then(async res => {
        if (res.success && res.data && isMounted) {
          setStudent(res.data);
          if (res.data.bus) {
            setBus(res.data.bus);
            try {
              const latestRes = await trackingService.getLatest(res.data.bus.id);
              if (latestRes.success && latestRes.data && isMounted) {
                setBus(prev => ({ ...prev, ...latestRes.data }));
                setLastRefreshed(new Date());
              }
            } catch (ignored) {}
          }
        }
      });
    }

    const interval = setInterval(async () => {
      const curBus = busRef.current;
      if (curBus && curBus.id) {
        try {
          const res = await trackingService.getLatest(curBus.id);
          if (res.success && res.data && isMounted) {
            setBus(prev => ({ ...prev, ...res.data }));
            setLastRefreshed(new Date());
          }
        } catch (ignored) {}
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>My Assigned College Bus</h2>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Real-time transit telemetry via OpenStreetMap
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Last sync: {lastRefreshed.toLocaleTimeString()}
        </span>
      </div>

      {bus ? (
        <>
          <div className="grid-cols-3">
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.85rem', borderRadius: '12px' }}>
                  <Bus size={32} color="#6366f1" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bus Identification</span>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>{bus.busNumber}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Capacity: {bus.capacity || 40} Seats</span>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(14, 165, 233, 0.2)', padding: '0.85rem', borderRadius: '12px' }}>
                  <User size={32} color="#0ea5e9" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Assigned Driver</span>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>{bus.driver?.user?.name || 'Ramesh Driver'}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Phone: {bus.driver?.user?.phone || '+91 9440112233'}</span>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.85rem', borderRadius: '12px' }}>
                  <RouteIcon size={32} color="#10b981" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Assigned Route</span>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>{bus.route?.routeName || 'Karedu → College'}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Status: {bus.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Live Location & Route Stops</h3>
              {bus.trackingSource && (
                <span className={`badge ${bus.trackingSource === 'REAL_GPS' ? 'badge-success' : 'badge-warning'}`}>
                  {bus.trackingSource === 'REAL_GPS' ? '● REAL GPS' : '● SIMULATED'}
                </span>
              )}
            </div>
            <MapView 
              busLocation={bus && typeof bus.currentLat === 'number' && typeof bus.currentLng === 'number' ? { lat: bus.currentLat, lng: bus.currentLng } : null} 
              routeStops={bus.route?.stops || []} 
              busNumber={bus.busNumber} 
              status={bus.status} 
              trackingSource={bus.trackingSource || 'REAL_GPS'}
              lastUpdated={bus.lastLocationUpdate}
              lastLocationUpdateEpoch={bus.lastLocationUpdateEpoch}
              accuracy={bus.currentAccuracy}
            />
          </div>
        </>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#94a3b8' }}>No bus assigned yet. Contact Admin.</p>
        </div>
      )}
    </div>
  );
};

export default MyBus;
