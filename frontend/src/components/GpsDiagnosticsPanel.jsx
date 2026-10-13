import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Wifi, Lock, Unlock, Compass, 
  AlertTriangle, CheckCircle2, XCircle, Info, ExternalLink, RefreshCw 
} from 'lucide-react';

const GpsDiagnosticsPanel = ({ lastGpsError = null, permissionState = 'prompt', onRefreshPermission = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSecure, setIsSecure] = useState(false);
  const [hasGeolocation, setHasGeolocation] = useState(false);
  const [hasWakeLock, setHasWakeLock] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentProtocol, setCurrentProtocol] = useState('');
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(Boolean(window.isSecureContext));
      setHasGeolocation('geolocation' in navigator);
      setHasWakeLock('wakeLock' in navigator);
      setCurrentUrl(window.location.href);
      setCurrentProtocol(window.location.protocol);
      setHostname(window.location.hostname);
    }
  }, []);

  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isInsecureRemote = !isSecure && !isLocalhost;

  // Compute https destination url if currently on http
  const getHttpsUrl = () => {
    if (typeof window === 'undefined') return '';
    const port = window.location.port;
    // Map default 5173 -> 5174 (standard dev HTTPS port)
    const httpsPort = port === '5173' ? '5174' : (parseInt(port, 10) + 1 || '5174');
    return `https://${hostname}:${httpsPort}${window.location.pathname}${window.location.search}`;
  };

  return (
    <div style={{
      background: isInsecureRemote ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.75)',
      border: isInsecureRemote ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '0.85rem 1.15rem',
      fontSize: '0.82rem',
      color: '#cbd5e1'
    }}>
      {/* Summary Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSecure ? (
            <Lock size={16} color="#10b981" />
          ) : (
            <Unlock size={16} color={isInsecureRemote ? "#ef4444" : "#f59e0b"} />
          )}
          <strong style={{ color: isSecure ? '#34d399' : isInsecureRemote ? '#f87171' : '#fbbf24' }}>
            GPS Environment: {isSecure ? 'Secure Context (GPS Ready)' : isInsecureRemote ? 'Insecure Context (HTTP Blocks GPS on Mobile)' : 'Localhost (Dev Mode)'}
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 700,
            background: permissionState === 'granted' ? 'rgba(16, 185, 129, 0.2)' : permissionState === 'denied' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: permissionState === 'granted' ? '#34d399' : permissionState === 'denied' ? '#f87171' : '#fbbf24',
            border: `1px solid ${permissionState === 'granted' ? '#10b981' : permissionState === 'denied' ? '#ef4444' : '#f59e0b'}`
          }}>
            Permission: {permissionState ? permissionState.toUpperCase() : 'UNKNOWN'}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.78rem',
              textDecoration: 'underline'
            }}
          >
            {isExpanded ? 'Hide Diagnostics' : 'View Diagnostics'}
          </button>
        </div>
      </div>

      {/* Critical Insecure Warning & Direct HTTPS Action Button */}
      {isInsecureRemote && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '2px' }}>
                Why Location Permission Is Blocked On This Device
              </strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                Mobile browsers (Chrome/Safari) <strong>strictly forbid GPS access over plain HTTP on LAN IPs</strong>. 
                They automatically reject requests without showing the permission dialog.
              </p>

              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a
                  href={getHttpsUrl()}
                  className="btn btn-primary"
                  style={{
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)'
                  }}
                >
                  <Lock size={14} /> Open Via HTTPS (Port 5174)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied Guide */}
      {permissionState === 'denied' && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          color: '#f8fafc'
        }}>
          <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '4px' }}>
            How to Reset Denied Location Permission:
          </strong>
          <ul style={{ margin: '0 0 0 1.2rem', padding: 0, fontSize: '0.78rem', lineHeight: 1.5, color: '#cbd5e1' }}>
            <li><strong>Chrome on Mobile:</strong> Tap the lock or tune icon (⚙️ / 🔒) in the address bar &rarr; <em>Permissions</em> &rarr; <em>Location</em> &rarr; Tap <strong>Reset</strong> or <strong>Allow</strong> &rarr; Refresh the page.</li>
            <li><strong>Chrome on Laptop/PC:</strong> Click the icon to the left of the URL &rarr; Toggle <em>Location</em> to <strong>Allow</strong> &rarr; Refresh page.</li>
            <li><strong>Device Settings:</strong> Ensure device-level Location / GPS is toggled <strong>ON</strong> in your phone's Android / iOS Quick Settings pull-down menu.</li>
          </ul>
        </div>
      )}

      {/* Expanded Technical Diagnostics Table */}
      {isExpanded && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Current URL:</span>
              <code style={{ fontSize: '0.75rem', color: '#818cf8', wordBreak: 'break-all' }}>{currentUrl || 'Unknown'}</code>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Secure Context (isSecureContext):</span>
              <strong style={{ color: isSecure ? '#34d399' : '#f87171' }}>
                {isSecure ? '✓ Yes (true)' : '✗ No (false - blocks GPS)'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Geolocation API:</span>
              <strong style={{ color: hasGeolocation ? '#34d399' : '#f87171' }}>
                {hasGeolocation ? '✓ Supported' : '✗ Not Available in this browser'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Screen WakeLock API:</span>
              <strong style={{ color: hasWakeLock ? '#34d399' : '#94a3b8' }}>
                {hasWakeLock ? '✓ Supported' : '○ Unsupported (display may sleep)'}
              </strong>
            </div>
          </div>

          {lastGpsError && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '6px 10px',
              borderRadius: '6px',
              borderLeft: '3px solid #ef4444',
              fontSize: '0.75rem',
              color: '#fca5a5'
            }}>
              <strong>Exact Last Error:</strong> {lastGpsError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GpsDiagnosticsPanel;
