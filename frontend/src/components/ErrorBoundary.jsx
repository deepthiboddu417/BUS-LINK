import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: '550px',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(15, 23, 42, 0.95)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '50%',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={48} color="#ef4444" />
            </div>

            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>
              Component Rendering Error
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              An unexpected error occurred while rendering this module. The rest of the BUS-LINK system remains active.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid #334155',
                color: '#f87171',
                padding: '1rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={this.handleReset} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                <RefreshCw size={18} /> Reload Scanner Page
              </button>
              <a href="/" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
                <Home size={18} /> Return Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
