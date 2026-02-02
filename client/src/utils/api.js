import axios from 'axios';

// API URL - use environment variable, fallback to localhost only in development
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');
if (!API_URL && import.meta.env.PROD) {
  console.error('VITE_API_URL must be set in production (e.g. https://api.yourdomain.com/api)');
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // required for cookies and CORS on HTTPS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: send token from localStorage (or cookie is sent automatically with withCredentials)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: 401 → clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const path = window.location.pathname;
      const isPublic = path === '/' || path === '/home' || path.includes('/login') || path.includes('/register');
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request.responseURL || 'Backend may be unreachable');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };

