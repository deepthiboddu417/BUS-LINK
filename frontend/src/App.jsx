import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyBus from './pages/student/MyBus';
import Boarding from './pages/student/Boarding';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';
import StudentJourneySafety from './pages/student/StudentJourneySafety';

// Parent Pages
import ParentDashboard from './pages/parent/ParentDashboard';
import TrackBus from './pages/parent/TrackBus';
import BoardingHistory from './pages/parent/BoardingHistory';
import ParentNotifications from './pages/parent/ParentNotifications';
import ParentSafetyTimeline from './pages/parent/ParentSafetyTimeline';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import ScanQr from './pages/driver/ScanQr';
import TripManagement from './pages/driver/TripManagement';
import StudentList from './pages/driver/StudentList';
import LocationSharing from './pages/driver/LocationSharing';
import DriverEmergencyPanel from './pages/driver/DriverEmergencyPanel';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import ParentManagement from './pages/admin/ParentManagement';
import DriverManagement from './pages/admin/DriverManagement';
import BusManagement from './pages/admin/BusManagement';
import RouteManagement from './pages/admin/RouteManagement';
import AdminTripManagement from './pages/admin/AdminTripManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import EmergencyAlerts from './pages/admin/EmergencyAlerts';
import AdminSecurity from './pages/admin/AdminSecurity';
import AuditLogs from './pages/admin/AuditLogs';
import Incidents from './pages/Incidents';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        {user && <Sidebar />}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'ROLE_STUDENT': return <Navigate to="/student/dashboard" replace />;
    case 'ROLE_PARENT': return <Navigate to="/parent/dashboard" replace />;
    case 'ROLE_DRIVER': return <Navigate to="/driver/dashboard" replace />;
    case 'ROLE_ADMIN': return <Navigate to="/admin/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/my-bus" element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']}><MyBus /></ProtectedRoute>} />
            <Route path="/student/boarding" element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']}><Boarding /></ProtectedRoute>} />
            <Route path="/student/incidents" element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']}><Incidents /></ProtectedRoute>} />
            <Route path="/student/safety-status" element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']}><StudentJourneySafety /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']}><StudentNotifications /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['ROLE_STUDENT']}><StudentProfile /></ProtectedRoute>} />

            {/* Parent Routes */}
            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['ROLE_PARENT']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/track-bus" element={<ProtectedRoute allowedRoles={['ROLE_PARENT']}><TrackBus /></ProtectedRoute>} />
            <Route path="/parent/incidents" element={<ProtectedRoute allowedRoles={['ROLE_PARENT']}><Incidents /></ProtectedRoute>} />
            <Route path="/parent/safety-timeline" element={<ProtectedRoute allowedRoles={['ROLE_PARENT']}><ParentSafetyTimeline /></ProtectedRoute>} />
            <Route path="/parent/boarding-history" element={<ProtectedRoute allowedRoles={['ROLE_PARENT']}><BoardingHistory /></ProtectedRoute>} />
            <Route path="/parent/notifications" element={<ProtectedRoute allowedRoles={['ROLE_PARENT']}><ParentNotifications /></ProtectedRoute>} />

            {/* Driver Routes */}
            <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={['ROLE_DRIVER']}><DriverDashboard /></ProtectedRoute>} />
            <Route path="/driver/scan-qr" element={<ProtectedRoute allowedRoles={['ROLE_DRIVER', 'ROLE_ADMIN']}><ScanQr /></ProtectedRoute>} />
            <Route path="/driver/trips" element={<ProtectedRoute allowedRoles={['ROLE_DRIVER']}><TripManagement /></ProtectedRoute>} />
            <Route path="/driver/students" element={<ProtectedRoute allowedRoles={['ROLE_DRIVER']}><StudentList /></ProtectedRoute>} />
            <Route path="/driver/incidents" element={<ProtectedRoute allowedRoles={['ROLE_DRIVER']}><Incidents /></ProtectedRoute>} />
            <Route path="/driver/location" element={<ProtectedRoute allowedRoles={['ROLE_DRIVER']}><LocationSharing /></ProtectedRoute>} />
            <Route path="/driver/emergency-panel" element={<ProtectedRoute allowedRoles={['ROLE_DRIVER']}><DriverEmergencyPanel /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/security" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AdminSecurity /></ProtectedRoute>} />
            <Route path="/admin/incidents" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><Incidents /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AuditLogs /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><StudentManagement /></ProtectedRoute>} />
            <Route path="/admin/parents" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><ParentManagement /></ProtectedRoute>} />
            <Route path="/admin/drivers" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><DriverManagement /></ProtectedRoute>} />
            <Route path="/admin/buses" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><BusManagement /></ProtectedRoute>} />
            <Route path="/admin/routes" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><RouteManagement /></ProtectedRoute>} />
            <Route path="/admin/trips" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AdminTripManagement /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AttendanceManagement /></ProtectedRoute>} />
            <Route path="/admin/emergency" element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><EmergencyAlerts /></ProtectedRoute>} />

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
