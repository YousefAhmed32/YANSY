> **⚠️ Historical record — since corrected.** This document describes what Phase 1 actually shipped. The product owner subsequently found that Phase 1's concept-type field-hiding went further than intended (it force-hid Client/Live URL/Awards, which should have stayed available). See `IMPLEMENTATION_PLAN.md` Part 1 for the correction and `USER_GUIDE.md` for current, accurate behavior. Left unedited below as a record of what was actually built and why, at the time.

# REVIEW — Phase 1: Project Type + Delivery Status

**Scope:** Phase 1 only, per PROJECT_REVIEW.md — `projectType` (library), `deliveryStatus` (live/concept/archived), a dynamic admin wizard, a public card badge, and a type-aware detail page. Everything under "DO NOT IMPLEMENT" (Color Palette, Typography, Behance, Dribbble, Download Assets, Phase 2) was left untouched.

**Result:** Implemented. Every existing, already-published portfolio project keeps working, keeps rendering, and needs zero manual edits — verified by tracing every read/write path, not just asserted (details below).

---

## 1. What changed, and why

### New reusable library: `ProjectType`
`server/models/ProjectType.js` — mirrors `Category.js` field-for-field (bilingual `name`/`nameAr`, `slug`, `icon`, `order`, `isActive`, plus the shared `usageCount`/`lastUsedAt`/`isPinned` metadata every library gets). Mounted through the exact same generic `createLibraryRouter` factory as the other 9 libraries — `app.use('/api/project-types', createLibraryRouter(ProjectType, {...}))` in `server/routes/libraries.routes.js`. No custom system, per the brief.

One deliberate addition beyond a Category clone: **`isConceptType: Boolean`**. Rather than hardcoding a slug string like `'ui-ux-concept'` into the wizard and detail-page code to detect "is this a concept project," the flag lives on the library entry itself — admin-editable, like `isActive`. This means a future type (e.g. "Personal Project") gets the exact same field-hiding behavior just by ticking one switch when it's created, with no code change. The starter "UI/UX Concept" entry is seeded with it `true`; the other five starter types (Web Project, Mobile App, Dashboard/SaaS, Landing Page, Branding/Identity) are seeded `false`.

The library also got an admin management page for free — added to `client/src/admin-ui/libraryConfigs.js` (`projectTypes` config + `LIBRARY_ORDER`), which drives the existing generic `AdminLibrary.jsx` CRUD page. No new admin page was hand-built.

### `PortfolioProject` — two new fields
- `projectType: { type: ObjectId, ref: 'ProjectType' }` — optional, no default. Every project that existed before this field simply has it `undefined`, which every conditional check below treats identically to "not a concept — show everything," i.e. today's exact behavior.
- `deliveryStatus: { type: String, enum: ['live','concept','archived'], default: 'live' }` — defaults to `'live'`, the correct value for every project that predates this field.

### Admin wizard — dynamic field visibility
`OverviewSection.jsx` gained a Project Type picker and a Delivery Status pill selector (reusing the existing `RelationPicker` and `FilterPills` components — no new UI primitives). When the selected type has `isConceptType: true`:
- The entire Client block (picker, logo preview, location, confidential toggle) is hidden; the Private toggle stays visible on its own, since "hide the whole project" is meaningful regardless of type.
- The Live URL field is hidden (Figma/GitHub stay — a Figma link is exactly what a concept project wants to show).
- A small inline hint explains why fields disappeared and what to fill in instead (Cover, Gallery, Tools, Tags) — this is a UX-quality addition in the spirit of the project's "never leave placeholder-quality UI" rule, not a functional requirement, but it's the difference between the wizard looking broken vs. looking intentional.

`ProofResultsSection.jsx`: Results, Headline Metrics, Performance (before/after), Testimonials, and Awards are all hidden for a concept type. Chat Proof (WhatsApp screenshots) and FAQs stay — both are meaningful for any project type and weren't in the brief's hide list.

Both components compute this from `form.projectType?.isConceptType`, which is simply `false` when `projectType` is unset — so every existing project's wizard renders exactly as it did before this change, field for field.

### Admin wizard — completion score stayed honest
The wizard's 0–100% completion bar (`PortfolioWizard.jsx`) previously scored 15 fields, four of which (`results`, `metrics`, `testimonials`, `liveUrl`) are now fields a concept project is never asked to fill in. Left as-is, every concept project would be permanently capped below 100% — which is exactly the "looks unfinished" problem this whole feature exists to avoid. Split the score into `CORE_SCORE_FIELDS` (11 fields, always scored) and `LIVE_ONLY_SCORE_FIELDS` (the 4 in question, scored only when `!isConceptType`). For every existing/non-concept project this produces the **exact same 15-field score, same fields, same order** as before — verified by construction, not just by inspection: `[...CORE_SCORE_FIELDS, ...LIVE_ONLY_SCORE_FIELDS]` is the original 15-entry array, just split and concatenated. The same reasoning was applied to the small nav-dot "is Proof section complete" indicator.

### Public portfolio card — status badge
`PortfolioCard.jsx` reads `project.deliveryStatus` (already present on every list-API response — see §3) and shows a small pill for `concept`/`archived`, positioned inside the existing top-left badge row (same flex-wrap container as the Category/Industry badges — no new layout element, no dimension change). **Deliberately not shown for `'live'`** — every one of the many existing projects is `'live'` by default, and stamping "LIVE" on every single card would be visual noise the rest of this card design goes out of its way to avoid (badges here already only ever appear for non-default/notable states, e.g. `confidential`). This is flagged as a design decision below, not a literal reading of the brief, with a one-line note on how to flip it if you'd rather see all three states always.

### Public project details page — no changes required
This is the one part of the brief where the honest answer is "already done, verified, nothing to build." `Hero.jsx`, `ImpactSection.jsx`, `ProofSection.jsx`, and `StoryBeats.jsx` were all read in full before writing any code, specifically to check this. Every one of them already gates on data presence, not on a hardcoded field list:
- `Hero.jsx`: the client name/logo line only renders `if (clientName || project.confidential)`; the Live URL panel CTA only renders `if (!hasMetrics && project.liveUrl)`; the meta-strip's Live Site link only renders `if (project.liveUrl)`. A concept project with no client and no `liveUrl` filled in (because the wizard now hides those fields) already produces zero rendered output for either — no code change needed.
- `ImpactSection.jsx`: returns `null` entirely unless `results`, `metrics`, `performanceMetrics`, or a testimonial quote is present.
- `ProofSection.jsx`: returns `null` unless a testimonial audio note, chat-proof screenshots, or awards are present.

Since the wizard now simply never asks a concept project's admin to fill these fields in, "hide irrelevant sections" and "never render empty sections" — the brief's own two requirements for this part — are already exactly what this code does. Adding a second, redundant `isConceptType`-driven hide on top would be exactly the "unnecessary complexity" the brief also asks to avoid, and would risk a genuine edge case: an admin who *intentionally* re-tags an already-published, fully-fleshed-out project as a Concept type for browsing/filtering purposes without wanting to blow away its real testimonial or metrics data. Leaving the existing data-presence gating in place handles both cases correctly with zero new code.

### Compatibility pass — every read/write path

| Path | Change | Why it's safe |
|---|---|---|
| `PROJECT_POPULATE` (list/detail/related/admin) | added `{ path: 'projectType' }` | Additive array entry — every existing populate target is untouched. |
| `WRITABLE_FIELDS` | added `'projectType'`, `'deliveryStatus'` | Additive — `pickWritable` still only ever picks fields present in the request body; old clients that don't send these two keys are unaffected. |
| `bumpLibraryUsage` | added `touchUsage(ProjectType, project.projectType)` | Same pattern as the other 8 libraries; a no-op (`touchUsage` short-circuits) when `projectType` is unset. |
| `LIST_EXCLUDE` | unchanged | New top-level fields are never excluded, so they flow through list responses automatically — required for the card badge to work without a second query. |
| `assertPublishable` | unchanged | `projectType`/`deliveryStatus` are never required to publish — a project can go live with neither set, exactly like before. |
| duplicate route (`/admin/:id/duplicate`) | unchanged | Clones the source doc via `{ ...rest }` spread — both new fields carry over to the clone automatically, no special-casing needed. |
| Public listing filters (`category`, `industry`, `tag`, `featured`, `search`, `sort`) | unchanged | No new filters were added — out of Phase 1 scope by the brief's own §4 (badge only, not new filter chips). Existing filter behavior is untouched. |

---

## 2. Migration strategy

Two independent, idempotent steps in `server/scripts/migrate-add-project-type-fields.js` (mirrors the style/conventions of the existing `migratePortfolioV3.js`):

1. **Seed the `ProjectType` library** with the six starter types, but only if the collection is currently empty — running it twice does nothing the second time. Only "UI/UX Concept" gets `isConceptType: true`.
2. **Backfill `deliveryStatus: 'live'`** on every `PortfolioProject` document that doesn't already have the field, via `updateMany({ deliveryStatus: { $exists: false } }, { $set: { deliveryStatus: 'live' } })`.

### Why the backfill is necessary even though the schema has a default
Mongoose applies a schema `default` when a document is *hydrated* from the database with the field missing — so `PortfolioProject.findById(x).deliveryStatus` already reads `'live'` for an old project with zero migration. But a raw MongoDB query filter like `{ deliveryStatus: 'live' }` only matches documents where the field **actually exists in storage** — it does not know about Mongoose schema defaults. Any future feature that filters or aggregates on `deliveryStatus` at the query level (not just reads it off an already-loaded document) would silently exclude every pre-existing project without this backfill. Running the script closes that gap permanently, so "old projects behave as Live" is true at the database level, not just true when read one document at a time through the model — this is the same reasoning already documented in this codebase's own `migratePortfolioV3.js` for a comparable case.

### `projectType` is deliberately left unset on existing projects
No existing project is auto-assigned a type. This is intentional, not an oversight: every conditional in the wizard and (as shown above) the public page already treats "no projectType" as "no restrictions" — assigning old projects a guessed type would add risk (a wrong guess actively hides a real project's Client/Live URL/Testimonials) for zero benefit (nothing currently reads `projectType` to decide anything for existing published work). An admin can optionally categorize old projects later, at their own pace, with zero urgency.

### Running it
```
node server/scripts/migrate-add-project-type-fields.js
```
Prints a verification line at the end (`N total, 0 still missing deliveryStatus`) so the run can be confirmed complete without a separate DB check.

---

## 3. Compatibility verification

Traced, not assumed, for each of the brief's six compatibility bullets:

- **Existing API responses remain valid** — every response shape gained two optional keys (`projectType: null`, `deliveryStatus: 'live'`) on documents that didn't have them before migration, and the real values after. No existing key was renamed, removed, or repurposed. `LIST_EXCLUDE`'s field-exclusion list is untouched, so nothing that used to be returned stopped being returned.
- **Existing routes keep working** — no route was removed, renamed, or given new required parameters. `WRITABLE_FIELDS`/`PROJECT_POPULATE`/`bumpLibraryUsage` all got additive entries only.
- **Existing CMS keeps working** — the wizard's `EMPTY_FORM`, `buildPayload`, and completion-score logic were all extended additively; a project with no `projectType` selected behaves identically to before this change at every one of those three points (verified above).
- **Existing Portfolio pages keep working** — `Hero`/`StoryBeats`/`ImpactSection`/`ProofSection`/`PortfolioDetailView` received zero edits (see §1); `PortfolioCard`'s only change is an additive badge that doesn't render for the default `'live'` state.
- **Existing SEO keeps working** — `metaTitle`/`metaDescription`/`assertPublishable`/the JSON-LD schema block in `PortfolioDetail.jsx` are all untouched; neither new field participates in any of them.
- **Existing filters keep working** — the public `/api/portfolio` listing route's category/industry/tag/featured/search/sort filters were not touched; no new filter was added in Phase 1 (out of scope per the brief's own §4).

---

## 4. Files modified / created

**Backend**
- `server/models/ProjectType.js` — new
- `server/models/PortfolioProject.js` — added `projectType`, `deliveryStatus`
- `server/routes/libraries.routes.js` — mounted `/api/project-types`
- `server/routes/portfolio.routes.js` — populate/writable-fields/usage-bump additions
- `server/scripts/migrate-add-project-type-fields.js` — new, the migration described in §2

**Admin frontend**
- `client/src/admin-ui/libraryConfigs.js` — `projectTypes` library config
- `client/src/pages/PortfolioWizard.jsx` — form state, payload, type-aware completion score
- `client/src/components/portfolio-wizard/OverviewSection.jsx` — Project Type/Delivery Status fields, conditional Client/Live URL
- `client/src/components/portfolio-wizard/ProofResultsSection.jsx` — conditional Results/Metrics/Testimonials/Awards

**Public frontend**
- `client/src/components/PortfolioCard.jsx` — delivery status badge

**Verification only, no changes needed**
- `client/src/components/portfolio-detail/Hero.jsx`, `StoryBeats.jsx`, `ImpactSection.jsx`, `ProofSection.jsx`, `PortfolioDetailView.jsx` — confirmed already conditionally render on data presence (§1)

---

## 5. Testing performed

- `node --check` on all five backend files — all pass.
- `npx eslint` on all five modified frontend files — zero errors, zero warnings.
- Traced `mongoose.pluralize()('ProjectType')` → confirmed `projecttypes`, matching the collection name used in the migration script (verified directly in this environment, not assumed).
- Manually traced every backend read/write path listed in §1's compatibility table against the actual route code (not inferred from the diff alone).
- Manually traced the client-side data flow for an *existing* project with no `projectType` through `EMPTY_FORM` → wizard load → `OverviewSection`/`ProofResultsSection` render → `calcCompletion` → `buildPayload` → confirmed identical output at every step to pre-change behavior.
- No project-level automated test suite exists for the portfolio routes/wizard in this repo (checked — none found), so this pass is the verification available; nothing was skipped on the assumption a test suite would catch it.

**Not done, and out of scope for Phase 1:** an actual `npm run build` / running dev server smoke test against a live database, since no local Mongo instance is available in this environment. Recommend running the migration script and a manual create/edit-project pass against a staging DB before this ships to production, per the brief's own "review before finish" standard — the code-level verification above is thorough but isn't a substitute for one real run against real data.

---

## 6. Known, deliberate simplifications (flagged, not hidden)

- **Card badge shows `CONCEPT`/`ARCHIVED` but not `LIVE`** — a design call explained in §1, not a literal three-state-always reading of the brief. Trivial to flip (`deliveryBadge` would just also cover `'live'`) if you'd rather see it on every card.
- **No new public filter chips for Project Type/Delivery Status** — the brief's §4 only asked for a card badge; adding filter UI was treated as Phase 2 scope rather than assumed.
- **No admin project-list table column for Type/Status** — `AdminPortfolio.jsx`'s table itself wasn't touched; the wizard is where the brief's dynamic-field requirement lives, and touching the list table wasn't asked for.

All three are additive, non-breaking follow-ups, not defects.
