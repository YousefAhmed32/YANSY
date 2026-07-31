# YANSY TECH — Complete Project Dossier

*Reverse-engineered from the live codebase (backend, frontend, database, admin panel) plus 27 historical project reports. Every claim below is grounded in what actually exists in the repository as of 2026-07-30. Where the project's own documentation is uncertain, aspirational, or internally contradictory, that is stated explicitly rather than smoothed over — per this project's own documented lesson: "treat any historical completion claim as a hypothesis to verify, not a fact to trust."*

> **Read this before anything else — an honesty flag inherited from the project's own paperwork:**
> The codebase's own most recent internal audit (`PROJECT_BUSINESS_DISCOVERY_INTERVIEW.md`) states plainly that it **cannot confirm YANSY Tech is a currently operating business with real clients**. No real company legal name, founder identity, client names, logos, or awards appear anywhere in the code or its 20+ historical reports, and there is a standing rule in the project never to fabricate them. The nine published "case studies" (Platterly, LearnSphere, StayLuxe, etc.) were built with Unsplash placeholder imagery and explicit `// TODO: Replace with real asset` comments. Revenue anywhere in the repo is either **$0** or a forward-looking target. This dossier therefore documents **what the platform is and does** — a real, substantial, working piece of software — without asserting unverifiable business outcomes (client counts, revenue, "years in business") as fact. Sections that traditionally require such claims (Business Goals, Metrics, CV/LinkedIn/Behance versions) are written to be accurate about the *engineering* while flagging business figures as target/illustrative, not verified.

---

# 1. Project Overview

**Project Name:** YANSY Tech Platform (working name; no confirmed registered legal/brand name in the codebase)

**Tagline:** *"We build websites, apps & digital systems for growing businesses."* (homepage headline)

**Elevator Pitch:** A bilingual (Arabic/English, full RTL) digital-agency platform that combines a conversion-focused public marketing site, an authenticated client portal for tracking commissioned projects, and a full internal admin system for running the agency's operations — sales pipeline, billing, messaging, portfolio CMS, and AI-assisted support — in one codebase.

**Full Description:** The repository ships three integrated products:
1. **Public marketing site** (`yansytech.com`) — homepage, portfolio/case-study gallery, industries, "why YANSY," blog, contact — the lead-generation surface a stranger sees before becoming a client.
2. **Authenticated client portal** (`/app/*`) — a signed-up client tracks project progress, messages the team in real time, views/pays invoices, manages a subscription, and gets AI-assisted briefs/estimates.
3. **Internal admin panel** (`/app/admin/*`, 19 modules) — the agency's own team manages users/CRM, project intake, portfolio content, billing/finance, feedback moderation, system health, roles, and a full AI-powered support/lead-qualification center.

**Business Problem (as designed):** Digital agencies typically fail clients in one of two ways — freelancers are cheap but unreliable and disappear mid-project; agencies are reliable but slow, expensive, and lock clients into proprietary systems. Internally, agencies also struggle to track leads/projects/invoices/support across scattered tools.

**Solution (as designed):** Position as "the structured studio" — agency-grade process at near-freelancer speed/pricing, milestone-based payment (never full payment upfront), full code ownership on delivery, direct access to the team (no account-manager layer) — backed by a single platform that gives the agency itself one place to run CRM, delivery, billing, and support.

**Target Audience:** MENA-first (Egypt, Saudi Arabia, UAE, Kuwait, Qatar named explicitly in project docs), secondarily global; verticals named across the platform: restaurants, clinics/healthcare, real estate, education, hotels/hospitality, manufacturing, startups/SaaS, e-commerce.

**Industry:** Digital/software agency services — web, e-commerce, SaaS, mobile, ERP/CRM, booking systems.

**Category:** Multi-tenant-style B2B service platform (marketing site + client portal + internal ops/admin), comparable in shape to Copilot.so, HoneyBook, or Dubsado, with an internal AI-support/CRM layer closer to a lightweight HubSpot.

**Current Status:** Functionally complete and actively iterated — not a prototype. Core flows (auth, project lifecycle, messaging, billing, portfolio CMS, admin operations, AI features) are implemented against a real database and real third-party integrations (Stripe, Anthropic Claude, OpenAI, Google OAuth, GridFS media storage). Some launch-readiness items remain open (see §19 Security, §21 Future Improvements) and the project's own audits flag that historical "100%/93% complete" claims should not be trusted without re-verification.

**Scale:** ~29 MongoDB models, ~22 route files exposing ~119 API endpoints, 52 frontend page components (public + client + admin), 19 dedicated admin modules, a shared design-token system, and a 1,247-line-per-language i18n dictionary.

**Estimated Development Time:** The project's own documentation records a dense multi-month build: an initial working application, a single-day "CTO-mode" hardening sprint (Phases 0–5: security, billing, AI, enterprise admin), a full visual rebrand, and multiple later audit/QA passes through 2026-07-30. Realistically representative of several hundred hours of senior full-stack + product design work.

---

# 2. Executive Summary

YANSY Tech is a production-grade, bilingual B2B platform built to run a digital agency end-to-end: it wins the client (marketing site with a single, consistent conversion path — an AI-assisted chat widget and a WhatsApp-or-form decision modal on every page), delivers the work (a real-time client portal with project tracking, milestone messaging, and file exchange), gets paid (Stripe-backed subscriptions plus a standalone multi-currency invoicing system), and runs the business (a 19-module admin panel covering CRM, portfolio CMS, financials, system health, RBAC, and an AI-powered support/lead-qualification center).

Architecturally it is a modern MERN-adjacent stack — React 19 + Vite + Redux Toolkit on the frontend, Express 5 + MongoDB/Mongoose + Socket.IO on the backend — with two genuinely differentiated AI integrations (Anthropic Claude for authenticated in-app features, OpenAI for the public sales chat widget with a RAG knowledge base), full GridFS-based media storage with content-addressed deduplication and magic-byte upload validation, and a from-scratch bilingual Arabic/English experience with RTL layout mirroring applied consistently across all three product surfaces.

The codebase is unusually self-aware for a solo/small-team project: it carries 27 historical audit and phase-report documents that track its own security posture, feature completeness, and (crucially) its own tendency to over-claim completion — a pattern the most recent audits explicitly flag and correct for. The most serious open finding, confirmed as recently as 2026-07-30, is a real privilege-escalation bug (any ADMIN can grant themselves SUPER_ADMIN) that should be treated as the top engineering priority ahead of any new feature work. Business-outcome claims (revenue, client count) are honestly represented in the project's own paperwork as unverified or aspirational, and this dossier preserves that honesty rather than manufacturing numbers.

---

# 3. Business Goals

**Why this software exists:**
- Give a small/solo digital-agency operation the same operational leverage as a larger studio — one system for leads, delivery, billing, and support instead of scattered tools (WhatsApp, spreadsheets, email).
- Convert MENA-region visitors who are underserved by English-only, non-RTL competitor tools (Copilot.so, Basecamp, Notion, Monday.com, HoneyBook, Dubsado — all named directly in the project's own competitive analysis as Western-market-only).
- Build client trust in an unfamiliar/unbranded agency through transparency: real (or honestly-placeholder) case studies, a visible process, milestone-based payment, code ownership on delivery — de-risking the client's decision rather than relying on brand reputation.

**Problems it solves:**
| For the prospect | For the signed client | For the agency internally |
|---|---|---|
| Trust in an unknown vendor | "What's happening with my project?" | Leads/projects/invoices/support scattered everywhere |
| Opaque agency pricing | Hard to reach the dev team | No visibility into whether AI features are worth their cost |
| Fear of a freelancer disappearing | Wants to add scope later without lock-in | No structured way to track a lead through a pipeline |

**Business value / ROI (as designed, not independently audited for real-world outcomes):**
- Milestone payments reduce the agency's non-payment risk versus full-upfront or full-on-delivery models.
- One admin panel replacing multiple point tools reduces context-switching cost for the operator.
- The AI support widget is designed to qualify leads to a 0–100 score and auto-route only serious inquiries to WhatsApp, filtering low-intent traffic before it costs a human's time.
- Documented unit economics for the paid AI tier (**the one concrete ROI figure that exists in the repo**): at $49/mo with a ~20-request/day cap, AI cost runs ~$5/user/month → roughly 90% gross margin on that specific feature (source: `AI_USAGE_REPORT.md`).

**Benefits:** faster time-to-launch positioning (~14-day average delivery claimed), bilingual reach into an underserved market segment, and a single codebase the agency itself fully owns (no third-party SaaS dependency for its core operations, aside from the named integrations in §17).

---

# 4. User Roles

Exactly **four roles**, single enum on the `User` model, plus an implicit unauthenticated "Guest" state:

| Role | Level | Who | Real permissions |
|---|---|---|---|
| **Guest** | — | Unauthenticated visitor | Browse public site, submit lead forms, use AI chat widget, submit feedback |
| **USER** | 0 | Signed-up client — the app's "Client," default role for every new registrant | Own projects/invoices/messages/subscription; onboarding; profile/password self-service; AI features per plan tier |
| **MANAGER** | 1 | Defined in schema and granted real read-level server permissions (`projects.view.all`, `users.view`, `billing.view`, `settings.view`, `audit.view`) | **Non-functional in practice** — every frontend guard (`ProtectedRoute`, `Layout.jsx`, `Sidebar.jsx`) treats "not ADMIN/SUPER_ADMIN" as a plain client, so a MANAGER account is redirected out of every admin page it's theoretically entitled to. A designed capability with no working UI path. |
| **ADMIN** | 2 | Staff/operator | Full access to all 19 admin modules — users, CRM, portfolio, billing config, feedback, project requests, support AI, settings, etc. |
| **SUPER_ADMIN** | 3 | Highest privilege | Everything ADMIN has, **plus** the only role allowed to impersonate another user (`users.impersonate`) and configure core system settings (`system.configure`). Intended to be the only role that can promote another account to SUPER_ADMIN. |

**Permission matrix:** 16 named permissions defined server-side (`projects.*`, `users.*`, `billing.*`, `settings.*`, `system.configure`, `ai.configure`, `audit.view`, `feedback.manage`, `notifications.broadcast`), each mapped to a minimum role. In practice only about half are actually enforced via the granular `requirePermission()` middleware (mainly the `users.*` routes); the rest of the admin surface is gated by the coarser `requireAdmin`/`requireSuperAdmin` role checks instead.

**⚠️ Known, unfixed privilege-escalation bug (most severe open finding in the codebase, confirmed 2026-07-30):** `PATCH /api/users/:id` (`userController.updateUser`) accepts an arbitrary `role` string from any caller with `users.edit` permission (i.e. any ADMIN) with **no target-role hierarchy check, no self-target check, and no audit log entry** — meaning any ADMIN can currently grant themselves (or anyone) `SUPER_ADMIN` silently. The properly-guarded sibling endpoint, `PATCH /api/users/:id/role`, does this correctly (enum validation, self-block, hierarchy check, audit log) — the bug is that two endpoints do the same job and only one is safe. A related bug lets an ADMIN delete or suspend a SUPER_ADMIN account (no check on the *target's* role, only the actor's own). See §19 Security for the full finding and recommended fix.

---

# 5. Complete Feature List

Grouped by module. Each entry: purpose, key business logic, and where it lives.

### 5.1 Authentication & Identity
- **Email/password registration & login** — bcrypt-hashed passwords, account lockout after 10 failed attempts (2h lock), single-token JWT (7-day expiry, delivered as both httpOnly cookie and JSON body). *Pages:* Login, Register. *API:* `/api/auth/*`.
- **Google OAuth** — server-side authorization-code exchange, auto-links to an existing email-matched account, marks email pre-verified. *Dependency:* `google-auth-library`.
- **Password reset** — SHA-256-hashed, 1-hour-expiry token, enumeration-safe responses (same message whether the email exists or not). *Pages:* ForgotPassword, ResetPassword.
- **Email verification** — 24h-expiry token, 5-minute resend cooldown; informational only (nothing currently gates access on verified status). *Page:* VerifyEmail.
- **Onboarding wizard** — 4-step flow forcing Google-signup users with no phone number to complete a profile before reaching the dashboard. *Page:* OnboardingWizard.
- **Role-based access control** — 4-role hierarchy + 16-permission matrix (see §4). **Contains the one confirmed unfixed security bug in the platform (see §19).**
- **Impersonation** — SUPER_ADMIN-only, issues a scoped JWT carrying `impersonatedBy` so audit logs stay attributable.

### 5.2 Client Project Management
- **Project lifecycle tracking** — 6 phases (planning→design→development→testing→launch→completed), 5 statuses, 0–100% progress with an `updateProgress()` model method that auto-transitions status and stamps completion date.
- **Project updates feed** — staff-posted timeline entries with optional file attachments, visible to the client.
- **Project intake / lead capture** — public "Start a Project" form (guest-capable), AI-lead variant, converts into staff-triaged `ProjectRequest` records with status pipeline (new→in-progress→completed).
- **File attachments** — GridFS-backed, linked to projects, updates, or messages.

### 5.3 Messaging & Real-Time Communication
- **Threaded client↔staff messaging** — WhatsApp-style UI, Socket.IO real-time delivery, read receipts, per-thread status (open/waiting-for-admin/waiting-for-customer/resolved/closed) and priority (low→urgent).
- **Thread assignment, pinning, archiving** — staff can assign a thread to a specific admin, pin urgent ones, archive resolved ones.
- **Admin-only internal notes per thread** — private annotations never shown to the client.
- **Real-time notifications** — 18 typed notification categories, Socket.IO push, 30-day TTL auto-cleanup, admin broadcast-to-role tool.

### 5.4 Billing & Payments
- **Subscription tiers** (FREE / PROFESSIONAL / ENTERPRISE) — Stripe-backed checkout, customer portal, cancel/reactivate, 14-day trial on signup, webhook-driven state sync with idempotency (`processedEventIds` ledger).
- **Plan-gated features** — `requirePlan()`/`requireFeature()` middleware enforces tier entitlements (max projects, storage, team members, AI features, invoicing, API access, custom branding, priority support, advanced analytics, white-label, SSO flags on the `Plan` model).
- **Invoicing** — admin-created invoices, auto-numbered (`INV-#####`), auto-computed line-item totals, 8-currency support (USD/EUR/SAR/AED/EGP/GBP/KWD/QAR), 6-state status workflow, direct Stripe checkout per invoice.
- **Admin financial dashboard** — MRR/ARR, plan distribution, subscription-status breakdown, recent payments.

### 5.5 Portfolio / Case-Study CMS
- **Full Notion-style content model** — fixed core fields (title, tagline, category, client, metrics) plus an ordered, polymorphic `blocks[]` array (heading/paragraph/image/gallery/quote/statRow/beforeAfter/video/embed/divider) for flexible case-study storytelling.
- **Draft → Published → Archived workflow**, featured flag, manual drag-reorder, bulk actions (publish/archive/draft/delete across a multi-select).
- **Confidential/private flags** — redact client identity publicly or hide a project entirely without deleting it.
- **Duplicate-as-draft**, cursor-paginated public listing with category/industry/tag/search filters, related-projects curation, view-count tracking.
- **Full bilingual field set** on nearly every content field (`title`/`titleAr`, `description`/`descriptionAr`, etc.).

### 5.6 Homepage Content Systems
- **Cinematic intro video** — one-time, session-gated, full-screen video on first homepage visit, admin-configurable (device targeting, play frequency, skip delay, fade/transition timing, "wait for interaction" autoplay-with-sound workaround), with view/completion/skip analytics.
- **Homepage video showcase** — a separate, independently configurable in-page video section (can reuse the intro's video or have its own), with extensive design controls (section height, background style, overlay opacity, animation style, shadow, spacing) and its own view/play/completion/CTA-click analytics.
- **"Trusted by" client-logo wall** — admin-managed logo list with drag-reorder, active toggle, and a section-level on/off + bilingual copy control.
- **"Start Your Project" decision screen** — admin-configurable WhatsApp-vs-form CTA with per-channel copy, button order, default option, and a full funnel-analytics view (decision views → channel chosen → form step reached → completion, per-step drop-off visualization).

### 5.7 Feedback & Trust
- **Multi-dimensional testimonial system** — 5 separate 1–5 ratings (quality/speed/communication/professionalism/overall) rather than a single star score, optional anonymity, optional project association, admin moderation (review/flag/highlight/soft-delete).
- **"Client Voices" proof components** — WhatsApp-screenshot and voice-note testimonial presentation on the public site.
- **Abuse/moderation reporting** — users can report a user/project/message; admin triage queue with status workflow (pending→under_review→resolved/dismissed).

### 5.8 AI Features (two separate integrations)
- **Public AI sales chat widget** (OpenAI, `gpt-4o-mini` default) — RAG-grounded (admin-curated `KnowledgeDoc` corpus + OpenAI embeddings, cosine-similarity retrieval), lead detection/scoring (0–100), sentiment/intent classification, escalation flagging, file/URL/document analysis (PDF/DOCX extraction, image vision, `cheerio`-based URL scraping with SSRF guarding), TTS, long-form document generation (BRD/FRD/user stories/roadmap), and a hard system-prompt rule that the AI must never quote a price.
- **Authenticated in-app AI** (Anthropic Claude, `claude-sonnet-4-6`) — dashboard insight generation, project brief/estimate/proposal generators, project/message summarizers, onboarding assistant — all plan-gated (PROFESSIONAL+) and daily-rate-limited by plan tier.
- **Per-call cost/token tracking** — three overlapping ledgers (`AIUsage` for authenticated features, `AiCostLog` for the public widget, `AIRequest` for qualified leads) feeding an admin cost-analytics dashboard.

### 5.9 CRM & Lead Pipeline (Admin)
- **Customer directory** built on top of the `User` model's CRM fields (`customerStatus`, `leadScore`, `tags`, `businessType`, `primaryGoal`, `howFound`) with a 4-tab detail panel (overview, activity timeline, projects, messages).
- **AI-qualified lead pipeline** — `AIRequest` records with a status funnel (new→contacted→proposal_sent→won/lost), separate from raw chat transcripts.
- **Support ticket system** — escalated from AI conversations, assignable, with internal notes and a resolution workflow.

### 5.10 Analytics & Observability
- **First-party site analytics** — page views, sessions, scroll depth, geography (IP-based), device/browser breakdown, traffic sources, conversion events (WhatsApp clicks, contact/booking requests, CTA clicks) — own database collections, not solely reliant on GA4.
- **Real-time "active now" visitor tracking**.
- **System health dashboard** — live status of DB, Stripe, SMTP, file storage, AI provider, and the server process itself, auto-refreshing.
- **Immutable audit log** — ~35 tracked privileged-action types, before/after snapshots, actor identity, 1-year TTL.
- **Per-user activity timeline** — separate from the admin audit log, feeds the client-facing "recent activity" view.

### 5.11 Admin Operations
- **19-module admin panel** (full breakdown in §7) covering every business function above plus system settings (key/value config store across 8 categories), role management, and platform-wide notification broadcasting.

---

# 6. Complete Pages

*(Admin pages are detailed separately in §7; this section covers the public site and authenticated client portal — 33 non-admin route components.)*

### Public / Marketing
| Page | Purpose | Forms | Key APIs |
|---|---|---|---|
| **Home** | Primary landing page; narrative flow Hero→Logos→Portfolio→Metrics→Testimonials→ClientVoices→Video→WhyYANSY→Process→Tech→Industries→FAQ→Contact | None (CTAs open the shared `ProjectRequestForm` modal) | `/portfolio`, `/client-logos`, `/intro/settings`, `/homepage-video/settings` |
| **Portfolio** | Filterable/searchable case-study gallery, infinite scroll | Filter/search only | `GET /portfolio`, `/portfolio/meta` |
| **PortfolioDetail** | Single case-study renderer (Hero, StoryBeats, Gallery+Lightbox, Process, Impact, Proof, FAQ, Next Project) | None | `GET /portfolio/:id`, `/portfolio/:id/related` |
| **CaseStudies / CaseStudyDetail** | Curated, statically-authored "how we solved X" showcase (distinct from CMS-driven Portfolio) | None | Static data, no API |
| **Industries** | 8 vertical cards linking to matching case studies | None | Static data |
| **WhyYansyPage** | 8-pillar commitment grid + comparison table + mini-FAQ | None | Static |
| **ContactPage** | 4 contact-channel cards + project-request banner | Opens `ProjectRequestForm` | `/start-project/event` |
| **Blog / BlogPost** | Static 30-article content, category filters, JSON-LD Article schema | None | Static data |
| **FeedbackForm** | Public testimonial submission | Star ratings ×5 + review text + anonymity toggle | `POST /feedback` |
| **NotFound** | 404 with quick links | None | — |

### Auth
| Page | Purpose | Validation | API |
|---|---|---|---|
| **Login** | Email/password + Google OAuth | Inline manual checks | `POST /auth/login`, `/auth/google` |
| **Register** | Full signup form, password-strength meter | Email regex, 6-char min password, shared phone validator | `POST /auth/register` |
| **ForgotPassword** | Email → reset link | Email format | `POST /auth/forgot-password` |
| **ResetPassword** | Token + new password | 8-char min, match check | `POST /auth/reset-password` |
| **VerifyEmail** | Auto-verifies from URL token | — | `GET /auth/verify-email/:token` |

### Client Dashboard (`/app/*`)
| Page | Purpose | Key features |
|---|---|---|
| **Dashboard** | Home screen — greeting, stat pills, active-project hero card, messages preview | Real-time via Redux + Socket.IO |
| **Account** | Profile + security settings, 2 tabs | Password change, language toggle |
| **Projects** | Grid of client's projects with search/filter | Status badges, progress bars |
| **ProjectDetails** | Tabbed single-project view (Overview/Messages/Milestones/Activity/Files/Invoices) | Embedded messaging |
| **AddProject** | 3-step "new project" wizard | GSAP transitions, budget/type selection |
| **Messages** | WhatsApp-style thread inbox | Real-time, read receipts |
| **Meetings** | Static booking page, 3 meeting types | WhatsApp-mediated booking (no calendar backend) |
| **Invoices** | Client's invoice list, multi-currency | Role-aware (admin sees create affordance) |
| **Payments / BillingPage** | Subscription management, Stripe checkout/portal | Plan comparison, billing history |
| **Support** | FAQ accordion + ticket form | `POST /support/ticket` |
| **OnboardingWizard** | Post-signup profile completion (Google users) | 4 steps, phone validation |
| **ActivityTimeline** | Cross-entity activity feed (projects+messages+invoices merged client-side) | Type filter |

---

# 7. Admin Dashboard

19 modules under `/app/admin/*`, all gated by `<ProtectedRoute requireAdmin>` (client) + `requireAdmin`/`requirePermission` (server). Built on a shared internal design system (`client/src/admin-ui/`: `tokens.js`, `Primitives.jsx`, `DataTable.jsx`, `Modal.jsx`, `PageHeader.jsx`, `Sidebar.jsx`). Every module is fully bilingual (Arabic/English, RTL-mirrored) via the `useLanguage()` hook — no admin page found with English-only text.

| # | Module | Purpose | CRUD | Notable |
|---|---|---|---|---|
| 1 | **AdminDashboard** | Command-center overview | Read-only | KPI grid, pipeline view, real-time via Socket.IO |
| 2 | **AdminAI** | AI usage/cost observability | Read + trigger-insights | Claude-generated priority-tinted insight cards |
| 3 | **AdminAnalytics** | Full web-analytics suite | Read-only | 7 tabs, custom SVG charts (no chart library) |
| 4 | **AdminAuditLog** | Immutable action trail viewer | Read-only | Color-coded action severity |
| 5 | **AdminClientLogos** | "Trusted by" logo wall manager | Full CRUD + reorder | Drag-and-drop, image upload |
| 6 | **AdminCRM** | Customer directory & profiles | Read + detail panel | Lead-score bar, 4-tab customer detail |
| 7 | **AdminFeedback** | Testimonial moderation | Update-only (review/flag/highlight/delete) | Category rating breakdown chart |
| 8 | **AdminFinancial** | Revenue dashboard | Read-only | MRR/ARR, plan distribution |
| 9 | **AdminHealth** | Infra health monitor | Read-only, auto-refresh 30s | DB/Stripe/SMTP/Storage/AI/Server status |
| 10 | **AdminHomepageVideo** | Homepage video-showcase CMS | Full CRUD | Extensive design/playback controls, analytics |
| 11 | **AdminIntro** | Cinematic intro-video CMS | Full CRUD | Device targeting, autoplay-with-sound workaround |
| 12 | **AdminMessages** | Unified admin inbox (875 lines) | Full messaging CRUD | Internal notes, urgency flagging by response age |
| 13 | **AdminNotifications** | Broadcast composer | Create-only | Role-targeted, live preview |
| 14 | **AdminPortfolio** | Case-study CMS list/actions | Full CRUD + bulk actions | Status tabs, drag-reorder, duplicate |
| 15 | **AdminReports** | Abuse/moderation queue | Read/update/delete | Master-detail layout |
| 16 | **AdminRoles** | Role assignment | Update-only | Self-role-change disabled in UI; permission-matrix reference |
| 17 | **AdminSettings** | System config console | Read/update + seed | 8 categories, typed setting editors |
| 18 | **AdminStartProject** | "Start Project" CTA CMS | Full CRUD | 4-step funnel drop-off visualization |
| 19 | **AdminSupportAI** | AI support center (1,309 lines — largest file in the app) | Full CRUD across 9 tabs | Conversations/Leads/Requests/Tickets/Escalations/Cost/Config |

**Sidebar IA** (7 grouped sections): Workspace → Overview → Content → People → Communication → Finance → System — collapsible, resizable, with per-item favorites and a recently-visited list, all persisted to `localStorage`.

**Role gating nuance:** all 19 modules are equally reachable by both ADMIN and SUPER_ADMIN — the only strictly SUPER_ADMIN-gated *capability* is user impersonation (server-enforced) and a "Super Admin" broadcast target. This is where the §4/§19 privilege-escalation bug matters most: an ADMIN who exploits it doesn't just get a badge, they get access to the impersonation flow too.

---

# 8. Database

**MongoDB via Mongoose.** 29 models across 27 files (2 files each export a pair: `Message`+`MessageThread`, `AnalyticsEvent`+`Session`).

### Categorized model list
**Core business (9):** `User`, `Project`, `ProjectRequest`, `Invoice`, `Plan`, `Subscription`, `Feedback`, `File`, `Message`+`MessageThread`
**Support/AI lead-gen (5):** `SupportConversation`, `SupportTicket`, `AIRequest`, `AIUsage`, `AiCostLog`
**CMS & settings (8):** `PortfolioProject`, `ClientLogo`, `ClientLogoSettings`, `HomepageVideoSettings`, `IntroSettings`, `StartProjectSettings`, `SystemSettings`, `KnowledgeDoc`
**Admin & audit (3):** `AuditLog`, `ActivityLog`, `Report`
**Analytics (3):** `AnalyticsEvent`, `Session`, `Notification`

### Key models (abridged — full field lists were verified against source)

**User** — hub of the entire schema. Auth fields (email unique, password `select:false` bcrypt-hashed, Google OAuth linkage), CRM fields (`customerStatus`, `leadScore` 0-100, `tags`, `businessType`, `primaryGoal`, `howFound`), security fields (`loginAttempts`, `lockUntil`, reset/verification tokens all `select:false`), Stripe linkage (`stripeCustomerId`). Indexes: `email` unique, `googleId` sparse, `{role,isActive}`, `{createdAt}`.

**Project** — `client`→User, `budget` enum (5 tiers), `phase` enum (6 stages), `status` enum (5 states), embedded `updates[]` timeline with attachments. Instance method `updateProgress()` auto-transitions status/completion.

**PortfolioProject** — the largest schema in the app: fixed core fields + 8 reusable sub-schemas (`mediaAsset`, `metric`, `performanceMetric`, `testimonial`, `teamMember`, `faq`, `award`, and a polymorphic `block` with 10 content types) enabling flexible, ordered case-study storytelling. Full bilingual field pairs throughout (`title`/`titleAr`, etc.). Text-indexed for search; cursor-paginated via `{createdAt,_id}` compound index.

**Invoice** — auto-numbered (`pre('validate')` hook), auto-computed totals (`pre('save')` recomputes subtotal/tax/total from line items every save), 8-currency support, 6-state status workflow.

**Subscription** — strictly 1:1 with User (unique index on `user`), references `Plan`, tracks Stripe IDs and a `processedEventIds` array for webhook idempotency.

**MessageThread/Message** — many-to-many `participants`↔User, support-style status/priority workflow, `unreadCounts` as a Map keyed by user.

**AuditLog / ActivityLog / Report / Notification** — all use a polymorphic `entityType`/`entityId` (or `targetType`/`refType`) pattern rather than a Mongoose `ref`, resolved manually at the application layer. All four carry TTL indexes (30 days–1 year) for automatic cleanup.

**SupportConversation / SupportTicket / AIRequest / AIUsage / AiCostLog** — the AI subsystem's data model, intentionally layered: raw transcript (`SupportConversation`) → escalated ticket (`SupportTicket`) → qualified sales lead (`AIRequest`) → cost ledgers split by context (authenticated features vs. anonymous public chat).

### Relationship map (summary)
`User` is the hub — nearly every model references it. Core delivery chain: `User 1—N Project`, `User 1—1 Subscription N—1 Plan`, `Project 1—N Invoice/Feedback/File`, `MessageThread N—N User` with `1—N Message`. AI/support chain: `SupportConversation 1—N SupportTicket`, `SupportConversation 1—N AIRequest`. Portfolio/CMS models are largely standalone singletons or self-referential (`PortfolioProject` self-refs for "related work" curation). Admin/audit models use polymorphic FKs across the rest of the schema.

### Indexing & validation
Every high-traffic query path (admin lists, public portfolio browsing, feedback moderation, message inbox, CRM directory) has a matching compound index verified in the model files — a genuine strength flagged independently in the project's own audits ("a properly indexed database" cited as a pre-existing strength before any hardening work began). Validation is enforced at the schema level (required fields, enums, min/max, custom validators — e.g. `PortfolioProject`'s media-asset schema explicitly rejects `data:` URIs to prevent base64-bloated documents).

---

# 9. Backend Architecture

**Stack:** Node.js (`>=20.0.0`) + Express 5 + Mongoose + Socket.IO, CommonJS, single monolithic service (`server/server.js`, 467 lines).

### Folder structure
```
server/
├── controllers/   23 files — one per resource domain
├── routes/        22 files — Express routers, mounted in server.js
├── middleware/     7 files — auth, errors, rate-limit, plan-gate, AI-quota, sanitize, analytics
├── models/        27 files — 29 Mongoose models
├── media/          7 files — de facto "services" layer for all file uploads (GridFS)
├── utils/         14 files — Claude/OpenAI/Stripe/email services, audit logger, cost calc, Meta CAPI
├── config/          gridfs.js — GridFS bucket singleton
├── scripts/        5 files — one-off maintenance/migration scripts (sitemap gen, media repair)
├── seeds/           plans.js, settings.js
└── __tests__/      6 Jest suites, 1,379 lines total
```

### Controllers → Routes → Middleware
23 controllers map to 22 route files exposing **~119 endpoints total**, spanning auth, users, projects, project-requests, messages, notifications, analytics, files, feedback, portfolio, intro-video, homepage-video, client-logos, start-project, invoices, billing (+ Stripe webhook), AI, support (public chatbot + admin AI ops), reports, search, settings, audit, activity, and media streaming.

### Authentication & Authorization
Single-token JWT (7-day expiry, no refresh-token rotation), delivered dual-mode (httpOnly cookie + JSON body). bcrypt password hashing (10 salt rounds), account lockout, enumeration-safe password reset. Two-layer RBAC: role hierarchy (`requireRole`/`requireAdmin`/`requireSuperAdmin`) + a granular 16-permission matrix (`requirePermission`). Google OAuth via server-side authorization-code exchange. **See §19 for the one confirmed unfixed authorization bug.**

### Middleware stack (registration order)
CORS → Stripe-webhook raw-body parser (deliberately mounted before JSON body parsing, fixing a historical bug where signature verification failed in production) → JSON/urlencoded parsers → custom NoSQL-injection sanitizer (hand-rolled to work around an Express-5/`express-mongo-sanitize` incompatibility) → custom XSS sanitizer (hand-rolled regex-based, not a maintained library) → Helmet CSP → compression → media-streaming route (mounted before rate limiting, since a gallery page alone can exceed the per-minute cap) → tiered rate limiting (global 300/min, auth 20/15min, password-reset 3/hr, search 30/min, plus route-local limiters for feedback/leads/AI-chat) → static uploads (legacy fallback) → request-timeout guard → analytics tracking → maintenance-mode gate → Socket.IO injection → DB-availability circuit breaker → routes → centralized error handler → 404.

### File upload system
Single choke point (`media/media.service.js`) used by every feature — no per-feature upload logic exists elsewhere. GridFS is the sole active storage backend (Cloudinary/local-disk fully migrated away, with dedicated repair scripts for legacy artifacts). Content-addressed SHA-256 deduplication. Two-layer validation: multer `fileFilter` on claimed MIME type, then **magic-byte verification** via the `file-type` package on actual bytes — a real defense against spoofed `Content-Type`. Per-feature size ceilings (portfolio 60MB, video 120MB, logos 5MB, generic 10MB). Streamed back via a public `GET /api/media/:id` endpoint with HTTP Range support, ETag, and immutable long-lived caching (safe because content is hash-addressed).

### Error handling & logging
Centralized handler classifies DB-connectivity, CORS, Mongoose validation, duplicate-key, cast, and JWT errors into clean HTTP responses; stack traces suppressed in production. **Gap:** all logging is ad hoc `console.*` — no structured logger (Winston/Pino) and no HTTP access-log middleware (`morgan`), despite both being reasonable additions for a production service.

### Background jobs
**None found** — no cron/scheduler dependency. Maintenance tasks (sitemap generation, DB migrations, media repair) are manual one-off scripts, not scheduled runtime jobs.

---

# 10. Frontend Architecture

**Stack:** React 19 + Vite 7 + React Router 7, Redux Toolkit (5 slices) for cross-page state, one React Context (`LanguageContext`) for i18n/RTL.

### Structure
```
client/src/
├── pages/          52 files — every route, public + client + admin side-by-side
├── components/     shared UI (Header, Footer, Layout, ProjectRequestForm, AIChatWidget…)
│   ├── portfolio-detail/   case-study page section library
│   ├── portfolio-wizard/   admin CMS wizard sections
│   └── reviews/            WhatsApp/voice-note proof components
├── sections/        large composed homepage sections (reused across pages)
├── admin-ui/        self-contained admin design-system kit
├── store/           Redux slices: auth, projects, messages, notifications, billing
├── contexts/        LanguageContext (the only Context)
├── hooks/           useSEO, useReveal, useReducedMotion, useIntroSettings, useHomepageVideoSettings
├── i18n/            react-i18next config + en.json/ar.json (1,247 lines each)
├── utils/           api client, media URL resolver, phone validator, analytics trackers, RTL sync
├── constants/       static option lists (budget tiers, project types)
└── data/            hand-authored bilingual content (case studies, blog — static, not CMS-driven)
```

### Routing
Single `BrowserRouter`, lazy-loaded routes (`React.lazy`) except the eager-loaded `Home`, `AnimatePresence`/`Suspense` with a branded loader. `ProtectedRoute` handles three gates: unauthenticated → `/login`; Google-onboarding-incomplete → `/app/onboarding`; non-admin on an admin route → `/app/dashboard`.

### State management
No `AuthContext`/`ThemeContext` — auth and cross-page state live in Redux (`authSlice`, `projectSlice`, `messageSlice`, `notificationSlice`, `billingSlice`). `LanguageContext` is the sole Context, syncing `i18next` and `document.dir`/`lang` via a shared `applyLanguageDirection` utility.

### i18n / bilingual system — an important nuance
**Two coexisting patterns**, not one clean system: (1) formal `react-i18next` JSON-key lookups (`t('auth.email')`) — used in only ~13 of 116 component files, mostly newer auth/form pages; (2) inline `isRTL ? 'نص عربي' : 'English'` ternaries directly in JSX — the dominant pattern across ~71 files, matching the same architectural approach the admin dashboard uses deliberately. `LanguageContext` is the single source of truth both patterns share for current language/direction.

### Animation
**GSAP** (+ ScrollTrigger) is the primary workhorse — hero entrances, staggered reveals, scroll effects, used directly in ~16 files. **Framer Motion** is scoped narrowly to route-transition orchestration (`AnimatePresence`, `PageTransition`). A custom, degrade-safe `useReveal`/`Reveal` IntersectionObserver system handles most homepage scroll-reveals independent of both libraries, deliberately defaulting to visible content if JS fails.

### Theming
**Single light theme, site-wide — no dark mode, confirmed by an explicit code comment.** CSS-custom-property-based color tokens (`--accent: 37 99 235` / `#2563EB`, consumed via a `themeColor()` Tailwind helper for opacity-modifier support). No component library (no shadcn/MUI) — hand-styled utility classes (`.btn-primary`, `.card-premium`) plus heavy inline `style={}` usage on marketing pages, more consistent Tailwind usage on newer pages and the entire admin surface.

---

# 11. APIs

**~119 endpoints across 22 route files.** Full method/path/access tables were verified against source; condensed by resource below (Pub=public, Auth=authenticated, Admin=`requireAdmin`, SuperAdmin=`requireSuperAdmin`, Perm(x)=granular permission).

| Resource | Base path | Endpoint count (approx.) | Access mix |
|---|---|---|---|
| Auth | `/api/auth` | 9 | All Pub except `/me`, `/resend-verification` |
| Users | `/api/users` | 13 | Mixed Auth (self-service) + Perm(users.*) for admin ops |
| Projects | `/api/projects` | 6 | Auth + Admin for mutations |
| Project Requests | `/api/project-requests` | 8 | Pub submit + Auth create + Admin triage |
| Messages | `/api/messages` | 10 | All Auth |
| Notifications | `/api/notifications` | 4 | Auth + Perm(notifications.broadcast) |
| Analytics | `/api/analytics` | 9 | Pub event ingest + Admin dashboards |
| Files | `/api/files` | 4 | All Auth |
| Feedback | `/api/feedback` | 6 | Pub submit + Auth self + Admin moderation |
| Portfolio | `/api/portfolio` | 15 | Pub read + Admin full CMS CRUD |
| Intro Video | `/api/intro` | 5 | Pub settings + Admin CMS |
| Homepage Video | `/api/homepage-video` | 6 | Pub settings + Admin CMS |
| Client Logos | `/api/client-logos` | 9 | Pub list + Admin CRUD |
| Start Project | `/api/start-project` | 3 | Pub + Admin |
| Invoices | `/api/invoices` | 6 | Auth (own) + Admin (all) |
| Billing | `/api/billing` | 13 | Pub plans/webhook + Auth self-service + Admin reporting |
| AI | `/api/ai` | 10 | Pub chat + Auth (plan-gated) + Admin |
| Support (AI chatbot + RAG) | `/api/support` | ~20 | Pub chat/upload/analyze + Auth + Admin ops (largest single route file) |
| Reports | `/api/reports` | 4 | Auth create + Admin manage |
| Search | `/api/search` | 1 | Auth, rate-limited |
| Settings | `/api/admin/settings` | 5 | Pub subset + Perm(settings.*) |
| Audit | `/api/audit` | 3 | All Admin |
| Activity | `/api/activity` | 2 | All Auth |
| Media | `/api/media/:id` | 1 | Pub, streams GridFS content |

**Notable API design decisions:**
- Stripe webhook (`POST /api/billing/webhook`) is mounted with `express.raw()` **before** the global JSON body parser — a deliberate fix for a historical bug where signature verification failed because the raw body had already been consumed.
- Portfolio admin endpoints support **bulk operations** (`POST /portfolio/admin/bulk`) and **cursor-based pagination** for the public list (`{createdAt,_id}` compound cursor, not offset-based).
- Most public/anonymous-facing endpoints carry a dedicated rate limiter with an explicit rationale in code comments (protecting metered LLM spend, preventing lead-form spam).
- Validation is **not** centralized through a validation library despite `express-validator` being an installed dependency — it is unused; validation is hand-written per controller.

---

# 12. Authentication

- **Registration:** email format check, 6-char min password, full-name min-length, permissive phone validation, requires brandName or companyName; first-ever user in the DB may self-register as ADMIN, all subsequent registrants forced to USER. Password hashed via a Mongoose `pre('save')` hook (bcrypt, 10 rounds).
- **Login:** explicit `+password +loginAttempts +lockUntil` field selection (these are `select:false` by default). 10-failed-attempt lockout, 2-hour cooldown. Blocks suspended accounts and Google-only accounts attempting password login with a clear redirect message.
- **JWT strategy:** single token type, no refresh token, 7-day expiry, delivered simultaneously as an httpOnly cookie (`sameSite:'lax'`, `secure` in production) and in the JSON response body — client may use either; Authorization header takes priority when both are present.
- **Password reset:** 32-byte random token, only its SHA-256 hash persisted, 1-hour expiry, enumeration-safe response wording identical regardless of whether the email exists.
- **Email verification:** hashed token pair, 24h expiry, 5-minute resend cooldown; **not currently enforced** anywhere as an access gate.
- **Google OAuth:** server-side `google-auth-library` authorization-code exchange (not client-side-only ID-token trust), auto-links to a pre-existing local account by email match, requires Google's own `email_verified`.
- **Sessions:** fully stateless (no server-side session store); Socket.IO connections independently verify the same JWT and join per-user rooms.
- **Security note:** no CSRF token exists anywhere in the app — `sameSite:'lax'` on the cookie is the sole mitigation, explicitly acknowledged in an inline code comment. This is a documented, still-open item as of the most recent audit (2026-07-27).

---

# 13. File Upload System

**Architecture:** `multer` (memory storage, no disk writes) → per-feature thin wrapper (`utils/*Media.js`) → shared `media/media.service.js` (the single choke point for every upload path in the app) → GridFS.

- **Storage:** GridFS is the sole active backend; Cloudinary/local-disk were used historically and have been fully migrated away (dedicated repair scripts exist specifically to clean up legacy artifacts like base64-inlined URLs).
- **Deduplication:** SHA-256 content hash checked against existing GridFS files before storing — identical bytes reuse the existing file rather than duplicating storage.
- **Validation:** two layers — claimed MIME type via multer `fileFilter`, then **magic-byte verification** via the `file-type` package inspecting actual bytes (guards against a spoofed `Content-Type` header). Per-feature MIME allow-lists and size ceilings (portfolio media 60MB combined image/video/audio, dedicated video 120MB, client logos 5MB, generic files 10MB).
- **Delivery:** public `GET /api/media/:id` streaming endpoint, HTTP Range support (206/416 responses), `ETag`, `Cache-Control: public, max-age=31536000, immutable` (safe since content is hash-addressed and therefore truly immutable), 304 handling.
- **Optimization:** **no on-the-fly image transcoding/resizing pipeline** — this was a Cloudinary-only capability that no longer exists; only image dimensions are read from file headers (no full decode). This is a genuine capability gap versus the prior Cloudinary-backed setup, worth flagging as a known trade-off of the GridFS migration.

---

# 14. UI/UX Review

- **Color palette:** single consistent blue accent `#2563EB` ("never mixed," per an in-code comment), white/near-white surface scale, near-black text (`#0D1117`), a small reserved-for-decoration gold token used only for star ratings/icons — never as a CTA color. All colors are CSS-custom-property tokens with a Tailwind opacity-modifier bridge.
- **Typography:** `Inter` (Latin) / `IBM Plex Sans Arabic` + `Alexandria` (Arabic), with a size-matched fallback stack for Arabic. Fluid `clamp()`-based type scale.
- **Design language:** minimal, light-only, "Minimal Tech White" — the result of a full rebrand away from an earlier gold/dark identity. No dark mode exists anywhere.
- **Spacing/Alignment:** token-based spacing scale on the admin system; more ad hoc (inline styles) on public marketing pages.
- **Accessibility:** targeted fixes have been made repeatedly (focus traps on modals/lightboxes, contrast-ratio corrections, form label additions after a 2026-07-24 audit found `ProjectRequestForm` had zero accessible labels on 6 inputs) — but **no formal axe/Lighthouse accessibility audit has ever been run**, confirmed as still true by the most recent project documentation.
- **Responsive:** mobile-first patterns present throughout; a real bug (hero artwork colliding with headline text below 1024px) was caught and fixed only in the most recent QA pass, illustrating that mobile-viewport testing had been inconsistent earlier in the project's history.
- **Animation:** GSAP for scroll/entrance choreography, Framer Motion narrowly for page transitions, a custom degrade-safe reveal system for homepage sections, and full `prefers-reduced-motion` support via a dedicated hook.
- **Consistency:** two parallel styling systems exist by design — inline styles/utility classes on the public site, Tailwind + a dedicated token package (`admin-ui`) on the authenticated app — which is a deliberate split, not an inconsistency, but is worth naming as an architectural decision a new engineer should know about.

---

# 15. User Journey

1. **Discovery** — visitor lands on Home (or a blog/case-study page) via organic search, an AI-answer-engine crawler (the site's `robots.txt` deliberately allows GPTBot/ClaudeBot/PerplexityBot), or a direct/social referral.
2. **Trust-building** — scrolls through real (or honestly-placeholder) portfolio work, multi-dimensional testimonials, WhatsApp-screenshot "client voices," the "Why YANSY" comparison, and process transparency.
3. **Engagement** — either opens the AI sales chat widget (which qualifies the lead conversationally, 2–5 messages, and is contractually barred from quoting a price) or clicks a "Start Your Project" CTA, landing on the WhatsApp-vs-form decision screen.
4. **Lead capture** — submits the structured project-request form (client type, budget, timeline, description) or continues on WhatsApp; either path lands in the admin's project-request/CRM/AI-lead pipeline with a lead score.
5. **Conversion to client** — after a human sales conversation (outside the platform, via WhatsApp/email), the prospect registers an account (email/password or Google OAuth), completes onboarding if needed.
6. **Delivery** — client sees their `Project` in the dashboard with live progress %, phase, and a staff-posted updates timeline; messages the team in real time; receives milestone-based invoices in their preferred currency.
7. **Payment** — pays invoices via Stripe checkout, or manages an ongoing subscription (if using AI/portal features) via the billing portal.
8. **Ongoing relationship** — uses AI-assisted briefs/estimates (paid tier), submits support tickets, leaves feedback/testimonials post-delivery, and can file abuse/moderation reports if needed.
9. **Internal mirror** — every step above generates a corresponding admin-side event: a new lead in AdminCRM/AI pipeline, a new thread in AdminMessages, a new invoice in AdminFinancial, a new audit-log entry for any privileged action taken on the client's behalf.

---

# 16. Business Workflow

1. **Lead generation** — public site + AI chat widget continuously capture inbound interest into `ProjectRequest`/`AIRequest`/`SupportConversation` records, each carrying a lead score and (for AI-sourced leads) a structured "project blueprint" summary.
2. **Triage** — an admin reviews new leads in `AdminCRM`/`AdminSupportAI`'s Leads & Requests tabs, moves status new→contacted→proposal_sent→won/lost, and adds internal notes.
3. **Onboarding** — a won lead becomes a registered `User`; if the deal includes a formal engagement, an admin creates a `Project` record and posts the first `updates` entry.
4. **Delivery loop** — admin posts progress updates and attachments to the project; progress % and phase advance (manually or via `updateProgress()`); client and admin exchange messages in the project's thread in real time.
5. **Billing** — admin issues milestone invoices (multi-currency) tied to the project; client pays via Stripe checkout; paid status syncs back automatically via webhook.
6. **Completion** — project reaches 100% progress (auto-transitions to `completed` status, stamps `completedDate`); admin may request a testimonial via the feedback flow.
7. **Post-delivery** — client remains in the portal for ongoing support tickets, AI-assisted future-scope estimates, and subscription management if applicable; their feedback (if submitted) can be moderated and optionally published as a public testimonial, feeding back into step 1's trust-building loop.
8. **Continuous operations** — in parallel, admins monitor system health, AI cost, audit logs, and analytics dashboards to keep the whole loop healthy.

---

# 17. Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19, React Router 7 |
| Build tool | Vite 7 |
| State management | Redux Toolkit (5 slices) + React Context (language) |
| Styling | Public site: inline styles + `index.css` utility classes. Authenticated app: Tailwind CSS + dedicated `admin-ui` token package |
| Animation | GSAP + ScrollTrigger (primary), Framer Motion (route transitions only) |
| i18n | react-i18next (partial) + inline ternary pattern (dominant) — `LanguageContext` as shared source of truth |
| Real-time (client) | socket.io-client |
| Backend framework | Node.js ≥20, Express 5 |
| Database | MongoDB via Mongoose; GridFS for binary storage |
| Real-time (server) | Socket.IO on the same HTTP server, JWT-authenticated handshake |
| Auth | jsonwebtoken, bcryptjs, google-auth-library |
| File uploads | multer (memory) + file-type (magic-byte validation) + image-size |
| Payments | Stripe (subscriptions, checkout, portal, webhooks) |
| Email | Nodemailer (SMTP-agnostic), 12+ branded HTML templates |
| AI — authenticated app | Anthropic Claude (`@anthropic-ai/sdk`, `claude-sonnet-4-6`), with prompt caching |
| AI — public chat widget | OpenAI (`gpt-4o-mini` default, raw axios calls — no official SDK dependency) |
| Document/URL analysis | `mammoth` (.docx), `pdf-parse` (PDF), `cheerio` (URL scraping) |
| Security middleware | Helmet, CORS, express-rate-limit, hand-rolled NoSQL/XSS sanitizers |
| Analytics | First-party custom analytics + Google Analytics 4 + Meta Pixel/Conversions API + Microsoft Clarity |
| Process management | PM2 (`ecosystem.config.cjs`), single forked process |
| Web server | Nginx (static SPA hosting + reverse proxy with WebSocket upgrade support) |
| Testing | Jest + Supertest (server-side only — no frontend test suite exists) |
| Deployment | Shell-script deploy (`deploy/deploy.sh`) — no CI/CD pipeline found |
| Hosting | Single VPS, not containerized (no Docker/Kubernetes) |

**External services depended on:** Cloudinary (legacy, migrated off), Stripe, Anthropic API, OpenAI API, an SMTP provider, Google OAuth, Google Analytics 4, Microsoft Clarity, Meta Pixel/Conversions API, WhatsApp Business (via `wa.me` deep links only — not the official API).

---

# 18. Performance

- **Code-splitting:** every route except `Home` is `React.lazy()`-loaded; heavy homepage sections below the fold are similarly split so other routes don't pay their cost.
- **Image handling:** `ProgressiveImage` component with blur-up/dominant-color placeholders and Cloudinary-style responsive `srcset` where applicable — adoption is **inconsistent** (raw `<img>` still used in several spots, a known gap per the project's own audits).
- **Caching:** GridFS-served media uses immutable, 1-year `Cache-Control` (safe due to content-addressing); `compression` middleware (gzip/deflate, level 6) on all API responses.
- **Bundle size:** main JS bundle tracked across audits at ~509KB (148KB gzipped) in one pass and ~580KB (178KB gzipped) in a later pass — trending larger, with no dedicated code-splitting/tree-shaking pass ever performed specifically to address it.
- **SEO:** per-page `useSEO` hook injecting meta tags and JSON-LD (`@graph` WebPage+FAQPage on Home, `CreativeWork` on case studies, `Article` on blog posts), a manually maintained `sitemap.xml`, and a `robots.txt` that deliberately allows AI-crawler bots as a discoverability bet.
- **Core Web Vitals:** **no formal Lighthouse audit has ever been run** against this codebase, confirmed as still true as of the most recent project documentation — this is a real, acknowledged gap rather than a measured-and-passing item.
- **No CDN** in front of Nginx; no Redis or other shared cache layer (rate limiting is in-process memory, which resets on every deploy/restart and doesn't share state across a multi-instance deployment — though the current deployment is a single non-clustered PM2 process, so this is a latent rather than active issue).

---

# 19. Security

*This section deliberately does not soften the codebase's own most recent, most rigorous audit findings.*

### Authentication & authorization
Two-layer RBAC (role hierarchy + granular permission matrix), account lockout, bcrypt hashing, enumeration-safe password reset, magic-byte file validation, immutable audit logging for privileged actions — all genuine strengths independently confirmed across multiple audit passes.

### 🔴 The confirmed, currently unfixed critical finding
**`PATCH /api/users/:id` allows any ADMIN to grant themselves (or anyone) `SUPER_ADMIN`** — no target-role hierarchy check, no self-target block, no audit log entry, and no validation of the submitted role string against the actual enum. A correctly-guarded sibling endpoint (`PATCH /api/users/:id/role`) exists and does this safely, but the vulnerable endpoint is still reachable and still used by the current CRM/user-management UI paths. **Related:** the same controller's delete/suspend actions check only whether the *actor* is targeting themselves, never whether the *target* is a SUPER_ADMIN — so an ADMIN can currently delete or deactivate a SUPER_ADMIN account. Together these two bugs mean the ADMIN/SUPER_ADMIN boundary is not currently enforced. **This should be the top engineering priority ahead of any new feature work.**

### Other confirmed open items (as of the most recent audits, 2026-07-27 / 2026-07-30)
- **No CSRF protection** anywhere — `sameSite:'lax'` on the auth cookie is the sole mitigation; the cookie is documented to fall back to `SameSite=None` in some production configurations, which would remove even that protection.
- **No refresh-token rotation** — a single 7-day JWT with no revocation mechanism short of waiting for expiry.
- **JWT also stored in localStorage** (dual-mode with the httpOnly cookie) — a documented, not-yet-fully-closed XSS exposure surface.
- **`GET /api/support/conversation/:sessionId` is fully public/unauthenticated** — exposes a full AI-chat transcript plus any captured lead PII to anyone who knows or guesses a session ID.
- **No 2FA** — a `security.require2FA` setting exists in the seeded config but is not implemented.
- **Object-level authorization (IDOR) has not been independently re-verified line-by-line** on `projects`, `files`, and `messages` routes — ownership checks exist in controller logic but the most recent audit explicitly flagged this as unverified rather than confirmed-safe.
- **`role === 'ADMIN'` literal-string comparisons** in 6+ locations (plan-gate, AI rate-limit, search, AI controller) bypass those checks only for the exact string `'ADMIN'`, not via the role hierarchy — meaning SUPER_ADMIN does **not** automatically inherit these bypasses, an inconsistency in the opposite direction from the escalation bug above.
- **Structured logging absent** — no Winston/Pino, no HTTP access-log middleware, limiting production observability and forensic capability if an incident occurs.

### Genuine strengths (independently confirmed, not self-reported)
Rate limiting is layered and consistently applied to every unauthenticated/cost-bearing/spam-prone endpoint with documented rationale per limiter. File upload validation (magic-byte + size + content-addressed dedup) is stronger than a typical MVP. The Stripe webhook's raw-body-before-JSON-parser ordering is correctly implemented (fixing a real historical production bug). The DB-availability circuit breaker and graceful-shutdown handling reflect real production-operations maturity uncommon in a solo/small-team project.

---

# 20. Challenges Solved

- **A covert data-exfiltration beacon** was present in the pre-hardening codebase (posting internal request data to a hardcoded local address in both frontend and backend, wrapped in a swallow-all try/catch) — found and removed across **two** separate locations (the second was missed by the first pass and caught only by an independent verification audit).
- **Broken Stripe webhook signature verification** — the global JSON body parser was consuming the raw request body before the webhook route's raw-body middleware ever ran, silently breaking all production payment-state sync; fixed by reordering middleware registration.
- **A homepage lead form silently posting to a route that never existed** (`/api/contact`) — found and fixed; likely never worked in production before discovery.
- **Zero notifications on any new lead** — an admin-notification function existed in code but was never actually invoked from any lead-capture path; leads were being captured to the database with no one told.
- **File uploads were non-functional stubs** in the original build — rebuilt into a real, validated, deduplicated GridFS pipeline.
- **A full storage-provider migration** (Cloudinary/local-disk → GridFS) executed with dedicated, idempotent migration and repair scripts rather than a risky in-place rewrite.
- **Repeated "invisible content" bugs** — dark-theme section backgrounds left in place after a light-theme rebrand, producing black-text-on-black-background sections; found and fixed across multiple files in more than one audit pass (the same bug class recurred in a different file months later, illustrating why the project now treats every "100% done" claim with explicit skepticism).
- **Admin role-check bug** (`fileController.js` compared against lowercase `'admin'` instead of `'ADMIN'`) silently broke all admin file-deletion — a one-character bug with real functional impact, caught by a security audit rather than a functional QA pass.
- **Express 5 compatibility issue** — `express-mongo-sanitize`'s approach of reassigning `req.query` broke under Express 5 (which made `req.query` a read-only getter); solved with a hand-rolled equivalent rather than downgrading Express.

---

# 21. Future Improvements

**Security (highest priority):**
1. Fix the ADMIN→SUPER_ADMIN privilege-escalation bug and the SUPER_ADMIN delete/suspend gap (§19) — should block other RBAC work until resolved.
2. Implement CSRF protection (or migrate fully to Authorization-header-only auth, eliminating the cookie-CSRF vector entirely, as previously recommended in the project's own audits).
3. Add refresh-token rotation and session invalidation on password change.
4. Add authentication/scoping to the public support-conversation endpoint.
5. Independently re-verify object-level authorization (IDOR) on projects/files/messages routes.
6. Replace literal `role === 'ADMIN'` checks with the existing role-hierarchy comparison everywhere.

**Product/Engineering:**
- Decide the MANAGER role's fate — either build its admin UI or retire the role from the schema.
- Consolidate the three overlapping AI-usage/cost ledgers (`AIUsage`, `AiCostLog`, `AIRequest`) if they continue to diverge.
- Add structured logging (Winston/Pino) and HTTP access logs for production observability.
- Add a frontend test suite (currently server-only Jest coverage; no React component/e2e tests exist).
- Run a formal Lighthouse/axe accessibility and performance audit — never done despite being repeatedly recommended.
- Reduce/monitor main bundle size, which has trended larger across audits.
- Consider re-introducing an image-transcoding pipeline (resize/format conversion) now that the Cloudinary-based auto-transform capability is gone post-GridFS-migration.
- Introduce a CI/CD pipeline — none currently exists; deployment is a manual shell script.
- Standardize password-length requirements (currently 6 chars at registration, 8 chars at reset — should be consistent).

**Business/Content (per the project's own backlog):**
- Build the 15 previously-briefed per-industry deep pages (currently only 8 summary cards exist).
- Decide and build dedicated pages for standalone services currently folded into a generic category (AI integration, automation, maintenance, hosting, SEO).
- Replace remaining placeholder case-study assets with real client work once available — the project has a standing rule never to fabricate this.
- Consider MENA-specific payment rails (Mada, Fawry, KNET) if regional expansion is prioritized — proposed in planning docs but unconfirmed as built.

---

# 22. Portfolio Case Study

**YANSY Tech — A Bilingual Agency Operations Platform**

*Category: Full-Stack Product Design & Engineering | Client Portal + Admin Ops + Public Marketing Site*

**The Challenge:** Build a single platform that could carry a digital agency's entire client-facing and operational surface — win the lead, deliver the project, collect the payment, and run the business — natively bilingual in Arabic and English with correct RTL support throughout, for a market segment most competing tools treat as an afterthought.

**The Approach:** Rather than bolting Arabic support onto an English-first product, the platform was built with `LanguageContext` and RTL-mirroring as a first-class architectural concern from the routing layer down through every shared component, modal, and data table. A single design-token system (`admin-ui`) unifies the authenticated app's visual language across all 19 admin modules and the client dashboard, while the public marketing site runs its own lighter-weight, animation-forward styling optimized for conversion.

**Key Engineering Decisions:**
- **Content-addressed, magic-byte-validated file storage** (GridFS + SHA-256 dedup + `file-type` verification) — chosen over trusting client-supplied MIME types, closing a real spoofing vector while also eliminating duplicate storage.
- **Two separate AI integrations for two separate jobs** — Anthropic Claude for paid, authenticated in-app features (prompt-cached for cost efficiency), OpenAI for the public, cost-sensitive, high-volume sales chat widget — rather than forcing one provider to serve both very different traffic/cost profiles.
- **A Notion-style polymorphic content-block schema** for the portfolio CMS, giving non-developer admins the flexibility to compose varied case-study layouts (galleries, before/afters, stat rows, embeds) without a developer touching code for every new case study.
- **An audit-log-first admin architecture** — nearly every privileged mutation across the 19 admin modules writes an immutable, TTL-retained `AuditLog` entry with before/after snapshots, a discipline that made it possible to build trust-and-safety features (AdminAuditLog, AdminReports) without retrofitting tracking later.

**The Outcome:** A working, three-surface platform (marketing site + client portal + admin operations) backed by ~29 database models, ~119 API endpoints, and 52 frontend pages, with genuinely differentiated technical strengths (RTL-first bilingual architecture, layered AI cost tracking, defense-in-depth file uploads) alongside honestly-documented open items (a confirmed authorization bug, no CSRF, incomplete accessibility auditing) that the project's own internal audit culture continues to track and prioritize rather than hide.

---

# 23. CV Version

**YANSY Tech Platform** — Full-Stack Bilingual SaaS/Agency-Operations Platform
*Role: Lead Full-Stack Engineer & Product Architect (solo/small-team build)*

**Responsibilities:**
- Architected and built a three-surface platform (public marketing site, authenticated client portal, internal admin system) on a MERN-adjacent stack (React 19, Redux Toolkit, Node/Express 5, MongoDB/Mongoose, Socket.IO).
- Designed a ~29-model MongoDB schema covering CRM, project delivery, billing/invoicing, portfolio CMS, messaging, and AI usage tracking, with compound indexing on every high-traffic query path.
- Implemented dual AI integrations (Anthropic Claude for authenticated features with prompt caching; OpenAI for a public RAG-grounded sales chat widget) with per-call cost/token ledgering and plan-tiered rate limiting.
- Built a content-addressed, magic-byte-validated GridFS file-upload pipeline, migrating the platform off a third-party CDN storage provider without downtime.
- Delivered a fully bilingual (Arabic/English) experience with correct RTL layout mirroring across 52 pages and a 19-module admin dashboard.
- Ran iterative self-audits (27 documented review passes) covering security, RBAC, accessibility, and production readiness — independently identifying and fixing a covert data-exfiltration beacon, a broken Stripe webhook signature check, and a silent lead-notification failure.
- Currently maintains a documented, unresolved privilege-escalation finding in the RBAC layer as the top open engineering priority.

**Technologies:** React 19, Redux Toolkit, React Router 7, Vite, Tailwind CSS, GSAP, Framer Motion, Node.js, Express 5, MongoDB/Mongoose, GridFS, Socket.IO, JWT, Stripe API, Anthropic Claude API, OpenAI API, Nodemailer, PM2, Nginx.

**Impact (engineering, not business-outcome claims — see honesty note at top of this document):** Consolidated what would typically require 4-5 separate SaaS tools (CRM, project management, invoicing, support ticketing, chatbot) into a single owned codebase; built the only Arabic-native, RTL-first client-portal architecture referenced against named Western competitors (Copilot.so, HoneyBook, Dubsado) in the project's own competitive positioning.

---

# 24. LinkedIn Version

🚀 **Project: YANSY Tech — Bilingual Digital Agency Platform**

Built a full-stack platform that runs a digital agency end-to-end: a conversion-focused marketing site, a real-time client portal, and a 19-module internal admin system — all natively bilingual in Arabic and English with full RTL support.

Highlights:
🔹 React 19 + Redux Toolkit frontend, Express 5 + MongoDB backend, Socket.IO real-time messaging
🔹 Dual AI integration — Anthropic Claude for in-app features, OpenAI for a RAG-grounded public sales assistant
🔹 Stripe-backed subscriptions + a standalone 8-currency invoicing system
🔹 Content-addressed, magic-byte-validated file storage pipeline (GridFS)
🔹 A Notion-style flexible content-block CMS for the portfolio/case-study system
🔹 Immutable audit logging across every privileged admin action

What made this project genuinely interesting was building RTL-first, not RTL-as-an-afterthought — every shared component, from data tables to modals to the design-token system, was built to mirror correctly from day one, for a market most competing tools (Copilot.so, HoneyBook, Dubsado) don't natively serve.

Also proud of the engineering discipline around self-review: repeated independent security/accessibility/production-readiness audits caught and fixed real issues — including a covert data beacon and a broken payment-webhook signature check — before they became incidents.

#FullStack #ReactJS #NodeJS #MongoDB #SaaS #i18n #RTL

---

# 25. GitHub Version

**Repository description:**
> Bilingual (AR/EN, RTL) full-stack platform for running a digital agency — public marketing site, real-time client portal, and a 19-module admin panel. React 19 · Express 5 · MongoDB · Socket.IO · Stripe · Claude + OpenAI.

**README summary:**
A three-surface application: (1) a public marketing/portfolio site with a CMS-driven case-study system and an AI-powered lead-qualification chat widget, (2) an authenticated client portal for project tracking, real-time messaging, and billing, and (3) an internal admin panel covering CRM, portfolio management, finance, system health, RBAC, and AI-support operations. Built with React 19/Redux Toolkit/Vite on the frontend and Express 5/MongoDB/Socket.IO on the backend, with Stripe for payments and dual AI provider integration (Anthropic Claude + OpenAI). Fully bilingual (Arabic/English) with RTL layout support end-to-end.

**Topics/tags:** `react` `nodejs` `express` `mongodb` `mongoose` `socketio` `stripe` `i18n` `rtl` `arabic` `claude-api` `openai-api` `redux-toolkit` `vite` `tailwindcss` `gridfs` `admin-dashboard` `saas` `client-portal` `crm`

---

# 26. Behance Version

**YANSY Tech — Designing a Bilingual Client Experience**

*A case study in building RTL-first, not RTL-as-afterthought.*

Most Arabic-market SaaS tools start life in English and get Arabic bolted on later — text gets mirrored, but the underlying rhythm of the interface (icon direction, spacing logic, data-table alignment, form flow) stays fundamentally left-to-right in its bones. This project set out to do the opposite.

**The visual system** is deliberately restrained: a single blue accent (`#2563EB`), a near-black text scale, and a light-only "Minimal Tech" surface — replacing an earlier, heavier gold-and-dark identity. The restraint was a conscious trade: with two languages, two directions, and 52 pages to keep coherent, a smaller, more disciplined palette scales better than a decorative one.

**The client-facing product design problem:** how do you make a client feel informed about a project they can't see being built? The answer here was a visible-progress-first dashboard — a live percentage, a phase indicator, a staff-posted updates timeline, and messaging that behaves like the tool clients already trust (WhatsApp), rather than a generic ticketing inbox.

**The internal-tool design problem:** an agency's own team needs to move fast across 19 different operational surfaces without the UI becoming noise. The admin system solves this with one shared token/component library (`admin-ui`) reused everywhere — every table, modal, badge, and status pill looks and behaves identically whether you're moderating feedback or reviewing AI cost analytics, so the interface disappears and the data takes over.

**Proof-of-craft details:** a degrade-safe scroll-reveal system that defaults to fully visible content if JavaScript ever fails; a lead-scoring visualization that reads instantly at a glance (color-graded 0–100 bars); a funnel drop-off chart for the "Start a Project" decision screen that shows exactly where prospects abandon a multi-step form.

---

# 27. One Paragraph Version (~100 words)

YANSY Tech is a full-stack, bilingual (Arabic/English, RTL) platform that runs a digital agency end-to-end: a conversion-focused public marketing site, a real-time client portal for tracking commissioned projects, and a 19-module internal admin system covering CRM, billing, portfolio content, and AI-powered support. Built on React 19, Redux Toolkit, Express 5, and MongoDB, it integrates Stripe for payments, dual AI providers (Anthropic Claude and OpenAI) for authenticated features and public lead qualification respectively, and a content-addressed GridFS file-storage pipeline with magic-byte upload validation. The project maintains an unusually rigorous internal audit culture, tracking its own security posture and completion claims across 27 documented review passes.

---

# 28. Short Version (~50 words)

A bilingual (Arabic/English, RTL) full-stack platform combining a public marketing site, a real-time client portal, and a 19-module admin panel for running a digital agency end-to-end — built with React 19, Express 5, MongoDB, Socket.IO, Stripe, and dual AI integrations (Claude + OpenAI) for in-app assistance and lead qualification.

---

# 29. One-Line Pitch

A bilingual, RTL-first client-portal-and-admin platform that lets a digital agency win, deliver, bill, and support every client from one real-time system.

---

# 30. Resume Keywords (ATS-optimized)

React.js, React 19, Redux Toolkit, React Router, Vite, Node.js, Express.js, Express 5, MongoDB, Mongoose, GridFS, Socket.IO, WebSockets, REST API, RESTful API Design, JWT Authentication, OAuth 2.0, Google OAuth, Role-Based Access Control (RBAC), Stripe API, Payment Integration, Subscription Billing, Multi-Currency Invoicing, Anthropic Claude API, OpenAI API, Large Language Models (LLM), Retrieval-Augmented Generation (RAG), AI Chatbot Development, Prompt Engineering, Full-Stack Development, MERN Stack, Internationalization (i18n), RTL Layout, Arabic Localization, Bilingual UI Development, Tailwind CSS, GSAP, Framer Motion, Real-Time Messaging, CRM System Design, Content Management System (CMS), Admin Dashboard Design, Database Schema Design, MongoDB Indexing, File Upload Security, Content-Addressed Storage, Rate Limiting, XSS Prevention, NoSQL Injection Prevention, Audit Logging, Security Auditing, Web Application Security, Nodemailer, Nginx, PM2, Jest, Supertest, Agile Development, Product Design, UI/UX Design.

---

# 31. Technologies Used (Categorized)

| Category | Technologies |
|---|---|
| **Frontend** | React 19, React Router 7, Redux Toolkit, Vite 7, Tailwind CSS, GSAP, Framer Motion, react-i18next, react-hot-toast, lucide-react |
| **Backend** | Node.js, Express 5, Socket.IO, Multer, express-rate-limit, Helmet |
| **Database** | MongoDB, Mongoose ODM, GridFS |
| **Cloud/External services** | Stripe, Anthropic (Claude), OpenAI, Google OAuth, Google Analytics 4, Meta Pixel/Conversions API, Microsoft Clarity, geoip-lite |
| **Deployment/Infra** | PM2, Nginx, VPS hosting (non-containerized), shell-script deploy |
| **Authentication** | JWT (jsonwebtoken), bcryptjs, google-auth-library, httpOnly cookies |
| **Libraries — file/media** | file-type, image-size, mammoth, pdf-parse, cheerio |
| **Libraries — comms** | Nodemailer |
| **Dev tools** | ESLint, Jest, Supertest, Nodemon, PostCSS, Autoprefixer |

---

# 32. Metrics

*Marked clearly: **[Verified]** = confirmed against source code, **[Documented, self-reported]** = from the project's own historical reports (not independently re-audited here), **[Target/Aspirational]** = a stated goal, not an achieved outcome.*

| Metric | Value | Status |
|---|---|---|
| MongoDB models | 29 across 27 files | **[Verified]** |
| API endpoints | ~119 across 22 route files | **[Verified]** |
| Frontend page components | 52 | **[Verified]** |
| Admin dashboard modules | 19 | **[Verified]** |
| i18n dictionary size | 1,247 lines per language | **[Verified]** |
| Case studies published | 9 | **[Verified]** (uses placeholder imagery, see honesty note) |
| Blog articles | 30 (English content, bilingual chrome) | **[Verified]** |
| Server test suite | 6 Jest suites, 1,379 lines | **[Verified — file exists]**; pass/fail count conflicts across documents (161/161 claimed at one point, 8-failing more recently) — **[Documented, self-reported, unresolved conflict]** |
| Self-reported project completion | Ranged 70% → 88% → 93% across same-day documents | **[Documented, self-reported — internally inconsistent, do not treat as fact]** |
| AI feature unit economics | ~90% gross margin at $49/mo tier with ~$5/user/month AI cost | **[Documented, self-reported]** — the only concrete unit-economics figure in the project |
| Current MRR | $0 | **[Documented, self-reported]** |
| Target MRR at fundraise | $5,000/mo | **[Target/Aspirational]** |
| Average delivery time claim | ~14 days | **[Documented, marketing claim — not independently verifiable]** |
| Main JS bundle | ~580KB / ~178KB gzipped (latest audit) | **[Documented, self-reported]** |
| Client build | 2,493 modules, 0 errors | **[Documented, self-reported]** |
| Lighthouse/accessibility audit | Never formally run | **[Verified absence]** |

---

# 33. Strengths

1. **Genuinely RTL-first architecture** — Arabic support built into the routing/component/design-token layer from the start, not bolted on, a real differentiator versus named Western competitors.
2. **Layered, real AI integration** — two purpose-fit providers, prompt caching, per-call cost ledgering, and plan-tiered rate limiting, not a superficial chatbot wrapper.
3. **Defense-in-depth file uploads** — magic-byte validation, content-addressed dedup, sanitized opaque IDs — stronger than most MVP-stage upload pipelines.
4. **Disciplined database design** — indexes matched to every real query pattern, TTL cleanup on log/analytics collections, schema-level validation (including rejecting `data:` URIs to prevent document bloat).
5. **Real production-operations maturity** — DB-availability circuit breaker, graceful shutdown, request-timeout guards, maintenance-mode gating — details often skipped in solo/small-team projects.
6. **A genuinely self-critical audit culture** — 27 documented review passes that catch and name real bugs (a data-exfiltration beacon, a broken webhook, dark-on-light contrast failures) rather than rubber-stamping "done."
7. **A coherent, restrained visual design system** with a shared token package powering 19 admin modules consistently.
8. **A flexible, non-developer-editable portfolio CMS** (polymorphic content blocks) that avoids hardcoding every case study in JSX.

---

# 34. Weaknesses

1. **A confirmed, currently unfixed authorization bug** allowing privilege escalation from ADMIN to SUPER_ADMIN — the single most serious issue in the codebase today.
2. **No CSRF protection anywhere**, relying solely on `sameSite: lax`.
3. **No refresh-token rotation or session invalidation** on password change.
4. **Two coexisting, unreconciled i18n patterns** (formal i18next keys vs. inline ternaries) rather than one clean system.
5. **No frontend test suite** at all — testing coverage exists only on the server.
6. **No formal accessibility or performance audit ever run**, despite repeated internal recommendations to do so.
7. **No structured logging** (console-only), limiting production debuggability.
8. **No CI/CD pipeline** — deployment is a manual shell script.
9. **History of overstated completion claims** in the project's own documentation, requiring a reader to independently verify rather than trust any single historical report (a process weakness as much as a code weakness).
10. **Business-outcome claims (revenue, client base) are unverifiable** from the code and its own paperwork as of this writing — not a code defect, but material context for anyone using this dossier to represent the project externally.
11. **No image-optimization pipeline** post-GridFS-migration — a real capability regression versus the earlier Cloudinary-backed setup.
12. **Public support-conversation endpoint has no authentication**, exposing chat transcripts/PII to anyone with a session ID.

---

# 35. Final Professional Score

*Scored against the actual verified implementation, not the project's own historical self-scores (several of which are shown above to be internally inconsistent).*

| Dimension | Score /100 | Rationale |
|---|---|---|
| **Architecture** | 80 | Clean separation of concerns (controllers/routes/middleware/media-service layer), sound data model, but no service-layer abstraction beyond `media/`, and three overlapping AI-usage models that should be consolidated. |
| **Code Quality** | 68 | Real strengths (indexing discipline, upload validation) offset by hand-rolled security middleware where maintained libraries were already installed-but-unused, ~140 known ESLint issues in the authenticated app, and inconsistent API-client usage (several pages bypass the shared `api.js` with raw `fetch`/`axios`). |
| **UI** | 82 | Coherent, restrained visual system; genuinely strong bilingual/RTL execution; consistent admin design-token package across 19 modules. |
| **UX** | 76 | Thoughtful client-facing flows (live progress, WhatsApp-style messaging) and a well-organized admin IA, docked by incomplete accessibility coverage and historically recurring "invisible content" contrast bugs. |
| **Scalability** | 62 | Single non-clustered process, in-memory rate limiting (not shared across instances), no Redis/CDN, no containerization — fine for current single-VPS scale, would need real work before multi-instance deployment. |
| **Security** | 58 | Genuine strengths in upload validation and rate limiting undermined by one confirmed, currently-exploitable privilege-escalation bug, no CSRF protection, and an unauthenticated PII-exposing endpoint — the score reflects that a real, severe, *known* vulnerability currently exists in production code. |
| **Business Value** | 55 | The engineering clearly supports a real business use case (agency operations), but the business itself is not independently verifiable as currently operating from the code or its own documentation — scored on demonstrated capability, not unverifiable outcomes. |
| **Maintainability** | 70 | Consistent naming/structure, decent module boundaries, but no frontend tests, console-only logging, and no CI/CD make regressions and onboarding costlier than they should be. |
| **Documentation** | 85 | Unusually extensive — 27 historical review documents plus this dossier — a genuine strength, though the historical documents' internal inconsistency (flagged throughout) means a reader must cross-reference rather than trust any single file in isolation. |
| **Overall Score** | **71 / 100** | A substantial, technically capable platform with real architectural strengths (RTL-first design, layered AI integration, disciplined data modeling) that is held back from a higher score by one confirmed critical security bug, incomplete test/observability coverage, and unverifiable business-outcome claims. The honest, self-critical audit trail this project maintains is itself a mitigating strength — the gaps above are known and named, not hidden. |

---

*Dossier compiled 2026-07-30 by full codebase inspection (backend, database, frontend, admin panel) plus synthesis of 27 historical project reports. No feature, metric, or business claim in this document was invented — where the underlying facts were themselves uncertain or self-contradictory in the project's own paperwork, that uncertainty is preserved rather than resolved by assertion.*
