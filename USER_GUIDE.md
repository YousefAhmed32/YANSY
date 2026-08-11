# Portfolio System — Project Types, Delivery Status & Display Order
### User Guide (Phase 2 — corrected concept-type behavior + manual ordering)

**Audience:** Admin / Product Owner
**Scope:** This guide documents exactly what is implemented in the codebase today — the `ProjectType` library, `deliveryStatus`, the dynamic admin wizard, `displayOrder` (manual portfolio ranking), and the type-aware public portfolio. Nothing in this guide is aspirational; every claim below was verified against the actual source files (cited inline as `path/to/file.js`).
**Background reading:** `PROJECT_REVIEW.md` (original strategy proposal), `REVIEW.md` (what Phase 1 actually shipped — since corrected, see below), `IMPLEMENTATION_PLAN.md` (this revision's plan, written before the code was touched).

**Phase 2 changelog (this revision):** the product owner reviewed Phase 1 and corrected its scope — Phase 1 hid more than it should have, making UI/UX Concept projects feel like a reduced product instead of a full portfolio project with one honest difference. Two changes ship in this revision:

1. **Concept-type field-hiding was narrowed.** Client, Live URL, and Awards are **no longer force-hidden** for concept types — they're optional, exactly like on any other project. Only fields that would require *fabricating a claim* stay hidden: Results, Headline Metrics, Performance Before/After, Client Testimonials — and, newly, **WhatsApp/Chat Proof** (a gap in Phase 1: it implies a real client conversation, which is exactly the kind of claim a concept project shouldn't make). See §4.
2. **A real manual ordering system was added.** `displayOrder` — an integer field, "lower number = shows first" on the public portfolio, independent of publish date and featured status. See §5.

---

## 1. The Workflow, End to End

```
Admin clicks "Create Project"
        ↓
Wizard opens on the Overview tab (empty draft, no ID yet)
        ↓
Fill in Cover Image + Title + Category            → required just to create the draft record
        ↓
Choose Project Type (optional)   ──┐
Choose Delivery Status (optional)  │  These fields are independent of each
Set Display Order (optional)       │  other and of every other field.
        ↓                          │
Wizard adapts its fields ◄─────────┘  (see §4 — only fires if Project Type
        ↓                              is flagged "Concept type")
Fill in remaining sections:
  Story → Team & Credits → Media & Blocks → Proof & Results → SEO & Publish
        ↓
Click "Publish"  (blocked until Description + Cover Image are filled in)
        ↓
Project is live on the public /portfolio grid and at /portfolio/:slug
```

Two things worth being precise about, because they surprise people:

1. **There is no "type selection gate."** `PROJECT_REVIEW.md` originally proposed a big visual card-picker shown the moment you click "Create Project." That was **not built**. What exists instead is a plain dropdown field ("Project Type") sitting inside the normal Overview tab, next to Delivery Status and Display Order — you can set it whenever you like, including never. See `client/src/components/portfolio-wizard/OverviewSection.jsx`.
2. **Autosave starts immediately.** The moment you type a Title and pick a Category, the wizard silently creates a draft in the background and keeps saving every change ~1.5s after you stop typing. You never click "Save" — you only click **Publish** when the project is ready to go live.

---

## 2. Every Project Type — What It's For

Project Type is a **library**, not a hardcoded list — you can rename, reorder, deactivate, or add new types at any time from the sidebar's **Content Libraries → Project Types** (`/app/admin/libraries/projectTypes`), the same way you manage Categories/Industries/Technologies/Services. The table below describes the six types the system was seeded with (`server/scripts/migrate-portfolio-phase2.js`).

- **Create** — click "Add project type," fill in Name (English + Arabic), optionally an Icon, and toggle **"Concept type"** on if this type should hide the fabrication-risk fields (§4).
- **Edit** — click any row to reopen the same form.
- **Delete** — trash icon + confirmation; existing projects referencing a deleted type just keep their old reference.
- **Reorder** — the numeric **Order** field in the Create/Edit form (lower sorts first) — same mechanism every other library uses. (Not to be confused with `displayOrder`, §5, which ranks *projects*, not project *types*.)

| Type | Slug | Concept type? | When to use it |
|---|---|---|---|
| **Web Project** | `web-project` | No | A real website you built for a client. |
| **Mobile App** | `mobile-app` | No | A native/cross-platform app you built and shipped. |
| **Dashboard / SaaS** | `dashboard-saas` | No | An internal tool, admin panel, or SaaS product. |
| **Landing Page** | `landing-page` | No | A single-page campaign/product site. |
| **Branding / Identity** | `branding-identity` | No | A brand identity project — logo, guidelines, visual system. |
| **UI/UX Concept** | `ui-ux-concept` | **Yes** | Self-directed design exploration, unshipped pitch, or design-only piece. |

**The only thing that changes wizard/public behavior is the `isConceptType` checkbox on the type itself** (`server/models/ProjectType.js`) — not the type's name. Rename "UI/UX Concept" to anything and the behavior travels with the checkbox, not the label. Create a brand-new type and check its "Concept type" switch, and it gets the same behavior with zero developer involvement.

---

## 3. Delivery Status — Live / Concept / Archived

A plain three-value field on every project (`server/models/PortfolioProject.js`), completely independent from Project Type:

| Value | Meaning | Public effect |
|---|---|---|
| **Live** *(default)* | The project shipped and is/was a real, visitable engagement. | No badge on the card — every existing project defaults here, so this stays the "normal, unlabeled" state. |
| **Concept** | Design/exploration work with no live product. | Card shows a **"Concept"** pill badge. |
| **Archived** | Used to be live, since taken down. | Card shows an **"Archived"** pill badge. |

**This is a second axis, not a synonym for the "UI/UX Concept" Project Type.** A **Web Project** can have Delivery Status = Archived (a real site since taken offline). A **UI/UX Concept**-typed project can have Delivery Status = Live (an unshipped-but-real client pitch you still want to flag as legitimate work). Delivery Status drives only the public badge — it does **not** hide any wizard field. Only the Project Type's `isConceptType` switch does that (§4).

---

## 4. The Dynamic Wizard — Corrected Field Visibility (Phase 2)

Every project type shares the same six wizard tabs — **no tabs appear or disappear**. What changes is a small, deliberately narrow set of fields inside Overview and Proof & Results, and only when the selected Project Type has `isConceptType: true`.

**The rule (see `IMPLEMENTATION_PLAN.md` Part 1):** hide only what would require *fabricating a claim*. Everything else — including fields that are simply optional — stays exactly as available as on any other project.

### Overview tab (`OverviewSection.jsx`)

| Field | Standard type | Concept type |
|---|---|---|
| Cover Image, Cover Video, Title, Tagline, Category, Industry | Visible | Visible |
| Project Type, Delivery Status, **Display Order** | Visible | Visible |
| **Client picker + logo + Location + Confidential toggle** | Visible | **Visible — unchanged.** A concept project can have a real client (an unshipped pitch); the wizard never decides that for you. |
| **Live URL** | Visible | **Visible — unchanged.** An empty URL field isn't dishonest; only a fabricated one would be. |
| Private toggle, Year/Duration/Team size/Launch date, Our Role, Services | Visible | Visible |
| Figma URL, GitHub URL | Visible | Visible |

When a concept type is selected, the wizard shows an inline info banner:
> *"UI/UX Concept projects are full portfolio projects, just like any other — same cover, gallery, story, process, tools, and awards. The only difference is honesty: Results, KPIs, Client Testimonials, and WhatsApp Proof are hidden because they imply a real client engagement. Client and Live URL stay available — use them if real, leave them blank if not."*

### Proof & Results tab (`ProofResultsSection.jsx`)

| Field | Standard type | Concept type |
|---|---|---|
| Results (business outcome text) | Visible | **Hidden** — implies a real business outcome. |
| Headline Metrics (stat chips) | Visible | **Hidden** — implies real KPIs. |
| Performance — Before/After rows | Visible | **Hidden** — same reason. |
| Client Testimonial picker | Visible | **Hidden** — implies a real client quote. |
| **WhatsApp / Chat Proof screenshots** | Visible | **Hidden (new in Phase 2)** — implies a real client conversation; Phase 1 left this visible, which was a gap. |
| **Awards & Certifications picker** | Visible | **Visible (changed in Phase 2)** — a concept project can win a real award (a Dribbble feature, a design competition); Phase 1 force-hid this for no honesty-related reason. Simply doesn't render on the public page if left empty (already-existing behavior). |
| FAQs | Visible | Visible — unchanged; a concept project can honestly answer "Why wasn't this shipped?" |

**What actually differs from a normal project, in one sentence:** a Concept-type project can't claim business results, KPIs, a client testimonial, or a WhatsApp conversation it didn't have — everything else about it is a first-class portfolio project.

### Required-to-publish fields (identical for every type)

Publishing is blocked until **Description** and **Cover Image** are filled in. Title and Category are required even earlier, to create the draft at all.

### The completion-percentage bar

Unchanged from Phase 1 and still correct under the Phase 2 rule: the sidebar's 0–100% score scores 11 "core" fields for every project, plus 4 more ("results," "metrics," "testimonials," "live URL") only if the type is not a concept type (`PortfolioWizard.jsx`, `CORE_SCORE_FIELDS`/`LIVE_ONLY_SCORE_FIELDS`). Live URL stays excluded from concept scoring even though the field is now visible — most concept projects genuinely won't have one, and the field being *available* doesn't mean it should be *required* for a complete score. The Proof-tab sidebar "complete" indicator was fixed this revision to check FAQs only for concept types (it used to check Chat Proof screenshots too, which are now hidden — checking for data the wizard no longer lets you enter would have been a fresh bug).

---

## 5. Display Order — Manual Portfolio Ranking

A new integer field, **"Display Order"** (`server/models/PortfolioProject.js` → `displayOrder`), giving you complete, direct control over the order projects appear in on the public `/portfolio` grid — independent of publish date, featured status, or creation order.

### The rule

**Lower numbers appear first.** Leave it empty and the project sorts automatically, after every manually-ranked project, by Publish Date (newest first).

```
Public sort order:
  1. Display Order ASC     (1, 2, 3, 10, 25, 100, ...)
  2. Featured               (tiebreaker — only matters if two projects share a Display Order)
  3. Publish Date DESC      (newest first — governs everything with no Display Order set)
```

### Where to set it

In the Project Editor's **Overview** tab, right next to **Project Type** and **Delivery Status** (`OverviewSection.jsx`) — three related classification/priority fields in one row. **Featured** lives in the **SEO & Publish** tab and **Status** (draft/published/archived) lives in the wizard's top bar — both unchanged, both already visually tied to the publish workflow, so Display Order isn't duplicated into those two spots; a one-line hint under the field points to where they live instead.

```
1 → Real Estate Redesign
2 → Luma Cafe
3 → AI Assistant Concept
4 → Mobile Banking UI
5 → Dashboard Platform
... (everything else) → sorted automatically by publish date
```

You don't have to number every project, and you don't have to renumber anything when you insert a new #1 — just give the new project a value lower than whatever was #1 before (or leave gaps on purpose, e.g. 10/20/30, so you can slot things in later without renumbering — see "Best practices" below).

### A second, small-catalog way to set it: drag-and-drop

The admin Portfolio list (`AdminPortfolio.jsx`) still supports dragging rows to reorder — this writes to the same `displayOrder` field. **It's only available when you're viewing every project unfiltered on a single page** (all statuses, all categories, no search, ≤20 projects total). Past that, drag-and-drop is disabled and the wizard's typed field is the tool to use — dragging across multiple pages used to silently corrupt the order (a real, fixed bug: it wrote colliding ranks per-page). A small `#N` badge appears next to any project that has a manual Display Order set, so you can see current ranks at a glance in the list.

### Validation

- **Integers only.** The wizard's input rejects non-integers; the backend also validates and returns a `400` if a non-integer somehow reaches the API.
- **Duplicates are allowed, on purpose.** Two projects can share the same Display Order — the sort's tiebreakers (Featured, then Publish Date) resolve it deterministically. Forcing uniqueness would mean either blocking a save mid-reorganization or silently renumbering something behind your back — both worse than just letting ties resolve themselves.
- **Empty is the normal state**, not an error — most projects should probably never get a manual rank; reserve it for the handful you want to deliberately feature at the top.

### Existing projects

Every project that existed before this feature has `displayOrder` set to the internal "unranked" value during migration — it sorts exactly where it did before (by publish date), with **zero action required from you**. The only visible change to the existing default feed: any project marked **Featured** now floats slightly ahead of non-featured projects within the unranked group (previously Featured had no effect on the default sort order) — this is the brief's own tiebreaker rule taking effect, not a bug.

---

## 6. Public Portfolio — How Each Project Appears

### Cards (`client/src/components/PortfolioCard.jsx`)
- **Category badge** — always shown.
- **Industry badge** — shown when set (desktop only).
- **Delivery Status badge** — shown only for `concept`/`archived`; a `live` project shows no badge (every project defaults to Live — stamping "LIVE" on every card would be visual noise).
- **Client line** — shows only when a client is present (or a "Confidential client" note). Absent, not blank, when there's no client — true for any project type, concept or not.
- **Headline metric chip** — shows the first metric if any exist. Naturally absent for concept projects, which don't have this field filled in.

### Details page (`client/src/components/portfolio-detail/*`)
No component needed to change for either Phase 1 or Phase 2 — every section already hides itself based on whether its underlying data exists, not on `projectType`. Concretely: **Hero**'s client line renders only if `client` is set; its CTA falls back through metric chips → Live URL → nothing (never a dead button); **Impact Section** (results/metrics/before-after/testimonial quote) and **Proof Section** (voice-note testimonial/chat screenshots/awards) both return nothing at all unless real data is present. A concept project simply has less data in the fields the wizard doesn't ask it to fill in — the page doesn't need type-awareness of its own.

### Filters
The public `/portfolio` page filters by Category, Industry, and Technology. There is still no Project Type or Delivery Status filter chip — out of scope for both phases so far, a documented backlog item, not an oversight.

---

## 7. Existing Projects — What Happened to Them

**Nothing changed for them, and you don't need to do anything.**

- `projectType` stays unset on every pre-existing project — never auto-assigned, on purpose (a wrong guess could hide real data on a published project). You can optionally tag old projects at your own pace.
- `deliveryStatus` was backfilled to `'live'` for every existing project.
- `displayOrder` was backfilled to the "unranked" sentinel for every existing project — sorts exactly where it did before (§5).
- `publishedAt` was backfilled from `createdAt` for any very old published project that predates that field's assignment logic, so the new sort's date tiebreaker never compares against a missing value.

**Running the migration** (a developer/ops task, one-time, safe to re-run):
```
node server/scripts/migrate-portfolio-phase2.js
```

---

## 8. Best Practices

**When should I choose "Concept" as Delivery Status?** Any time there's no real, verifiable outcome to report — no live URL, no real client testimonial, no actual usage metrics.

**Should UI/UX Concept projects have a Client or Live URL?** Only if genuinely real (Phase 2: both fields stay available — see §4). Leave them blank for a self-directed exploration; fill them in for a real unshipped client pitch. Don't fabricate either.

**Should Concept projects have KPIs / Headline Metrics / a Testimonial / WhatsApp Proof?** Never fabricate them — the wizard structurally prevents it by hiding those four inputs for concept types.

**Should Concept projects have Awards?** Yes, if real (Phase 2: no longer hidden). A Dribbble feature or a design-competition placement is legitimate proof for a concept project.

**How should I use Display Order?** Reserve it for a small, deliberately curated set — your best 5–15 projects. Everything else should stay unranked and let publish date sort it; hand-ranking your entire catalog doesn't scale and isn't the point. Consider leaving gaps (10, 20, 30, ...) so you can insert a new top project later (a "15") without renumbering everything below it.

---

## 9. Screens That Changed (Phase 2)

| Screen | What's different |
|---|---|
| **Portfolio Wizard → Overview tab** | Client/Live URL no longer force-hidden for concept types (Phase 1 bug, corrected). New **Display Order** integer field, next to Project Type/Delivery Status. Concept-type info banner copy rewritten to match the narrower hide list. |
| **Portfolio Wizard → Proof & Results tab** | Awards no longer force-hidden for concept types. WhatsApp/Chat Proof newly hidden for concept types (was a Phase 1 gap). |
| **Portfolio Wizard → sidebar completion bar** | Proof-tab "complete" dot fixed to check FAQs only for concept types (previously also checked the now-hidden Chat Proof field). |
| **Admin → Portfolio list** (`AdminPortfolio.jsx`) | Drag-and-drop reorder gated to single-page unfiltered views only (fixes a real cross-page data-corruption bug). New `#N` rank badge shown per row when Display Order is set. |
| **Public Portfolio grid** | Default sort now honors Display Order → Featured → Publish Date, instead of pure publish date. |
| **Admin → Libraries → Project Types** | Unchanged from Phase 1. |

---

## 10. Final Checklist Before Publishing a Project

**Every project, any type:**
- [ ] Cover Image uploaded
- [ ] Title (English + Arabic) filled in
- [ ] Category selected
- [ ] Description filled in *(required — publish is blocked without it)*
- [ ] At least a few Gallery images uploaded
- [ ] Meta Title / Meta Description filled in for SEO
- [ ] Display Order set, if this project should jump the queue — otherwise leave it empty

**If it's real client work:**
- [ ] Client selected (or intentionally left blank)
- [ ] Live URL filled in, if applicable
- [ ] Results / Headline Metrics / Testimonial filled in with **real** data only

**If it's a UI/UX Concept (or any type with "Concept type" checked):**
- [ ] Gallery is generous — it's the primary showcase since there's usually no live site
- [ ] Client/Live URL filled in only if genuinely real, otherwise left blank
- [ ] Figma/other reference link added if available
- [ ] Awards added if real ones exist
- [ ] FAQs used to proactively answer "why wasn't this shipped" if relevant
- [ ] Confirmed no fabricated Results/KPIs/Testimonial/WhatsApp Proof was added by switching to a non-concept type

**Always, regardless of type:**
- [ ] Preview the project before publishing
- [ ] Check both English and Arabic render correctly
- [ ] Click **Publish**
