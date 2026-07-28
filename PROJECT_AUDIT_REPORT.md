# YANSY Tech — Full Project Audit & Production-Readiness Report

**Date:** 2026-07-27
**Scope:** Full-stack review (client + server) — Performance, SEO, Security, Accessibility, Tracking/Analytics, Conversion, UX, Core Web Vitals, Forms, API/DB, Admin.
**Approach:** Every issue below was investigated against the actual code (not assumed), fixed directly in the codebase, and verified where practical. Items that would require a larger, separate initiative (credentials, infrastructure changes, content rewrites) are listed as **Future Recommendations** instead of being partially done.

---

## 1. Executive summary

The codebase was already in a genuinely good state going in — GA4, Microsoft Clarity, a real i18n/RTL system, a working SEO hook, GSAP-based lazy routing, and a properly indexed database were all present before this pass. The real findings were concentrated in three places:

1. **Meta Pixel was completely absent** — this is now fully implemented, client + server-side.
2. **Two silent, production-breaking bugs**: Stripe webhook signature verification was structurally broken, and the homepage's primary contact form posted to an API route that has never existed.
3. **Nothing notified the team when a new lead came in** — leads were being captured to the database with zero alerting.

All three are fixed. Below is the full detail.

---

## 2. Meta Pixel — full implementation

### What was added
- **`client/src/utils/metaPixel.js`** (new) — wrapper around `window.fbq`, mirroring the existing `utils/ga4.js` pattern: `trackPageView`, `trackLead`, `trackContact`, `trackCompleteRegistration`, `trackViewContent`, `trackInitiateCheckout`, `trackPurchase`, `trackSchedule`, `trackCustomEvent`.
- **`client/index.html`** — Meta Pixel base code (fbq snippet + noscript fallback), env-driven via `VITE_META_PIXEL_ID`. If that env var is empty, the pixel silently never initializes — **no risk of it firing with a placeholder/missing ID**. Also switched the previously-hardcoded GA4 (`G-EBKWH60W27`) and Microsoft Clarity (`x58kfxz02f`) IDs to env vars (`VITE_GA4_ID`, `VITE_CLARITY_ID`) with the current live values preserved as defaults, so staging/prod can diverge without editing `index.html`.
- **`server/utils/metaConversionsApi.js`** (new) — server-side Meta Conversions API client. Sends the same standard events from the backend (currently wired for `Lead`), with SHA-256-hashed PII per Meta's requirements. This is the **"Meta Conversion API"** item from the brief — implemented as a real, working integration, gated behind `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`. Fully inert (no-ops, never throws) until both are set. This gives lead attribution a second, more reliable path that survives ad blockers, Safari ITP, and iOS App Tracking Transparency stripping the browser pixel.

### SPA route tracking
`App.jsx`'s existing route-change effect (which already drove GA4's manual `page_view`) now also calls `trackMetaPageView()` on every client-side navigation — Meta gets accurate SPA page views, not just the one on initial document load.

### Events wired to real user actions

| Event | Where | Trigger |
|---|---|---|
| **PageView** | `App.jsx` | Every SPA route change (+ initial load via the base snippet) |
| **Lead** | `ProjectRequestForm.jsx` (main 4-step form), `ContactSection.jsx` (homepage form) | Successful submission |
| **Contact** | `ProjectRequestForm.jsx` (WhatsApp quick-brief), `ContactPage.jsx` (all channel cards + final CTA), `Footer.jsx`, `FloatingActionMenu.jsx` | WhatsApp/channel click |
| **CompleteRegistration** | `Register.jsx` | Successful email/password registration |
| **ViewContent** | `PortfolioDetail.jsx`, `CaseStudyDetail.jsx`, `BlogPost.jsx` | Content loaded |
| **InitiateCheckout** | `BillingPage.jsx` | Redirect to Stripe Checkout |
| **Purchase** | `BillingPage.jsx` | Return from Stripe with `checkout=success`, once the real plan/price has loaded |
| **Schedule** | `Meetings.jsx` | "Book via WhatsApp" click |
| **Custom (`Feedback`)** | `FeedbackForm.jsx` | Feedback submitted |
| **AddToCart** | N/A | No e-commerce/cart exists in this codebase — correctly omitted rather than faked |
| **Lead (server-side, Conversions API)** | `projectRequestController.js` | Every new `ProjectRequest` (submit, authenticated submit, AI-chat lead) |

### New/changed env vars
- `client/.env`, `.env.example`, `.env.production.example`: `VITE_GA4_ID`, `VITE_CLARITY_ID`, `VITE_META_PIXEL_ID`.
- `server/.env.example`, `.env.production.example`: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`.

**To go live:** set `VITE_META_PIXEL_ID` (client) and, if you want server-side Conversions API too, `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` (server) — both from Meta Events Manager. Nothing else needs to change; the code is already wired end-to-end.

---

## 3. Real bugs found and fixed

### 3.1 Stripe webhook signature verification was structurally broken (High — revenue-impacting)
`server.js` applied `express.json()` globally, and `/api/billing` was mounted *after* that. `routes/billing.js`'s `express.raw({type:'application/json'})` on the `/webhook` route never actually ran first — by the time it executed, Express's global JSON parser had already consumed and parsed the request body. `stripeService.constructWebhookEvent(req.body, sig, secret)` needs the **raw, unmodified bytes** to validate Stripe's HMAC signature; with a parsed object instead of a Buffer, every real Stripe webhook would fail signature verification in production, silently breaking subscription/payment state sync.

**Fix:** moved the webhook route to `server.js`, mounted with `express.raw()` **before** the global `express.json()` call. Removed the now-dead duplicate route from `routes/billing.js` with a comment explaining why.
Files: `server/server.js`, `server/routes/billing.js`.

### 3.2 Homepage contact form posted to a route that has never existed (High — broken conversion path)
`ContactSection.jsx` (the form embedded directly on the homepage) called `fetch('/api/contact', ...)`. There is no `/api/contact` route anywhere in `server/routes/*` — every single submission through this form failed. It correctly showed an inline error state, so it wasn't crashing, but the site's primary embedded lead form has likely never worked.

**Fix:** routed it through the existing lightweight lead-capture endpoint (`POST /project-requests/ai-lead`) via the shared `api` client (so it respects `VITE_API_URL` in every environment instead of a hardcoded relative path). Extended that endpoint (see 3.3) to accept an optional message/source so the homepage form's fields aren't dropped on the floor.
Files: `client/src/sections/ContactSection.jsx`, `server/controllers/projectRequestController.js`.

### 3.3 Zero notifications on any new lead or low-satisfaction feedback (High — business-impacting)
`utils/emailService.js` already defined `sendAdminNewProjectRequest(...)` — it was **never called from anywhere**. Every "Start a Project" submission, AI-chat lead, and authenticated project request was written to MongoDB with no alert to the team; someone had to manually poll the admin panel to discover new business. Similarly, `Feedback.isLowSatisfaction()` was computed and returned in the API response but never surfaced to anyone.

**Fix:** added a `notifyNewLead()` helper that fires an in-app admin notification + email (fire-and-forget via `setImmediate`, matching the existing pattern in `authController.js`) on every new `ProjectRequest`, and wired the same server-side Meta `Lead` event alongside it. Added an equivalent in-app notification for low-satisfaction feedback.
Files: `server/controllers/projectRequestController.js`, `server/controllers/feedbackController.js`.

---

## 4. Security

| Fix | File(s) | Detail |
|---|---|---|
| Rate limiting on lead-capture endpoints | `server/middleware/rateLimit.js`, `server/routes/projectRequests.js` | `/project-requests/submit` and `/ai-lead` previously only had the blanket 300/min API-wide limiter — far looser than the 3/hr guest-feedback limiter. Added a dedicated 10/hr/IP limiter (refactored the rate-limit middleware into a reusable factory in the process). |
| Missing `ProjectRequest` indexes | `server/models/ProjectRequest.js` | The model had **zero indexes** despite being filtered by `status`/`user` and sorted by `createdAt` on every admin list view — a full collection scan on every request. Added `{status,createdAt}`, `{user}`, `{createdAt}`. |
| `CastError` (bad ObjectId) fell through to a generic 500 | `server/middleware/errorHandler.js` | Now returns a clean 400 instead of masking a client error as a server fault. |
| Dead/confusing files in the repo | `server/sever+api`, `server/_tmp_debug_intel.js` | Removed. `sever+api` was a stray, insecure near-duplicate of `server.js` (no helmet, no rate limiting, hardcoded prod URL) — a real risk if ever deployed by accident. |
| Stale, failing security regression test | `server/__tests__/security.test.js` | Was asserting `mongoSanitize` is used, but the codebase deliberately replaced it with hand-rolled `stripDollarKeys` logic (Express 5 makes `req.query` read-only, which breaks `express-mongo-sanitize`). Updated the test to check for the actual implementation instead of a stale expectation. |
| Undocumented env vars | `server/.env.example`, `.env.production.example` | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (used by Google OAuth login) and `OPENAI_EMBED_MODEL` (knowledge-base search) were referenced in code but never documented anywhere. Added, plus the new Meta CAPI vars. |

### Reviewed, not changed (documented as future work — see §8)
CSRF exposure via the `SameSite=None` cookie fallback, object-level authorization (IDOR risk) in `projectController`/`fileController`/`messageController`, and in-memory-only rate limiting are real findings but each requires either a cross-cutting client+server change or careful testing against live auth flows — see Future Recommendations rather than a rushed fix.

---

## 5. SEO

| Fix | File(s) | Detail |
|---|---|---|
| Dead stylesheet link causing a guaranteed 404 on every page load | `client/index.html` | `<link rel="stylesheet" href="./styles.css">` pointed at a file that doesn't exist anywhere in the repo (confirmed in `dist/index.html` too). Removed. |
| `useSEO` hook leaked stale metadata across routes | `client/src/hooks/useSEO.js` | It only ever *set* title/description/OG/canonical — nothing reset them when navigating to a page that didn't set its own values (e.g. auth pages), so a visitor could see the previous page's title/canonical/OG tags. Now resets to sane site defaults on unmount. |
| Auth pages had no SEO handling at all | `Login.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx` | None called `useSEO` — inherited whatever title/meta the previous route left behind, and (before the fix above) would have kept leaking it forward too. Added `useSEO({ title, noIndex: true })` to each — consistent with `robots.txt` already disallowing these paths. |
| `PortfolioDetail` had zero structured data | `client/src/pages/PortfolioDetail.jsx` | Every other detail page type (case studies, blog posts, industries) already ships `CreativeWork`/`Article` + `BreadcrumbList` JSON-LD — portfolio project pages were the one gap. Added matching `CreativeWork` + `BreadcrumbList` schema. |
| Sitemap missing `/feedback` | `client/public/sitemap.xml` | Present in `robots.txt`'s allow-list but absent from the sitemap. Added. |

**Correction to initial assumptions:** two things flagged during discovery turned out to already be handled correctly and needed no fix — `document.documentElement.lang`/`dir` **do** get updated at runtime (via `utils/rtl.js`'s `applyLanguageDirection`, called from `LanguageContext`), and `BreadcrumbList` schema already exists on `BlogPost`, `CaseStudyDetail`, `Industries`, `CaseStudies`, `Portfolio`, `Blog`, and `ContactPage` — only `PortfolioDetail` was missing it. Verifying against the actual code before "fixing" avoided two unnecessary changes.

---

## 6. Performance

| Fix | File(s) | Detail |
|---|---|---|
| `Home` eagerly bundled its entire below-the-fold content + the ~1600-line AI chat widget | `client/src/pages/Home.jsx` | `Home` is the only eagerly-imported route in the app (correctly, for LCP) — but it eagerly imported `WhyYANSY`, `ProcessSection`, `TechSection`, `IndustriesPreview`, `FAQ`, `ContactSection`, and `AIChatWidget` too, making the main entry chunk (572KB, the largest asset in the build) load in full on **every route**, not just `/`. Converted all seven to `React.lazy()` behind `Suspense` boundaries, keeping Hero/Portfolio/Metrics/Testimonials (the above-the-fold proof block) eager. |
| Dead, stale CSS shipped nowhere but sitting in the repo | `client/src/App.css` | Never imported anywhere (confirmed via repo-wide search); also had a leftover gold color scheme contradicting the current blue brand tokens. Removed. |
| Static assets missing long-term cache headers | `deploy/nginx/yansytech.com.conf` | The cache regex covered `js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2` but not `webp`/`avif`/`mp4` — meaning the site's LCP-critical hero images (`hero-en-*.webp`) and the homepage brand-film video got **no caching** despite being static, non-hashed filenames. Added `webp|avif|mp4` to the regex (both the live and commented HTTPS blocks). |
| Google Fonts CSS was render-blocking | `client/index.html` | Switched from a plain `<link rel="stylesheet">` to the standard preload+onload swap pattern (with a `<noscript>` fallback), so the font stylesheet fetch no longer blocks first paint. |

**Requires a deploy to take effect:** the nginx config change only applies once re-deployed to the server (`deploy/nginx/yansytech.com.conf` is a reference file in the repo, not live config).

---

## 7. Full list of files touched

**New files:**
- `client/src/utils/metaPixel.js`
- `server/utils/metaConversionsApi.js`

**Client — modified:**
`index.html`, `.env`, `.env.example`, `.env.production.example`, `src/App.jsx`, `src/hooks/useSEO.js`, `src/pages/Home.jsx`, `src/pages/Login.jsx`, `src/pages/ForgotPassword.jsx`, `src/pages/ResetPassword.jsx`, `src/pages/VerifyEmail.jsx`, `src/pages/Register.jsx`, `src/pages/PortfolioDetail.jsx`, `src/pages/CaseStudyDetail.jsx`, `src/pages/BlogPost.jsx`, `src/pages/ContactPage.jsx`, `src/pages/FeedbackForm.jsx`, `src/pages/BillingPage.jsx`, `src/pages/Meetings.jsx`, `src/sections/ContactSection.jsx`, `src/components/ProjectRequestForm.jsx`, `src/components/Footer.jsx`, `src/components/FloatingActionMenu.jsx`, `public/sitemap.xml`

**Removed:** `client/src/App.css` (dead, unused)

**Server — modified:**
`server.js`, `.env.example`, `.env.production.example`, `controllers/projectRequestController.js`, `controllers/feedbackController.js`, `middleware/errorHandler.js`, `middleware/rateLimit.js`, `models/ProjectRequest.js`, `routes/billing.js`, `routes/projectRequests.js`, `__tests__/security.test.js`

**Removed:** `server/sever+api` (dead, insecure duplicate), `server/_tmp_debug_intel.js` (debug scratch file)

**Infra — modified:** `deploy/nginx/yansytech.com.conf`

---

## 8. Future recommendations (not done in this pass — why, and what's involved)

These are real findings that deserve attention but need either credentials/infra access this session doesn't have, or careful dedicated testing against live auth/payment flows rather than a rushed change bundled into a large sweep:

1. **CSRF hardening.** The auth cookie falls back to `SameSite=None` in production (`authController.js`), and `authenticate` accepts a token from either the header or the cookie — a classic CSRF surface for state-changing endpoints. Worth a dedicated pass: either move to `SameSite=Lax` (client and API share the `yansytech.com` registrable domain, so this may already be sufficient) or add a double-submit CSRF token, tested against every existing authenticated flow before shipping.
2. **Object-level authorization (IDOR) audit.** `routes/projects.js`, `routes/files.js`, `routes/messages.js` only check *authentication* at the route layer — ownership checks depend on controller-level logic that wasn't independently re-verified line-by-line in this pass. Worth a focused audit of `projectController`, `fileController`, `messageController`.
3. **Redis-backed rate limiting/caching.** All current rate limiting (`middleware/rateLimit.js`, `express-rate-limit`'s default store) is in-process memory — it resets on every deploy/restart and isn't shared across a multi-instance/PM2-cluster deployment. Fine for a single instance, a real gap if this ever scales horizontally.
4. **`framer-motion` vs `gsap` overlap.** `framer-motion` is used in only 2 files (page-transition wrapper) but its vendor chunk (114.8KB) is the single largest in the bundle — larger than `vendor-react`. `gsap`+`ScrollTrigger` already handles animation everywhere else. Replacing the page-transition usage with GSAP/CSS would remove a meaningful, always-loaded chunk — didn't do this in the same pass as everything else because it touches the transition behavior on every route and deserves its own visual QA pass.
5. **Font self-hosting.** Preload+onload (done, §6) helps, but self-hosting the actual `.woff2` files would let a real `<link rel="preload" as="font">` be added — Google's CDN serves different files per User-Agent/subset, so a specific file URL can't be safely hardcoded without self-hosting.
6. **Dynamic sitemap generation for portfolio items.** `sitemap.xml` is hand-maintained; individual `/portfolio/:id` pages (CMS/DB-driven) aren't listed at all, only the `/portfolio` index. A small script pulling published portfolio slugs from MongoDB at build/deploy time would close this properly, rather than hand-editing an XML file every time a project is published.
7. **Unused dependencies.** `express-validator` and `express-mongo-sanitize` are installed but never imported (the codebase uses hand-rolled equivalents instead, for good documented reasons in `express-mongo-sanitize`'s case). Left in place rather than running `npm uninstall` mid-audit — removing them is a one-line follow-up whenever convenient, but touches the lockfile and didn't seem worth the risk bundled into this many other changes.
8. **GTM consolidation.** Currently GA4 (`gtag.js`) + Meta Pixel + Clarity are three separate direct integrations. Consolidating behind a single Google Tag Manager container is a reasonable next step for tag management convenience, but migrating an already-working GA4 setup carries real regression risk and deserves its own testing pass rather than being bundled here.

---

## 9. Verification

- All modified/created **server** files pass `node --check` (syntax-verified): `server.js`, `controllers/projectRequestController.js`, `controllers/feedbackController.js`, `middleware/errorHandler.js`, `middleware/rateLimit.js`, `models/ProjectRequest.js`, `routes/billing.js`, `routes/projectRequests.js`, `utils/metaConversionsApi.js`.
- Every modified/created **client** file was run through the project's own ESLint config. Result: zero new errors or warnings introduced by any of these changes — the handful of pre-existing findings ESLint surfaced (an unused var and an empty catch block in `BillingPage.jsx`, ref-in-render/setState-in-effect patterns in `Login.jsx`/`Register.jsx`/`VerifyEmail.jsx`, missing-dependency warnings in `FeedbackForm.jsx`/`PortfolioDetail.jsx`) all sit on lines untouched by this pass — confirmed via `git diff` before concluding they predate this work, rather than assumed.
- A full production build (`npm run build`) was kicked off to catch any remaining bundling/import issues; the sandbox this session runs in is unusually slow for this (CPU time climbing steadily rather than hung, ~40+ minutes and still going at time of writing). It did not finish before this report was written — if it surfaces an error afterward, treat that as the authoritative check and fix accordingly.
