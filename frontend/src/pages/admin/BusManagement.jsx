import React, { useState, useEffect } from 'react';
import { busService, driverService, routeService } from '../../services/api';
import { Bus, Plus, Trash2 } from 'lucide-react';

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [newBus, setNewBus] = useState({
    busNumber: '',
    capacity: 40
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const bRes = await busService.getAll();
    if (bRes.success && bRes.data) setBuses(bRes.data);

    const dRes = await driverService.getAll();
    if (dRes.success && dRes.data) setDrivers(dRes.data);

    const rRes = await routeService.getAll();
    if (rRes.success && rRes.data) setRoutes(rRes.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await busService.create(newBus);
      if (res.success) {
        setNewBus({ busNumber: '', capacity: 40 });
        loadAll();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignDriver = async (busId, driverId) => {
    if (!driverId) return;
    await busService.assignDriver(busId, driverId);
    loadAll();
  };

  const handleAssignRoute = async (busId, routeId) => {
    if (!routeId) return;
    await busService.assignRoute(busId, routeId);
    loadAll();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete bus?")) {
      await busService.delete(id);
      loadAll();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Bus Fleet Management</h2>

      {/* Add Bus Form */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Add New Bus to Fleet</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label>Bus Number</label>
            <input type="text" className="form-input" placeholder="e.g. BUS-02" value={newBus.busNumber} onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })} required />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label>Passenger Capacity</label>
            <input type="number" className="form-input" value={newBus.capacity} onChange={(e) => setNewBus({ ...newBus, capacity: parseInt(e.target.value) })} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
            <Plus size={18} /> Add Bus
          </button>
        </form>
      </div>

      {/* Buses List */}
      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Bus Number</th>
              <th style={{ padding: '0.75rem' }}>Capacity</th>
              <th style={{ padding: '0.75rem' }}>Assigned Driver</th>
              <th style={{ padding: '0.75rem' }}>Assigned Route</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700, color: '#818cf8' }}>{b.busNumber}</td>
                <td style={{ padding: '0.75rem' }}>{b.capacity} Seats</td>
                <td style={{ padding: '0.75rem' }}>
                  <select 
                    className="form-input" 
                    style={{ padding: '0.35rem', fontSize: '0.82rem', width: '140px' }}
                    value={b.driver?.id || ''} 
                    onChange={(e) => handleAssignDriver(b.id, e.target.value)}
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.user?.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <select 
                    className="form-input" 
                    style={{ padding: '0.35rem', fontSize: '0.82rem', width: '160px' }}
                    value={b.route?.id || ''} 
                    onChange={(e) => handleAssignRoute(b.id, e.target.value)}
                  >
                    <option value="">Select Route</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.routeName}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge ${b.status === 'IN_TRANSIT' ? 'badge-success' : 'badge-info'}`}>{b.status}</span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => handleDelete(b.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default BusManagement;
