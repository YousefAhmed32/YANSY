# Production (HTTPS) Deployment Guide

This document summarizes fixes applied for moving from local development (HTTP, localhost) to production (HTTPS, remote server), and how to run the app in production.

---

## 1. MongoDB Connection

**Issue:** Environment variable name mismatch (`MONGO_URI` vs `MONGODB_URI`).

**Fix:** Backend now accepts **both** `MONGODB_URI` and `MONGO_URI` (prefer `MONGODB_URI`).

- **Local:** `MONGODB_URI=mongodb://localhost:27017/yansy`
- **Atlas:** `MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/yansy?retryWrites=true&w=majority`

Use the same variable in `.env` on the server so connection works for both local MongoDB and MongoDB Atlas.

---

## 2. CORS & HTTPS

**Fixes applied:**

- CORS uses `CLIENT_URL` (comma-separated for multiple origins) with `credentials: true` for cookies/JWT.
- In development, requests with no `origin` are allowed (e.g. Postman).
- CORS rejection is handled in the error handler and returns `403` JSON instead of throwing.
- `methods` and `allowedHeaders` are set for `Authorization` and `Content-Type`.

**Production:** Set `CLIENT_URL=https://yourdomain.com` (or multiple: `https://yourdomain.com,http://localhost:5173` for dev).

---

## 3. Authentication & Cookies

**Fixes applied:**

- **JWT cookie:** On login/register the backend sets an **httpOnly, secure (in production), sameSite** cookie in addition to returning the token in the JSON body. This allows auth to work over HTTPS with credentials.
- **Cookie name:** `token` (same as `req.cookies.token` in auth middleware).
- **Logout:** `POST /api/auth/logout` clears the cookie; frontend also clears `localStorage` and calls this endpoint.
- **Duplicate submit:** Login and Register forms use a `submittingRef` guard and `disabled={loading}` so repeated clicks do not send multiple requests. Backend still returns `400` for duplicate email (MongoDB `11000`).

**Why:** Cookies are sent automatically with `withCredentials: true`; the backend accepts token from either `Authorization` header or `Cookie`, so auth works whether the frontend uses localStorage or the cookie.

---

## 4. Frontend (API & Redirects)

**Fixes applied:**

- **Axios:** `withCredentials: true` on the API client so cookies are sent on cross-origin HTTPS requests.
- **Token:** Request interceptor sends `Authorization: Bearer <token>` from `localStorage` when present; cookie is sent automatically.
- **401 handling:** On 401, token is removed from `localStorage` and user is redirected to `/login` only when not already on a public route (`/`, `/home`, `/login`, `/register`).
- **Redirect after login/register:** Existing `useEffect` that watches `isAuthenticated` and calls `navigate('/app/dashboard')` is unchanged.
- **Session restore:** On app load, `getMe()` is always dispatched once so that cookie-only auth (e.g. after clearing localStorage) still restores the user.
- **Analytics:** `trackEvent` and session-end use `VITE_API_URL` as base URL so production requests hit the backend over HTTPS instead of relative `/api/...`.

**Production:** Set `VITE_API_URL=https://api.yourdomain.com/api` and `VITE_SOCKET_URL=https://api.yourdomain.com` in the client build env (e.g. `.env.production` or CI).

---

## 5. Debugging & Common Errors

| Error | Cause | Fix |
|-------|--------|-----|
| **Invalid email/password** | Wrong credentials or user not found. | Check email/password; ensure user exists and password hash matches. |
| **Token expired** | JWT past `JWT_EXPIRES_IN`. | User must log in again; optionally increase `JWT_EXPIRES_IN` (e.g. `7d`). |
| **Database connection error** | Wrong `MONGODB_URI`, network, or Atlas IP allowlist. | Verify URI, network, and Atlas “Network Access” allowlist (e.g. `0.0.0.0/0` for VPS). |
| **Not allowed by CORS** | Frontend origin not in `CLIENT_URL`. | Add the exact frontend origin (e.g. `https://yansytech.com`) to `CLIENT_URL`. |
| **401 on protected routes** | No token/cookie or invalid/expired token. | Ensure login sets cookie and/or localStorage; use HTTPS so secure cookies work; clear cache/cookies and log in again. |

**Logging:** Backend uses `console.error` for auth and DB errors; ensure `NODE_ENV=production` and log aggregation is configured on the server.

---

## 6. Environment Variables

### Backend (server `.env`)

```env
PORT=5000
NODE_ENV=production

# Prefer MONGODB_URI; MONGO_URI also supported
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/yansy?retryWrites=true&w=majority

JWT_SECRET=<strong-secret e.g. openssl rand -base64 32>
JWT_EXPIRES_IN=7d

# Exact frontend origin(s), comma-separated
CLIENT_URL=https://yansytech.com
```

### Frontend (build / `.env.production`)

```env
VITE_API_URL=https://api.yansytech.com/api
VITE_SOCKET_URL=https://api.yansytech.com
```

---

## 7. Cache & Cookies

If users see old behavior or auth issues after deployment:

1. **Hard refresh:** Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).
2. **Clear site data:** DevTools → Application → Storage → “Clear site data” (or clear cookies and localStorage for the site).
3. **Log out and log in again** so a new JWT and cookie are set with the correct domain and flags.

---

## 8. Checklist Before Go-Live

- [ ] Backend `.env`: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (HTTPS frontend URL).
- [ ] Frontend build env: `VITE_API_URL` and `VITE_SOCKET_URL` point to backend over HTTPS.
- [ ] CORS: `CLIENT_URL` includes the exact frontend origin (no trailing slash).
- [ ] MongoDB Atlas (if used): Network Access allows your server IP (or `0.0.0.0/0` for testing).
- [ ] HTTPS: Backend and frontend both served over HTTPS so secure cookies work.
- [ ] After deploy: Test login, register, protected routes, and logout; clear cookies/cache if needed.
