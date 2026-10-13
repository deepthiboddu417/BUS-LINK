import React, { useState, useEffect } from 'react';
import { routeService } from '../../services/api';
import { Route, Plus, Trash2, MapPin } from 'lucide-react';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState({
    routeName: '',
    startPoint: '',
    endPoint: ''
  });

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [newStop, setNewStop] = useState({
    stopName: '',
    sequenceNumber: 1,
    latitude: 15.5050,
    longitude: 80.0490,
    expectedArrivalTime: '08:00 AM'
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    const res = await routeService.getAll();
    if (res.success && res.data) {
      setRoutes(res.data);
      if (res.data.length > 0) setSelectedRoute(res.data[0]);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    const res = await routeService.create(newRoute);
    if (res.success) {
      setNewRoute({ routeName: '', startPoint: '', endPoint: '' });
      loadRoutes();
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!selectedRoute) return;
    const res = await routeService.addStop(selectedRoute.id, newStop);
    if (res.success) {
      setNewStop({
        stopName: '',
        sequenceNumber: (selectedRoute.stops?.length || 0) + 1,
        latitude: 15.5050,
        longitude: 80.0490,
        expectedArrivalTime: '08:30 AM'
      });
      loadRoutes();
    }
  };

  const handleDeleteRoute = async (id) => {
    if (window.confirm("Delete route?")) {
      await routeService.delete(id);
      loadRoutes();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Route & Bus Stops Management</h2>

      {/* Create Route Form */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Create New Bus Route</h3>
        <form onSubmit={handleCreateRoute} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Route Title</label>
            <input type="text" className="form-input" placeholder="e.g. Karedu → College" value={newRoute.routeName} onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Start Point</label>
            <input type="text" className="form-input" placeholder="e.g. Karedu" value={newRoute.startPoint} onChange={(e) => setNewRoute({ ...newRoute, startPoint: e.target.value })} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>End Point</label>
            <input type="text" className="form-input" placeholder="e.g. PACE College" value={newRoute.endPoint} onChange={(e) => setNewRoute({ ...newRoute, endPoint: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.25rem' }}>
            <Plus size={18} /> Add Route
          </button>
        </form>
      </div>

      {/* Routes List & Stops Configuration */}
      <div className="grid-cols-2">
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Configured Routes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {routes.map(r => (
              <div 
                key={r.id} 
                onClick={() => setSelectedRoute(r)}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: selectedRoute?.id === r.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  border: selectedRoute?.id === r.id ? '1px solid #6366f1' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: '#fff' }}>{r.routeName}</h4>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Stops count: {r.stops?.length || 0}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteRoute(r.id); }} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stops for Selected Route */}
        {selectedRoute && (
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>
              Stops for {selectedRoute.routeName}
            </h3>

            {/* Add Stop Form */}
            <form onSubmit={handleAddStop} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Stop Name</label>
                <input type="text" className="form-input" placeholder="Stop Name (e.g. Kandukur)" value={newStop.stopName} onChange={(e) => setNewStop({ ...newStop, stopName: e.target.value })} required />
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Expected Arrival Time</label>
                <input type="text" className="form-input" placeholder="ETA (e.g. 08:15 AM)" value={newStop.expectedArrivalTime} onChange={(e) => setNewStop({ ...newStop, expectedArrivalTime: e.target.value })} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>GPS Latitude (Lat)</label>
                <input type="number" step="0.0001" className="form-input" placeholder="Latitude (e.g. 15.5050)" value={newStop.latitude} onChange={(e) => setNewStop({ ...newStop, latitude: parseFloat(e.target.value) })} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>GPS Longitude (Lng)</label>
                <input type="number" step="0.0001" className="form-input" placeholder="Longitude (e.g. 80.0490)" value={newStop.longitude} onChange={(e) => setNewStop({ ...newStop, longitude: parseFloat(e.target.value) })} required />
              </div>
              
              <button type="submit" className="btn btn-success" style={{ gridColumn: 'span 2', padding: '0.65rem' }}>
                <Plus size={16} /> Add Stop to Route
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(selectedRoute.stops || []).map((s, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 700 }}>Seq #{s.sequenceNumber || idx + 1}</span>
                    <h5 style={{ margin: '0.2rem 0', color: '#fff' }}>{s.stopName}</h5>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lat: {s.latitude}, Lng: {s.longitude}</span>
                  </div>
                  <span className="badge badge-info">{s.expectedArrivalTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteManagement;
