import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parentService, trackingService } from '../../services/api';
import BusMap from '../../components/BusMap';
import { 
  MapPin, Navigation, Bus, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, User, ShieldCheck, Radio, Phone
} from 'lucide-react';

const TrackBus = () => {
  const { user } = useAuth();
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [busData, setBusData] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isStale, setIsStale] = useState(false);

  const selectedChildRef = useRef(null);
  selectedChildRef.current = selectedChild;

  // Load parent profile & linked children
  useEffect(() => {
    let isMounted = true;

    const loadParentData = async () => {
      try {
        setLoading(true);
        if (!user) return;
        const pRes = await parentService.getByEmail(user.email);
        if (pRes.success && pRes.data && isMounted) {
          const chRes = await parentService.getChildren(pRes.data.id);
          if (chRes.success && chRes.data && chRes.data.length > 0 && isMounted) {
            setChildrenList(chRes.data);
            const firstChild = chRes.data[0];
            setSelectedChild(firstChild);
            if (firstChild.bus?.id) {
              fetchBusTelemetry(firstChild.bus.id);
            }
          } else {
            setError('No student is linked to your parent account. Please contact school administration.');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load children profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadParentData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Fetch telemetry for specific bus
  const fetchBusTelemetry = async (busId) => {
    if (!busId) return;
    try {
      const res = await trackingService.getLatest(busId);
      if (res.success && res.data) {
        const bus = res.data;
        setBusData(bus);
        setLastRefreshed(new Date());

        // Check staleness (> 60 seconds during active transit)
        const isTripActive = bus.status === 'IN_TRANSIT' || bus.status === 'STARTED';
        const epoch = bus.lastLocationUpdateEpoch || (bus.lastLocationUpdate ? new Date(bus.lastLocationUpdate).getTime() : null);
        if (isTripActive && epoch && !isNaN(epoch)) {
          const ageSeconds = (Date.now() - epoch) / 1000;
          setIsStale(ageSeconds > 60);
        } else {
          setIsStale(false);
        }

        // Load route stops if needed
        if (bus.route && bus.route.stops) {
          setRouteStops(bus.route.stops);
        } else {
          try {
            const rRes = await trackingService.getRoute(busId);
            if (rRes.success && rRes.data && rRes.data.stops) {
              setRouteStops(rRes.data.stops);
            }
          } catch (ignored) {}
        }
      }
    } catch (e) {
      console.error('Error fetching bus telemetry:', e);
    }
  };

  // Live polling every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const current = selectedChildRef.current;
      if (current && current.bus && current.bus.id) {
        fetchBusTelemetry(current.bus.id);
      }
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    if (child.bus?.id) {
      fetchBusTelemetry(child.bus.id);
    } else {
      setBusData(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={28} className="pulse-icon" color="#818cf8" style={{ marginBottom: '1rem' }} />
        <p style={{ color: '#94a3b8', margin: 0 }}>Connecting to authorized bus tracking feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '2rem', border: '1px solid #ef4444' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f87171' }}>
          <AlertTriangle size={24} />
          <h3 style={{ margin: 0 }}>Tracking Unavailable</h3>
        </div>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>{error}</p>
      </div>
    );
  }

  const bus = busData || selectedChild?.bus;
  const hasCoordinates = bus && bus.currentLat != null && bus.currentLng != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Page Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(14, 165, 233, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              PARENT GUARDIAN LIVE TRACKING
            </span>
            {bus?.trackingSource && (
              <span className={`badge ${bus.trackingSource === 'REAL_GPS' ? 'badge-success' : 'badge-warning'}`}>
                {bus.trackingSource === 'REAL_GPS' ? '● REAL GPS' : '● SIMULATED'}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>
            Live School Bus Tracking
          </h2>
          <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Tracking journey for <strong style={{ color: '#fff' }}>{selectedChild?.user?.name || 'Student'}</strong> (ID: {selectedChild?.studentIdCode})
          </p>
        </div>

        {/* Child Selector (if parent has multiple children) */}
        {childrenList.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {childrenList.map(ch => (
              <button
                key={ch.id}
                onClick={() => handleSelectChild(ch)}
                className={`btn ${selectedChild?.id === ch.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                {ch.user?.name}
              </button>
            ))}
          </div>
        )}

        <button 
          onClick={() => bus?.id && fetchBusTelemetry(bus.id)} 
          className="btn btn-secondary" 
          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} /> Refresh ({lastRefreshed.toLocaleTimeString()})
        </button>
      </div>

      {/* Stale Signal Warning Banner */}
      {isStale && (
        <div style={{ background: 'rgba(245, 158, 11, 0.18)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '0.85rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>GPS Signal Stale:</strong> No recent location updates received from vehicle in over 60 seconds. The bus may be in a low-cellular zone or paused.
          </div>
        </div>
      )}

      {/* Vehicle & Journey Metrics */}
      <div className="grid-cols-4">
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Assigned Vehicle</span>
          <h3 style={{ fontSize: '1.3rem', color: '#818cf8', margin: '0.3rem 0' }}>{bus?.busNumber || 'BUS-01'}</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Plate: {bus?.licensePlate || 'AP 27 TX 1024'}</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Journey Status</span>
          <h3 style={{ margin: '0.3rem 0' }}>
            <span className={`badge ${bus?.status === 'IN_TRANSIT' ? 'badge-success' : 'badge-warning'}`}>
              🚌 {bus?.status || 'NOT_STARTED'}
            </span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Route: {bus?.route?.routeName || 'Karedu → College'}</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Telemetry Source</span>
          <h3 style={{ fontSize: '1.15rem', color: bus?.trackingSource === 'REAL_GPS' ? '#34d399' : '#f59e0b', margin: '0.3rem 0' }}>
            {bus?.trackingSource === 'REAL_GPS' ? 'Verified Driver GPS' : 'Route Simulation'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {bus?.currentAccuracy ? `Accuracy: ±${Math.round(bus.currentAccuracy)}m` : 'Live satellite link'}
          </span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Assigned Driver</span>
          <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', margin: '0.3rem 0' }}>
            {bus?.driver?.user?.name || 'Ramesh Driver'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Phone: {bus?.driver?.user?.phone || '+91 9440112233'}
          </span>
        </div>
      </div>

      {/* Real Map View */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="#10b981" /> Child Bus Journey Route & Live Stops
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Leaflet + OpenStreetMap | Continuous live sync active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
            <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Active Stream</span>
          </div>
        </div>

        {hasCoordinates ? (
          <BusMap 
            busLocation={{ lat: bus.currentLat, lng: bus.currentLng }} 
            routeStops={routeStops} 
            busNumber={bus.busNumber || 'BUS-01'} 
            status={bus.status || 'IN_TRANSIT'} 
            trackingSource={bus.trackingSource || 'REAL_GPS'}
            lastUpdated={bus.lastLocationUpdate}
            lastLocationUpdateEpoch={bus.lastLocationUpdateEpoch}
            accuracy={bus.currentAccuracy}
            height="460px"
          />
        ) : (
          <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
            <Bus size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
            <h4 style={{ color: '#f8fafc', margin: 0 }}>No GPS Location Available Yet</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', maxWidth: '400px', textAlign: 'center' }}>
              The driver has not started transmitting location coordinates for this bus yet today. Please check back when the journey starts.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default TrackBus;
