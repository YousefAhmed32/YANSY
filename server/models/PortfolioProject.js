const mongoose = require('mongoose');

// ── Reusable sub-schemas ──────────────────────────────────────────────────────

const mediaAssetSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      // Media must always go through the upload endpoint (Cloudinary/local disk), which never
      // returns inline data URIs. Blocking them here prevents multi-MB base64 blobs from ever
      // being persisted directly into a document again (they previously bloated a single
      // project's API payload from a few KB to ~28MB).
      validate: {
        validator: (v) => !v || !v.startsWith('data:'),
        message: 'Media assets must be uploaded via the media upload endpoint — inline data URIs are not allowed.',
      },
    },
    publicId:    { type: String },                                            // cloudinary public_id or local filename — needed for deletion
    provider:    { type: String, enum: ['cloudinary', 'local'], default: 'cloudinary' },
    width:       { type: Number },
    height:      { type: Number },
    blurDataURL: { type: String },                                            // base64 LQIP for progressive reveal
    dominantColor: { type: String },                                          // hex, used as instant paint color before LQIP loads
    alt:         { type: String, default: '' },
    altAr:       { type: String, default: '' },
  },
  { _id: false }
);

const metricSchema = new mongoose.Schema(
  {
    label:   { type: String, required: true },
    labelAr: { type: String },
    value:   { type: String, required: true },   // e.g. "+230%", "2.4s", "50K users"
  },
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
  },
  { _id: false }
);

// ── Main schema ────────────────────────────────────────────────────────────────

const portfolioProjectSchema = new mongoose.Schema(
  {
    // Identity
    title:    { type: String, required: true, trim: true },
    titleAr:  { type: String, trim: true },
    slug:     { type: String, required: true, unique: true, lowercase: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: ['E-commerce', 'Medical', 'Real Estate', 'Restaurants & Food', 'SaaS / Platforms', 'Educational', 'Other'],
    },
    industry: { type: String, trim: true },

    // Summary — used in cards, listing, SEO
    description:   { type: String, required: true },
    descriptionAr: { type: String },

    // Case-study narrative — all optional, sections render only when present
    challenge:   { type: String },
    challengeAr: { type: String },
    solution:    { type: String },
    solutionAr:  { type: String },
    process:     { type: String },
    processAr:   { type: String },
    results:     { type: String },
    resultsAr:   { type: String },

    metrics:     [metricSchema],
    testimonial: testimonialSchema,

    // Meta
    liveUrl:  { type: String, trim: true },
    tags:     [{ type: String }],           // doubles as tech-stack display
    duration: { type: String },             // e.g. "8 weeks"
    teamSize: { type: String },             // e.g. "4 people"
    year:     { type: Number },

    // Media
    coverImage: { type: mediaAssetSchema, required: true },
    gallery:    [mediaAssetSchema],

    // Publishing
    status:      { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    featured:    { type: Boolean, default: false },
    order:       { type: Number, default: 0 },
    publishedAt: { type: Date },

    // SEO
    metaTitle:       { type: String },
    metaDescription: { type: String },

    // Analytics
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

portfolioProjectSchema.index({ title: 'text', description: 'text', tags: 'text', industry: 'text' });
portfolioProjectSchema.index({ status: 1, order: 1, createdAt: -1 });
portfolioProjectSchema.index({ status: 1, featured: 1 });
portfolioProjectSchema.index({ createdAt: -1, _id: -1 }); // cursor pagination

module.exports = mongoose.model('PortfolioProject', portfolioProjectSchema);
