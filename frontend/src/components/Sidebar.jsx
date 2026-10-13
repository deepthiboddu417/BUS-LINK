import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Bus, UserCheck, Bell, ShieldAlert, 
  MapPin, Users, User, Route, Navigation, History, ListChecks,
  ShieldCheck, FileText
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getLinks = () => {
    switch (role) {
      case 'ROLE_STUDENT':
        return [
          { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/my-bus', label: 'My Assigned Bus', icon: Bus },
          { to: '/student/boarding', label: 'Board Bus & QR', icon: UserCheck },
          { to: '/student/incidents', label: 'Incidents & Safety', icon: ShieldAlert },
          { to: '/student/notifications', label: 'Notifications', icon: Bell },
          { to: '/student/profile', label: 'My Profile', icon: User },
        ];
      case 'ROLE_PARENT':
        return [
          { to: '/parent/dashboard', label: 'Child Dashboard', icon: LayoutDashboard },
          { to: '/parent/track-bus', label: 'Track Live Bus', icon: MapPin },
          { to: '/parent/incidents', label: 'Incidents Portal', icon: ShieldAlert },
          { to: '/parent/boarding-history', label: 'Boarding History', icon: History },
          { to: '/parent/notifications', label: 'Notifications', icon: Bell },
        ];
      case 'ROLE_DRIVER':
        return [
          { to: '/driver/dashboard', label: 'Driver Console', icon: LayoutDashboard },
          { to: '/driver/scan-qr', label: 'Scan Student QR', icon: UserCheck },
          { to: '/driver/location', label: 'Live GPS Tracking', icon: MapPin },
          { to: '/driver/trips', label: 'Trip Management', icon: Navigation },
          { to: '/driver/students', label: 'Passengers & Logs', icon: ListChecks },
          { to: '/driver/incidents', label: 'Report Incident', icon: ShieldAlert },
        ];
      case 'ROLE_ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
          { to: '/admin/security', label: 'Security Center', icon: ShieldCheck },
          { to: '/admin/incidents', label: 'Incidents Log', icon: ShieldAlert },
          { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
          { to: '/admin/students', label: 'Students', icon: Users },
          { to: '/admin/parents', label: 'Parents', icon: User },
          { to: '/admin/drivers', label: 'Drivers', icon: Users },
          { to: '/admin/buses', label: 'Buses', icon: Bus },
          { to: '/admin/routes', label: 'Routes & Stops', icon: Route },
          { to: '/admin/trips', label: 'Trips Control', icon: Navigation },
          { to: '/admin/attendance', label: 'Boarding Logs', icon: UserCheck },
          { to: '/admin/emergency', label: 'Emergency Alerts', icon: ShieldAlert },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside style={{
      width: '240px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--border-color)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      minHeight: 'calc(100vh - 65px)'
    }}>
      <div style={{ padding: '0 0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          BUS-LINK 2.0 NAVIGATION
        </span>
      </div>

      {links.map((link, idx) => {
        const IconComponent = link.icon;
        return (
          <NavLink
            key={idx}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s ease',
              background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.15))' : 'transparent',
              color: isActive ? '#818cf8' : '#94a3b8',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
            })}
          >
            <IconComponent size={18} />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};

export default Sidebar;
