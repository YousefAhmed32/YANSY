# Portfolio Portable JSON Format

Version **1** — `format: "yansy-portfolio-project"`

This is the file format produced by **Export JSON** and accepted by
**Import JSON** in both Portfolio editors (Full Case Study wizard and Quick
Showcase editor), under Admin → Portfolio → *(open a project)* → **More
actions**.

It exists so an admin can receive a prepared project (written by hand, or
generated with an AI assistant from a brief) as a plain JSON file, import it
to populate the editor in one shot, review/edit normally, upload media
manually, and publish when ready.

---

## 1. Top-level shape

```json
{
  "format": "yansy-portfolio-project",
  "schemaVersion": 1,
  "exportedAt": "2026-08-26T12:00:00.000Z",
  "project": { "...": "see below" },
  "mediaManifest": [ "...", "optional, see §5" ]
}
```

| Field | Required | Notes |
|---|---|---|
| `format` | yes | Must be exactly `"yansy-portfolio-project"`. Any other value is rejected outright. |
| `schemaVersion` | yes | Integer. This build supports version `1`. An unsupported version (too new, or one this build no longer knows how to migrate) is rejected with a clear error — never partially imported. |
| `exportedAt` | no | ISO 8601 timestamp, informational only. Never imported as an authoritative `createdAt`/`updatedAt`. |
| `project` | yes | The actual project content — see §2. |
| `mediaManifest` | no | A checklist of media slots that had content in the source project — see §5. Never contains binaries, URLs, or upload-provider data. |

The whole file must be valid UTF-8 JSON — Arabic text round-trips exactly
(see the automated test asserting Arabic export→import fidelity).

---

## 2. The `project` object

Every field is optional — export only writes fields that actually have a
value, and import only ever touches a field the file provides (see §6 for
exactly how "touches" is defined per merge strategy).

### 2.1 Identity & classification

```json
{
  "title": "Vespera — Boutique Hotel Booking",
  "titleAr": "فيسبيرا — منصة حجز فندقي بوتيك",
  "tagline": "A concierge-grade booking flow for independent hotels",
  "taglineAr": "تجربة حجز بمستوى الكونسيرج للفنادق المستقلة",
  "description": "Two or three sentence summary shown on cards and in search.",
  "descriptionAr": "وصف عربي مختصر",
  "presentationMode": "caseStudy",
  "deliveryStatus": "live",
  "projectOrigin": "clientWork"
}
```

- `presentationMode`: `"caseStudy"` (Full Case Study) or `"showcase"`
  (Quick Showcase) — informational only, shown in the import review so you
  know what kind of project the file was exported from. **It is never
  applied to the form on Apply** — which editor a project uses is chosen
  explicitly when the project is created (see PortfolioWizard.jsx vs.
  PortfolioQuickShowcase.jsx) and an import never silently switches it. You
  can still apply a `showcase` export into the Full Case Study editor; its
  extra narrative fields will simply be empty.
- `deliveryStatus`: `"live" | "concept" | "archived"`.
- `projectOrigin`: `"clientWork" | "selfInitiated" | "internalProduct" |
  "experimental"`, or omitted entirely for "not classified." **Independent**
  of `deliveryStatus` — a self-initiated project can be Live; a client
  project can be a Concept. Never inferred from any other field.

### 2.2 Library relations — portable descriptors, not database IDs

`category`, `industry`, `projectType`, and `client` are single descriptors;
`services`, `technologies`, `projectTags`, and `team` are arrays of them.

```json
{
  "category": { "slug": "saas-platforms", "name": "SaaS / Platforms", "nameAr": "برمجيات / منصات" },
  "industry": { "slug": "hospitality", "name": "Hospitality", "nameAr": "الضيافة" },
  "services": [
    { "slug": "ui-ux-design", "name": "UI/UX Design", "nameAr": "تصميم واجهات وتجربة المستخدم" },
    { "name": "Front-end Development" }
  ],
  "team": [
    { "name": "Sara Ahmed", "roleOverride": "Lead Designer", "roleArOverride": "مصممة رئيسية" }
  ]
}
```

A descriptor is `{ slug?, name?, nameAr? }`. **No MongoDB `_id` is ever part
of the portable identity** — that's the whole point: the same file imports
cleanly into a different database/environment. On import, the server
resolves each descriptor against your real content libraries:

1. **Slug match** — exact, if `slug` is present. Wins outright.
2. **Normalized name match** — case-insensitive exact match on `name` OR
   `nameAr`, only if it's **unambiguous** (exactly one hit).
3. Anything else is reported **unresolved**; more than one equally-valid
   name match is reported **ambiguous**. Neither is ever guessed, and
   **no library record is ever auto-created** during import.

`category` is the only relation the schema itself requires — an unresolved
`category` blocks Apply. Every other relation is optional: if it doesn't
resolve, the import review shows it as a warning and the admin explicitly
acknowledges before applying; the field is simply left as-is (existing
value under "fill empty only," or empty under "replace") and can be picked
normally afterward — the same search/create picker used everywhere else in
the editor.

`testimonials` and `awards` are exported as **read-only reference text**
only (`{ author, quote, ... }` / `{ title, org, year, ... }`) — they don't
have the simple name/slug identity every other library here does, so they
are never auto-resolved or auto-created. Use them as a copy/paste reference
and add the real testimonial/award via the normal picker.

`relatedProjectsOverride` (the manual "related projects" pin) is
**intentionally excluded** from the portable format — it references other
portfolio projects specifically, which is out of scope for a single-project
file. Re-set it manually in SEO & Publish after import if needed.

### 2.3 Narrative (Full Case Study)

`myRole`/`myRoleAr`, `goals`/`goalsAr`, `painPoints`/`painPointsAr`,
`challenge`/`challengeAr`, `solution`/`solutionAr`, `process`/`processAr`,
`results`/`resultsAr` — plain strings, exactly as typed in the Story tab.

### 2.4 Highlights (both modes)

```json
"highlights": [
  { "text": "Rebuilt the design system from scratch", "textAr": "أعدنا بناء نظام التصميم بالكامل" }
]
```

Up to 3 items. An item with neither `text` nor `textAr` is dropped on
import (never rendered publicly, per the schema's own sanitize-on-write).

### 2.5 Metrics, performance, FAQs (Full Case Study)

```json
"metrics": [{ "label": "Conversion rate", "value": "+230%", "trend": "up" }],
"performanceMetrics": [{ "label": "Load time", "before": "4.2s", "after": "0.9s" }],
"faqs": [{ "question": "...", "answer": "..." }]
```

### 2.6 Links, timeline, SEO, display

`liveUrl`, `figmaUrl`, `githubUrl`, `duration`, `teamSize`, `startDate`,
`launchDate`, `year`, `metaTitle`, `metaDescription`, `featured`,
`displayOrder` — plain values, validated the same way the editor already
validates them (URL shape, integer `displayOrder`, etc.).

### 2.7 Content blocks (Full Case Study "The Build")

`blocks[]` preserves every non-media field (`type`, `text`/`textAr`,
`level`, `frame`, `layout`, `caption`/`captionAr`, `embedUrl`, `url`,
`title`, `stats`, ...). Media sub-fields (`asset`, `images`, `before`,
`after`, `poster`) are **never exported** — see §5. On import, each block
lands with **empty** media slots, obviously ready for you to upload into,
never a broken-looking partially-populated asset.

---

## 3. What's explicitly excluded

Never present in an export, and never trusted from an import even if a
hand-edited file includes them:

- `_id`, `slug`, `__v`, `createdAt`, `updatedAt`
- `status`, `publishedAt` — **importing never publishes or unpublishes a
  project.** The project's current status is untouched by import; a
  brand-new project created via import starts as `draft` like any other.
- `viewCount` — analytics, not content.
- Image/video/audio binaries, signed URLs, upload-provider internals
  (`publicId`, `provider`, catalog asset IDs).

---

## 4. Media handling

**No image, video, or audio is ever included in the JSON.** Cover image,
cover video, gallery, proof screenshots, client logos, avatars — none of it.
After applying an import, every media slot is empty and visibly says so
(the normal "Upload" tile). This is deliberate: a JSON file is for content
and structure, not a media transfer mechanism.

## 5. `mediaManifest` — the "what to re-upload" checklist

```json
"mediaManifest": [
  { "field": "coverImage", "kind": "image", "alt": "Vespera homepage hero" },
  { "field": "gallery", "order": 0, "kind": "image", "caption": "Booking flow, step 2" },
  { "field": "blocks[3].asset", "kind": "video" }
]
```

Each entry is **metadata only** — a logical field name, its position
(`order`, for array fields), and the alt/caption text that WAS on that
asset, so you know what to re-upload and how to caption it. It is never
treated as an uploaded asset, never rendered as media, and never affects
which media slots the import fills (all media slots stay empty regardless).

---

## 6. Import merge strategies

### Smart partial import

Content problems are handled per field/item, not as all-or-nothing file
failures. Recognized valid fields are imported while unknown fields, invalid
URLs/enums/dates, unsupported block types, and unresolved or ambiguous library
relations are skipped and listed in the review report. An unresolved Category
does **not** block importing the rest of the project; normal publish-readiness
validation will ask the admin to choose a Category before publication.

Only envelope/security failures reject the complete file: malformed JSON,
wrong format, unsupported schema version, missing project object, unsafe keys,
or payload size/depth violations.

The review modal reports three counts before Apply: ready to import, skipped,
and preserved by the selected merge strategy. Replace mode only replaces with
valid compatible values; skipped or unresolved values never clear existing
data. The post-import banner provides a one-step in-memory Undo action.

| Strategy | Arabic label | Behavior |
|---|---|---|
| **Fill empty fields only** (default) | تعبئة الحقول الفارغة فقط | Only sets a field if the editor's current value is empty. Never overwrites anything you've already filled in. |
| **Replace current data** | استبدال البيانات الحالية | Overwrites every textual/structured field the file provides. **Media is always preserved** either way — existing uploaded images/video are never cleared by an import, because the file never contains media to replace them with. |

Both strategies apply relations only where the dry-run resolution actually
matched a real library entry (§2.2) — an unresolved relation is never
force-set to null under "Replace," it's simply left alone.

---

## 7. Schema versioning

`schemaVersion` is a plain integer, currently `1`. If a future version adds
fields, this admin will ship an explicit migration function for it (see
`server/utils/portfolioPortable.js`'s `SCHEMA_MIGRATIONS` map) so an
older-but-still-supported file is normalized before use. A version this
build doesn't recognize — newer than it knows how to read, or older than
anything it still migrates — is rejected with a clear message; nothing is
ever partially imported from an unsupported version.

---

## 8. Creating a file by hand or with an AI assistant

The two example files next to this doc are meant to be copy/paste starting
points:

- [`examples/quick-showcase.example.json`](examples/quick-showcase.example.json)
- [`examples/full-case-study.example.json`](examples/full-case-study.example.json)

When asking an AI assistant to draft one from a brief: give it this
document plus the presentation-mode example that matches what you're
building, and ask it to fill in `project` only — leave `format` and
`schemaVersion` exactly as shown, and leave `mediaManifest` off entirely
unless you actually want the checklist. **Never ask it to invent a client
testimonial, KPI, or business result that didn't happen** — for a Quick
Showcase in particular, keep it visual-first and honest; don't turn it into
a fabricated case study.

## 9. Importing safely

1. Admin → Portfolio → open (or start) a project → **More actions → Import
   JSON**.
2. Drop or choose the file. It's validated locally first (valid JSON,
   recognized format, supported schema version, safe shape) — a bad file is
   rejected immediately with a specific reason, never a generic failure.
3. The server does a **read-only dry run** matching every relation
   (category, industry, services, technologies, tags, team, client) against
   your real libraries and reports back what resolved, what's ambiguous,
   and what's unresolved. Nothing is written yet.
4. Review the summary, pick a merge strategy, and click **Apply** — this
   only updates the open editor's in-memory form, exactly once. It does
   **not** save or publish anything by itself; review the populated fields
   like any other edit, upload media, and save/publish manually when ready.
5. **Cancel** at any point leaves the editor exactly as it was — nothing is
   written until you explicitly click Apply, and Apply never touches the
   database directly either (it just fills the form you were already
   editing).
