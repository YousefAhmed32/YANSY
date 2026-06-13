import axios from 'axios';

// ─── Base URL ──────────────────────────────────────────────────────────────────
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

if (!API_URL && import.meta.env.PROD) {
  console.error(
    '❌ VITE_API_URL is not set. Requests will fail in production.'
  );
}

// ─── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15_000,  // 15-second hard timeout — frontend never hangs forever
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach JWT token ─────────────────────────────────────
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

// ─── Response interceptor: normalize errors ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.error;

    // 401 — clear token and redirect (but not on auth pages)
    if (status === 401) {
      console.warn('[API] 401 Unauthorized — clearing token');
      localStorage.removeItem('token');

      const path = window.location.pathname;
      const isPublicPage =
        path === '/' ||
        path.includes('/login') ||
        path.includes('/register');

      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }

    // 5xx — surface the real error message in dev
    if (status >= 500) {
      console.error('[API] Server error:', status, message || error.response?.data);
    }

    // Network / timeout
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('[API] Request timed out after 15 s');
        // Attach a friendly message so UI can display it
        error.friendlyMessage =
          'The server took too long to respond. Please check your connection and try again.';
      } else {
        console.error('[API] Network error — backend unreachable or CORS issue');
        error.friendlyMessage =
          'Cannot reach the server. Please check your connection.';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
