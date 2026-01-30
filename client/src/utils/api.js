import axios from 'axios';

// API URL - use environment variable, fallback to localhost only in development
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');
if (!API_URL && import.meta.env.PROD) {
  console.error('VITE_API_URL must be set in production');
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register') && 
          window.location.pathname !== '/' &&
          window.location.pathname !== '/home') {
        window.location.href = '/login';
      }
    }
    // Log error for debugging
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', 'Backend server may not be running');
    }
    return Promise.reject(error);
  }
);

export default api;

