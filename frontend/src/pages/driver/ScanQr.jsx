import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { boardingService, driverService, tripService } from '../../services/api';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, UserCheck, Bus, Key, XCircle } from 'lucide-react';

const ScanQrContent = () => {
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const scannerInstanceRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadDriverData();

    return () => {
      isMounted.current = false;
      stopAndClearScanner();
    };
  }, [user]);

  const loadDriverData = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setScanError('');

    try {
      if (user && user.email) {
        const dRes = await driverService.getByEmail(user.email);
        if (isMounted.current && dRes.success && dRes.data) {
          setDriver(dRes.data);
          if (dRes.data.bus) {
            const tripRes = await tripService.getActiveForBus(dRes.data.bus.id);
            if (isMounted.current && tripRes.success && tripRes.data) {
              setActiveTrip(tripRes.data);
            }
          }
        }
      }

      // Check browser camera API support safely
      if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (isMounted.current && devices && devices.length > 0) {
            setCameras(devices);
            setSelectedCamera(devices[0].id);
          }
        } catch (camErr) {
          console.warn("Camera device enumeration notice (harmless):", camErr);
        }
      }
    } catch (e) {
      console.error("Error loading driver data:", e);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const stopAndClearScanner = async () => {
    if (scannerInstanceRef.current) {
      const instance = scannerInstanceRef.current;
      scannerInstanceRef.current = null;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
      } catch (e) {
        console.warn("Notice stopping html5Qrcode scanner instance:", e);
      }

      try {
        instance.clear();
      } catch (e) {
        console.warn("Notice clearing html5Qrcode element:", e);
      }
    }

    // Stop all active MediaStream tracks to release hardware light cleanly
    try {
      const videoElements = document.getElementsByTagName('video');
      for (let i = 0; i < videoElements.length; i++) {
        const video = videoElements[i];
        if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
          video.srcObject.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
      }
    } catch (e) {}

    if (isMounted.current) {
      setIsScanning(false);
    }
  };

  const startCamera = async () => {
    if (isMounted.current) {
      setScanResult(null);
      setScanError('');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (isMounted.current) {
        setScanError("Camera API is not supported in this browser context (HTTPS or localhost required). You can still verify student passes using the manual entry fallback below.");
      }
      return;
    }

    const readerElement = document.getElementById("reader");
    if (!readerElement) {
      if (isMounted.current) {
        setScanError("Scanner DOM container not ready. Please refresh the page.");
      }
      return;
    }

    await stopAndClearScanner();

    try {
      if (isMounted.current) {
        setIsScanning(true);
      }

      const html5Qrcode = new Html5Qrcode("reader");
      scannerInstanceRef.current = html5Qrcode;

      const cameraConfig = selectedCamera ? selectedCamera : { facingMode: "environment" };

      await html5Qrcode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          if (isMounted.current) {
            handleQrScanned(decodedText);
          }
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera start exception:", err);
      await stopAndClearScanner();

      let errorMsg = "Camera initialization failed. ";
      const errStr = err?.toString() || '';
      if (err?.name === "NotAllowedError" || errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        errorMsg += "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err?.name === "NotFoundError" || errStr.includes("NotFoundError")) {
        errorMsg += "No camera device found on this system.";
      } else if (err?.name === "NotReadableError" || errStr.includes("NotReadableError") || errStr.includes("in use")) {
        errorMsg += "Camera is currently in use by another application.";
      } else {
        errorMsg += err?.message || "Please check device permissions or use manual entry below.";
      }

      if (isMounted.current) {
        setScanError(errorMsg);
      }
    }
  };

  const handleQrScanned = async (tokenStr) => {
    await stopAndClearScanner();
    processBoardingVerification(tokenStr);
  };

  const processBoardingVerification = async (tokenStr) => {
    if (!isMounted.current) return;
    setVerifying(true);
    setScanResult(null);
    setScanError('');

    try {
      const busId = driver?.bus?.id || 1;
      const tripId = activeTrip?.id || null;
      const location = driver?.bus?.route?.startPoint || "Driver Station QR Scan";

      const res = await boardingService.scanDriverAttendance(tokenStr, busId, tripId, location);
      if (isMounted.current) {
        if (res.success && res.data) {
          setScanResult({
            approved: true,
            studentName: res.data.student?.user?.name || "Student",
            studentIdCode: res.data.student?.studentIdCode || "STU-ID",
            busNumber: res.data.bus?.busNumber || "BUS-01",
            location: res.data.location,
            boardingTime: new Date(res.data.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: "✓ STUDENT VERIFIED & BOARDING CONFIRMED"
          });
        } else {
          setScanResult({
            approved: false,
            message: res.message || "Boarding Rejected: Invalid or unauthorized QR Code."
          });
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setScanResult({
          approved: false,
          message: err.message || "Boarding Rejected: Security validation failed."
        });
      }
    } finally {
      if (isMounted.current) {
        setVerifying(false);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    processBoardingVerification(manualToken.trim());
    setManualToken('');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#818cf8' }}>
        <RefreshCw className="spin" size={40} style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>Initializing Driver Console & Trip Status...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck color="#818cf8" size={28} /> Live Driver QR Boarding Scanner
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.3rem 0 0' }}>
            Driver: <strong style={{ color: '#38bdf8' }}>{driver?.user?.name || user?.name || 'Driver'}</strong> | Assigned Bus: <strong style={{ color: '#10b981' }}>{driver?.bus?.busNumber || 'BUS-01'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!isScanning ? (
            <button onClick={startCamera} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
              <Camera size={20} /> START CAMERA SCANNER
            </button>
          ) : (
            <button onClick={stopAndClearScanner} className="btn btn-danger" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
              <XCircle size={20} /> STOP CAMERA
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Camera Viewfinder & Controls Box */}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="#6366f1" /> Real-Time Camera Feed
          </h3>

          {/* Camera Selector drop-down */}
          {cameras.length > 1 && (
            <div style={{ marginBottom: '1rem' }}>
              <select
                className="input-field"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={isScanning}
                style={{ fontSize: '0.85rem' }}
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.substring(0, 8)}...`}</option>
                ))}
              </select>
            </div>
          )}

          {/* Video Container Wrapper */}
          <div 
            style={{ 
              width: '100%', 
              minHeight: '260px', 
              background: '#090d16', 
              borderRadius: '16px', 
              border: isScanning ? '2px solid #10b981' : '1px dashed #475569',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Dedicated empty container for Html5Qrcode - NO REACT CHILDREN INSIDE */}
            <div id="reader" style={{ width: '100%', height: '100%', minHeight: '260px' }} />

            {/* Offline Placeholder Overlay - Rendered outside #reader to prevent removeChild DOM conflicts */}
            {!isScanning && (
              <div 
                style={{ 
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b', 
                  padding: '2rem',
                  pointerEvents: 'none'
                }}
              >
                <Camera size={48} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>
                  Camera scanner is offline.<br />Click "START CAMERA SCANNER" above to begin scanning.
                </p>
              </div>
            )}
          </div>

          {scanError && (
            <div style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', textAlign: 'left' }}>
              ⚠️ {scanError}
            </div>
          )}

          {/* Manual Entry Fallback Form */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Manual Pass Token Fallback:
            </span>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Enter STU-1-timestamp-signature token..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-secondary" disabled={verifying} style={{ whiteSpace: 'nowrap' }}>
                Verify Token
              </button>
            </form>
          </div>
        </div>

        {/* Verification Result Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#10b981" /> Verification Result
          </h3>

          {verifying ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#818cf8' }}>
              <RefreshCw className="spin" size={36} style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600 }}>Verifying HMAC Signature & Bus Assignment...</p>
            </div>
          ) : scanResult ? (
            scanResult.approved ? (
              /* Approved Boarding Card */
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.2))',
                border: '2px solid #10b981',
                borderRadius: '16px',
                padding: '1.75rem',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={56} color="#10b981" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1.3rem', color: '#34d399', margin: '0 0 0.5rem' }}>
                  STUDENT VERIFIED & APPROVED
                </h4>
                <div style={{ margin: '1rem 0', textTransform: 'none', textAlign: 'left', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', fontSize: '0.95rem' }}>
                  <div style={{ marginBottom: '0.4rem' }}><strong>Student Name:</strong> <span style={{ color: '#fff' }}>{scanResult.studentName}</span></div>
                  <div style={{ marginBottom: '0.4rem' }}><strong>Student ID Code:</strong> <span style={{ color: '#38bdf8' }}>{scanResult.studentIdCode}</span></div>
                  <div style={{ marginBottom: '0.4rem' }}><strong>Assigned Bus:</strong> <span style={{ color: '#818cf8' }}>{scanResult.busNumber}</span></div>
                  <div style={{ marginBottom: '0.4rem' }}><strong>Boarding Time:</strong> <span style={{ color: '#34d399' }}>{scanResult.boardingTime}</span></div>
                  <div><strong>Location:</strong> <span style={{ color: '#94a3b8' }}>{scanResult.location}</span></div>
                </div>
                <div className="badge badge-success" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                  ✓ Parent SMS & In-App Notification Sent Automatically
                </div>
                <button 
                  onClick={startCamera} 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem', width: '100%', padding: '0.65rem' }}
                >
                  <RefreshCw size={16} /> Scan Next Student
                </button>
              </div>
            ) : (
              /* Rejected Boarding Card */
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(153, 27, 27, 0.2))',
                border: '2px solid #ef4444',
                borderRadius: '16px',
                padding: '1.75rem',
                textAlign: 'center'
              }}>
                <AlertTriangle size={56} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1.3rem', color: '#f87171', margin: '0 0 0.5rem' }}>
                  BOARDING REJECTED
                </h4>
                <p style={{ color: '#fca5a5', fontSize: '0.95rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', marginTop: '0.75rem', fontWeight: 600 }}>
                  ⚠️ {scanResult.message}
                </p>
                <button 
                  onClick={startCamera} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1rem', width: '100%', padding: '0.65rem' }}
                >
                  <RefreshCw size={16} /> Retry Scan
                </button>
              </div>
            )
          ) : (
            /* Idle Instruction State */
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              <UserCheck size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                Present student's phone screen to the camera.<br/>The system will automatically decode HMAC signatures and verify bus assignment.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

const ScanQr = () => (
  <ErrorBoundary>
    <ScanQrContent />
  </ErrorBoundary>
);

export default ScanQr;
