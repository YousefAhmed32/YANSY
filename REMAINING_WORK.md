# YANSY — Remaining Work
> Ranked by priority | Updated: 2026-05-29

---

## CRITICAL

### C1 — JWT in localStorage (XSS Vulnerability)
**File**: `client/src/store/authSlice.js` + `client/src/utils/api.js`  
**Issue**: JWT is stored in `localStorage.getItem('token')` and attached to every request header. Any XSS attack (e.g., via injected third-party script) can steal the token and impersonate the user indefinitely.  
**Fix**: Migrate fully to httpOnly cookie-based auth. Server already sets httpOnly cookie in `authController.js`. Client needs to stop reading localStorage token and rely on cookie (which axios sends automatically with `withCredentials: true`).  
**Effort**: 2-3 hours. High impact.

### C2 — No SMTP Configuration In Production
**File**: `server/.env.example`  
**Issue**: Without SMTP credentials in `.env`, all transactional emails (password reset, welcome, invoices) silently fail. Password reset is completely non-functional without email.  
**Fix**: Configure SMTP provider (Resend, SendGrid, or SMTP) in server `.env`.  
**Effort**: 15 minutes. Requires external service.

### C3 — No Cloudinary Configuration In Production
**File**: `server/.env.example`  
**Issue**: Without Cloudinary credentials, file uploads fall back to local filesystem. In production (PM2 cluster, Nginx), local filesystem is not shared across processes and the local URL format returns 404.  
**Fix**: Configure `CLOUDINARY_*` env vars.  
**Effort**: 15 minutes. Requires Cloudinary account.

---

## HIGH

### H1 — No Refresh Token System
**File**: `server/controllers/authController.js`  
**Issue**: Single JWT with 7-day expiry. Stolen token remains valid until expiry. No rotation mechanism.  
**Fix**: Add `RefreshToken` model, issue 15-minute access token + 30-day refresh token (httpOnly cookie). Add `POST /api/auth/refresh` endpoint.  
**Effort**: 4-6 hours.

### H2 — No Email Verification on Registration
**File**: `server/controllers/authController.js`  
**Issue**: Users can register with any email. No verification step. Enables:
- Fake accounts
- Email enumeration via "forgot password"
- Spam project requests
**Fix**: Add `isEmailVerified` to User model. Send verification email on register. Block access until verified.  
**Effort**: 3-4 hours.

### H3 — File Type Validation Via MIME Only
**File**: `server/controllers/fileController.js`  
**Issue**: Multer validates MIME type from client-supplied `Content-Type` header, which is attacker-controlled. A `.php` file with `Content-Type: image/jpeg` passes validation.  
**Fix**: Use `file-type` npm package to inspect actual buffer magic bytes.  
**Effort**: 1-2 hours.  
**Fix code**:
```javascript
const { fileTypeFromBuffer } = await import('file-type');
const detected = await fileTypeFromBuffer(file.buffer);
if (!detected || !allowedMimeTypes.includes(detected.mime)) {
  return cb(new Error('Invalid file type detected.'));
}
```

### H4 — No Stripe / Payment Integration
**File**: Missing entirely  
**Issue**: Invoices can be created and sent but there is no mechanism for clients to pay them. Revenue flow is broken.  
**Fix**: Integrate Stripe:
- `stripe.checkout.Session.create()` for invoice payment
- Stripe webhook to confirm payment and update invoice status
- Client payment page with Stripe Elements
**Effort**: 6-8 hours.

### H5 — No CSRF Protection
**File**: `server/server.js`  
**Issue**: Once JWT is moved to httpOnly cookies, CSRF attacks become possible. Without a CSRF token or SameSite=Strict, malicious sites can trigger authenticated requests.  
**Fix**: Add `csurf` middleware OR set `SameSite=Strict` on all cookies (already partially done — `sameSite: isProd ? 'none' : 'lax'` in authController; change to `strict`).  
**Effort**: 1-2 hours.

### H6 — Socket.IO Room Name Inconsistency  
**File**: `server/controllers/notificationController.js` vs `server/controllers/projectController.js`  
**Issue**: notificationController emits to `user_${userId}` (underscore), while projectController emits to `user:${userId}` (colon). Currently working because server.js joins both rooms, but fragile.  
**Fix**: Standardize all socket rooms to use colon convention (`user:${id}`, `project:${id}`, `thread:${id}`). Update notificationController to use `user:${userId}`.  
**Effort**: 30 minutes.

### H7 — Missing Input Validation Library
**File**: All controllers  
**Issue**: Request body validation uses ad-hoc if-checks. No schema validation, no sanitization of string lengths, no type coercion checks.  
**Fix**: Install and apply `express-validator` (already in package.json) or `zod`. Create middleware validators for each route.  
**Effort**: 6-8 hours (full coverage).

---

## MEDIUM

### M1 — timeAgo Helper Not i18n-Aware
**Files**: `client/src/pages/Dashboard.jsx:25`, `client/src/pages/AdminDashboard.jsx:19`, `client/src/components/NotificationBell.jsx:19`  
**Issue**: Returns hardcoded English: "just now", "m ago", "h ago", "d ago". Arabic users see English time strings.  
**Fix**: Move to i18n-aware relative time using `useTranslation` and add keys to `en.json`/`ar.json`. Or use `Intl.RelativeTimeFormat`.  
**Effort**: 1-2 hours.

### M2 — "AI Insight" Card Is Fake
**File**: `client/src/pages/Dashboard.jsx:231`  
**Issue**: `AIInsightCard` generates text from simple if/else logic. Labeled "AI Insight" with a sparkle icon — misleading to clients.  
**Fix**: Integrate Claude API. Add `/api/ai/insight` endpoint using `@anthropic-ai/sdk` that analyzes the user's project data and returns a real insight.  
**Effort**: 2-3 hours.

### M3 — Platform Status Hardcoded
**File**: `client/src/pages/Dashboard.jsx:781`  
**Issue**: "Platform", "Messages", "Files" status indicators always show green/Operational. No real health check is performed.  
**Fix**: Create `/api/health/detailed` endpoint that checks MongoDB ping, file storage connectivity, and Socket.IO connections. Poll from client every 60s.  
**Effort**: 2 hours.

### M4 — No Rate Limiting on Forgot-Password Endpoint
**File**: `server/routes/auth.js` + `server/server.js`  
**Issue**: `/api/auth/forgot-password` is not rate-limited. An attacker can trigger thousands of "forgot password" emails to a victim's address.  
**Fix**: Add specific rate limiter: 3 requests per hour per IP on `/api/auth/forgot-password`.  
**Effort**: 20 minutes.

### M5 — No Session Invalidation on Password Change
**File**: `server/controllers/authController.js:resetPassword`  
**Issue**: After resetting the password, all other active sessions remain valid. A compromised session token remains usable.  
**Fix**: Add `passwordChangedAt` field to User. Reject JWTs issued before `passwordChangedAt` in the auth middleware.  
**Effort**: 1-2 hours.

### M6 — No Pagination Enforcement on Message Threads
**File**: `server/controllers/messageController.js:getThreads`  
**Issue**: `MessageThread.find({ participants: req.user._id })` fetches ALL threads without pagination. A power user with 1,000 threads will cause memory issues.  
**Fix**: Add `limit` and `page` query params, default limit 20.  
**Effort**: 30 minutes.

### M7 — Missing 404 Page
**File**: `client/src/App.jsx:154`  
**Issue**: Unknown routes silently redirect to `/` (`<Navigate to="/" replace />`). Users who follow broken links see the home page with no explanation.  
**Fix**: Create `NotFound.jsx` with a branded 404 page and replace `<Navigate to="/" replace />` with `<NotFound />`.  
**Effort**: 1 hour.

### M8 — No Graceful Fallback on API Errors
**File**: Multiple client pages  
**Issue**: API errors in several pages (`catch (err) { console.error(...) }`) have no UI feedback — the page stays loading forever or shows empty state.  
**Fix**: Add error state to all pages that make API calls. Show user-friendly error message with retry option.  
**Effort**: 3-4 hours (all pages).

### M9 — Search Not Rate Limited
**File**: `server/routes/search.js`  
**Issue**: The global search endpoint runs regex queries on multiple collections simultaneously. Without rate limiting, a user could trigger hundreds of expensive queries per second.  
**Fix**: Add rate limiter: 30 requests per minute on `/api/search`.  
**Effort**: 20 minutes.

### M10 — No Gzip for Static Files (Nginx)
**File**: `deploy/nginx/yansytech.com.conf`  
**Issue**: Nginx config doesn't include `gzip_static on` or `gzip_types` for API responses. Large JSON responses (project lists, analytics) are served uncompressed.  
**Fix**: Add gzip directives to Nginx config.  
**Effort**: 15 minutes.

---

## LOW

### L1 — Inline Styles Throughout
**Files**: `AdminDashboard.jsx`, `Dashboard.jsx`, `Projects.jsx`, `Messages.jsx`, etc.  
**Issue**: 95% of styling uses large JavaScript style objects. Unmaintainable, not cached, not responsive utilities, duplicated across components.  
**Fix**: Migrate to Tailwind utility classes systematically. Extract repeated style patterns to shared constants or CSS classes.  
**Effort**: 10-20 hours (full migration).

### L2 — No Accessibility (a11y) Compliance
**Files**: Multiple components  
**Issues**:
- Many `div` elements with click handlers instead of `button`
- Missing `aria-label` on icon-only buttons
- Color contrast issues (muted text on dark backgrounds)
- Missing focus styles
- No `role` attributes on modal-like panels
**Fix**: Audit with `axe-core`. Replace interactive divs with buttons. Add aria labels.  
**Effort**: 4-6 hours.

### L3 — No PWA Support
**Issue**: No `manifest.json`, no service worker, no offline support. Users must reload on every visit.  
**Fix**: Add Vite PWA plugin. Create manifest with app icons. Add service worker for offline dashboard access.  
**Effort**: 2-3 hours.

### L4 — Mobile Navigation UX
**File**: `client/src/components/Layout.jsx`  
**Issue**: Mobile navigation uses a full-screen drawer triggered by a hamburger. No bottom tab bar for quick access on mobile.  
**Fix**: Add bottom tab bar for mobile with: Dashboard, Projects, Messages, Menu.  
**Effort**: 2-3 hours.

### L5 — No API Versioning
**File**: `server/server.js`  
**Issue**: All routes at `/api/...` with no version. Breaking changes require coordinated frontend + backend deploys with no backward compatibility.  
**Fix**: Add `/api/v1/` prefix. Old `/api/` redirects to v1. Enables gradual migration.  
**Effort**: 2 hours + route updates.

### L6 — No TypeScript
**Issue**: Zero type safety. Any refactor risks runtime errors. No IDE autocomplete for types.  
**Fix**: Incremental migration starting with models and utility functions. Add `tsconfig.json` + `.d.ts` type definitions.  
**Effort**: 15-20 hours (full coverage).

### L7 — N+1 Risk in Project Updates Population
**File**: `server/controllers/projectController.js:45`  
**Issue**: `getProjectById` populates `updates.postedBy` and `updates.attachments` for all updates. With 100+ updates, this creates N+1 queries.  
**Fix**: Use lean queries + batch population or limit updates returned to the last 20.  
**Effort**: 1 hour.

### L8 — No Structured Logging
**Files**: Multiple controllers  
**Issue**: `console.log/error` without request IDs, correlation IDs, or log levels. Impossible to trace issues in production.  
**Fix**: Install Winston or Pino. Add request ID middleware. Structured JSON logging.  
**Effort**: 2-3 hours.

### L9 — `refrance` File in Client Root
**File**: `client/refrance`  
**Issue**: Unknown unexplained file at client root. Likely a development artifact.  
**Fix**: Delete after confirming it's not needed.  
**Effort**: 5 minutes.

### L10 — No Redis Caching
**Issue**: Every dashboard request hits MongoDB. Admin dashboard fetches 4 endpoints in parallel on every load. With growing data, this becomes slow.  
**Fix**: Add Redis via `ioredis`. Cache dashboard analytics (5 min TTL), user sessions, and rate limit state.  
**Effort**: 4-6 hours.

### L11 — Duplicate timeAgo Logic
**Files**: Dashboard.jsx, AdminDashboard.jsx, NotificationBell.jsx, Messages.jsx, Projects.jsx  
**Issue**: The same `timeAgo` function is copy-pasted in 5 separate files.  
**Fix**: Create `client/src/utils/time.js` with a shared `timeAgo(date, locale)` function. Import in all files.  
**Effort**: 30 minutes.

---

## SUMMARY TABLE

| ID | Issue | Priority | Effort | Phase |
|---|---|---|---|---|
| C1 | JWT in localStorage | CRITICAL | 3h | Phase 6 |
| C2 | No SMTP configured | CRITICAL | 15m | Config |
| C3 | No Cloudinary configured | CRITICAL | 15m | Config |
| H1 | No refresh token rotation | HIGH | 5h | Phase 6 |
| H2 | No email verification | HIGH | 4h | Phase 3 |
| H3 | File type magic byte validation | HIGH | 2h | Next |
| H4 | No Stripe payment integration | HIGH | 8h | Phase 3 |
| H5 | No CSRF protection | HIGH | 2h | Phase 6 |
| H6 | Socket.IO room naming | HIGH | 30m | Next |
| H7 | No input validation library | HIGH | 8h | Phase 3 |
| M1 | timeAgo not i18n-aware | MEDIUM | 2h | Phase 7 |
| M2 | Fake AI Insight | MEDIUM | 3h | Phase 4 |
| M3 | Hardcoded platform status | MEDIUM | 2h | Phase 2.5 |
| M4 | Forgot-password no rate limit | MEDIUM | 20m | Next |
| M5 | No session invalidation | MEDIUM | 2h | Phase 6 |
| M6 | Thread pagination missing | MEDIUM | 30m | Next |
| M7 | Missing 404 page | MEDIUM | 1h | Next |
| M8 | No API error fallback UI | MEDIUM | 4h | Phase 7 |
| M9 | Search not rate limited | MEDIUM | 20m | Next |
| M10 | Nginx gzip | MEDIUM | 15m | Config |
| L1 | Inline styles | LOW | 15h | Phase 7 |
| L2 | No a11y | LOW | 5h | Phase 7 |
| L3 | No PWA | LOW | 3h | Phase 7 |
| L4 | Mobile nav | LOW | 2h | Phase 7 |
| L5 | No API versioning | LOW | 2h | Phase 6 |
| L6 | No TypeScript | LOW | 15h | Phase 6 |
| L7 | N+1 in project updates | LOW | 1h | Phase 9 |
| L8 | No structured logging | LOW | 3h | Phase 6 |
| L9 | `refrance` file | LOW | 5m | Now |
| L10 | No Redis caching | LOW | 5h | Phase 6 |
| L11 | Duplicate timeAgo | LOW | 30m | Now |

---

## NEXT IMMEDIATE ACTIONS (before Phase 3)

1. **M4** — Rate limit forgot-password (20 min)
2. **M6** — Thread pagination (30 min)
3. **M7** — 404 page (1 hour)
4. **M9** — Rate limit search (20 min)
5. **H6** — Fix socket room naming (30 min)
6. **L9** — Delete `refrance` file (5 min)
7. **L11** — Extract shared `timeAgo` util (30 min)
8. **H3** — File type magic byte validation (2 hours)

Total: ~5 hours of high-value quick wins before Phase 3.
