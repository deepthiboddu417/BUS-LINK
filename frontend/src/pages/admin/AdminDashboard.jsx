import React, { useState, useEffect, useRef } from 'react';
import { adminService, trackingService } from '../../services/api';
import BusMap from '../../components/BusMap';
import { 
  Users, UserCheck, Bus, Route, Navigation, ShieldAlert, 
  Activity, CheckCircle2, Play, Square, RefreshCw, MapPin, Radio, Cpu, AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 2,
    totalParents: 1,
    totalDrivers: 1,
    totalBuses: 1,
    activeTrips: 1,
    studentsBoardedToday: 1,
    emergencyAlertsCount: 0
  });

  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [lastSync, setLastSync] = useState(new Date());

  const selectedBusRef = useRef(null);
  selectedBusRef.current = selectedBus;

  useEffect(() => {
    adminService.getStats().then(res => {
      if (res.success && res.data) {
        setStats(res.data);
      }
    });

    loadFleetTelemetry();

    const interval = setInterval(loadFleetTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadFleetTelemetry = async () => {
    try {
      const res = await trackingService.getActiveBuses();
      if (res.success && res.data) {
        setBuses(res.data);
        setLastSync(new Date());

        const current = selectedBusRef.current;
        const target = current 
          ? res.data.find(b => b.id === current.id) || res.data[0]
          : res.data[0];

        if (target) {
          setSelectedBus(target);
          if (target.route && target.route.stops) {
            setRouteStops(target.route.stops);
          }

          // Check simulation status
          try {
            const simRes = await trackingService.getSimulationStatus(target.id);
            if (simRes.success && simRes.data) {
              setIsSimulating(Boolean(simRes.data.active));
            }
          } catch (ignored) {}
        }
      }
    } catch (e) {
      console.error('Error fetching fleet telemetry:', e);
    }
  };

  const handleStartSimulation = async (busId) => {
    setSimLoading(true);
    try {
      const res = await trackingService.startSimulation(busId);
      if (res.success) {
        setIsSimulating(true);
        setStatusMsg(`▶ Demonstration Simulation Started for Bus #${busId}. Status marked as SIMULATED.`);
        loadFleetTelemetry();
      }
    } catch (err) {
      alert(err.message || 'Error starting simulation');
    } finally {
      setSimLoading(false);
    }
  };

  const handleStopSimulation = async (busId) => {
    setSimLoading(true);
    try {
      const res = await trackingService.stopSimulation(busId);
      if (res.success) {
        setIsSimulating(false);
        setStatusMsg(`⏹ Demonstration Simulation Stopped for Bus #${busId}.`);
        loadFleetTelemetry();
      }
    } catch (err) {
      alert(err.message || 'Error stopping simulation');
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Admin Title Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(16, 185, 129, 0.15))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
            COLLEGE TRANSPORTATION SYSTEM CONTROL
          </span>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: '0.2rem 0' }}>
            BUS-LINK Admin Command Center
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Fleet-wide Real-Time Telemetry & Simulation Management
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#34d399" />
            <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>System Operational</span>
          </div>
          <button 
            onClick={loadFleetTelemetry} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
          >
            <RefreshCw size={14} /> Sync ({lastSync.toLocaleTimeString()})
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', color: '#818cf8', padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 600 }}>
          {statusMsg}
        </div>
      )}

      {/* Stats Metric Cards */}
      <div className="grid-cols-4">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Students</span>
              <h3 style={{ fontSize: '1.8rem', color: '#fff', margin: '0.2rem 0' }}>{stats.totalStudents}</h3>
              <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Enrolled Passengers</span>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <Users size={28} color="#38bdf8" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Buses</span>
              <h3 style={{ fontSize: '1.8rem', color: '#fff', margin: '0.2rem 0' }}>{stats.totalBuses}</h3>
              <span style={{ fontSize: '0.8rem', color: '#818cf8' }}>Active Fleet</span>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <Bus size={28} color="#6366f1" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Boarded Today</span>
              <h3 style={{ fontSize: '1.8rem', color: '#fff', margin: '0.2rem 0' }}>{stats.studentsBoardedToday}</h3>
              <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Verified Boardings</span>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <UserCheck size={28} color="#10b981" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Emergency Alerts</span>
              <h3 style={{ fontSize: '1.8rem', color: stats.emergencyAlertsCount > 0 ? '#f87171' : '#fff', margin: '0.2rem 0' }}>
                {stats.emergencyAlertsCount}
              </h3>
              <span style={{ fontSize: '0.8rem', color: stats.emergencyAlertsCount > 0 ? '#f87171' : '#64748b' }}>
                {stats.emergencyAlertsCount > 0 ? 'Action Required' : 'All Clear'}
              </span>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
              <ShieldAlert size={28} color="#ef4444" />
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Live Tracking Map & Simulation Controls */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={22} color="#6366f1" /> Fleet Tracking & Demonstration Simulator
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Leaflet.js + OpenStreetMap | Real vs. Simulated GPS Telemetry Fleet Monitor
            </span>
          </div>

          {/* Demonstration Controls */}
          {selectedBus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${selectedBus.trackingSource === 'REAL_GPS' ? 'badge-success' : 'badge-warning'}`}>
                {selectedBus.trackingSource === 'REAL_GPS' ? '● REAL GPS' : '● SIMULATED'}
              </span>

              {!isSimulating ? (
                <button
                  onClick={() => handleStartSimulation(selectedBus.id)}
                  disabled={simLoading}
                  className="btn btn-warning"
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Play size={16} /> Start Demo Simulation
                </button>
              ) : (
                <button
                  onClick={() => handleStopSimulation(selectedBus.id)}
                  disabled={simLoading}
                  className="btn btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Square size={16} /> Stop Simulation
                </button>
              )}
            </div>
          )}
        </div>

        {/* Map Container */}
        <BusMap 
          buses={buses}
          busLocation={selectedBus && typeof selectedBus.currentLat === 'number' && typeof selectedBus.currentLng === 'number' ? { lat: selectedBus.currentLat, lng: selectedBus.currentLng } : null}
          routeStops={routeStops}
          busNumber={selectedBus?.busNumber || 'BUS-01'}
          status={selectedBus?.status || 'IN_TRANSIT'}
          trackingSource={selectedBus?.trackingSource || (isSimulating ? 'SIMULATED' : 'REAL_GPS')}
          lastUpdated={selectedBus?.lastLocationUpdate}
          lastLocationUpdateEpoch={selectedBus?.lastLocationUpdateEpoch}
          height="480px"
        />

        {/* Fleet Status Table */}
        <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem' }}>Bus Number</th>
                <th style={{ padding: '0.75rem' }}>License Plate</th>
                <th style={{ padding: '0.75rem' }}>Assigned Driver</th>
                <th style={{ padding: '0.75rem' }}>Route</th>
                <th style={{ padding: '0.75rem' }}>Tracking Mode</th>
                <th style={{ padding: '0.75rem' }}>Current Coordinates</th>
                <th style={{ padding: '0.75rem' }}>Last Update</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {buses.map(b => {
                const isSelected = selectedBus?.id === b.id;
                const epoch = b.lastLocationUpdateEpoch || (b.lastLocationUpdate ? new Date(b.lastLocationUpdate).getTime() : null);
                const isTripActive = b.status === 'IN_TRANSIT' || b.status === 'STARTED';
                const isStale = isTripActive && epoch ? (Date.now() - epoch) > 60000 : false;
                const diffSec = epoch ? Math.max(0, Math.round((Date.now() - epoch) / 1000)) : null;
                const relativeText = diffSec != null ? (diffSec < 5 ? 'just now' : diffSec < 60 ? `${diffSec}s ago` : `${Math.round(diffSec/60)}m ago`) : 'Never';
                return (
                  <tr 
                    key={b.id} 
                    onClick={() => setSelectedBus(b)}
                    style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent'
                  }}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: '#818cf8' }}>{b.busNumber}</td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{b.licensePlate || 'AP 27 TX 1024'}</td>
                    <td style={{ padding: '0.75rem' }}>{b.driver?.user?.name || 'Ramesh Driver'}</td>
                    <td style={{ padding: '0.75rem' }}>{b.route?.routeName || 'Karedu → College'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${b.trackingSource === 'REAL_GPS' ? 'badge-success' : 'badge-warning'}`}>
                        {b.trackingSource === 'REAL_GPS' ? 'REAL_GPS' : 'SIMULATED'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {b.currentLat ? `${b.currentLat.toFixed(4)}, ${b.currentLng.toFixed(4)}` : 'No fix'}
                    </td>
                    <td style={{ padding: '0.75rem', color: isStale ? '#fbbf24' : '#94a3b8', fontSize: '0.8rem' }}>
                      {relativeText}
                      {isStale && <span style={{ marginLeft: '6px' }} title="Stale GPS signal (> 60s)">⚠️ Stale</span>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${b.status === 'IN_TRANSIT' ? 'badge-success' : 'badge-info'}`}>
                        {b.status || 'STANDBY'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Fleet Management Quick Links</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <a href="/admin/students" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Manage Students</a>
          <a href="/admin/buses" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Manage Buses</a>
          <a href="/admin/routes" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Manage Routes</a>
          <a href="/admin/attendance" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Attendance Logs</a>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
