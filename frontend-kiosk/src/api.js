import axios from 'axios';

const API = axios.create({
  baseURL: `http://${window.location.hostname}:5000/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const verifyPin = (pin) => API.post('/kiosk/verify-pin', { pin });
export const recordClockEvent = (data) => API.post('/kiosk/clock', data);

export default API;