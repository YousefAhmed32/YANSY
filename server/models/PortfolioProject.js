const mongoose = require('mongoose');
const { mediaAssetSchema } = require('./shared/mediaAssetSchema');
const { UNRANKED_DISPLAY_ORDER } = require('../utils/displayOrder');

/**
 * Schema v2 — curated core fields + a flexible content-block system.
 *
 * The v1 schema only ever supported five fixed narrative paragraphs
 * (challenge/solution/process/results) and a flat image gallery. That's not
 * enough to build a real case study, but the fix is NOT "add thirty more
 * top-level fields" (tagline, wireframes, design-system, color-palette,
 * architecture-diagram, competitor-analysis, before/after, desktop/tablet/
 * mobile screenshots, ...). Most of those are one-off artifacts that only
 * apply to SOME projects, in SOME order, with SOME amount of supporting text
 * — exactly what a rigid schema is bad at and a Notion-style block list is
 * good at. So: a bounded set of structured fields for things every project
 * genuinely has (client, team, timeline, links, metrics, testimonial), plus
 * `blocks[]` — an ordered, mixed-type content stream — for everything else.
 * See `blockSchema` below for the block vocabulary.
 *
 * Schema v3 (CMS normalization) — client, team, technologies, testimonials,
 * awards, category, industry, and services are now references into the
 * reusable content libraries under server/models/ (TeamMember, Client,
 * Technology, Testimonial, Award, Category, Industry, Service) instead of
 * embedded/duplicated data — see plan doc for the full rationale. `team`
 * keeps a small join-object shape (`{ member, roleOverride, roleArOverride }`)
 * rather than a bare ObjectId array because how someone is credited on THIS
 * project can differ from their canonical library position.
 *
 * Schema v3.1 (Design Showcase, Phase 1 — see PROJECT_REVIEW.md) adds two
 * classification fields so UI-only work (mobile app designs, dashboards,
 * concepts with no live URL or client) can live in the same collection
 * without looking unfinished or fake:
 *
 *   projectType    — ref into the new ProjectType library (Web Project,
 *                     Mobile App, Dashboard, Landing Page, Branding,
 *                     UI/UX Concept, ...). Optional — every project that
 *                     existed before this field shipped simply has it unset,
 *                     which the wizard/public page treat identically to
 *                     "no restrictions apply" (every field shows, exactly
 *                     as it did before this change).
 *   deliveryStatus — 'live' | 'concept' | 'archived'. Defaults to 'live' so
 *                     every pre-existing project is correct with zero writes
 *                     required (see the migration script for why existing
 *                     documents are also backfilled explicitly, not left to
 *                     rely on this default alone).
 *
 * Neither field removes or repurposes anything — every field that existed
 * before v3.1 keeps its exact same meaning and behavior.
 *
 * Schema v3.2 (Phase 2 correction + manual ordering — see IMPLEMENTATION_PLAN.md)
 * narrows Phase 1's concept-type field-hiding (Client/Live URL/Awards are no
 * longer force-hidden — see the wizard) and renames/fixes the pre-existing,
 * never-fully-wired `order` field into `displayOrder`:
 *
 *   displayOrder — integer. Lower sorts first on the public portfolio.
 *                  Defaults to UNRANKED_DISPLAY_ORDER (server/utils/
 *                  displayOrder.js), a sentinel that sorts after every real
 *                  manual rank — NOT `null`/0, because Mongo's native
 *                  ascending sort puts null/missing fields FIRST, the
 *                  opposite of "empty sorts last." Every read/write path
 *                  that shows this field to an admin converts the sentinel
 *                  to/from a blank input — see server/utils/displayOrder.js.
 *
 * Schema v3.3 (Quick Showcase) adds `presentationMode`, a THIRD, deliberately
 * independent axis from `projectType` (what the project IS) and
 * `deliveryStatus` (whether it's live/concept/archived):
 *
 *   presentationMode — 'caseStudy' | 'showcase'. Which renderer + how much
 *                       narrative depth. 'caseStudy' is the full long-form
 *                       page (Story/Process/Impact/Proof/FAQ). 'showcase' is
 *                       a short, visual-first page for screenshots/video/
 *                       concepts that don't warrant a written case study.
 *                       Defaults to 'caseStudy' so every project that existed
 *                       before this field shipped renders EXACTLY as it did
 *                       before — same publish requirements, same page. Never
 *                       used to infer project type or delivery status, and
 *                       never inferred FROM them (see PortfolioWizard vs.
 *                       PortfolioQuickShowcase — the admin picks this once,
 *                       explicitly, when starting a new project).
 *
 * Schema v3.4 (Project Origin + Highlights + Portable JSON) adds a FOURTH
 * independent classification axis plus one small optional narrative field:
 *
 *   projectOrigin — 'clientWork' | 'selfInitiated' | 'internalProduct' |
 *                    'experimental'. Where the project came from — distinct
 *                    from deliveryStatus (whether it's live/concept/
 *                    archived), projectType (what it is), and
 *                    presentationMode (how it's rendered). A self-initiated
 *                    project can still be Live; a client project can still
 *                    be a Concept. Deliberately has NO default and is never
 *                    inferred from another field — every project that
 *                    existed before this field shipped simply has it unset
 *                    (`undefined`), which every read path treats as "not
 *                    classified," not as any specific value. There is no
 *                    migration that backfills this field: unlike
 *                    deliveryStatus (where 'live' was a safe, provably-true
 *                    default for every pre-existing project), there is no
 *                    origin value that's safely true for a project we have
 *                    no record of the provenance of — guessing would be a
 *                    false claim. Left permanently optional/unset for
 *                    legacy records that are never manually classified.
 *
 *   highlights — up to 3 short bilingual bullets ({ text, textAr }) for
 *                "what's strongest about this execution," shown compactly in
 *                both public renderers. Deliberately NOT a place for
 *                metrics/results/client claims (those live in
 *                metrics/performanceMetrics/results, hidden for concept
 *                projects — see the v3.1 doc comment above); highlights are
 *                allowed on every project type since they describe the
 *                execution itself, not a business outcome.
 */

// ── Reusable sub-schemas ──────────────────────────────────────────────────────

const teamCreditSchema = new mongoose.Schema(
  {
    member:        { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', required: true },
    roleOverride:   { type: String, trim: true }, // falls back to TeamMember.position when blank
    roleArOverride: { type: String, trim: true },
  },
  { _id: false }
);

const metricSchema = new mongoose.Schema(
  {
    label:   { type: String, required: true },
    labelAr: { type: String },
    value:   { type: String, required: true },
    trend:   { type: String, enum: ['up', 'down', 'neutral'] },               // optional — drives an arrow/color in the UI
  },
  { _id: false }
);

// Before/after pairs for technical proof points (load time, Lighthouse score,
// bounce rate, ...) — deliberately just label + two short values, not a
// dedicated "Lighthouse scores" schema. One shape covers every such metric a
// dev-focused case study wants to show.
const performanceMetricSchema = new mongoose.Schema(
  { label: { type: String, required: true }, labelAr: { type: String }, before: { type: String, required: true }, after: { type: String, required: true } },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  { question: { type: String, required: true }, questionAr: { type: String }, answer: { type: String, required: true }, answerAr: { type: String } },
  { _id: false }
);

// Short, structured "what's strongest about this execution" bullets — see
// the v3.4 doc comment above. Deliberately NOT a single free-text field: a
// bounded, structured list is what lets the admin UI enforce "max 3, keep it
// short" and both public renderers show them as scannable bullets instead of
// admin-authored markdown-ish bullet formatting.
const HIGHLIGHT_TEXT_MAXLEN = 140;
const HIGHLIGHT_TEXT_AR_MAXLEN = 160;
const highlightSchema = new mongoose.Schema(
  {
    text:   { type: String, trim: true, maxlength: HIGHLIGHT_TEXT_MAXLEN },
    textAr: { type: String, trim: true, maxlength: HIGHLIGHT_TEXT_AR_MAXLEN },
  },
  { _id: false }
);

/**
 * Content blocks — the flexible part of the schema.
 *
 * One Mongoose sub-schema holds every block type's fields as optional; the
 * `type` discriminator tells the renderer which subset is meaningful. This
 * (rather than Mongoose discriminators/a polymorphic array) keeps admin
 * writes and the public renderer simple — both just switch on `block.type`.
 *
 *   heading     { text, textAr, level }              level: 2 | 3
 *   paragraph   { text, textAr }
 *   image       { asset, frame }                      frame: 'none'|'browser'|'mobile'|'tablet' — a device-chrome wrapper
 *   gallery     { images: [asset], layout }            layout: 'grid'|'carousel'
 *   quote       { text, textAr, author, role }
 *   statRow     { stats: [{value,label,labelAr}] }     mid-content stat callout, separate from the hero metrics
 *   beforeAfter { before: asset, after: asset, beforeLabel, afterLabel }
 *   video       { asset, embedUrl, poster }             asset OR embedUrl (YouTube/Vimeo/Loom), never both
 *   embed       { url, title }                          Figma frame / interactive demo iframe
 *   divider     {}
 *
 * `caption`/`captionAr` apply to any media-carrying block (image/gallery/
 * video/beforeAfter) as the block's own displayed caption, independent of
 * each asset's per-image alt/caption in mediaAssetSchema.
 */
const blockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['heading', 'paragraph', 'image', 'gallery', 'quote', 'statRow', 'beforeAfter', 'video', 'embed', 'divider'],
    },
    text: { type: String }, textAr: { type: String },
    level: { type: Number, enum: [2, 3], default: 2 },
    asset: { type: mediaAssetSchema },
    images: [mediaAssetSchema],
    layout: { type: String, enum: ['grid', 'carousel'], default: 'grid' },
    frame: { type: String, enum: ['none', 'browser', 'mobile', 'tablet'], default: 'none' },
    author: { type: String }, role: { type: String },
    stats: [{ _id: false, value: String, label: String, labelAr: String }],
    before: { type: mediaAssetSchema }, after: { type: mediaAssetSchema },
    beforeLabel: { type: String }, afterLabel: { type: String },
    embedUrl: { type: String }, poster: { type: mediaAssetSchema },
    url: { type: String }, title: { type: String },
    caption: { type: String }, captionAr: { type: String },
  },
  { _id: true, timestamps: false }
);

// ── Main schema ────────────────────────────────────────────────────────────────

const portfolioProjectSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────
    title:    { type: String, required: true, trim: true },
    titleAr:  { type: String, trim: true },
    tagline:  { type: String, trim: true, maxlength: 140 },                    // one-line elevator pitch, shown in the hero under the title
    taglineAr: { type: String, trim: true, maxlength: 160 },
    slug:     { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Reference into the Category library (server/models/Category.js) —
    // replaces the hardcoded string enum this field used to be. Migrated
    // 1:1 from that enum by scripts/migrate-portfolio-libraries.js.
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    // Reference into the Industry library — replaces the free-text string.
    industry: { type: mongoose.Schema.Types.ObjectId, ref: 'Industry' },
    // Reference into the ProjectType library (Web Project, Mobile App,
    // Dashboard, UI/UX Concept, ...) — see the v3.1 doc comment above.
    // Deliberately optional and un-migrated: every project created before
    // this field existed keeps working with it unset.
    projectType: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectType' },
    // Did this project actually ship as a real, visitable product? Defaults
    // to 'live' — the correct value for every project that existed before
    // this field was introduced.
    deliveryStatus: { type: String, enum: ['live', 'concept', 'archived'], default: 'live' },
    // Which public renderer + how much narrative depth — see the v3.3 doc
    // comment above. Independent of projectType/deliveryStatus on purpose.
    presentationMode: { type: String, enum: ['caseStudy', 'showcase'], default: 'caseStudy' },
    // Where the project came from — see the v3.4 doc comment above.
    // Deliberately NO default: unset means "not classified," never a guess.
    projectOrigin: {
      type: String,
      enum: ['clientWork', 'selfInitiated', 'internalProduct', 'experimental'],
    },

    // ── Client ────────────────────────────────────────────────────────────
    // Reference into the Client library (server/models/Client.js) — replaces
    // the embedded clientName/clientNameAr/clientLogo fields.
    client:       { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    location:     { type: String, trim: true },
    locationAr:   { type: String, trim: true },
    // Publicly listed and viewable, but the client's identity is redacted in
    // the public render (name/logo hidden, replaced with a generic
    // category+industry line) — for NDA'd work the agency still wants to
    // show. Different from `private`, which hides the project entirely.
    confidential: { type: Boolean, default: false },
    private:      { type: Boolean, default: false },

    // ── Summary — used in cards, listing, SEO ────────────────────────────
    // Not `required` at the schema level on purpose: a Notion-style editor
    // has to let a draft exist with just a title while everything else is
    // filled in progressively (that's the whole point of autosave-from-
    // first-keystroke). `description` and `coverImage` below are instead
    // enforced only at the moment a project is published — see the
    // `assertPublishable` guard in routes/portfolio.routes.js.
    description:   { type: String },
    descriptionAr: { type: String },

    // ── Case-study narrative — all optional, sections render only when present
    myRole:      { type: String },      myRoleAr:      { type: String },       // this agency's specific responsibilities on the project
    goals:       { type: String },      goalsAr:       { type: String },       // client/business goals going in
    painPoints:  { type: String },      painPointsAr:  { type: String },
    challenge:   { type: String },      challengeAr:   { type: String },
    solution:    { type: String },      solutionAr:    { type: String },
    process:     { type: String },      processAr:     { type: String },
    results:     { type: String },      resultsAr:     { type: String },

    metrics:            [metricSchema],
    performanceMetrics: [performanceMetricSchema],
    // References into the Testimonial/Award libraries — a project usually
    // has one testimonial and a handful of awards, but both are now
    // reusable library entries rather than embedded, one-off data.
    testimonials:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial' }],
    proofScreenshots:   [mediaAssetSchema],                                    // e.g. WhatsApp/chat proof of client satisfaction
    faqs:               [faqSchema],
    awards:             [{ type: mongoose.Schema.Types.ObjectId, ref: 'Award' }],

    team: [teamCreditSchema],

    // Reference into the Service library — new field, no legacy data.
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],

    // Up to 3 short bilingual "what's strongest" bullets — see the v3.4 doc
    // comment above. The count cap is enforced here (not just in the admin
    // UI) so a direct/import API write can never smuggle in more than 3.
    highlights: {
      type: [highlightSchema],
      default: [],
      validate: { validator: (arr) => (arr || []).length <= 3, message: 'A project can have at most 3 highlights.' },
    },

    // Flexible mid-page content — see blockSchema doc comment above.
    blocks: [blockSchema],

    // ── Meta ──────────────────────────────────────────────────────────────
    liveUrl:   { type: String, trim: true },
    figmaUrl:  { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    // Reference into the Technology library — replaces the free-text `tags`
    // array that used to double as the tech-stack display (see TechTagInput.jsx).
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    // Generic project labels, distinct from the tech-stack — new, optional.
    projectTags:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    duration:  { type: String },             // e.g. "8 weeks" — human-friendly, not derived from dates
    teamSize:  { type: String },             // simple fallback display ("5 people") when the full `team[]` roster isn't filled in
    startDate:  { type: Date },
    launchDate: { type: Date },
    year:       { type: Number },

    // Manual override for the "next/related" rail; falls back to the
    // category/industry-matching algorithm (see routes) when empty.
    relatedProjectsOverride: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioProject' }],

    // ── Media ─────────────────────────────────────────────────────────────
    coverImage: { type: mediaAssetSchema },                                    // required to publish, not to save a draft — see note above
    coverVideo: { type: mediaAssetSchema },                                    // optional — hero plays this instead of the static cover when present
    gallery:    [mediaAssetSchema],

    // ── Publishing ────────────────────────────────────────────────────────
    status:      { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    featured:    { type: Boolean, default: false },
    // Manual portfolio rank — see the v3.2 doc comment above and
    // server/utils/displayOrder.js. Always a real integer, never null; the
    // sentinel default means "no manual rank," not "rank zero."
    displayOrder: {
      type: Number,
      default: UNRANKED_DISPLAY_ORDER,
      validate: { validator: Number.isInteger, message: 'displayOrder must be an integer' },
    },
    publishedAt: { type: Date },

    // ── SEO ───────────────────────────────────────────────────────────────
    metaTitle:       { type: String },
    metaDescription: { type: String },

    // ── Analytics ─────────────────────────────────────────────────────────
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// `tags`/`industry`/`clientName` used to be plain strings and were part of
// this index; all three are now ObjectId refs into libraries (technologies/
// industry/client) and can't be text-indexed directly — search now covers
// the project's own bilingual title/description only. Library-side search
// (e.g. "find projects using this client") goes through Client/Technology
// usage tracking instead, not full-text search.
portfolioProjectSchema.index({ title: 'text', titleAr: 'text', description: 'text', descriptionAr: 'text' });
// Matches the public listing's default sort exactly (see portfolio.routes.js
// CURSOR_SORT) — displayOrder ASC, featured DESC, publishedAt DESC.
portfolioProjectSchema.index({ status: 1, private: 1, displayOrder: 1, featured: -1, publishedAt: -1 });
portfolioProjectSchema.index({ status: 1, featured: 1 });
portfolioProjectSchema.index({ createdAt: -1, _id: -1 }); // sort=oldest cursor pagination

const PortfolioProject = mongoose.model('PortfolioProject', portfolioProjectSchema);
// Exposed so route-layer sanitizers (see sanitizeHighlights in
// server/routes/portfolio.routes.js) and the import validator enforce the
// exact same limits as the schema itself, instead of a second hardcoded copy.
PortfolioProject.HIGHLIGHT_TEXT_MAXLEN = HIGHLIGHT_TEXT_MAXLEN;
PortfolioProject.HIGHLIGHT_TEXT_AR_MAXLEN = HIGHLIGHT_TEXT_AR_MAXLEN;
PortfolioProject.HIGHLIGHTS_MAX = 3;
PortfolioProject.PROJECT_ORIGIN_VALUES = ['clientWork', 'selfInitiated', 'internalProduct', 'experimental'];
module.exports = PortfolioProject;
