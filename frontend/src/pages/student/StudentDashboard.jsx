import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentService, boardingService, locationService, tripService, trackingService } from '../../services/api';
import MapView from '../../components/MapView';
import { Bus, UserCheck, MapPin, Clock, ShieldCheck, AlertCircle, ArrowRight, QrCode } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [bus, setBus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [boardingStatus, setBoardingStatus] = useState('NOT_BOARDED');
  const [boardingTime, setBoardingTime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive genuine busLocation dynamically from verified live bus telemetry
  const busLocation = (bus && typeof bus.currentLat === 'number' && typeof bus.currentLng === 'number' && !isNaN(bus.currentLat) && !isNaN(bus.currentLng)) 
    ? { lat: bus.currentLat, lng: bus.currentLng } 
    : null;

  const busRef = useRef(null);
  busRef.current = bus;

  useEffect(() => {
    fetchStudentData();
    const interval = setInterval(fetchBusLocation, 3500); // Live tracking updates
    return () => clearInterval(interval);
  }, [user]);

  const fetchStudentData = async () => {
    try {
      if (!user) return;
      const studentRes = await studentService.getByEmail(user.email);
      if (studentRes.success && studentRes.data) {
        const stuData = studentRes.data;
        setStudent(stuData);

        if (stuData.bus) {
          let busObj = stuData.bus;
          // Immediately fetch freshest authorized location telemetry from the tracking service
          try {
            const locRes = await trackingService.getLatest(stuData.bus.id);
            if (locRes.success && locRes.data) {
              busObj = { ...busObj, ...locRes.data };
            }
          } catch (ignored) {}
          setBus(busObj);

          // Fetch active trip & check today's boarding status
          const tripRes = await tripService.getActiveForBus(stuData.bus.id);
          if (tripRes.success && tripRes.data) {
            setActiveTrip(tripRes.data);
          }

          const attendanceRes = await boardingService.getStudentHistory(stuData.id);
          if (attendanceRes.success && attendanceRes.data) {
            const todayRecord = attendanceRes.data.find(a => 
              new Date(a.date).toDateString() === new Date().toDateString()
            );
            if (todayRecord) {
              setBoardingStatus('BOARDED');
              setBoardingTime(todayRecord.boardingTime);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error loading student dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusLocation = async () => {
    const currentBus = busRef.current;
    if (currentBus && currentBus.id) {
      try {
        const locRes = await trackingService.getLatest(currentBus.id);
        if (locRes.success && locRes.data) {
          setBus(prev => prev ? { ...prev, ...locRes.data } : locRes.data);
        }
      } catch (e) {}
    }
  };

  if (loading) return <div style={{ color: '#6366f1', padding: '2rem' }}>Loading Student Dashboard...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Student Welcome Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(14, 165, 233, 0.15))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 0.4rem' }}>
            Welcome back, {student?.user?.name || user.name}!
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Student ID: <strong style={{ color: '#38bdf8' }}>{student?.studentIdCode || 'STU1001'}</strong> | College: {student?.collegeName}
          </p>
        </div>
        
        <div>
          {boardingStatus === 'BOARDED' ? (
            <div className="badge badge-success" style={{ padding: '0.65rem 1.3rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} /> Boarded Today
            </div>
          ) : (
            <Link 
              to="/student/boarding" 
              className="btn btn-primary" 
              style={{ fontSize: '0.95rem', padding: '0.65rem 1.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <QrCode size={18} /> View QR Pass
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid-cols-4">
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Bus</span>
          <h3 style={{ fontSize: '1.5rem', color: '#818cf8', margin: '0.4rem 0 0.2rem' }}>{bus?.busNumber || 'BUS-01'}</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Driver: {bus?.driver?.user?.name || 'Ramesh Driver'}</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Route Name</span>
          <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', margin: '0.4rem 0 0.2rem' }}>{bus?.route?.routeName || 'Karedu → College'}</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>4 Stops En Route</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Journey Status</span>
          <h3 style={{ margin: '0.4rem 0 0.2rem' }}>
            <span className={`badge ${bus?.status === 'IN_TRANSIT' ? 'badge-success' : 'badge-warning'}`}>
              {bus?.status || 'NOT_STARTED'}
            </span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Updated Live</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Boarding Status</span>
          <h3 style={{ margin: '0.4rem 0 0.2rem' }}>
            <span className={`badge ${boardingStatus === 'BOARDED' ? 'badge-success' : 'badge-danger'}`}>
              {boardingStatus === 'BOARDED' ? '✓ BOARDED' : 'PENDING'}
            </span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {boardingTime ? `Time: ${new Date(boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not yet boarded'}
          </span>
        </div>
      </div>

      {/* Live Map Section */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin color="#6366f1" size={22} /> Live College Bus Location
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Real-time GPS tracking via OpenStreetMap & Leaflet</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {busLocation ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#34d399' }}>
                <span className="pulse-dot"></span> Live Signal Active ({bus?.trackingSource || 'REAL_GPS'})
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#fbbf24' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></span> Awaiting Live GPS
              </span>
            )}
          </div>
        </div>

        <MapView 
          busLocation={busLocation} 
          routeStops={bus?.route?.stops || []} 
          busNumber={bus?.busNumber || 'BUS-01'} 
          status={bus?.status || 'IN_TRANSIT'} 
          trackingSource={bus?.trackingSource || 'REAL_GPS'}
          lastUpdated={bus?.lastLocationUpdate}
          lastLocationUpdateEpoch={bus?.lastLocationUpdateEpoch}
          accuracy={bus?.currentAccuracy}
        />
      </div>

      {/* Today's Journey Timeline */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="#38bdf8" /> Today's Journey Schedule
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {(bus?.route?.stops || [
            { stopName: 'Karedu Bus Stop', expectedArrivalTime: '07:30 AM', sequenceNumber: 1 },
            { stopName: 'Kandukur Junction', expectedArrivalTime: '08:00 AM', sequenceNumber: 2 },
            { stopName: 'Ongole Bus Stand', expectedArrivalTime: '08:35 AM', sequenceNumber: 3 },
            { stopName: 'College Main Gate', expectedArrivalTime: '09:00 AM', sequenceNumber: 4 }
          ]).map((stop, i) => (
            <div key={i} style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700 }}>STOP #{stop.sequenceNumber || i + 1}</span>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: '0.3rem 0' }}>{stop.stopName}</h4>
              <span style={{ fontSize: '0.8rem', color: '#10b981' }}>ETA: {stop.expectedArrivalTime || '08:00 AM'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
