const mongoose = require('mongoose');

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
 */

// ── Reusable sub-schemas ──────────────────────────────────────────────────────

const mediaAssetSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v) => !v || !v.startsWith('data:'),
        message: 'Media assets must be uploaded via the media upload endpoint — inline data URIs are not allowed.',
      },
    },
    publicId:    { type: String },
    // 'cloudinary'/'local' kept only so pre-GridFS documents still deserialize —
    // every new upload writes 'gridfs' (see server/media/media.service.js).
    provider:    { type: String, enum: ['cloudinary', 'local', 'gridfs'], default: 'gridfs' },
    // 'image' (default) | 'video' | 'audio' — lets the client pick a renderer
    // without sniffing file extensions. Cloudinary's resource_type already
    // distinguishes these at upload time (see uploadPortfolioMedia).
    kind:        { type: String, enum: ['image', 'video', 'audio'], default: 'image' },
    width:       { type: Number },
    height:      { type: Number },
    duration:    { type: Number },                                            // seconds, video/audio only
    blurDataURL: { type: String },
    dominantColor: { type: String },
    alt:         { type: String, default: '' },                               // accessibility text
    altAr:       { type: String, default: '' },
    caption:     { type: String, default: '' },                               // visible caption, distinct from alt
    captionAr:   { type: String, default: '' },
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

const testimonialSchema = new mongoose.Schema(
  {
    quote:   { type: String },
    quoteAr: { type: String },
    author:  { type: String },
    role:    { type: String },
    roleAr:  { type: String },
    avatar:  { type: mediaAssetSchema },
    audio:   { type: mediaAssetSchema },                                       // optional voice-note testimonial (kind: 'audio')
  },
  { _id: false }
);

const teamMemberSchema = new mongoose.Schema(
  { name: { type: String, required: true }, role: { type: String }, roleAr: { type: String }, avatar: { type: mediaAssetSchema } },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  { question: { type: String, required: true }, questionAr: { type: String }, answer: { type: String, required: true }, answerAr: { type: String } },
  { _id: false }
);

const awardSchema = new mongoose.Schema(
  { title: { type: String, required: true }, titleAr: { type: String }, org: { type: String }, year: { type: Number }, url: { type: String } },
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

    category: {
      type: String,
      required: true,
      // 'Hotels & Hospitality' was already a selectable option in the public
      // taxonomy (client/src/utils/portfolioTaxonomy.js) but missing here —
      // choosing it in the admin has always failed Mongoose validation.
      enum: ['E-commerce', 'Medical', 'Real Estate', 'Restaurants & Food', 'SaaS / Platforms', 'Educational', 'Hotels & Hospitality', 'Other'],
    },
    industry: { type: String, trim: true },

    // ── Client ────────────────────────────────────────────────────────────
    clientName:   { type: String, trim: true },
    clientNameAr: { type: String, trim: true },
    clientLogo:   { type: mediaAssetSchema },
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
    testimonial:        testimonialSchema,
    proofScreenshots:   [mediaAssetSchema],                                    // e.g. WhatsApp/chat proof of client satisfaction
    faqs:               [faqSchema],
    awards:              [awardSchema],

    team: [teamMemberSchema],

    // Flexible mid-page content — see blockSchema doc comment above.
    blocks: [blockSchema],

    // ── Meta ──────────────────────────────────────────────────────────────
    liveUrl:   { type: String, trim: true },
    figmaUrl:  { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    tags:      [{ type: String }],           // doubles as tech-stack display
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
    order:       { type: Number, default: 0 },
    publishedAt: { type: Date },

    // ── SEO ───────────────────────────────────────────────────────────────
    metaTitle:       { type: String },
    metaDescription: { type: String },

    // ── Analytics ─────────────────────────────────────────────────────────
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

portfolioProjectSchema.index({ title: 'text', description: 'text', tags: 'text', industry: 'text', clientName: 'text' });
portfolioProjectSchema.index({ status: 1, order: 1, createdAt: -1 });
portfolioProjectSchema.index({ status: 1, featured: 1 });
portfolioProjectSchema.index({ createdAt: -1, _id: -1 }); // cursor pagination

module.exports = mongoose.model('PortfolioProject', portfolioProjectSchema);
