import axios from 'axios';

const getApiBaseUrl = () => {
  // Use relative '/api' in browser so all requests go to same origin (supporting localhost, LAN IP, and HTTPS tunnels)
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.VITE_API_URL || 'http://localhost:8080/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('buslink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Automatic token expiration handling
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  logout: (refreshToken) => api.post(`/auth/logout${refreshToken ? `?refreshToken=${refreshToken}` : ''}`),
};

export const studentService = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  getByEmail: (email) => api.get(`/students/email/${email}`),
  update: (id, data) => api.put(`/students/${id}`, data),
  assignBus: (id, busId) => api.put(`/students/${id}/assign-bus/${busId}`),
  linkParent: (id, parentId) => api.put(`/students/${id}/link-parent/${parentId}`),
  delete: (id) => api.delete(`/students/${id}`),
};

export const parentService = {
  getAll: () => api.get('/parents'),
  getById: (id) => api.get(`/parents/${id}`),
  getByEmail: (email) => api.get(`/parents/email/${email}`),
  getChildren: (id) => api.get(`/parents/${id}/children`),
  getChildBoardingHistory: (parentId, childId) => api.get(`/parents/${parentId}/children/${childId}/boarding-history`),
  update: (id, data) => api.put(`/parents/${id}`, data),
  delete: (id) => api.delete(`/parents/${id}`),
};

export const driverService = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  getByEmail: (email) => api.get(`/drivers/email/${email}`),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

export const busService = {
  getAll: () => api.get('/buses'),
  getById: (id) => api.get(`/buses/${id}`),
  create: (data) => api.post('/buses', data),
  update: (id, data) => api.put(`/buses/${id}`, data),
  assignDriver: (id, driverId) => api.put(`/buses/${id}/assign-driver/${driverId}`),
  assignRoute: (id, routeId) => api.put(`/buses/${id}/assign-route/${routeId}`),
  delete: (id) => api.delete(`/buses/${id}`),
};

export const locationService = {
  getLocation: (busId) => api.get(`/buses/${busId}/location`),
  updateLocation: (busId, lat, lng) => api.put(`/buses/${busId}/location`, { latitude: lat, longitude: lng }),
  getHistory: (busId) => api.get(`/buses/${busId}/location/history`),
};

export const trackingService = {
  submitLocation: (telemetry) => api.post('/tracking/location', telemetry),
  getLatest: (busId) => api.get(`/tracking/buses/${busId}/latest`),
  getHistory: (busId, limit = 50) => api.get(`/tracking/buses/${busId}/history?limit=${limit}`),
  getRoute: (busId) => api.get(`/tracking/buses/${busId}/route`),
  getActiveBuses: () => api.get('/tracking/buses/active'),
  startSimulation: (busId) => api.post('/tracking/simulation/start', { busId }),
  stopSimulation: (busId) => api.post('/tracking/simulation/stop', { busId }),
  getSimulationStatus: (busId) => api.get(`/tracking/simulation/status/${busId}`),
};

export const boardingService = {
  recordBoarding: (studentId, tripId, busId, location) => 
    api.post(`/boarding?studentId=${studentId}`, { tripId, busId, location }),
  getStudentHistory: (studentId) => api.get(`/boarding/student/${studentId}`),
  getTripAttendance: (tripId) => api.get(`/boarding/trip/${tripId}`),
  getTodayBusAttendance: (busId) => api.get(`/boarding/bus/${busId}/today`),
  getAllAttendance: () => api.get('/boarding'),
  getStudentQrToken: (studentId) => api.get(`/boarding/student/${studentId}/qr-token`),
  getStudentQrPass: (studentId) => api.get(`/boarding/student/${studentId}/qr-pass`),
  scanQrCode: (qrToken, busId, location) => api.post('/boarding/scan-qr', { qrToken, busId, location }),
  scanDriverAttendance: (qrToken, busId, tripId, location) => 
    api.post('/drivers/attendance/scan', { qrToken, busId, tripId, location }),
};

export const incidentService = {
  getAll: () => api.get('/incidents'),
  report: (data) => api.post('/incidents', data),
  updateStatus: (id, status) => api.put(`/incidents/${id}/status`, { status }),
};

export const otpService = {
  sendOtp: (email) => api.post('/auth/otp/send', { email }),
  verifyOtp: (email, code) => api.post('/auth/otp/verify', { email, code }),
};

export const notificationService = {
  getParentNotifications: (parentId) => api.get(`/notifications/parent/${parentId}`),
  getUnreadNotifications: (parentId) => api.get(`/notifications/parent/${parentId}/unread`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (parentId) => api.put(`/notifications/parent/${parentId}/read-all`),
};

export const tripService = {
  getAll: () => api.get('/trips'),
  getActive: () => api.get('/trips/active'),
  getActiveForBus: (busId) => api.get(`/trips/bus/${busId}/active`),
  startTrip: (busId) => api.put(`/trips/bus/${busId}/start`),
  endTrip: (tripId) => api.put(`/trips/${tripId}/end`),
};

export const routeService = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  addStop: (id, stopData) => api.post(`/routes/${id}/stops`, stopData),
  delete: (id) => api.delete(`/routes/${id}`),
};

export const emergencyService = {
  raiseEmergency: (userId, busId, message, lat, lng) => 
    api.post(`/emergency?userId=${userId}`, { message, busId, latitude: lat, longitude: lng }),
  getAllAlerts: () => api.get('/emergency'),
  resolveAlert: (id) => api.put(`/emergency/${id}/resolve`),
};

export const adminSecurityService = {
  getMetrics: () => api.get('/admin/security/metrics'),
  getAuditLogs: (params) => api.get('/admin/security/audit-logs', { params }),
};

export const adminService = {
  getStats: () => api.get('/admin/dashboard-stats'),
};

export default api;
