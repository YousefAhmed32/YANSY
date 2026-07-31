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

// A 401 only means "log this user out" when the server explicitly says the
// *token* is the problem. A 401 with no code (e.g. wrong password on the
// login form itself) or a 500/503 from a DB/network hiccup must NOT clear a
// perfectly valid session — see server/middleware/auth.js, which now returns
// 503/500 (not 401) for infrastructure failures precisely so this check works.
const SESSION_INVALID_CODES = new Set([
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'TOKEN_MISSING',
  'USER_NOT_FOUND',
]);

// ─── Response interceptor: normalize errors ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const code    = error.response?.data?.code;
    const message = error.response?.data?.error;

    // 401 with a recognized token-failure code — the session really is gone.
    // Clear it and redirect (but not on auth pages).
    if (status === 401 && SESSION_INVALID_CODES.has(code)) {
      console.warn('[API] Session invalid —', code, '— clearing token');
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

// ─── Media origin ──────────────────────────────────────────────────────────────
// Local (non-Cloudinary) media assets are stored as relative paths (e.g. "/uploads/files/x.png")
// so they aren't frozen to whatever host/port the backend happened to be running on at upload
// time. This is the origin they get resolved against at render time — see utils/media.js.
const MEDIA_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export default api;
export { API_URL, MEDIA_ORIGIN };
