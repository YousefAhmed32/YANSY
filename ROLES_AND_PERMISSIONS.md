# YANSY Tech — Roles & Permissions (Authorization System) Reference

**Scope:** This document describes the authorization system as it actually exists in the codebase as of 2026-07-30. It was produced by inspecting `server/models/User.js`, `server/middleware/auth.js`, `server/middleware/requirePlan.js`, `server/middleware/aiRateLimit.js`, `server/middleware/rateLimit.js`, all 22 files in `server/routes/`, all 18 files in `server/controllers/`, `server/server.js`, and the relevant client-side route guards under `client/src/`. Every claim below is tied to a file and, where practical, a line number. Nothing here is aspirational — if a capability isn't wired into code, it is explicitly called out as absent.

---

# Roles Overview

The system has exactly **four roles**, defined as a single enum field on the User model (`server/models/User.js:47-51`):

```js
role: {
  type: String,
  enum: ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  default: 'USER',
},
```

- **Guest** — unauthenticated visitor. Not a stored role; the absence of a valid JWT. Can reach only routes with no `authenticate` middleware.
- **USER** (`role: 'USER'`) — the default role for everyone who registers. This is the app's "Client" — every project, invoice, message thread etc. is owned by a `USER`. There is no separate `Client` role/document; "Client" is a UI/business term for a `USER` account, not a distinct value.
- **MANAGER** (`role: 'MANAGER'`) — defined in the schema and given real read-oriented permissions in the server-side permission matrix (`server/middleware/auth.js:9-27`), but **has no functional path on the frontend** (see Security Review) and is not used as an exact-match check anywhere in a route or controller. It only ever qualifies implicitly through hierarchy comparisons.
- **ADMIN** (`role: 'ADMIN'`) — staff role. Gated by `requireAdmin`/`requireRole('ADMIN')`/most `requirePermission(...)` checks. Can manage clients, projects, content, billing configuration, and most operational admin surfaces.
- **SUPER_ADMIN** (`role: 'SUPER_ADMIN'`) — highest role. Exclusively holds `users.impersonate` and `system.configure` in the permission matrix, and is the only role allowed to promote another user to `SUPER_ADMIN` (via the correctly-guarded endpoint — see Security Review for the endpoint that does **not** enforce this).

**Not RBAC roles** (surfaced by repo-wide grep for "role" — noted here only to avoid confusion in future audits):
- `role: 'user' | 'assistant' | 'system'` — LLM chat-message role used throughout `aiController.js` / `supportController.js` (OpenAI/Anthropic message format).
- `role` / `roleAr` in `PortfolioProject.js` — a testimonial/team member's job title (e.g. "CEO"), free text, unrelated to RBAC.
- `'SUPERUSER'` — appears once, only in `server/__tests__/phase5.test.js:263`, as a deliberately-invalid value used to test that `changeRole` rejects unknown roles. Not a real role.

**Role hierarchy** (`server/middleware/auth.js:6`):
```js
const ROLE_HIERARCHY = { USER: 0, MANAGER: 1, ADMIN: 2, SUPER_ADMIN: 3 };
```
Authorization checks are hierarchical (`userLevel >= requiredLevel`), so `SUPER_ADMIN` passes any `ADMIN`/`MANAGER`/`USER` gate, and `ADMIN` passes any `MANAGER`/`USER` gate — **except** in three specific places that compare `role === 'ADMIN'` by strict string equality instead of hierarchy (see Security Review §3).

---

# Role Comparison

| Feature | Guest | USER (Client) | MANAGER | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Client Dashboard (`/app/*`) | ❌ | ✅ | Backend-only¹ | ✅ | ✅ |
| Admin Dashboard (`/admin/*`) | ❌ | ❌ | Backend-only¹ | ✅ | ✅ |
| View/manage own profile, password, own account deletion | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create project request / submit AI lead | ✅ (public forms) | ✅ | ✅ | ✅ | ✅ |
| View own projects/invoices/messages | ❌ | ✅ | ✅ | ✅ | ✅ |
| View **all** projects/users (`users.view`, `projects.view.all`) | ❌ | ❌ | ✅ (perm only) | ✅ | ✅ |
| Edit/assign projects, post project updates | ❌ | ❌ | ✅ (perm only, not wired) | ✅ | ✅ |
| Delete projects (`projects.delete`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit users (`users.edit`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Change a user's role to USER/MANAGER/ADMIN | ❌ | ❌ | ❌ | ✅ | ✅ |
| Change a user's role to **SUPER_ADMIN** | ❌ | ❌ | ❌ | ❌ (blocked in `changeRole`, **not blocked in `updateUser`** — see Security Review) | ✅ |
| Delete users (`users.delete`) | ❌ | ❌ | ❌ | ✅ (**no target-role check** — can delete a SUPER_ADMIN) | ✅ |
| Suspend/activate users | ❌ | ❌ | ❌ | ✅ (**no target-role check**) | ✅ |
| Impersonate a user (`users.impersonate`) | ❌ | ❌ | ❌ | ❌ | ✅ (exclusive) |
| Export users to CSV | ❌ | ❌ | ❌ | ✅ | ✅ |
| View billing / invoices (own) | ❌ | ✅ (own only) | ✅ (perm only) | ✅ (all) | ✅ (all) |
| Manage billing (plans, pricing, admin subscription views, revenue) | ❌ | ❌ | ❌ | ✅ | ✅ |
| View settings (`settings.view`) | ❌ | ❌ | ✅ (perm only) | ✅ | ✅ |
| Edit settings (`settings.edit`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Seed default settings / system configure (`system.configure`) | ❌ | ❌ | ❌ | ❌ | ✅ (exclusive) |
| AI settings / unlimited AI usage | ❌ | ❌ (plan-limited) | ❌ (plan-limited) | ✅ (unlimited, bypasses plan gate) | Plan-gated in 3 checks that literally compare `=== 'ADMIN'` (see Security Review) |
| View audit log | ❌ | ❌ | Matrix says yes, route enforces `requireAdmin` so **no** in practice | ✅ | ✅ |
| Manage feedback/testimonials | ❌ | ❌ | ❌ | ✅ | ✅ |
| Broadcast notifications | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage portfolio, intro video, homepage video, client logos, start-project CMS | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage support KB, tickets, escalations, CRM leads | ❌ | ❌ | ❌ | ✅ | ✅ |

¹ MANAGER is a real, permission-bearing role server-side, but the frontend (`ProtectedRoute`, `Layout`, `Sidebar` — see Security Review) treats anyone who is not `ADMIN`/`SUPER_ADMIN` as a plain client. A MANAGER account is redirected out of every `/admin/*` page and shown the client nav, so its backend permissions are currently unreachable through the UI.

---

# Permissions Matrix

Source of truth: `server/middleware/auth.js:9-27` (the `PERMISSIONS` object), consumed by `requirePermission(permission)` and the `hasPermission(user, permission)` utility. A permission is granted to a role if `ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRoleForThatPermission]`.

| Permission | Description | Roles that hold it | Wired via `requirePermission(...)` in routes? | Enforcement file(s) |
|---|---|---|---|---|
| `projects.view.all` | View all clients' projects, not just own | MANAGER, ADMIN, SUPER_ADMIN | **No** — not referenced by any route. Equivalent behavior is done inline in `projectController.getAllProjects` (`server/controllers/projectController.js:15`, `if (req.user.role === 'USER') query.client = req.user._id;`) and the route itself only has `authenticate` (`server/routes/projects.js`) | `server/controllers/projectController.js:15` |
| `projects.edit` | Edit any project | MANAGER, ADMIN, SUPER_ADMIN | **No** — `PATCH /api/projects/:id` route only has `authenticate`; `projectController.updateProject` does inline ownership/role branching instead | `server/controllers/projectController.js` (updateProject) |
| `projects.delete` | Delete a project | ADMIN, SUPER_ADMIN | **No** — route uses `requireAdmin` directly (`server/routes/projects.js`) | `server/routes/projects.js` |
| `users.view` | View user list / user detail / client details | MANAGER, ADMIN, SUPER_ADMIN | **Yes** | `server/routes/users.js:14-16` |
| `users.edit` | Edit a user's profile fields and role | ADMIN, SUPER_ADMIN | **Yes** | `server/routes/users.js:17-19` |
| `users.delete` | Delete a user account | ADMIN, SUPER_ADMIN | **Yes** | `server/routes/users.js:21` |
| `users.impersonate` | Log in as another user (1-hour token) | SUPER_ADMIN only | **Yes** | `server/routes/users.js:20` |
| `users.export` | Export the user list to CSV | ADMIN, SUPER_ADMIN | **Yes** | `server/routes/users.js:13` |
| `billing.view` | View billing/subscription data | MANAGER, ADMIN, SUPER_ADMIN | **No** — all `/api/billing/admin/*` routes use `requireAdmin` directly | `server/routes/billing.js` |
| `billing.manage` | Change plans, pricing, cancel/reactivate on behalf of a user | ADMIN, SUPER_ADMIN | **No** — same, `requireAdmin` used directly | `server/routes/billing.js` |
| `settings.view` | Read system settings | MANAGER, ADMIN, SUPER_ADMIN | **Yes** | `server/routes/settings.js:11,17` |
| `settings.edit` | Change system settings | ADMIN, SUPER_ADMIN | **Yes** | `server/routes/settings.js:12-13` |
| `system.configure` | Seed/reset system configuration | SUPER_ADMIN only | **No** — the one place this would apply (`POST /api/admin/settings/seed`) instead uses `requireSuperAdmin` directly (`server/routes/settings.js:14`), which is equivalent in effect but bypasses the named permission | `server/routes/settings.js:14` |
| `ai.configure` | Configure AI/chat behavior | ADMIN, SUPER_ADMIN | **No** — AI settings are edited through the generic `settings.edit`-gated `SystemSettings` endpoints, not a dedicated AI route | `server/controllers/settingsController.js` |
| `audit.view` | View audit log | MANAGER, ADMIN, SUPER_ADMIN | **No** — `server/routes/audit.js` uses `requireAdmin` directly, so despite the matrix listing MANAGER, MANAGER is actually **blocked** from `/api/audit/*` in practice | `server/routes/audit.js` |
| `feedback.manage` | View/moderate feedback & testimonials | ADMIN, SUPER_ADMIN | **No** — `server/routes/feedback.js` uses `requireAdmin` directly | `server/routes/feedback.js` |
| `notifications.broadcast` | Send a notification to many users at once | ADMIN, SUPER_ADMIN | **Yes** | `server/routes/notifications.js:18` |

**Finding:** 8 of the 16 permissions in the matrix (`projects.view.all`, `projects.edit`, `projects.delete`, `billing.view`, `billing.manage`, `system.configure`, `ai.configure`, `audit.view`, `feedback.manage`) are never actually referenced by `requirePermission(...)` anywhere in `server/routes/`. Those areas are instead gated with the coarser `requireAdmin`/`requireSuperAdmin` role checks, or with inline controller logic. The matrix is a real, exported, hierarchy-aware system — but roughly half of it is unused documentation rather than active enforcement. This particularly matters for `audit.view`, which the matrix implies MANAGER can use, but which is actually ADMIN-only at the route.

---

# Middleware Analysis

All middleware lives in `server/middleware/`. Only `auth.js`, `requirePlan.js`, `aiRateLimit.js`, and `rateLimit.js` contain authorization-relevant logic; `sanitize.js`, `errorHandler.js`, and `analytics.js` do not perform any role/permission checks.

### `server/middleware/auth.js`

| Function | What it checks | Roles allowed | Used on |
|---|---|---|---|
| `authenticate` | Reads JWT from `Authorization: Bearer` header or `req.cookies.token`; verifies with `JWT_SECRET`; loads `User.findById(decoded.userId)`; rejects if user missing or `!user.isActive`; sets `req.user` and `req.impersonatedBy` | Any valid, active account | Every protected route in the app (the universal first gate) |
| `requireRole(...roles)` | Hierarchical: `ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY[role]` for any listed role | Configurable | Base for `requireAdmin`/`requireSuperAdmin`/`requireManager` |
| `requireAdmin` | `= requireRole('ADMIN')` | ADMIN, SUPER_ADMIN (via hierarchy) | ~14 route files: `analytics.js`, `ai.js` (admin endpoints), `audit.js`, `billing.js` (admin endpoints), `clientLogos.routes.js`, `feedback.js`, `intro.routes.js`, `homepageVideo.routes.js`, `invoices.js` (mutations/stats), `portfolio.routes.js`, `projectRequests.js` (admin endpoints), `projects.js` (delete/updates), `reports.js`, `support.js` (all `admin/*`), `startProject.routes.js` |
| `requireSuperAdmin` | `= requireRole('SUPER_ADMIN')` | SUPER_ADMIN only | `server/routes/settings.js:14` (`POST /seed`) — the **only** route in the entire app gated this way |
| `requireManager` | `= requireRole('MANAGER')` | MANAGER+ | Exported but **never imported by any route file** — dead code at the routing layer |
| `requirePermission(permission)` | Looks up `PERMISSIONS[permission]`, same hierarchical comparison | Per-permission | `server/routes/users.js`, `server/routes/settings.js`, `server/routes/notifications.js:18` |
| `hasPermission(user, permission)` | Non-middleware boolean utility, same logic | Per-permission | Not found in use in any controller during this audit (exported, unused) |

### `server/middleware/requirePlan.js` — billing-tier gate, not RBAC, but role-aware

- `requirePlan(...plans)` — hierarchical Stripe plan check (`FREE < PROFESSIONAL < ENTERPRISE`); returns `402` on failure. **Line 20: `if (req.user.role === 'ADMIN') return next();`** — bypasses the plan check entirely, but only for the literal string `'ADMIN'`, not via `ROLE_HIERARCHY`, so `SUPER_ADMIN` does **not** automatically get this bypass (see Security Review).
- `requireFeature(featureName)` — same `role === 'ADMIN'` bypass (line 88), checks a plan's feature-flag map instead of a tier.
- Used on: `server/routes/ai.js` (`/brief`, `/estimate`, `/proposal`, `/project-summary`, `/message-summary` — all require `PROFESSIONAL`+).

### `server/middleware/aiRateLimit.js` — daily AI quota, role-aware

- Enforces `DAILY_LIMITS = { FREE: 0, PROFESSIONAL: 20 (env-overridable), ENTERPRISE: 100 (env-overridable) }` against `AIUsage.dailyCount`.
- **Line 21: `if (req.user.role === 'ADMIN') return next();`** — same literal-string bypass pattern as `requirePlan`.
- Used on: `server/routes/ai.js` (`/insight` and all plan-gated AI endpoints).

### `server/middleware/rateLimit.js` — IP-based anti-abuse, mostly role-blind

- `rateLimitFeedback` (3/hr), `rateLimitLeadSubmission` (10/hr), `rateLimitAIChat` (30/hr) — in-memory per-IP sliding windows.
- All three **skip entirely when `req.user` is set** (`if (req.user) return next();`) — this is "authenticated vs. anonymous," not role-differentiated; any logged-in user of any role bypasses these limiters.
- Used on: `server/routes/feedback.js` (POST /), `server/routes/projectRequests.js` (`/submit`, `/ai-lead`), `server/routes/ai.js` (`/chat`).

### Not authorization middleware (confirmed, no role logic)
- `sanitize.js` — XSS stripping on `req.body`/`req.query`.
- `errorHandler.js` — maps thrown errors (Mongoose validation, cast errors, JWT errors) to HTTP status codes.
- `analytics.js` — page-view/session tracking; records `userId: req.user?._id` opportunistically but makes no access-control decision.

---

# Protected Routes

Server entry point: `server/server.js`. Router mounting (`server/server.js:301-324`):

```js
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/intro', introRoutes);
app.use('/api/homepage-video', homepageVideoRoutes);
app.use('/api/client-logos', clientLogosRoutes);
app.use('/api/start-project', startProjectRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/support', supportRoutes);
```
One route bypasses its router entirely (`server/server.js:158`, mounted before `express.json()` so Stripe's raw body reaches the signature verifier): `POST /api/billing/webhook`, no auth (Stripe signature verified inside the handler).

Below: every route, grouped by resource. "Required Role" reflects the effective minimum given hierarchy; "Permission" is the named permission where `requirePermission` is used, otherwise "—".

### Auth (`/api/auth`) — mostly public by design

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`, `/verify-email/:token`, `/google` | various | Guest (public) | — |
| `/me` | GET | Any authenticated | — |
| `/resend-verification` | POST | Any authenticated | — |

### Users (`/api/users`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/profile`, `/onboarding`, `/change-password`, `/me` (delete) | PUT/POST/DELETE | Any authenticated (self) | — |
| `/export` | GET | ADMIN+ | `users.export` |
| `/` | GET | MANAGER+ | `users.view` |
| `/:id`, `/:id/client-details` | GET | MANAGER+ | `users.view` |
| `/:id` | PATCH | ADMIN+ | `users.edit` (⚠ see Security Review — no target-role restriction) |
| `/:id/role` | PATCH | ADMIN+ (SUPER_ADMIN required to *grant* SUPER_ADMIN, enforced in controller) | `users.edit` |
| `/:id/toggle-status` | PATCH | ADMIN+ | `users.edit` (⚠ no target-role check) |
| `/:id/impersonate` | POST | SUPER_ADMIN only | `users.impersonate` |
| `/:id` | DELETE | ADMIN+ | `users.delete` (⚠ no target-role check) |

### Projects (`/api/projects`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/`, `/:id` | GET | Any authenticated (scoped to own if USER, inline in controller) | — |
| `/` | POST | Any authenticated | — |
| `/:id` | PATCH | Any authenticated (⚠ no route-level admin/ownership gate — enforced only inside `projectController.updateProject`) | — |
| `/:id/updates` | POST | ADMIN+ | — |
| `/:id/files` | POST | Any authenticated (ownership check in controller) | — |
| `/:id` | DELETE | ADMIN+ | — |

### Project Requests (`/api/project-requests`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/submit`, `/ai-lead` | POST | Guest (public, IP rate-limited) | — |
| `/create`, `/my-requests` | POST/GET | Any authenticated | — |
| `/`, `/stats`, `/:id` | GET | ADMIN+ | — |
| `/:id/status` | PATCH | ADMIN+ | — |
| `/:id` | DELETE | ADMIN+ | — |

### Messages (`/api/messages`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/threads/search`, `/threads`, `/threads/:id`, `/projects/:projectId/thread` | GET | Any authenticated (visibility scoped to participants; admins see all — inline check) | — |
| `/threads`, `/threads/:id/messages` | POST | Any authenticated | — |
| `/threads/:id/status`, `/:id/archive` | PATCH | Any authenticated at route level; participant-or-admin enforced inline | — |
| `/threads/:id/priority`, `/:id/pin`, `/:id/assign` | PATCH | **ADMIN+ enforced only inline in the controller** — route itself has no `requireAdmin` | — |

### Files (`/api/files`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/upload`, `/` | POST/GET | Any authenticated (scoped to own/project files inline) | — |
| `/:id` | GET | Any authenticated (ownership check inline) | — |
| `/:id` | DELETE | Owner or ADMIN (inline check: `file.uploadedBy !== req.user._id && req.user.role !== 'ADMIN'`) | — |

### Invoices (`/api/invoices`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/`, `/:id` | GET | Any authenticated (USER scoped to own client invoices inline) | — |
| `/stats` | GET | ADMIN+ | — |
| `/` | POST | ADMIN+ | — |
| `/:id` | PATCH | ADMIN+ | — |
| `/:id/send` | POST | ADMIN+ | — |
| `/:id` | DELETE | ADMIN+ | — |

### Billing (`/api/billing`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/plans` | GET | Guest (public) | — |
| `/webhook` | POST | None — Stripe signature only (mounted in `server.js`, not this router) | — |
| `/subscription`, `/history`, `/checkout`, `/portal`, `/cancel`, `/reactivate`, `/invoice/:id/checkout` | various | Any authenticated (own account) | — |
| `/admin/subscriptions`, `/admin/revenue`, `/admin/financial-stats` | GET | ADMIN+ | — |
| `/admin/plans/seed` | POST | ADMIN+ | — |
| `/admin/plans/:planId` | PATCH | ADMIN+ | — |
| `/admin/:userId/plan` | PATCH | ADMIN+ | — |

### Portfolio, Intro, Homepage Video, Client Logos, Start Project (public CMS)

All five follow the same pattern: public read routes (`GET /`, `GET /settings`, `GET /meta`, plus analytics-beacon `POST /event`), and every `admin*`/`.../admin/*` route gated `authenticate + requireAdmin`. Mutating admin routes include media uploads (multer memory storage; portfolio 60MB, homepage-video 120MB, intro 120MB, client-logos 5MB) — all still gated `requireAdmin`, no additional file-owner concept since these are all site-content, not user data.

| File | Public routes | Admin routes (all `requireAdmin`) |
|---|---|---|
| `portfolio.routes.js` (`/api/portfolio`) | `GET /`, `GET /meta`, `GET /:idOrSlug`, `GET /:id/related` | `GET/POST /admin`, `GET/PUT/DELETE /admin/:id`, `POST/DELETE /admin/media`, `POST /admin/:id/duplicate`, `PATCH /admin/:id/status`, `PATCH /admin/reorder`, `POST /admin/bulk` |
| `intro.routes.js` (`/api/intro`) | `GET /settings`, `POST /event` | `GET/PUT /admin`, `POST/DELETE /admin/video` |
| `homepageVideo.routes.js` (`/api/homepage-video`) | `GET /settings`, `POST /event` | `GET/PUT /admin`, `POST/DELETE /admin/video`, `POST/DELETE /admin/poster` |
| `clientLogos.routes.js` (`/api/client-logos`) | `GET /` | `GET/PUT /admin/settings`, `GET/POST /admin`, `POST/DELETE /admin/media`, `PATCH /admin/reorder`, `PATCH /admin/:id/toggle`, `PUT/DELETE /admin/:id` |
| `startProject.routes.js` (`/api/start-project`) | `GET /settings`, `POST /event` | `GET/PUT /admin` |

### Feedback (`/api/feedback`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/` | POST | Guest (public, IP rate-limited) | — |
| `/testimonials` | GET | Guest (public) | — |
| `/my-projects` | GET | Any authenticated | — |
| `/`, `/stats`, `/:id` | GET | ADMIN+ | — |
| `/:id` | PATCH | ADMIN+ | — |

### Notifications (`/api/notifications`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/`, `/:id/read`, `/read-all`, `/:id` (delete) | GET/PATCH/DELETE | Any authenticated (scoped to `req.user._id` in the query) | — |
| `/broadcast` | POST | ADMIN+ | `notifications.broadcast` |

### Activity (`/api/activity`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/` | GET | Any authenticated (own activity) | — |
| `/user/:userId` | GET | **ADMIN+ enforced only inline in the controller** — route has only `authenticate` | — |

### Audit (`/api/audit`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/`, `/actions`, `/stats` | GET | ADMIN+ | — |

### Search (`/api/search`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/` | GET | Any authenticated (results scoped by role inline; `users` category ADMIN-only) | — |

### AI (`/api/ai`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/chat` | POST | Guest (public, IP rate-limited) | — |
| `/insight` | POST | Any authenticated (AI quota applies) | — |
| `/brief`, `/estimate`, `/proposal`, `/project-summary`, `/message-summary` | POST | Any authenticated + PROFESSIONAL plan (ADMIN bypasses) | — |
| `/onboarding` | POST | Any authenticated (no plan gate) | — |
| `/usage/me` | GET | Any authenticated | — |
| `/admin/insights`, `/admin/usage` | GET | ADMIN+ | — |

### Settings (`/api/admin/settings`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/public` | GET | Guest (public) | — |
| `/`, `/health` | GET | MANAGER+ | `settings.view` |
| `/:key`, `/` | PATCH | ADMIN+ | `settings.edit` |
| `/seed` | POST | **SUPER_ADMIN only** | — |

### Reports (`/api/reports`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/` | POST | Any authenticated | — |
| `/`, `/stats` | GET | ADMIN+ | — |
| `/:id` | PATCH | ADMIN+ | — |
| `/:id` | DELETE | ADMIN+ | — |

### Support (`/api/support`) — largest surface, public AI chat + admin CRM

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/chat`, `/config`, `/upload`, `/analyze-url`, `/tts`, `/generate-document` | POST/GET | Guest (public, IP rate-limited; `chatLimiter`/`heavyLimiter` disabled in dev) | — |
| `/conversation/:sessionId` | GET | **Guest (public — no auth, session-ID-only access; exposes any PII a lead entered in that chat)** | — |
| `/my-conversation` | GET | Any authenticated (own conversation) | — |
| `/admin/knowledge` (GET/POST), `/admin/knowledge/:id` (PATCH/DELETE) | various | ADMIN+ | — |
| `/admin/analytics`, `/admin/cost-analytics`, `/admin/conversations`, `/admin/conversation/:id`, `/admin/leads`, `/admin/escalations`, `/admin/tickets`, `/admin/ticket/:id`, `/admin/requests`, `/admin/request/:id` | GET/PATCH | ADMIN+ | — |

### Analytics (`/api/analytics`)

| Route | Method | Required Role | Permission |
|---|---|---|---|
| `/events`, `/sessions/end` | POST | Guest (public beacon) | — |
| `/dashboard`, `/visitors`, `/realtime`, `/geography`, `/sources`, `/devices`, `/pages/detail`, `/conversions` | GET | ADMIN+ | — |

**Total protected/public routes catalogued: ~119** across the 22 route files plus the one server.js-mounted webhook.

---

# Admin Capabilities

An `ADMIN` account can, in addition to everything a `USER` can do for their own data:

- **Users**: view all users, view any user's client details/project history, edit any user's profile fields and (via `updateUser`) even their role, export the full user list to CSV, delete any user (except themselves and, in practice, except when blocked by nothing else — see Security Review), suspend/reactivate any user.
- **Projects**: view/edit/delete any project, post admin-authored project updates, change project status/progress, create a project on behalf of any client.
- **Project requests / leads**: view all inbound requests and stats, change request status, delete requests.
- **Messaging**: see and act on every message thread (not just their own), assign/pin/prioritize/archive any thread.
- **Invoicing & billing**: create/edit/send/delete invoices for any client, view revenue and financial stats, view/change any user's subscription plan, seed/update plan pricing.
- **Content/CMS**: full CRUD on portfolio projects and media, homepage showcase video, intro splash video, client logos, start-project settings.
- **Feedback**: view all feedback/testimonials, moderate/update them.
- **Notifications**: broadcast a notification to a filtered set of users by role.
- **Reports**: view/update/delete user-submitted reports and stats.
- **Support/CRM**: full access to the AI support knowledge base (CRUD), conversation transcripts, cost analytics, leads, escalations, tickets, and project requests captured through the AI concierge.
- **Analytics**: full site analytics dashboard (visitors, realtime, geography, traffic sources, devices, page performance, conversions).
- **Settings**: view and edit system settings (excluding the one-off `/seed` endpoint), including AI/chat configuration stored as `SystemSettings`.
- **Audit log**: view all audit log entries, actions, and stats.
- **AI usage**: unlimited AI calls and no plan/billing gate on AI features (`requirePlan`/`requireFeature`/`aiRateLimit` all exempt `role === 'ADMIN'`).
- **De facto (bug, not designed capability)**: promote any user — including themselves — to `SUPER_ADMIN`, delete a `SUPER_ADMIN` account, and suspend a `SUPER_ADMIN` account. See Security Review; this is not an intended Admin capability, it's the absence of a check.

# Super Admin Capabilities

Everything an `ADMIN` can do, **plus** the two capabilities exclusively reserved by the permission matrix:

- **Impersonate any user** (`users.impersonate`, `POST /api/users/:id/impersonate`) — issues a 1-hour JWT for the target account carrying `impersonatedBy: <super admin's id>`, which `authenticate` propagates as `req.impersonatedBy` so every subsequent `audit()` call during the impersonated session records the real actor.
- **Seed/reset system settings** (`POST /api/admin/settings/seed`) — the only route in the codebase gated by `requireSuperAdmin` directly.
- **Grant the `SUPER_ADMIN` role to another account** — the *only* correctly-implemented path for this is `PATCH /api/users/:id/role` (`userController.changeRole`), which explicitly checks `ROLE_HIERARCHY[req.user.role] >= 3` before allowing `role: 'SUPER_ADMIN'` in the request body.

**What is documented as SUPER_ADMIN-exclusive but not actually enforced as such:**
- `system.configure` permission exists in the matrix as SUPER_ADMIN-only, but no route calls `requirePermission('system.configure')` — the one place it would apply uses `requireSuperAdmin` directly instead, which happens to have the same effect but means the named permission itself is unused.
- Everywhere else, `SUPER_ADMIN` is simply "ADMIN and then some" via hierarchy — there is no separate SUPER_ADMIN-only content-management, billing, or analytics surface beyond the two items above.

---

# Security Review

### 1. Confirmed privilege-escalation bug: `PATCH /api/users/:id` lets an ADMIN grant themselves SUPER_ADMIN

`server/controllers/userController.js:159-176` (`exports.updateUser`), reachable via `server/routes/users.js:17` (`requirePermission('users.edit')` → ADMIN or SUPER_ADMIN):

```js
exports.updateUser = async (req, res, next) => {
  const { name, role, isActive, avatar } = req.body;
  const updates = {};
  if (role && req.user.role === 'ADMIN') updates.role = role;   // line 164
  const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
  res.json({ user });
};
```

This code:
- Accepts **any** string for `role` — no `validRoles` check, no `runValidators: true` on the update, so it's not even guaranteed to be blocked by the Mongoose enum.
- Has **no target-role hierarchy check** — unlike its sibling endpoint.
- Has **no self-target check** — `req.params.id` is never compared to `req.user._id`.
- Calls no `audit()` — every other mutating endpoint in this file logs to the audit trail; this one doesn't.

Compare with the correctly-implemented sibling, `PATCH /api/users/:id/role` → `exports.changeRole` (`userController.js:254-284`), which validates the role against an enum, blocks self-targeting, and explicitly requires `ROLE_HIERARCHY[req.user.role] >= 3` before allowing `SUPER_ADMIN` to be assigned, and does call `audit()`.

**Net effect**: any `ADMIN` can `PATCH /api/users/<their own id>` (or anyone else's) with `{"role": "SUPER_ADMIN"}` and it is applied, silently and unaudited. The two endpoints exist to do the same job; only one of them enforces the intended restriction. This is the single highest-severity finding in this review — it collapses the ADMIN/SUPER_ADMIN boundary entirely.

### 2. An ADMIN can delete or suspend a SUPER_ADMIN account

`exports.deleteUser` (`userController.js:228-251`) and `exports.toggleUserStatus` (`userController.js:414-440`) both check only `user._id.toString() === req.user._id.toString()` (self-targeting) before allowing the action — neither checks the **target's** role. An `ADMIN` (gated only by `users.delete` / `users.edit`, both ADMIN+) can delete or deactivate any `SUPER_ADMIN` account other than their own. Combined with finding #1, an `ADMIN` has a full path to lock out or take over the highest-privileged tier of the system.

### 3. Frontend UI does not hide the paths above, and independently exposes the same gap

- `client/src/pages/AdminRoles.jsx` renders `SUPER_ADMIN` as a selectable option in the role dropdown for any user row, with no client-side restriction based on the acting admin's own role (`RoleDropdown`, unconditional `ROLES.map(...)`). It calls the *correctly-guarded* `/role` endpoint, so this specific UI action does get a 403 server-side — but nothing in the UI signals that the sibling `/:id` endpoint (used by other parts of the app for name/avatar edits) applies the `role` field from the same request body without the same restriction.
- `client/src/pages/AdminUsers.jsx` renders a delete button on every user row unconditionally — no hiding/disabling when the target is `ADMIN`/`SUPER_ADMIN`. This directly exposes finding #2 through the UI, not just via raw API calls.
- `client/src/components/ProtectedRoute.jsx` has only one gate shape — `requireAdmin` (ADMIN or SUPER_ADMIN) — used identically for all 24 admin-area routes in `client/src/App.jsx`, including the Roles and Settings pages that server-side reserve some actions for SUPER_ADMIN only. There is no `requireSuperAdmin` variant on the frontend at all.

### 4. `role === 'ADMIN'` literal-string bypasses break the hierarchy invariant in two directions

- **SUPER_ADMIN under-privileged**: `requirePlan.js:20`, `requirePlan.js:88` (`requireFeature`), and `aiRateLimit.js:21` all bypass with `if (req.user.role === 'ADMIN')`, a strict string match rather than a `ROLE_HIERARCHY` comparison. A `SUPER_ADMIN` account does **not** get the same automatic bypass — it would fall through to plan/quota logic like a paying customer, unless it separately holds a qualifying subscription. This is the opposite-direction inconsistency from findings #1-2: here SUPER_ADMIN ends up with *fewer* effective privileges than ADMIN for AI usage and paid-feature gating.
- Same pattern in `aiController.summarizeProject` (`:325`), `aiController.summarizeMessages` (`:381`), `aiController.getMyUsage` (`:669`, `role === 'ADMIN' ? Infinity : ...`), and `searchController.globalSearch` (`:16`, `const isAdmin = req.user.role === 'ADMIN'`) — all check the literal string, excluding SUPER_ADMIN, while the rest of the codebase's convention is `role !== 'ADMIN' && role !== 'SUPER_ADMIN'`.

### 5. Inconsistent authorization idiom: two systems doing the same job differently

Most route files gate admin-only endpoints with the coarse `requireAdmin`/`requireSuperAdmin` (binary role check). Three route files (`users.js`, `settings.js`, `notifications.js`) instead use the granular `requirePermission('resource.action')` system. Both are legitimate and both are actively tested (`server/__tests__/phase5.test.js`), but 8 of the 16 defined permissions are never wired to any route (see Permissions Matrix) — meaning the permission matrix currently documents intent for `projects.*`, `billing.*`, `system.configure`, `ai.configure`, `audit.view`, and `feedback.manage` that isn't actually enforced through that mechanism; those areas fall back to `requireAdmin`, which is coarser than what the matrix implies is possible (e.g. MANAGER-level read access to audit logs and billing is modeled but unreachable).

### 6. MANAGER role has no functional path — a designed capability that doesn't work

The permission matrix gives `MANAGER` real read access (`projects.view.all`, `users.view`, `billing.view`, `settings.view`, `audit.view`). But every frontend admin gate (`ProtectedRoute`'s `requireAdmin` prop, `Layout.jsx:22`'s `isAdmin` check, `admin-ui/Sidebar.jsx:122`'s nav switch) treats "not ADMIN and not SUPER_ADMIN" as a plain client. A `MANAGER` account is redirected out of every admin page and given the 8-item client nav. There is currently no way to actually exercise the MANAGER permission tier through the product.

### 7. Endpoints that should probably require SUPER_ADMIN but currently only require ADMIN

- **`PATCH /api/users/:id`** when the body contains `role` — should either be removed (role changes only via `/role`) or should apply the exact same hierarchy/self checks as `changeRole`. **Highest priority fix.**
- **`DELETE /api/users/:id`** and **`PATCH /api/users/:id/toggle-status`** — deleting/suspending an `ADMIN` or `SUPER_ADMIN` target should require the actor to be `SUPER_ADMIN` (or at minimum outrank the target in the hierarchy), not just hold `users.delete`/`users.edit`.
- **`server/routes/settings.js` `/` and `/:key` (PATCH, `settings.edit`)** — this endpoint can rewrite `SystemSettings` broadly, including AI/chat provider configuration and (per `settingsController.getHealth`) surfaces whether `ANTHROPIC_API_KEY` etc. are configured; given the blast radius, consider whether all `settings.edit` writes should stay ADMIN+ or whether specific high-impact keys (integrations, security policy) should require SUPER_ADMIN.

### 8. Other notable, lower-severity gaps found during this audit

- `GET /api/support/conversation/:sessionId` is fully public (no `authenticate`) and returns the full chat transcript plus any lead PII (name/phone/email) collected in that session — access control is "knowledge of a session ID" only.
- No CSRF token is generated anywhere (`authController.js:29-34` has an explicit comment relying on `sameSite: 'lax'` cookies as the sole mitigation).
- No 2FA implementation exists despite a seeded settings flag (`server/seeds/settings.js:29`, `security.require2FA: false`) that suggests the feature was planned; it is not wired to any enforcement code.
- No refresh-token mechanism — a single 7-day JWT in an httpOnly cookie is the entire session model.
- JWT payload contains only `{ userId }` (`authController.js:19-22`) — role is re-fetched from MongoDB on every request. This is a good property (role changes/deactivation take effect immediately, not at token expiry) but means every authenticated request pays a DB round-trip.
- The account bootstrap mechanism ("first user to register becomes ADMIN," `authController.js:154-157` and `:472-482`) has no seed script, CLI, or env-var-driven alternative — it's the sole admin-creation path, silently active for the lifetime of the app (not just at first deploy), since the check is `userCount === 0` evaluated on every registration.
- Password length is inconsistently enforced: model minlength 6, `register` enforces 6, `resetPassword` enforces 8.

---

# Recommendations

1. **Fix the `updateUser` privilege-escalation bug immediately.** Either strip `role` out of `updateUser`'s accepted body entirely (role changes should only ever go through `changeRole`), or make `updateUser` call the exact same validation `changeRole` uses (valid-enum check, self-target block, `ROLE_HIERARCHY[actor] >= 3` before granting SUPER_ADMIN) and add an `audit()` call. This is the one finding that should block further RBAC work until resolved.
2. **Add a target-role check to `deleteUser` and `toggleUserStatus`.** A caller should not be able to delete or suspend an account that outranks them (or, arguably, any `ADMIN`/`SUPER_ADMIN` account at all unless the caller is `SUPER_ADMIN`). Mirror the `ROLE_HIERARCHY` comparison already proven out in `changeRole`.
3. **Introduce a `requireSuperAdmin`-aware frontend guard.** Add a `minRole` or `requireSuperAdmin` prop to `ProtectedRoute` and apply it to the Roles page and any Settings sub-pages that map to SUPER_ADMIN-only server actions, so the UI stops offering actions the backend will reject (and, post-fix-#1, stops offering actions the backend used to silently accept).
4. **Replace the three literal `role === 'ADMIN'` bypass checks** (`requirePlan.js:20,88`, `aiRateLimit.js:21`) and the four literal-string role checks in `aiController.js`/`searchController.js` with `ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY.ADMIN`, so `SUPER_ADMIN` consistently inherits everything `ADMIN` has, matching the convention used everywhere else in the codebase.
5. **Either wire up or retire the unused half of the permission matrix.** `projects.*`, `billing.*`, `system.configure`, `ai.configure`, `audit.view`, and `feedback.manage` are defined but never checked via `requirePermission`. If the intent is for MANAGER to eventually get scoped access to projects/billing/audit, wire the routes to `requirePermission(...)` instead of `requireAdmin`. If MANAGER-level granularity in those areas isn't actually planned, remove the unused entries so the matrix doesn't overstate what's enforced.
6. **Decide MANAGER's fate.** Either build the frontend surface for it (a MANAGER-scoped dashboard reachable through `ProtectedRoute`) or remove the role from the schema/matrix if it's not part of the near-term roadmap — a role that exists in the data model and permission system but has no reachable UI is a maintenance liability and a plausible source of future confusion (e.g. someone manually setting a user's role to MANAGER expecting elevated access that the frontend won't grant).
7. **Add authentication (or at least a scoping check) to `GET /api/support/conversation/:sessionId`.** At minimum, require the session's owner or an admin; a leaked/guessed session ID currently exposes a full chat transcript and any PII a lead typed into it.
8. **Standardize password length requirements** across the model, register, and reset-password paths (pick one minimum, likely 8, and apply it everywhere).
9. **Consider a dedicated bootstrap mechanism for the first admin** (a one-time CLI/seed script gated by an environment flag) rather than a permanent `userCount === 0` check evaluated on every registration — while currently safe in practice (the check only ever succeeds once), it's a more fragile invariant than an explicit, auditable bootstrap step, particularly if a future migration or bulk-delete ever leaves the users collection empty in production.
10. **Add `audit()` calls consistently.** `deleteUser` and `toggleUserStatus` already call `audit()`; `updateUser` does not (see finding #1) — once fixed, every user-mutating admin endpoint should log to the audit trail so role changes, deletions, and suspensions are all reconstructable after the fact.
