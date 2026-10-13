import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { driverService, busService, trackingService, tripService } from '../../services/api';
import BusMap from '../../components/BusMap';
import GpsDiagnosticsPanel from '../../components/GpsDiagnosticsPanel';
import { 
  MapPin, Navigation, Radio, Play, Square, Pause, AlertTriangle, 
  CheckCircle2, Compass, RefreshCw, Info, Wifi, WifiOff, Cpu, ShieldCheck,
  Zap, Clock, Award
} from 'lucide-react';

const LocationSharing = () => {
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [bus, setBus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  
  // Real GPS state
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isGpsPaused, setIsGpsPaused] = useState(false);
  const [gpsPermission, setGpsPermission] = useState('prompt'); // prompt, granted, denied, unsupported
  const [driverGps, setDriverGps] = useState(null); // { lat, lng, accuracy, speed, heading, timestamp }
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [gpsError, setGpsError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tripLoading, setTripLoading] = useState(false);

  // Simulation state (explicitly separated)
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Refs for watcher, throttling, and background screen lock
  const watchIdRef = useRef(null);
  const lastSentPosRef = useRef(null);
  const lastSentTimeRef = useRef(0);
  const isMountedRef = useRef(true);
  const wakeLockRef = useRef(null);
  const activeTripRef = useRef(null);
  activeTripRef.current = activeTrip;

  // Online/Offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch driver & assigned bus info & active trip
  useEffect(() => {
    isMountedRef.current = true;
    loadDriverAndBus();

    // Check Geolocation permission state if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (isMountedRef.current) {
          setGpsPermission(result.state);
          result.onchange = () => {
            if (isMountedRef.current) setGpsPermission(result.state);
          };
        }
      }).catch(() => {
        // Permissions API query unsupported in some environments
      });
    }

    return () => {
      isMountedRef.current = false;
      stopGpsTrackingInternal();
      releaseWakeLock();
    };
  }, [user]);

  const loadDriverAndBus = async () => {
    try {
      if (!user) return;
      const dRes = await driverService.getByEmail(user.email);
      if (dRes.success && dRes.data) {
        setDriver(dRes.data);
        const busesRes = await trackingService.getActiveBuses();
        if (busesRes.success && busesRes.data && busesRes.data.length > 0) {
          const myBus = busesRes.data[0];
          setBus(myBus);
          
          // Load active trip for bus
          try {
            const tripRes = await tripService.getActiveForBus(myBus.id);
            if (tripRes.success && tripRes.data) {
              setActiveTrip(tripRes.data);
            } else {
              setActiveTrip(null);
            }
          } catch (ignored) {}

          // Load stops
          if (myBus.route && myBus.route.stops) {
            setRouteStops(myBus.route.stops);
          } else if (myBus.id) {
            try {
              const routeRes = await trackingService.getRoute(myBus.id);
              if (routeRes.success && routeRes.data && routeRes.data.stops) {
                setRouteStops(routeRes.data.stops);
              }
            } catch (ignored) {}
          }

          // Check if simulation is currently active
          try {
            const simStatus = await trackingService.getSimulationStatus(myBus.id);
            if (simStatus.success && simStatus.data) {
              setIsSimulationActive(Boolean(simStatus.data.active));
            }
          } catch (ignored) {}
        }
      }
    } catch (e) {
      console.error('Error loading driver profile:', e);
    }
  };

  // Screen Wake Lock helper to keep display on during driving
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        // Wake Lock may fail if battery saver is on
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
    const R = 6371e3; // metres
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

  // Submit real GPS location to Spring Boot
  const transmitLocation = async (lat, lng, accuracy, speed, heading) => {
    if (!bus || !bus.id) return;
    try {
      const payload = {
        busId: bus.id,
        tripId: activeTripRef.current?.id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ? Math.round(accuracy * 10) / 10 : null,
        speed: speed != null && !isNaN(speed) ? Math.round(speed * 3.6 * 10) / 10 : null, // convert m/s to km/h
        heading: heading != null && !isNaN(heading) ? Math.round(heading) : null,
        source: 'REAL_GPS',
        timestamp: new Date().toISOString()
      };

      const res = await trackingService.submitLocation(payload);
      if (res.success && isMountedRef.current) {
        setBus(res.data);
        if (res.data.status === 'IN_TRANSIT' && activeTripRef.current) {
          setActiveTrip(prev => prev ? { ...prev, status: 'IN_TRANSIT' } : prev);
        }
        setLastSyncedTime(new Date());
        setUpdateCount(prev => prev + 1);
        setGpsError(null);
        setStatusMessage('✓ Live GPS telemetry transmitted to backend and broadcasted to Parents & Admins.');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setGpsError(err.message || 'Failed to sync location with server.');
      }
    }
  };

  // Position received callback
  const handlePositionSuccess = useCallback((position) => {
    if (!isMountedRef.current) return;

    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const now = Date.now();

    setDriverGps({
      lat: latitude,
      lng: longitude,
      accuracy: accuracy,
      speed: speed,
      heading: heading,
      timestamp: position.timestamp
    });
    setGpsPermission('granted');
    setGpsError(null);

    // Throttling: send only if > 3 seconds elapsed OR moved > 4 meters
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
  }, [bus]);

  // Position error callback
  const handlePositionError = useCallback((error) => {
    if (!isMountedRef.current) return;
    const isSec = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let message = 'GPS location unavailable.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        if (!isSec && !isLocal) {
          message = 'Location Blocked (Insecure Context): Mobile browsers require HTTPS to access GPS. Please access via the HTTPS server (port 5174) or use Chrome Port Forwarding.';
        } else {
          message = 'Location permission was denied. Tap the lock/tune icon in your browser URL bar -> Permissions -> Location -> Allow, then refresh the page.';
        }
        setGpsPermission('denied');
        setIsGpsActive(false);
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Physical GPS satellite fix unavailable. Ensure device location/GPS is enabled in your phone settings.';
        break;
      case error.TIMEOUT:
        message = 'GPS acquisition timed out. Retrying satellite fix...';
        break;
      default:
        message = error.message || 'Unknown GPS location error.';
    }
    setGpsError(message);
  }, []);

  // Internal stop helper without resetting pause state
  const stopGpsTrackingInternal = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    setIsGpsActive(false);
  };

  // --- TRIP LIFECYCLE CONTROLS ---

  // 1. Start Trip
  const handleStartTrip = async () => {
    if (!bus || !bus.id) return;
    setTripLoading(true);
    setGpsError(null);
    try {
      const res = await tripService.startTrip(bus.id);
      if (res.success && res.data) {
        setActiveTrip(res.data);
        setBus(prev => prev ? { ...prev, status: 'STARTED' } : prev);
        setStatusMessage('✓ Trip officially started! You can now start Real GPS tracking when ready to depart.');
      }
    } catch (err) {
      setGpsError(err.message || 'Failed to start trip.');
    } finally {
      setTripLoading(false);
    }
  };

  // 2. Start Real GPS Tracking
  const handleStartGpsTracking = () => {
    if (typeof window !== 'undefined' && !('geolocation' in navigator)) {
      setGpsError('Geolocation API is not supported by your browser.');
      setGpsPermission('unsupported');
      return;
    }

    const isSec = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Check secure context first: Mobile browsers block GPS over plain HTTP on LAN IPs
    if (!isSec && !isLocal) {
      const httpsPort = window.location.port === '5173' ? '5174' : (parseInt(window.location.port, 10) + 1 || '5174');
      const httpsUrl = `https://${window.location.hostname}:${httpsPort}${window.location.pathname}${window.location.search}`;
      setGpsError(`Insecure Context: Mobile browsers block Location over plain HTTP on LAN IPs. Please connect via HTTPS at: ${httpsUrl}`);
      setIsGpsActive(false);
      return;
    }

    // If permission was already permanently denied in browser settings, do not prompt pointlessly
    if (gpsPermission === 'denied') {
      setGpsError('Location permission is blocked in browser settings. Please tap the lock/tune icon in your address bar to Allow Location, then refresh.');
      setIsGpsActive(false);
      return;
    }

    // Require active trip
    if (!activeTrip || (activeTrip.status !== 'STARTED' && activeTrip.status !== 'IN_TRANSIT')) {
      setGpsError('You must start an authorized trip before transmitting real GPS telemetry.');
      return;
    }

    // Stop simulation if it was running
    if (isSimulationActive) {
      handleStopSimulation();
    }

    setGpsError(null);
    setIsGpsActive(true);
    setIsGpsPaused(false);
    setStatusMessage('Acquiring high-accuracy real GPS satellite fix from device...');

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000
    };

    const id = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
    watchIdRef.current = id;
    requestWakeLock();
  };

  // 3. Pause Tracking
  const handlePauseGpsTracking = () => {
    stopGpsTrackingInternal();
    setIsGpsPaused(true);
    setStatusMessage('⏸ Real GPS tracking paused by driver. Trip is still active; resume when vehicle departs.');
  };

  // 4. Resume Tracking
  const handleResumeGpsTracking = () => {
    setIsGpsPaused(false);
    handleStartGpsTracking();
  };

  // 5. End Trip
  const handleEndTrip = async () => {
    if (!bus) return;
    const confirmEnd = window.confirm(
      'Are you sure you want to end this trip? Real GPS transmission will cease and the trip will be marked COMPLETED.'
    );
    if (!confirmEnd) return;

    setTripLoading(true);
    setGpsError(null);

    // Stop location tracking
    stopGpsTrackingInternal();
    setIsGpsPaused(false);

    try {
      const tripId = activeTrip ? activeTrip.id : bus.id;
      const res = await tripService.endTrip(tripId);
      if (res.success && res.data) {
        setActiveTrip(res.data);
        setBus(prev => prev ? { ...prev, status: 'COMPLETED', currentSpeed: 0 } : prev);
        setStatusMessage('✓ Trip completed successfully. Real GPS broadcasting has ended.');
      }
    } catch (err) {
      setGpsError(err.message || 'Failed to complete trip.');
    } finally {
      setTripLoading(false);
    }
  };

  // --- SIMULATION CONTROLS (SEPARATED) ---

  const handleStartSimulation = async () => {
    if (!bus) return;
    // Stop real GPS first to avoid mode collision
    if (isGpsActive) {
      stopGpsTrackingInternal();
      setIsGpsPaused(false);
    }

    setSimLoading(true);
    try {
      const res = await trackingService.startSimulation(bus.id);
      if (res.success) {
        setIsSimulationActive(true);
        setStatusMessage('▶ Backend Route Demonstration Simulation Started. (SIMULATED mode)');
        const latest = await trackingService.getLatest(bus.id);
        if (latest.success) {
          setBus(latest.data);
          setActiveTrip(prev => prev ? { ...prev, status: 'IN_TRANSIT' } : null);
        }
      }
    } catch (err) {
      alert(err.message || 'Error starting simulation');
    } finally {
      setSimLoading(false);
    }
  };

  const handleStopSimulation = async () => {
    if (!bus) return;
    setSimLoading(true);
    try {
      const res = await trackingService.stopSimulation(bus.id);
      if (res.success) {
        setIsSimulationActive(false);
        setStatusMessage('⏹ Route Simulation Stopped.');
        const latest = await trackingService.getLatest(bus.id);
        if (latest.success) setBus(latest.data);
      }
    } catch (err) {
      alert(err.message || 'Error stopping simulation');
    } finally {
      setSimLoading(false);
    }
  };

  // Polling when simulation is active to update driver map display
  useEffect(() => {
    let timer;
    if (isSimulationActive && bus && bus.id) {
      timer = setInterval(async () => {
        try {
          const res = await trackingService.getLatest(bus.id);
          if (res.success && res.data && isMountedRef.current) {
            setBus(res.data);
          }
        } catch (ignored) {}
      }, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulationActive, bus?.id]);

  const tripStatus = activeTrip?.status || bus?.status || 'NOT_STARTED';
  const hasActiveTrip = activeTrip && (activeTrip.status === 'STARTED' || activeTrip.status === 'IN_TRANSIT');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(16, 185, 129, 0.15))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              DRIVER GPS TELEMETRY & TRIP CONTROL
            </span>
            <span className={`badge ${
              isGpsActive ? 'badge-success' : 
              isGpsPaused ? 'badge-warning' : 
              isSimulationActive ? 'badge-warning' : 
              'badge-info'
            }`}>
              {isGpsActive ? '● REAL GPS ACTIVE' : 
               isGpsPaused ? '⏸ GPS PAUSED' : 
               isSimulationActive ? '● SIMULATION RUNNING' : 
               'STANDBY'}
            </span>
            <span className={`badge ${
              tripStatus === 'IN_TRANSIT' ? 'badge-success' : 
              tripStatus === 'STARTED' ? 'badge-info' : 
              tripStatus === 'COMPLETED' ? 'badge-secondary' : 
              'badge-warning'
            }`}>
              TRIP: {tripStatus}
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>
            Live Vehicle Tracking Controller
          </h2>
          <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Assigned Bus: <strong style={{ color: '#fff' }}>{bus?.busNumber || 'BUS-01'}</strong> ({bus?.licensePlate || 'AP 27 TX 1024'}) | Driver: <strong style={{ color: '#fff' }}>{user.name}</strong>
          </p>
        </div>

        {/* Primary Driver Trip Lifecycle Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* 1. Trip Not Started -> START TRIP */}
          {(!hasActiveTrip || tripStatus === 'COMPLETED' || tripStatus === 'NOT_STARTED') && (
            <button
              onClick={handleStartTrip}
              disabled={tripLoading}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Play size={18} /> {tripStatus === 'COMPLETED' ? 'START NEW TRIP' : 'START TRIP'}
            </button>
          )}

          {/* 2. Trip Started & GPS not active -> START REAL GPS */}
          {hasActiveTrip && !isGpsActive && !isGpsPaused && (
            <button
              onClick={handleStartGpsTracking}
              disabled={tripLoading}
              className="btn btn-success"
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Radio size={18} className="pulse-icon" /> START REAL GPS
            </button>
          )}

          {/* 3. Real GPS is actively tracking -> PAUSE TRACKING */}
          {isGpsActive && (
            <button
              onClick={handlePauseGpsTracking}
              className="btn btn-warning"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Pause size={18} /> PAUSE GPS
            </button>
          )}

          {/* 4. Real GPS is paused -> RESUME TRACKING */}
          {isGpsPaused && (
            <button
              onClick={handleResumeGpsTracking}
              className="btn btn-success"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Radio size={18} className="pulse-icon" /> RESUME GPS
            </button>
          )}

          {/* 5. Trip Active -> END TRIP */}
          {hasActiveTrip && (
            <button
              onClick={handleEndTrip}
              disabled={tripLoading}
              className="btn btn-danger"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Square size={18} /> END TRIP
            </button>
          )}

        </div>
      </div>

      {/* GPS Diagnostics & Secure Context Inspector */}
      <GpsDiagnosticsPanel 
        lastGpsError={gpsError} 
        permissionState={gpsPermission} 
      />

      {/* Connectivity & Permission Status Banners */}
      {!isOnline && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.85rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <WifiOff size={20} />
          <span><strong>Offline Mode:</strong> Internet connection lost. GPS packets will resume when network connectivity is restored.</span>
        </div>
      )}

      {gpsError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.85rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} />
          <span>{gpsError}</span>
        </div>
      )}

      {statusMessage && !gpsError && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.9rem' }}>
          {statusMessage}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-cols-4">
        
        {/* Trip Lifecycle Status */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Trip Lifecycle</span>
          <h3 style={{ fontSize: '1.2rem', color: tripStatus === 'IN_TRANSIT' ? '#34d399' : tripStatus === 'STARTED' ? '#38bdf8' : '#fbbf24', margin: '0.3rem 0' }}>
            {tripStatus}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {activeTrip ? `Active Trip #${activeTrip.id}` : 'No active trip'}
          </span>
        </div>

        {/* GPS Sensor & Permission */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Device Geolocation</span>
          <h3 style={{ fontSize: '1.2rem', color: gpsPermission === 'granted' ? '#34d399' : gpsPermission === 'denied' ? '#ef4444' : '#fbbf24', margin: '0.3rem 0' }}>
            {gpsPermission === 'granted' ? '✓ Granted' : gpsPermission === 'denied' ? '✗ Denied' : 'Prompt / Unset'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {navigator.geolocation ? 'Phone sensor active' : 'Sensor unsupported'}
          </span>
        </div>

        {/* GPS Fix Precision */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fix Precision & Speed</span>
          <h3 style={{ fontSize: '1.2rem', color: driverGps?.accuracy ? '#38bdf8' : '#64748b', margin: '0.3rem 0' }}>
            {driverGps?.accuracy ? `± ${Math.round(driverGps.accuracy)} meters` : 'Acquiring...'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {driverGps?.speed != null ? `Speed: ${Math.round(driverGps.speed * 3.6)} km/h` : 'High accuracy mode'}
          </span>
        </div>

        {/* Sync Counter & Last Transmit */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transmitted Telemetry</span>
          <h3 style={{ fontSize: '1.3rem', color: '#818cf8', margin: '0.3rem 0' }}>
            {updateCount} Packets
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {lastSyncedTime ? `Last: ${lastSyncedTime.toLocaleTimeString()}` : 'Awaiting transmit'}
          </span>
        </div>

      </div>

      {/* Real Map Integration */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="#6366f1" /> Live Vehicle Route Map
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Leaflet.js + OpenStreetMap | Route: {bus?.route?.routeName || 'Karedu → College'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Coords: {bus?.currentLat != null ? `${bus.currentLat.toFixed(4)}, ${bus.currentLng.toFixed(4)}` : 'Waiting for GPS fix'}
            </span>
          </div>
        </div>

        <BusMap 
          busLocation={bus && typeof bus.currentLat === 'number' && typeof bus.currentLng === 'number' ? { lat: bus.currentLat, lng: bus.currentLng } : null} 
          routeStops={routeStops} 
          busNumber={bus?.busNumber || 'BUS-01'} 
          status={bus?.status || tripStatus} 
          driverGps={driverGps}
          trackingSource={bus?.trackingSource || (isSimulationActive ? 'SIMULATED' : 'REAL_GPS')}
          lastUpdated={bus?.lastLocationUpdate}
          height="450px"
        />
      </div>

      {/* Testing & Simulation Section (Explicitly separated from Real GPS) */}
      <div className="glass-card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(15, 23, 42, 0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', color: '#fbbf24', margin: 0 }}>
                Demo Route Playback Mode (Simulation)
              </h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
              For development demo when no mobile device is physically driving on the road. Real GPS is completely separate.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!isSimulationActive ? (
              <button
                onClick={handleStartSimulation}
                disabled={simLoading || isGpsActive}
                className="btn btn-warning"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Play size={16} /> Start Simulated Tour
              </button>
            ) : (
              <button
                onClick={handleStopSimulation}
                disabled={simLoading}
                className="btn btn-danger"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Square size={16} /> Stop Simulation
              </button>
            )}
          </div>
        </div>

        {/* Technical Guidance & Background Limitations */}
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Info size={16} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              <strong>Browser Geolocation & Mobile Notice:</strong> W3C Geolocation tracks high-accuracy coordinates while this browser tab remains active. A screen wake-lock has been requested to keep the display active. If the phone is locked or browser backgrounded by the operating system, standard browser tracking may pause until reopened.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LocationSharing;
