import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverService, busService, tripService, boardingService, studentService, trackingService } from '../../services/api';
import MapView from '../../components/MapView';
import GpsDiagnosticsPanel from '../../components/GpsDiagnosticsPanel';
import { 
  Bus, Navigation, Play, Square, Pause, MapPin, Users, CheckCircle2, 
  AlertCircle, Radio, Compass, RefreshCw, ExternalLink, Zap, ShieldCheck 
} from 'lucide-react';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [bus, setBus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  // Real GPS state
  const [isGpsTracking, setIsGpsTracking] = useState(false);
  const [isGpsPaused, setIsGpsPaused] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('STOPPED'); // 'STOPPED', 'WAITING_FOR_GPS', 'GPS_ACTIVE', 'GPS_PAUSED', 'GPS_ERROR'
  const [gpsError, setGpsError] = useState(null);
  const [currentGps, setCurrentGps] = useState(null); // { lat, lng, accuracy, speed, heading, timestamp }
  const [updateCount, setUpdateCount] = useState(0);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [gpsPermission, setGpsPermission] = useState('prompt');

  // Refs for tracking watcher, throttling, and wake lock
  const watchIdRef = useRef(null);
  const lastSentPosRef = useRef(null);
  const lastSentTimeRef = useRef(0);
  const isMountedRef = useRef(true);
  const wakeLockRef = useRef(null);
  const activeTripRef = useRef(null);
  activeTripRef.current = activeTrip;

  useEffect(() => {
    isMountedRef.current = true;
    fetchDriverData();

    // Query Geolocation permission state if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (isMountedRef.current) {
          setGpsPermission(result.state);
          result.onchange = () => {
            if (isMountedRef.current) setGpsPermission(result.state);
          };
        }
      }).catch(() => {});
    }

    return () => {
      isMountedRef.current = false;
      stopGpsTrackingInternal();
      releaseWakeLock();
    };
  }, [user]);

  const fetchDriverData = async () => {
    try {
      if (!user) return;
      const dRes = await driverService.getByEmail(user.email);
      if (dRes.success && dRes.data) {
        setDriver(dRes.data);
        const bRes = await busService.getAll();
        if (bRes.success && bRes.data) {
          const myBus = bRes.data.find(b => b.driver?.id === dRes.data.id || b.driver?.user?.email === user.email);
          if (myBus) {
            setBus(myBus);
            const tripRes = await tripService.getActiveForBus(myBus.id);
            if (tripRes.success && tripRes.data) {
              setActiveTrip(tripRes.data);
              // If trip was already active and not simulating, initialize status to standby
              if (!isGpsTracking && !isSimulating) {
                setGpsStatus('WAITING_FOR_GPS');
              }
            }

            // Fetch today's passenger boarding attendance & passenger list
            const attRes = await boardingService.getTodayBusAttendance(myBus.id);
            if (attRes.success && attRes.data) {
              setTodayAttendance(attRes.data);
            }

            const stuRes = await studentService.getAll();
            if (stuRes.success && stuRes.data) {
              setPassengers(stuRes.data);
            }

            // Check simulation status
            try {
              const simStatus = await trackingService.getSimulationStatus(myBus.id);
              if (simStatus.success && simStatus.data) {
                setIsSimulating(Boolean(simStatus.data.active));
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Screen Wake Lock to prevent phone screen sleep while driving
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        // Ignored if unsupported or restricted
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // Distance helper (Haversine in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Transmit genuine GPS coordinates to authenticated Spring Boot backend
  const transmitLocation = async (lat, lng, accuracy, speed, heading) => {
    if (!bus || !bus.id) return;
    try {
      const payload = {
        busId: bus.id,
        tripId: activeTripRef.current?.id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ? Math.round(accuracy * 10) / 10 : null,
        speed: speed != null && !isNaN(speed) ? Math.round(speed * 3.6 * 10) / 10 : null, // km/h
        heading: heading != null && !isNaN(heading) ? Math.round(heading) : null,
        source: 'REAL_GPS',
        timestamp: new Date().toISOString()
      };

      const res = await trackingService.submitLocation(payload);
      if (res.success && isMountedRef.current) {
        setBus(prev => ({
          ...prev,
          ...res.data,
          currentLat: res.data.currentLat,
          currentLng: res.data.currentLng,
          lastLocationUpdateEpoch: res.data.lastLocationUpdateEpoch || Date.now(),
          status: res.data.status || 'IN_TRANSIT',
          trackingSource: 'REAL_GPS'
        }));
        if (activeTripRef.current) {
          setActiveTrip(prev => prev ? { ...prev, status: 'IN_TRANSIT' } : prev);
        }
        setLastSyncedTime(new Date());
        setUpdateCount(prev => prev + 1);
        setGpsStatus('GPS_ACTIVE');
        setGpsError(null);
        setSimMessage('✓ Live device GPS coordinates accepted by backend and broadcasted to Admins, Students, and Parents.');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setGpsError(err.message || 'Failed to sync GPS location with server.');
        setGpsStatus('GPS_ERROR');
      }
    }
  };

  // Geolocation success callback
  const handlePositionSuccess = useCallback((position) => {
    if (!isMountedRef.current) return;
    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const now = Date.now();

    setCurrentGps({
      lat: latitude,
      lng: longitude,
      accuracy: accuracy,
      speed: speed,
      heading: heading,
      timestamp: position.timestamp
    });
    setGpsPermission('granted');

    // Throttling: send only if first pos, or >= 3000ms elapsed, or moved >= 4 meters
    const lastTime = lastSentTimeRef.current;
    const lastPos = lastSentPosRef.current;

    let shouldSend = false;
    if (!lastPos) {
      shouldSend = true;
    } else {
      const timeDiff = now - lastTime;
      const distance = calculateDistance(lastPos.lat, lastPos.lng, latitude, longitude);
      if (timeDiff >= 3000 || distance >= 4) {
        shouldSend = true;
      }
    }

    if (shouldSend) {
      lastSentTimeRef.current = now;
      lastSentPosRef.current = { lat: latitude, lng: longitude };
      transmitLocation(latitude, longitude, accuracy, speed, heading);
    }
  }, [bus?.id]);

  // Geolocation error callback - accurate error classification
  const handlePositionError = useCallback((error) => {
    if (!isMountedRef.current) return;
    const isSec = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let message = 'GPS location unavailable.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        if (!isSec && !isLocal) {
          message = 'Location Blocked (Insecure Context): Mobile browsers strictly require HTTPS to access GPS. Please access via the HTTPS server (port 5174) or use Chrome Port Forwarding.';
        } else {
          message = 'Location permission was denied. Tap the lock/tune icon in your browser address bar -> Permissions -> Location -> Allow, then refresh the page.';
        }
        setGpsPermission('denied');
        setIsGpsTracking(false);
        setGpsStatus('GPS_ERROR');
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Physical GPS position unavailable. Ensure device Location / GPS is turned ON in phone settings.';
        setGpsStatus('GPS_ERROR');
        break;
      case error.TIMEOUT:
        message = 'GPS acquisition timed out. Acquiring satellite fix...';
        setGpsStatus('WAITING_FOR_GPS');
        break;
      default:
        message = error.message || 'Unknown GPS location error.';
        setGpsStatus('GPS_ERROR');
    }
    setGpsError(message);
  }, []);

  // Internal stop helper
  const stopGpsTrackingInternal = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    setIsGpsTracking(false);
  };

  // --- CONTROLS ---

  // 1. Start Trip
  const handleStartTrip = async () => {
    if (!bus) return;
    try {
      const res = await tripService.startTrip(bus.id);
      if (res.success) {
        setActiveTrip(res.data);
        setBus(prev => ({ ...prev, status: 'STARTED' }));
        setGpsStatus('WAITING_FOR_GPS');
        setSimMessage('▶ Trip Started! Click "START REAL GPS TRACKING" to begin streaming genuine device coordinates.');
      }
    } catch (err) {
      alert(err.message || 'Error starting trip');
    }
  };

  // 2. Start Real GPS Tracking - Triggered DIRECTLY by user click
  const handleStartGpsTracking = () => {
    if (typeof window !== 'undefined' && !('geolocation' in navigator)) {
      setGpsError('Geolocation API is not supported by your browser.');
      setGpsStatus('GPS_ERROR');
      return;
    }

    const isSec = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Check secure context first: Mobile browsers block GPS over plain HTTP on LAN IPs
    if (!isSec && !isLocal) {
      const httpsPort = window.location.port === '5173' ? '5174' : (parseInt(window.location.port, 10) + 1 || '5174');
      const httpsUrl = `https://${window.location.hostname}:${httpsPort}${window.location.pathname}${window.location.search}`;
      setGpsError(`Insecure Context: Mobile browsers block Location over plain HTTP on LAN IPs. Please connect via HTTPS at: ${httpsUrl}`);
      setGpsStatus('GPS_ERROR');
      setIsGpsTracking(false);
      return;
    }

    // If permission was already permanently denied in browser settings, do not prompt pointlessly
    if (gpsPermission === 'denied') {
      setGpsError('Location permission is blocked in browser settings. Please tap the lock/tune icon in your address bar to Allow Location, then refresh.');
      setGpsStatus('GPS_ERROR');
      setIsGpsTracking(false);
      return;
    }

    if (!activeTrip || (activeTrip.status !== 'STARTED' && activeTrip.status !== 'IN_TRANSIT')) {
      setGpsError('You must start an authorized trip before transmitting real GPS telemetry.');
      return;
    }

    // Stop simulation asynchronously without delaying synchronous user activation
    if (isSimulating) {
      trackingService.stopSimulation(bus.id).catch(() => {});
      setIsSimulating(false);
    }

    setGpsError(null);
    setIsGpsTracking(true);
    setIsGpsPaused(false);
    setGpsStatus('WAITING_FOR_GPS');
    setSimMessage('📡 Requesting device location permission & acquiring satellite fix...');

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    requestWakeLock();

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000
    };

    try {
      // Direct synchronous browser API invocation inside user click callback
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        options
      );
    } catch (err) {
      setGpsError('Failed to launch geolocation watcher: ' + err.message);
      setGpsStatus('GPS_ERROR');
      setIsGpsTracking(false);
    }
  };

  // 3. Pause GPS Tracking
  const handlePauseGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    setIsGpsPaused(true);
    setGpsStatus('GPS_PAUSED');
    setSimMessage('⏸ Real GPS tracking paused. Device coordinates are not being broadcasted.');
  };

  // 4. Resume GPS Tracking
  const handleResumeGpsTracking = () => {
    setIsGpsPaused(false);
    setGpsStatus('WAITING_FOR_GPS');
    setSimMessage('▶ Resuming GPS satellite tracking...');
    requestWakeLock();
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000
    };
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
  };

  // 5. Stop GPS Tracking
  const handleStopGpsTracking = () => {
    stopGpsTrackingInternal();
    setGpsStatus('STOPPED');
    setSimMessage('⏹ Real GPS tracking stopped. Trip remains active in standby.');
  };

  // 6. End Trip
  const handleEndTrip = async () => {
    if (!activeTrip) return;
    try {
      stopGpsTrackingInternal();
      const res = await tripService.endTrip(activeTrip.id);
      if (res.success) {
        setActiveTrip(null);
        setBus(prev => prev ? { ...prev, status: 'COMPLETED', currentSpeed: 0 } : prev);
        setIsSimulating(false);
        setGpsStatus('STOPPED');
        setSimMessage('🏁 Trip Completed! All students and parents notified. GPS tracking terminated.');
      }
    } catch (err) {
      alert(err.message || 'Error ending trip');
    }
  };

  // 7. Toggle Demo Simulation
  const handleToggleSimulation = async () => {
    if (!bus) return;
    try {
      if (!isSimulating) {
        stopGpsTrackingInternal();
        const res = await trackingService.startSimulation(bus.id);
        if (res.success) {
          setIsSimulating(true);
          setGpsStatus('STOPPED');
          setSimMessage('▶ Backend Route Simulation Active (Telemetric source: SIMULATED).');
        }
      } else {
        const res = await trackingService.stopSimulation(bus.id);
        if (res.success) {
          setIsSimulating(false);
          setSimMessage('⏹ Backend Route Simulation Stopped.');
        }
      }
    } catch (err) {
      alert(err.message || 'Error toggling simulation');
    }
  };

  // Poll latest telemetry from backend when NOT broadcasting real GPS from this client
  useEffect(() => {
    let timer;
    if (bus && bus.id) {
      timer = setInterval(async () => {
        // Do not overwrite local real GPS with polling if this tab is actively transmitting
        if (isGpsTracking && !isGpsPaused) return;

        try {
          const res = await trackingService.getLatest(bus.id);
          if (res.success && res.data) {
            setBus(prev => ({
              ...prev,
              ...res.data,
              lastLocationUpdateEpoch: res.data.lastLocationUpdateEpoch
            }));
          }
        } catch (e) {}
      }, isSimulating ? 3000 : 6000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating, bus?.id, isGpsTracking, isGpsPaused]);

  const isTripActive = Boolean(activeTrip && (bus?.status === 'STARTED' || bus?.status === 'IN_TRANSIT'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Driver Console Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.15))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
            BUS DRIVER CONTROL CONSOLE
          </span>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: '0.2rem 0' }}>
            Welcome, {user.name}
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Assigned Vehicle: <strong style={{ color: '#818cf8' }}>{bus?.busNumber || 'BUS-01'}</strong> | Route: {bus?.route?.routeName || 'Karedu → College'}
          </p>
        </div>

        {/* Primary Controls */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Trip Start / End */}
          {!isTripActive ? (
            <button 
              id="driver-start-trip-btn"
              onClick={handleStartTrip} 
              className="btn btn-success" 
              style={{ padding: '0.7rem 1.4rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              <Play size={18} /> START TRIP
            </button>
          ) : (
            <button 
              id="driver-end-trip-btn"
              onClick={handleEndTrip} 
              className="btn btn-danger" 
              style={{ padding: '0.7rem 1.4rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              <Square size={18} /> END TRIP
            </button>
          )}

          {/* Real GPS Controls (when trip is active) */}
          {isTripActive && (
            <>
              {!isGpsTracking ? (
                <button 
                  id="driver-start-gps-btn"
                  onClick={handleStartGpsTracking} 
                  className="btn btn-success" 
                  style={{ 
                    background: 'linear-gradient(135deg, #059669, #10b981)', 
                    padding: '0.7rem 1.4rem', 
                    fontSize: '0.95rem', 
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Radio size={18} className="pulse" /> START REAL GPS TRACKING
                </button>
              ) : (
                <>
                  {!isGpsPaused ? (
                    <button 
                      id="driver-pause-gps-btn"
                      onClick={handlePauseGpsTracking} 
                      className="btn btn-warning" 
                      style={{ padding: '0.7rem 1.2rem', fontSize: '0.9rem', fontWeight: 700 }}
                    >
                      <Pause size={16} /> PAUSE GPS
                    </button>
                  ) : (
                    <button 
                      id="driver-resume-gps-btn"
                      onClick={handleResumeGpsTracking} 
                      className="btn btn-success" 
                      style={{ padding: '0.7rem 1.2rem', fontSize: '0.9rem', fontWeight: 700 }}
                    >
                      <Play size={16} /> RESUME GPS
                    </button>
                  )}

                  <button 
                    id="driver-stop-gps-btn"
                    onClick={handleStopGpsTracking} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.7rem 1.2rem', fontSize: '0.9rem' }}
                  >
                    <Square size={16} /> STOP GPS
                  </button>
                </>
              )}
            </>
          )}

          {/* Toggle Simulation */}
          <button 
            id="driver-toggle-sim-btn"
            onClick={handleToggleSimulation} 
            className={`btn ${isSimulating ? 'btn-danger' : 'btn-primary'}`}
            style={{ padding: '0.7rem 1.1rem', fontSize: '0.88rem' }}
          >
            <Navigation size={16} /> {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </button>

          {/* Direct link to dedicated GPS page */}
          <Link 
            to="/driver/location" 
            className="btn btn-secondary" 
            style={{ 
              padding: '0.7rem 1.1rem', 
              fontSize: '0.88rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={16} /> GPS Console
          </Link>
        </div>
      </div>

      {/* GPS Diagnostics & Secure Context Inspector */}
      <GpsDiagnosticsPanel 
        lastGpsError={gpsError} 
        permissionState={gpsPermission} 
      />

      {/* GPS Error Alert */}
      {gpsError && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.15)', 
          border: '1px solid #ef4444', 
          color: '#fca5a5', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Status Message */}
      {simMessage && !gpsError && (
        <div style={{ 
          background: 'rgba(99, 102, 241, 0.15)', 
          border: '1px solid #6366f1', 
          color: '#818cf8', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#818cf8" />
          <span>{simMessage}</span>
        </div>
      )}

      {/* Real GPS Live Telemetry Panel */}
      {isTripActive && (
        <div className="glass-card" style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-color)',
          padding: '1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isGpsTracking && !isGpsPaused ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Radio size={20} color={isGpsTracking && !isGpsPaused ? '#10b981' : '#94a3b8'} className={isGpsTracking && !isGpsPaused ? 'pulse' : ''} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Device GPS Telemetry Stream
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isGpsTracking ? (
                    isGpsPaused ? (
                      <span style={{ color: '#fbbf24' }}>⏸ GPS Tracking Paused</span>
                    ) : gpsStatus === 'GPS_ACTIVE' ? (
                      <span style={{ color: '#34d399' }}>● GPS Live Broadcasting</span>
                    ) : (
                      <span style={{ color: '#fbbf24' }}>⏳ Waiting for Satellite Fix...</span>
                    )
                  ) : (
                    <span style={{ color: '#94a3b8' }}>○ GPS Tracking Inactive (Click Start Real GPS)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Coordinates & Accuracy readout */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Reported Coordinates</span>
                <strong style={{ fontSize: '0.9rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
                  {bus?.currentLat ? `${bus.currentLat.toFixed(5)}°, ${bus.currentLng.toFixed(5)}°` : 'Awaiting GPS...'}
                </strong>
              </div>

              {currentGps?.accuracy && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Accuracy</span>
                  <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>
                    ±{currentGps.accuracy.toFixed(1)} m
                  </strong>
                </div>
              )}

              {bus?.currentSpeed != null && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Speed</span>
                  <strong style={{ fontSize: '0.9rem', color: '#34d399' }}>
                    {Math.round(bus.currentSpeed)} km/h
                  </strong>
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Backend Sync</span>
                <strong style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {updateCount > 0 ? `${updateCount} updates synced` : 'No updates yet'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bus Metrics */}
      <div className="grid-cols-4">
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bus Identification</span>
          <h3 style={{ fontSize: '1.4rem', color: '#818cf8', margin: '0.2rem 0' }}>{bus?.busNumber || 'BUS-01'}</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Capacity: {bus?.capacity || 40} Seats</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Trip Status</span>
          <h3 style={{ margin: '0.4rem 0' }}>
            <span className={`badge ${bus?.status === 'IN_TRANSIT' ? 'badge-success' : bus?.status === 'STARTED' ? 'badge-warning' : 'badge-secondary'}`}>
              {bus?.status || 'NOT_STARTED'}
            </span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {activeTrip ? `Trip #${activeTrip.id} Active` : 'No Active Trip'}
          </span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Students Boarded Today</span>
          <h3 style={{ fontSize: '1.4rem', color: '#34d399', margin: '0.2rem 0' }}>
            {todayAttendance.length}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified Boardings</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tracking Telemetry</span>
          <h3 style={{ fontSize: '1.1rem', color: isSimulating ? '#f59e0b' : isGpsTracking ? '#34d399' : '#94a3b8', margin: '0.4rem 0' }}>
            {isSimulating ? '● Route Simulation' : isGpsTracking ? (isGpsPaused ? '⏸ GPS Paused' : '● Real Phone GPS') : 'Standby / Off'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Source: {isSimulating ? 'SIMULATED' : 'REAL_GPS'}
          </span>
        </div>
      </div>

      {/* Live Driver Map */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="#6366f1" /> Vehicle Location Map (Leaflet + OpenStreetMap)
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Marker updates dynamically only when fresh coordinates arrive
          </span>
        </div>
        <MapView 
          busLocation={bus && typeof bus.currentLat === 'number' && typeof bus.currentLng === 'number' ? { lat: bus.currentLat, lng: bus.currentLng } : null} 
          routeStops={bus?.route?.stops || []} 
          busNumber={bus?.busNumber || 'BUS-01'} 
          status={bus?.status || 'NOT_STARTED'} 
          trackingSource={isSimulating ? 'SIMULATED' : 'REAL_GPS'}
          lastUpdated={bus?.lastLocationUpdate}
          lastLocationUpdateEpoch={bus?.lastLocationUpdateEpoch}
          driverGps={currentGps}
          gpsStatus={isSimulating ? 'SIMULATED' : gpsStatus}
          gpsError={gpsError}
        />
      </div>

      {/* Passenger Boarding Roster Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="#38bdf8" /> Assigned Passenger Roster
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Student Name</th>
              <th style={{ padding: '0.75rem' }}>Student ID</th>
              <th style={{ padding: '0.75rem' }}>Parent Guardian</th>
              <th style={{ padding: '0.75rem' }}>Boarding Status</th>
            </tr>
          </thead>
          <tbody>
            {(passengers && passengers.length > 0 ? passengers : [
              { name: 'Veeru', idCode: 'STU1001', parentName: 'Suresh Kumar', id: 1 },
              { name: 'B.Deepthi', idCode: 'STU1002', parentName: 'B.sridhar', id: 2 },
              { name: 'P.gayathri', idCode: 'STU1003', parentName: 'P.Sunil', id: 3 },
              { name: 'E.sailaja', idCode: 'STU1004', parentName: 'E.jagadeesh', id: 4 }
            ]).map(stu => {
              const stuId = stu.id;
              const stuCode = stu.studentIdCode || stu.idCode;
              const stuName = stu.user?.name || stu.name;
              const parentName = stu.parent?.user?.name || stu.parentName || 'Not Linked';
              const isBoarded = todayAttendance.some(a => a.student?.id === stuId || a.student?.studentIdCode === stuCode);
              return (
                <tr key={stuId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{stuName}</td>
                  <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{stuCode}</td>
                  <td style={{ padding: '0.75rem' }}>{parentName}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${isBoarded ? 'badge-success' : 'badge-warning'}`}>
                      {isBoarded ? '✓ BOARDED' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default DriverDashboard;
