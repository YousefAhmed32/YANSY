# IMPLEMENTATION_PLAN — Phase 2 Correction + Portfolio Ordering System

**Date:** 2026-08-06
**Author:** Lead Software Architect (this pass)
**Trigger:** Direct product-owner correction of Phase 1 (`REVIEW.md`) — the concept-type field-hiding went further than intended and made UI/UX Concept projects feel like a reduced/lightweight product, plus a new, explicitly-requested manual ordering system.

This plan covers two independent, unrelated pieces of work landing together. Nothing here is speculative — every claim is grounded in the current diff (`git diff`) and the actual route/schema/component code, read in full before writing this.

---

## Part 1 — Correcting the Concept-Type Vision

### 1.1 What Phase 1 actually did (the mistake)

`REVIEW.md` (already in the repo, describing the uncommitted diff) implemented `isConceptType`-driven field hiding across two wizard sections:

| Field | Phase 1 behavior |
|---|---|
| Client picker + logo + Location + Confidential toggle | **Force-hidden** for concept types |
| Live URL | **Force-hidden** for concept types |
| Results, Headline Metrics, Performance Before/After, Testimonials, Awards | **Force-hidden** for concept types |
| Chat Proof (WhatsApp screenshots), FAQs | Left visible for every type |

This is a wider blast radius than the brief ever asked for. Hiding the Client picker and Live URL — fields that were **already optional in the schema before Phase 1** (`server/models/PortfolioProject.js`, no `required: true` on either) — removes wizard *capability*, not just wizard *noise*. That is exactly what reads as "this project type gets a smaller, worse editor," which is the complaint.

### 1.2 The corrected rule

> Hide only what would require **fabricating a claim**. Everything else stays exactly as available as it is for any other project — optional, not forced, not removed.

| Field | New behavior | Why |
|---|---|---|
| Client (picker, logo, Location, Confidential) | **Always visible**, unconditionally optional (unchanged from pre-Phase-1/base schema behavior) | A concept can legitimately have a real client (an unshipped pitch); admin decides, wizard never decides for them |
| Live URL | **Always visible**, unconditionally optional | Same reasoning — nothing dishonest about an *empty* URL field; the dishonesty was only ever in *fabricating* one |
| Awards | **Always visible/editable**; simply doesn't render on the public page when the list is empty (already true — `ProofSection.jsx` returns `null` unless `awards.length \|\| screenshots.length \|\| audioSrc`) | A concept project can win a real award (Dribbble feature, a design competition) — no reason to structurally block it |
| Results, Headline Metrics, Performance Before/After, Client Testimonials | **Stays force-hidden** for concept types | These are the actual fabrication risk — a business outcome, a KPI, or a quoted client testimonial cannot exist without a real, verifiable engagement |
| Chat Proof (WhatsApp screenshots) | **Newly force-hidden** for concept types | WhatsApp proof screenshots exist specifically to evidence a *real client conversation*. That's exactly the kind of claim a self-directed concept project shouldn't be presenting, even informally. This was a gap in Phase 1, not a deliberate keep. |
| FAQs | Unchanged, always visible | Applies to any project type as-is (e.g. "Why wasn't this shipped?" is a legitimate FAQ) |

Net effect: of the seven things Phase 1 hid, three (Client, Live URL, Awards) get restored to always-available; one (Chat Proof) newly joins the hidden set; three (Results, Metrics/Performance, Testimonials) are unchanged. The public detail page needs **zero changes** either way — every section there already gates on data presence, not on `projectType` (verified again in this pass, same as Phase 1's own finding).

### 1.3 Files touched

- **`client/src/components/portfolio-wizard/OverviewSection.jsx`** — remove the `{!isConceptType && (...)}` wrapper around the Client block (picker/logo/Location/Confidential) and around the Live URL field; both render unconditionally again, exactly like Category/Industry/Figma/GitHub. Rewrite `L.conceptHint` (the inline info banner) to describe the corrected, narrower hide list.
- **`client/src/components/portfolio-wizard/ProofResultsSection.jsx`** — remove the `{!isConceptType && (...)}` wrapper around the Awards block (always visible now); add a new `{!isConceptType && (...)}` wrapper around the Chat Proof block (screenshots repeater). Results/Metrics/Performance/Testimonials keep their existing wrapper, unchanged.
- **`client/src/pages/PortfolioWizard.jsx`** — the sidebar's per-section "complete" dot for `proof` currently reads `Boolean((form.proofScreenshots || []).length || (form.faqs || []).length)` for concept types. Since Chat Proof is now hidden for concept types, that dot would look for data the wizard no longer lets the admin enter — a fresh bug introduced by 1.2's own change if left alone. Fix: for concept types, the dot should read `Boolean((form.faqs || []).length)` only. `CORE_SCORE_FIELDS`/`LIVE_ONLY_SCORE_FIELDS` (the 0–100% bar) need **no change** — neither list ever scored Client/Live URL-as-required or Chat Proof/Awards, so restoring/narrowing visibility doesn't touch the score.
- **`USER_GUIDE.md`** — full rewrite of §4 ("The Dynamic Wizard — Exactly What Changes") and the related table in §6, since both currently describe the Phase 1 (over-hidden) behavior as ground truth.
- **`REVIEW.md`** — left as-is (historical record of what Phase 1 actually shipped); a one-line pointer is added at its top to this plan so nobody mistakes it for current behavior.

### 1.4 Explicitly not changed

- The `ProjectType` library, `isConceptType` flag mechanism, and `deliveryStatus` field are all correct as built — the *mechanism* was never the problem, only how much it was wired to hide.
- No public-facing component changes (`Hero.jsx`, `StoryBeats.jsx`, `ImpactSection.jsx`, `ProofSection.jsx`) — confirmed again, all already data-driven.
- No schema changes for Part 1 — this is 100% a wizard-visibility correction.

---

## Part 2 — Portfolio Ordering System ("Display Order")

### 2.1 What already exists (must not be duplicated)

A manual-order mechanism **already exists**, discovered while reading the code, not part of the current diff:

- `PortfolioProject.order: { type: Number, default: 0 }`, indexed via `{ status: 1, order: 1, createdAt: -1 }`.
- Admin drag-and-drop reordering in `AdminPortfolio.jsx` (`GripVertical`, `handleDrop`), writing sequential `order: i` values via `PATCH /api/portfolio/admin/reorder`.
- The **admin** list's default sort already uses `{ order: 1, createdAt: -1 }`.
- The **public** listing (`GET /api/portfolio`, the one visitors hit) does **not** use `order` at all — its default sort is pure `{ createdAt: -1, _id: -1 }` via cursor pagination. This is the actual gap the brief is asking to close.

Two real, pre-existing bugs found while tracing this:
1. **Cross-page corruption**: `canReorder` in `AdminPortfolio.jsx` is gated on `status === 'all' && category === 'All' && !search`, but **not** on `pages <= 1`. With `limit: 20`, dragging a row on page 2 of a >20-project catalog writes `order: 0..19` to that page's items — colliding with page 1's own `order: 0..19`. Silent data corruption today, latent because nothing reads `order` on the public site yet.
2. **`order` default is `0`, not "unset"**: since every project (past and future, via schema default) already has `order: 0` unless manually dragged, there is no way today to distinguish "deliberately ranked first" from "never touched." Introducing `{ order: 1 }` into the *public* sort as-is would make every never-ranked project tie at rank 0 and sort **ahead of** any manually-assigned rank like 1, 2, 3 — the exact opposite of "if Display Order is empty, place the project after all manually ordered projects."

Decision: **rename and fix, don't add a parallel field.** A brand-new `displayOrder` field sitting next to a dead, half-working `order` field would be exactly the kind of duplicate-implementation this codebase's own conventions (and CLAUDE.md) reject. `order` is renamed to `displayOrder`, its semantics are corrected, and the existing drag UI is repaired rather than replaced — the brief's own UX ask ("allow me to easily prioritize projects... 1 → Real Estate, 2 → Luma Cafe...") is served primarily by a typed number field (new), with drag-and-drop kept as a secondary, small-catalog convenience (fixed, not removed).

### 2.2 Data model

```js
// server/models/PortfolioProject.js
displayOrder: {
  type: Number,
  default: UNRANKED_DISPLAY_ORDER,     // sentinel — see below
  validate: { validator: Number.isInteger, message: 'displayOrder must be an integer' },
},
```

**The "empty means last" problem and its resolution.** MongoDB's native ascending sort places `null`/missing fields *before* real numbers, not after — the opposite of "empty sorts last." Rather than reach for an aggregation pipeline (which would break the existing, deliberately-efficient cursor-pagination scheme on the public listing — see §10 of `PROJECT_REVIEW.md`, which specifically praises that pagination as already scaling to 1000+), this plan uses a documented **sentinel value**:

```js
// server/utils/displayOrder.js (new, shared by every route that touches the field)
const UNRANKED_DISPLAY_ORDER = 1_000_000; // "no manual rank" — larger than any real rank will ever be

const normalizeDisplayOrderInput = (raw) => {
  if (raw === null || raw === undefined || raw === '') return UNRANKED_DISPLAY_ORDER;
  const n = Number(raw);
  if (!Number.isInteger(n)) { const e = new Error('displayOrder must be an integer'); e.status = 400; throw e; }
  return n;
};

const serializeDisplayOrder = (v) => (v === UNRANKED_DISPLAY_ORDER ? null : v);
```

- **Write path**: every admin write (`POST /admin`, `PUT /admin/:id`) runs `displayOrder` through `normalizeDisplayOrderInput` before it reaches Mongoose — blank/`null`/omitted → sentinel, a real integer → itself, a non-integer → `400`.
- **Read path**: the two admin surfaces that render the raw number back to a human (`GET /admin` list, `GET /admin/:id`) run it through `serializeDisplayOrder` so the wizard's input shows **blank**, never `1000000`.
- **Sort path**: nothing needs to know about the sentinel *as* a sentinel — it's just a real, very large number, so a plain `{ displayOrder: 1, ... }` Mongo sort naturally puts every unranked project after every ranked one, with zero aggregation, zero cursor redesign-by-phase, and full index support.
- The public listing never needs `serializeDisplayOrder` — visitors don't see the raw field.

This is a deliberate, documented trade-off: a "magic number" instead of `null`, chosen specifically because it keeps the sort a single flat `find().sort()` call compatible with cursor pagination, instead of a two-phase ranked/unranked query or an aggregation pipeline. The constant lives in one file, imported everywhere it's needed, so it is never a silently-duplicated literal.

### 2.3 Public sort algorithm (the actual brief)

> 1. Display Order ASC → 2. Featured (tiebreak) → 3. Publish Date DESC → empty Display Order sorts last

Implemented as a single compound sort, applied only to the **default** ("latest") branch of `GET /api/portfolio` — `sort=featured`, `sort=popular`, `sort=oldest` are visitor-chosen alternate views and stay exactly as they are today (they already intentionally bypass the normal ordering, same as before this change):

```js
const CURSOR_SORT = { displayOrder: 1, featured: -1, publishedAt: -1, _id: -1 };
```

Because this is now a 4-key sort instead of 2-key, the cursor has to carry all four values (not just `createdAt`/`_id`), and the `$or` seek-pagination filter grows to the standard N-key form:

```js
filter.$or = [
  { displayOrder: { $gt: c.displayOrder } },
  { displayOrder: c.displayOrder, featured: { $lt: c.featured } },
  { displayOrder: c.displayOrder, featured: c.featured, publishedAt: { $lt: c.publishedAt } },
  { displayOrder: c.displayOrder, featured: c.featured, publishedAt: c.publishedAt, _id: { $lt: c._id } },
];
```

`publishedAt` is used (not `createdAt`) per the brief's literal "Publish Date DESC" — every published project already gets `publishedAt` set on its first publish (`portfolio.routes.js`, unchanged logic), with one gap closed in the migration (§2.5): very old projects published before that logic existed may be missing it, backfilled from `createdAt`.

**Index**: `{ status: 1, private: 1, displayOrder: 1, featured: -1, publishedAt: -1 }` replaces the old `{ status: 1, order: 1, createdAt: -1 }`. `{ createdAt: -1, _id: -1 }` stays (still used by `sort=oldest`).

**Admin list** (`GET /api/portfolio/admin`, skip/limit — not cursor, so no cursor redesign needed there): its default sort becomes `{ displayOrder: 1, featured: -1, createdAt: -1 }` (using `createdAt` here, not `publishedAt`, since the admin list also shows unpublished drafts, which have no `publishedAt` yet — consistent with what that endpoint already used before this change).

### 2.4 Validation rules (per the brief's own checklist)

- **Integers only** — enforced server-side (Mongoose validator + `normalizeDisplayOrderInput`'s `Number.isInteger` check, `400` on failure) and client-side (`<input type="number" step="1">`, rejects on blur if non-integer).
- **Duplicates: allowed, deliberately.** The brief asks to "reject duplicates only if necessary, or explain why acceptable." Reasoning: enforcing uniqueness would require either blocking the second save (bad UX — an admin assigning rank `5` to two projects mid-reorganization shouldn't get an error, they should be able to fix it after) or silently auto-incrementing one of them (surprising, invisible action-at-a-distance). Two projects sharing the same `displayOrder` is well-defined and harmless: the sort's secondary key (`featured DESC`) and tertiary key (`publishedAt DESC`) resolve the tie deterministically, same as any real-world "rank" field with ties. No unique index is added.
- **Never breaks pagination** — solved by the sentinel (§2.2) keeping this a flat, single-pass compound sort with a proper seek cursor, not a phased or aggregated query.
- **Never breaks filters** — `category`/`industry`/`tag`/`featured`/`search` all remain independent `$match` conditions built before the sort/cursor logic runs; nothing about this change touches them.

### 2.5 Migration (safe, idempotent, mirrors `migrate-add-project-type-fields.js`'s own conventions)

Extend the existing migration script (renamed `migrate-portfolio-phase2.js` to reflect its now-broader scope) with two more idempotent steps:

1. **Rename `order` → `displayOrder`, everywhere it's the old default-`0` value.** Since `order` has never been exposed in any UI before this diff, every stored `0` is schema-default noise, not a deliberate admin ranking — safe to treat uniformly as "unranked." `updateMany({}, [{ $set: { displayOrder: UNRANKED_DISPLAY_ORDER } }, { $unset: 'order' }])` (aggregation-pipeline update, single pass). Re-running is a no-op the second time (nothing left to `$unset`).
2. **Backfill `publishedAt` from `createdAt`** for any `status: 'published'` project missing it — closes the gap noted in §2.3 so "Publish Date DESC" is never sorting against `undefined` for a legacy doc. `updateMany({ status: 'published', publishedAt: { $exists: false } }, [{ $set: { publishedAt: '$createdAt' } }])`.

**Why this is safe for existing projects (the brief's explicit backward-compatibility requirement):** after migration, every existing project has `displayOrder = 1,000,000` (sorts last, exactly like today's implicit "sorted by date" behavior) and a real `publishedAt`. The *only* default-sort behavior change visitors will see immediately after deploy is that `featured` projects rise to the top of the (currently undifferentiated) date-sorted feed — an intended, explicitly-specified consequence of the brief's own 3-key sort, not a side effect. Nothing disappears, nothing reorders unpredictably, and no admin action is required until they choose to start assigning ranks.

### 2.6 Admin UX

- **Wizard field** — new integer input, **"Display Order"**, placed in the Overview tab's existing Project Type / Delivery Status row (extends that 2-column grid to 3 columns on desktop). This is the one location that's simultaneously "near Project Type" (literal brief requirement) and visible from the very first tab, rather than buried in the Publish tab. Helper copy: *"Lower numbers appear first on the public portfolio. Leave empty to sort automatically by publish date."* Featured (SEO & Publish tab) and Status (top bar) are unchanged in location — both already exist and are already visually adjacent to the publish workflow; duplicating them next to Display Order would fragment the single source of truth for each toggle. A one-line cross-reference is added instead: the Display Order field's hint also states *"Featured and Publish status are set in the SEO & Publish tab / top bar."*
- **`AdminPortfolio.jsx` drag-and-drop** — kept, repaired: `canReorder` gains a `pages <= 1` condition (fixes the cross-page corruption bug in §2.1 at the root, by disabling the unsafe case rather than trying to make partial-page drags cross-page-aware). Reorder payload key renamed `order` → `displayOrder`. A small numeric badge is added next to each row's Featured star when `displayOrder` is set (not the sentinel) — e.g. `#3` — so an admin scanning the list can see manual ranks at a glance without opening each project.
- **No new admin page, no new route shape** — `PATCH /admin/reorder` keeps its existing shape, just renames the field it writes.

### 2.7 Documentation

`USER_GUIDE.md` gets a new top-level section, **"Display Order — Manual Portfolio Ranking,"** covering: what it is, the "lower = first" rule, how it interacts with Featured/Publish Date as tiebreakers, that duplicates are fine, that leaving it empty is the normal/default state, and the two ways to set it (typed number in the wizard, or drag-and-drop for small catalogs). The existing "Screens That Changed" and "Final Checklist" sections get one line each added.

### 2.8 Files touched

**Backend**
- `server/models/PortfolioProject.js` — rename `order` → `displayOrder`, sentinel default, integer validator, index swap.
- `server/utils/displayOrder.js` — new, the sentinel constant + two pure helpers, shared by every route below.
- `server/routes/portfolio.routes.js` — `WRITABLE_FIELDS` rename; `normalizeDisplayOrderInput`/`serializeDisplayOrder` wired into create/update/admin-list/admin-get-by-id; public listing's 4-key cursor sort + seek filter; admin listing's 3-key sort; `/admin/reorder` field rename.
- `server/scripts/migrate-portfolio-phase2.js` — renamed/extended from `migrate-add-project-type-fields.js`, adds the two new idempotent steps from §2.5 alongside the existing Phase 1 steps (kept, unchanged — still needed for fresh installs).

**Admin frontend**
- `client/src/components/portfolio-wizard/OverviewSection.jsx` — new Display Order input (this file is already being touched for Part 1).
- `client/src/pages/PortfolioWizard.jsx` — `EMPTY_FORM.displayOrder`, `buildPayload` passthrough.
- `client/src/pages/AdminPortfolio.jsx` — `canReorder` fix, field rename, rank badge.

**Docs**
- `USER_GUIDE.md` — new section + touch-ups (shared with Part 1's rewrite of §4/§6).

---

## Execution order

1. Part 1 wizard fixes (`OverviewSection.jsx`, `ProofResultsSection.jsx`, `PortfolioWizard.jsx` proof-dot) — small, isolated, no schema risk.
2. Part 2 backend (`displayOrder.js` util → schema → routes) — the ordering logic is the riskiest piece (cursor math), gets built and reasoned through before any UI depends on it.
3. Part 2 admin frontend (wizard field, `AdminPortfolio.jsx` fixes).
4. Migration script.
5. `USER_GUIDE.md` rewrite covering both parts.
6. Self-review: `node --check` on every touched backend file, `eslint` on every touched frontend file, re-trace the existing-project compatibility argument the same way Phase 1's `REVIEW.md` did (not just assert it).
