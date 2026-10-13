import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Compass, RefreshCw, AlertTriangle, Radio, MapPin, ZoomIn } from 'lucide-react';

// Real Bus marker icon (Vibrant Indigo with glowing shadow)
const createRealBusIcon = (busNumber = "BUS") => new L.DivIcon({
  className: 'custom-bus-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: #fff;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.6);
      border: 2px solid #fff;
      white-space: nowrap;
      transform: translate(-50%, -50%);
    ">
      <span>🚌</span>
      <span>${busNumber}</span>
      <span style="display:inline-block; width:6px; height:6px; background:#10b981; border-radius:50%; animation: pulse 1.5s infinite;"></span>
    </div>
  `,
  iconSize: [80, 32],
  iconAnchor: [40, 16],
  popupAnchor: [0, -20],
});

// Simulated Bus marker icon (Vibrant Amber/Gold with SIMULATED badge)
const createSimulatedBusIcon = (busNumber = "BUS") => new L.DivIcon({
  className: 'custom-sim-bus-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #d97706, #f59e0b);
      color: #000;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.6);
      border: 2px solid #fff;
      white-space: nowrap;
      transform: translate(-50%, -50%);
    ">
      <span>🚌</span>
      <span>${busNumber}</span>
      <span style="background:#000; color:#fbbf24; font-size:8px; padding:1px 4px; border-radius:6px; font-weight:900;">SIM</span>
    </div>
  `,
  iconSize: [95, 32],
  iconAnchor: [47, 16],
  popupAnchor: [0, -20],
});

// Driver GPS Beacon Marker
const driverGpsIcon = new L.DivIcon({
  className: 'custom-driver-marker',
  html: `
    <div style="
      width: 22px;
      height: 22px;
      background: #10b981;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
      position: relative;
      transform: translate(-50%, -50%);
    ">
      <div style="
        position: absolute;
        inset: -6px;
        border: 2px solid #10b981;
        border-radius: 50%;
        opacity: 0.7;
        animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

// Bus Stop Marker icon
const createStopIcon = (seq) => new L.DivIcon({
  className: 'custom-stop-marker',
  html: `
    <div style="
      background: #0f172a;
      color: #10b981;
      border: 2px solid #10b981;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transform: translate(-50%, -50%);
    ">
      ${seq || '•'}
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

// Map Recenter Controller component
const MapRecenter = ({ target, autoPan = true }) => {
  const map = useMap();
  useEffect(() => {
    if (autoPan && target && target[0] && target[1]) {
      map.panTo(target, { animate: true, duration: 1.2 });
    }
  }, [target, autoPan, map]);
  return null;
};

// Fit Bounds Controller component
const FitBoundsButton = ({ bounds }) => {
  const map = useMap();
  const handleFit = () => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };
  return (
    <button
      onClick={handleFit}
      title="Fit All Route Stops in View"
      style={{
        position: 'absolute',
        top: '12px',
        left: '50px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        borderRadius: '8px',
        padding: '6px 10px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <Compass size={14} color="#38bdf8" /> Fit Route
    </button>
  );
};

const BusMap = ({
  buses = [],
  busLocation = null,
  routeStops = [],
  driverGps = null,
  trackingSource = 'REAL_GPS',
  lastUpdated = null,
  lastLocationUpdateEpoch = null,
  loading = false,
  error = null,
  height = '420px',
  busNumber = 'BUS-01',
  status = 'IN_TRANSIT',
  showControls = true,
  gpsStatus = null,
  gpsError = null
}) => {
  // Normalize buses list - ONLY include buses with valid numerical coordinates!
  const busList = useMemo(() => {
    let rawList = [];
    if (Array.isArray(buses) && buses.length > 0) {
      rawList = buses;
    } else if (busLocation && typeof busLocation.lat === 'number' && typeof busLocation.lng === 'number' && !isNaN(busLocation.lat) && !isNaN(busLocation.lng)) {
      rawList = [{
        id: 1,
        busNumber: busNumber,
        currentLat: busLocation.lat,
        currentLng: busLocation.lng,
        status: status,
        trackingSource: trackingSource,
        lastLocationUpdate: lastUpdated,
        lastLocationUpdateEpoch: lastLocationUpdateEpoch
      }];
    }
    // Filter strictly to ensure only buses with valid coordinates are in busList
    return rawList.filter(b => b && typeof b.currentLat === 'number' && typeof b.currentLng === 'number' && !isNaN(b.currentLat) && !isNaN(b.currentLng));
  }, [buses, busLocation, busNumber, status, trackingSource, lastUpdated, lastLocationUpdateEpoch]);

  // Compute map center - Separated strictly from bus markers
  // 1. If bus has valid live coordinates, center map on bus
  // 2. Otherwise if route stops exist, center on the first route stop or mid-route
  // 3. Otherwise fallback to regional center
  // Note: defaultCenter is NEVER added to busList and NEVER creates a bus marker!
  const defaultCenter = [15.2050, 79.9200]; // Regional fallback view for Andhra Pradesh
  const primaryBus = busList[0];
  const mapCenter = useMemo(() => {
    if (primaryBus && typeof primaryBus.currentLat === 'number' && typeof primaryBus.currentLng === 'number') {
      return [primaryBus.currentLat, primaryBus.currentLng];
    }
    if (routeStops.length > 0 && typeof routeStops[0].latitude === 'number' && typeof routeStops[0].longitude === 'number') {
      return [routeStops[0].latitude, routeStops[0].longitude];
    }
    return defaultCenter;
  }, [primaryBus, routeStops]);

  // Compute polyline coordinates along route
  const polylineCoords = useMemo(() => {
    return routeStops
      .filter(s => s.latitude && s.longitude)
      .map(s => [s.latitude, s.longitude]);
  }, [routeStops]);

  // Compute total bounds encompassing buses and stops
  const allBounds = useMemo(() => {
    const pts = [];
    busList.forEach(b => {
      if (b.currentLat && b.currentLng) pts.push([b.currentLat, b.currentLng]);
    });
    routeStops.forEach(s => {
      if (s.latitude && s.longitude) pts.push([s.latitude, s.longitude]);
    });
    if (driverGps && driverGps.lat && driverGps.lng) {
      pts.push([driverGps.lat, driverGps.lng]);
    }
    return pts.length > 1 ? pts : null;
  }, [busList, routeStops, driverGps]);

  // Check if location is stale (> 60s without coordinates during active transit)
  const epochTimestamp = useMemo(() => {
    if (primaryBus?.lastLocationUpdateEpoch) return primaryBus.lastLocationUpdateEpoch;
    if (!lastUpdated) return null;
    const t = new Date(lastUpdated).getTime();
    return isNaN(t) ? null : t;
  }, [primaryBus?.lastLocationUpdateEpoch, lastUpdated]);

  const lastUpdatedText = useMemo(() => {
    if (!epochTimestamp) return null;
    const diffSec = Math.max(0, Math.round((Date.now() - epochTimestamp) / 1000));
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.round(diffSec / 60);
    return `${diffMin}m ago`;
  }, [epochTimestamp]);

  const activeStatus = primaryBus?.status || status || 'NOT_STARTED';
  const isInActiveTrip = activeStatus === 'IN_TRANSIT' || activeStatus === 'STARTED';

  const isStale = useMemo(() => {
    // Only active trips in transit can be stale; standby or completed trips are not actively sending GPS
    if (!isInActiveTrip || !epochTimestamp) return false;
    return (Date.now() - epochTimestamp) > 60000; // 60 seconds threshold
  }, [isInActiveTrip, epochTimestamp]);

  const activeSource = primaryBus?.trackingSource || trackingSource || 'REAL_GPS';
  const isSimulated = activeSource.toUpperCase() === 'SIMULATED';

  // Dynamic Status Badge Configuration
  const badgeConfig = useMemo(() => {
    if (activeStatus === 'COMPLETED') {
      return {
        text: '✓ TRIP COMPLETED',
        bg: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid #64748b',
        color: '#94a3b8',
        iconColor: '#94a3b8',
        pulse: false
      };
    }
    if (activeStatus === 'NOT_STARTED' || busList.length === 0) {
      return {
        text: '● TRIP STANDBY (AWAITING GPS)',
        bg: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid #64748b',
        color: '#94a3b8',
        iconColor: '#94a3b8',
        pulse: false
      };
    }
    if (isSimulated) {
      return {
        text: 'DEMO SIMULATION ACTIVE',
        bg: 'rgba(217, 119, 6, 0.92)',
        border: '1px solid #f59e0b',
        color: '#fff',
        iconColor: '#fbbf24',
        pulse: true
      };
    }

    // Real GPS Mode
    if (gpsStatus === 'GPS_ERROR' || (gpsError && gpsStatus !== 'GPS_ACTIVE')) {
      return {
        text: '⚠ GPS ERROR',
        bg: 'rgba(239, 68, 68, 0.92)',
        border: '1px solid #ef4444',
        color: '#fff',
        iconColor: '#fff',
        pulse: false
      };
    }
    if (gpsStatus === 'GPS_PAUSED') {
      return {
        text: '⏸ GPS PAUSED',
        bg: 'rgba(217, 119, 6, 0.92)',
        border: '1px solid #f59e0b',
        color: '#fff',
        iconColor: '#fbbf24',
        pulse: false
      };
    }
    if (gpsStatus === 'WAITING_FOR_GPS') {
      return {
        text: '⏳ WAITING FOR GPS',
        bg: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid #f59e0b',
        color: '#fbbf24',
        iconColor: '#f59e0b',
        pulse: true
      };
    }

    // If coordinates are stale
    if (isStale) {
      return {
        text: '⚠ STALE LOCATION',
        bg: 'rgba(239, 68, 68, 0.92)',
        border: '1px solid #ef4444',
        color: '#fff',
        iconColor: '#fff',
        pulse: false
      };
    }

    // Fresh GPS active (< 60s ago)
    const hasFreshGps = epochTimestamp && (Date.now() - epochTimestamp) <= 60000;
    if (gpsStatus === 'GPS_ACTIVE' || hasFreshGps) {
      return {
        text: '● GPS ACTIVE',
        bg: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid #10b981',
        color: '#34d399',
        iconColor: '#10b981',
        pulse: true
      };
    }

    // Fallback: trip is started, awaiting GPS telemetry
    return {
      text: '⏳ WAITING FOR GPS',
      bg: 'rgba(15, 23, 42, 0.92)',
      border: '1px solid #f59e0b',
      color: '#fbbf24',
      iconColor: '#f59e0b',
      pulse: true
    };
  }, [activeStatus, isSimulated, gpsStatus, gpsError, isStale, epochTimestamp, busList.length]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#090d16' }}>
      
      {/* Top Source & Status Overlay Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px'
      }}>
        {/* Dynamic Status Indicator */}
        <div style={{
          background: badgeConfig.bg,
          backdropFilter: 'blur(8px)',
          border: badgeConfig.border,
          color: badgeConfig.color,
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          letterSpacing: '0.04em'
        }}>
          <Radio size={14} className={badgeConfig.pulse ? 'pulse' : ''} color={badgeConfig.iconColor} />
          {badgeConfig.text}
        </div>

        {/* Live Heartbeat / Last Updated Pill */}
        {lastUpdatedText && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            padding: '3px 8px',
            borderRadius: '10px',
            fontSize: '0.68rem',
            fontWeight: 600
          }}>
            Updated {lastUpdatedText}
          </div>
        )}

        {/* Stale Location Warning (Active trips only) */}
        {isStale && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.92)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          }}>
            <AlertTriangle size={13} /> Stale GPS Signal ({lastUpdatedText || '> 1m ago'})
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8',
          fontSize: '0.9rem',
          fontWeight: 600,
          gap: '8px'
        }}>
          <RefreshCw className="spin" size={20} /> Connecting to OpenStreetMap Live Stream...
        </div>
      )}

      {/* Empty State Banner if no coordinates AND no route stops are available */}
      {!loading && busList.length === 0 && routeStops.length === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <MapPin size={40} color="#6366f1" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <h4 style={{ color: '#fff', margin: '0 0 0.3rem', fontSize: '1.1rem' }}>No Route or Live Location Broadcast Yet</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '400px' }}>
            No bus route or location telemetry is currently broadcasting. Telemetry will show as soon as the driver begins the trip.
          </p>
        </div>
      )}

      {/* Info Pill when Route Stops exist but Bus has no Live GPS Fix yet */}
      {!loading && busList.length === 0 && routeStops.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          backdropFilter: 'blur(8px)',
          padding: '8px 16px',
          borderRadius: '24px',
          color: '#fbbf24',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          pointerEvents: 'none'
        }}>
          <Radio size={14} className="pulse" color="#f59e0b" />
          Awaiting Driver GPS Broadcast — Showing Scheduled Route Stops
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="leaflet-container"
        style={{ width: '100%', height: '100%' }}
      >
        {/* OpenStreetMap Tile Layer with full legal attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Dynamic Re-centering Hook */}
        <MapRecenter target={mapCenter} autoPan={true} />

        {/* Fit Bounds Control Button */}
        {showControls && allBounds && <FitBoundsButton bounds={allBounds} />}

        {/* Route Polyline (Route Path) */}
        {polylineCoords.length > 1 && (
          <>
            <Polyline
              positions={polylineCoords}
              color="#6366f1"
              weight={5}
              opacity={0.8}
            />
            <Polyline
              positions={polylineCoords}
              color="#38bdf8"
              weight={2}
              opacity={0.9}
              dashArray="6, 8"
            />
          </>
        )}

        {/* Route Stops Markers */}
        {routeStops.map((stop, idx) => (
          stop.latitude && stop.longitude && (
            <Marker
              key={`stop-${stop.id || idx}`}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon(stop.sequenceNumber || idx + 1)}
            >
              <Popup>
                <div style={{ padding: '4px', minWidth: '150px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                    STOP #{stop.sequenceNumber || idx + 1}
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', margin: '2px 0' }}>
                    {stop.stopName}
                  </strong>
                  {stop.expectedArrivalTime && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Scheduled ETA: <strong>{stop.expectedArrivalTime}</strong>
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Active Bus Markers */}
        {busList.map(b => (
          b.currentLat && b.currentLng && (
            <Marker
              key={`bus-${b.id || b.busNumber}`}
              position={[b.currentLat, b.currentLng]}
              icon={
                (b.trackingSource && b.trackingSource.toUpperCase() === 'SIMULATED')
                  ? createSimulatedBusIcon(b.busNumber)
                  : createRealBusIcon(b.busNumber)
              }
            >
              <Popup>
                <div style={{ padding: '6px', textAlign: 'center', minWidth: '170px' }}>
                  <strong style={{ fontSize: '1.05rem', color: '#4338ca', display: 'block' }}>
                    🚌 {b.busNumber}
                  </strong>
                  <div style={{ margin: '4px 0' }}>
                    <span style={{
                      background: (b.trackingSource && b.trackingSource.toUpperCase() === 'SIMULATED') ? '#fef3c7' : '#dcfce7',
                      color: (b.trackingSource && b.trackingSource.toUpperCase() === 'SIMULATED') ? '#b45309' : '#15803d',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}>
                      {(b.trackingSource && b.trackingSource.toUpperCase() === 'SIMULATED') ? 'SIMULATED DEMO' : 'LIVE DRIVER GPS'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                    Status: <strong>{b.status || 'IN_TRANSIT'}</strong>
                  </div>
                  {b.currentSpeed != null && (
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Speed: <strong>{Math.round(b.currentSpeed)} km/h</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                    {b.currentLat.toFixed(5)}, {b.currentLng.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Driver GPS Accuracy Radius Circle & Beacon */}
        {driverGps && driverGps.lat && driverGps.lng && (
          <>
            {driverGps.accuracy && driverGps.accuracy > 0 && (
              <Circle
                center={[driverGps.lat, driverGps.lng]}
                radius={Math.min(driverGps.accuracy, 150)}
                pathOptions={{
                  fillColor: '#10b981',
                  fillOpacity: 0.15,
                  color: '#10b981',
                  weight: 1,
                  dashArray: '4, 4'
                }}
              />
            )}
            <Marker position={[driverGps.lat, driverGps.lng]} icon={driverGpsIcon}>
              <Popup>
                <div style={{ padding: '4px', textAlign: 'center' }}>
                  <strong style={{ color: '#047857' }}>Driver GPS Location</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Accuracy: ±{Math.round(driverGps.accuracy || 10)}m
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default BusMap;
