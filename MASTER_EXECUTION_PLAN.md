# YANSY — MASTER EXECUTION PLAN
> CTO Mode | Full Platform Evolution
> Started: 2026-05-29

---

## CURRENT STATE SUMMARY

YANSY is a premium digital-agency client portal with a strong visual foundation. Most core features exist but several are broken, faked, or missing critical business logic. The platform is NOT production-ready in current state.

### What Works
- Auth (JWT, httpOnly cookies, login/register/logout)
- Project CRUD + real-time Socket.IO updates
- Messaging threads
- Feedback/review system
- Notifications (model, controller, frontend)
- Portfolio management
- Analytics tracking events
- Admin dashboard
- Bilingual EN/AR with RTL support

### What Is Broken or Missing
- File uploads → STUB ONLY — fake URLs, nothing is stored
- Email system → COMPLETELY ABSENT
- Password reset → NO UI, NO API, NO EMAIL
- Covert beacon code in analyticsController.js → SECURITY CRITICAL
- Admin role check bug in fileController.js (`'admin'` vs `'ADMIN'`)
- CORS hardcoded in server entry instead of using env variable
- No helmet.js security headers
- No global rate limiting on auth routes
- No input sanitization against NoSQL injection
- No search functionality
- No audit log
- No invoice/billing system
- No subscription tiers

---

## EXECUTION PHASES

### PHASE 0 — SECURITY (Executing)
- [x] Remove covert beacon code from analyticsController.js
- [x] Fix admin role check bug in fileController.js
- [x] Create proper server.js with helmet, compression, mongo-sanitize
- [x] Add global rate limiting with express-rate-limit
- [x] Fix CORS to use env variable properly
- [x] Update package.json with all new dependencies

### PHASE 1 — CRITICAL FIXES (Executing)
- [x] Implement Cloudinary file uploads (real, functional)
- [x] Email service (Nodemailer) — all transactional emails
- [x] Password reset flow (API + frontend page)
- [x] Add AuditLog model
- [x] Add password reset fields to User model

### PHASE 2 — ENTERPRISE FEATURES (Executing)
- [x] Global search endpoint
- [x] Audit log model + controller + routes
- [x] Invoice model + controller + routes
- [x] Subscription/Plan model
- [x] Enhanced admin routes (stats, audit, system health)
- [x] Activity timeline per project

### PHASE 3 — FRONTEND IMPROVEMENTS (Executing)
- [x] ForgotPassword page
- [x] ResetPassword page
- [x] Search UI (global command palette)
- [x] InvoiceList page
- [x] Enhanced admin pages

### PHASE 4 — ARCHITECTURE HARDENING (Planned)
- [ ] TypeScript migration plan
- [ ] Redis caching layer
- [ ] API versioning /api/v1/

---

## DEPENDENCY MAP

New npm packages required (server):
- helmet
- express-rate-limit
- express-mongo-sanitize
- compression
- nodemailer
- cloudinary

New npm packages required (client):
- None (using existing stack)

**Run after code changes:**
```bash
cd server && npm install helmet express-rate-limit express-mongo-sanitize compression nodemailer cloudinary
```

---

## RISK ANALYSIS

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Breaking existing auth flow during security hardening | Low | High | JWT in both cookie+localStorage maintained during transition |
| Cloudinary credentials not configured | Medium | Medium | Graceful fallback to local storage with warning |
| Email credentials not configured | Medium | Low | Fail silently, log to console, never block user actions |
| MongoDB queries breaking after mongo-sanitize | Low | Medium | sanitize only removes `$` and `.` from keys, won't affect normal queries |

---

*This document is updated as execution progresses.*
