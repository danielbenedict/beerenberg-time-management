import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Staff Management Endpoints
export const fetchStaff = () => API.get('/users');
export const createStaff = (data) => API.post('/users', data);
export const updateStaff = (id, data) => API.put(`/users/${id}`, data);
export const fetchMetadata = () => API.get('/metadata');

// Shift Rostering Endpoints
export const fetchRoster = () => API.get('/roster');
export const createShift = (data) => API.post('/roster', data);

// Task 3.4: Clock Override Endpoint
export const recordClockOverride = (data) => API.post('/kiosk/override', data);

// Task 3.5: Audit Logs Endpoint
export const fetchAuditLogs = () => API.get('/kiosk/audit-logs');

// Task 4.2: Exception Reports Endpoint
export const fetchExceptionReport = (date) => API.get(`/reports/exceptions?date=${date}`);

export default API;