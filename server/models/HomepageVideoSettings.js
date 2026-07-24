const mongoose = require('mongoose');

const localized = { en: { type: String, default: '' }, ar: { type: String, default: '' } };

const posterSchema = new mongoose.Schema(
  {
    url:           { type: String, default: null },
    publicId:      { type: String, default: null },
    provider:      { type: String, enum: ['cloudinary', 'local'], default: 'cloudinary' },
    width:         { type: Number, default: null },
    height:        { type: Number, default: null },
    blurDataURL:   { type: String, default: null },
    dominantColor: { type: String, default: null },
  },
  { _id: false }
);

/**
 * Singleton document — controls the standalone homepage "video showcase" section.
 * Fully independent of IntroSettings, except it can optionally *point at* the intro's
 * video live (videoSource: 'intro') instead of storing its own — resolved at read time
 * in the routes layer, never copied, so replacing the intro video updates this too.
 */
const homepageVideoSettingsSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },

    // Media — either reuse the intro video live, or host a separate one
    videoSource:    { type: String, enum: ['intro', 'own'], default: 'intro' },
    videoUrl:       { type: String, default: null },
    videoPublicId:  { type: String, default: null },
    videoProvider:  { type: String, enum: ['cloudinary', 'local'], default: 'cloudinary' },
    videoSizeBytes: { type: Number, default: null },
    poster: posterSchema,

    // Content
    headline:    localized,
    subtitle:    localized,
    description: localized,
    ctaText:     localized,
    ctaLink:     { type: String, default: '' },

    // Playback behavior
    autoplay:    { type: Boolean, default: false },
    muted:       { type: Boolean, default: true },
    loop:        { type: Boolean, default: true },
    playTrigger: { type: String, enum: ['autoplay', 'click', 'scroll', 'visible'], default: 'visible' },

    // Custom controls
    showControls:          { type: Boolean, default: true },
    showProgress:           { type: Boolean, default: true },
    showSoundButton:        { type: Boolean, default: true },
    showFullscreenButton:   { type: Boolean, default: true },

    // Design
    sectionHeight:    { type: String, enum: ['compact', 'standard', 'large', 'cinematic'], default: 'large' },
    backgroundStyle:  { type: String, enum: ['dark', 'light', 'gradient', 'black'], default: 'dark' },
    overlayOpacity:   { type: Number, default: 35, min: 0, max: 100 },
    animationStyle:   { type: String, enum: ['fade', 'scale', 'slide', 'cinematic'], default: 'cinematic' },
    roundedCorners:   { type: Boolean, default: true },
    borderRadius:     { type: Number, default: 24, min: 0, max: 64 },
    shadowStyle:      { type: String, enum: ['none', 'soft', 'elevated', 'glow'], default: 'glow' },
    glowEffect:       { type: Boolean, default: true },
    spacing:          { type: String, enum: ['compact', 'comfortable', 'spacious'], default: 'comfortable' },
    marginTop:        { type: Number, default: 0, min: 0, max: 400 },
    marginBottom:     { type: Number, default: 0, min: 0, max: 400 },
    sectionOrder:     { type: Number, default: 0 },

    // Visibility
    hideOnMobile:  { type: Boolean, default: false },
    hideOnDesktop: { type: Boolean, default: false },

    // Analytics counters — atomic $inc from the public beacon endpoint
    analytics: {
      views:             { type: Number, default: 0 },
      playCount:         { type: Number, default: 0 },
      completions:       { type: Number, default: 0 },
      totalWatchSeconds: { type: Number, default: 0 },
      clicks:            { type: Number, default: 0 },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

homepageVideoSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({
     headline: {
  en: "Solutions Built for Every Industry",
  ar: "حلول رقمية لكل قطاع"
},
      subtitle: { en: 'A closer look at how we build premium digital products.', ar: 'نظرة أقرب على كيفية بنائنا لمنتجات رقمية متميزة.' },
      ctaText:  { en: 'Start Your Project', ar: 'ابدأ مشروعك' },
    });
  }
  return doc;
};

module.exports = mongoose.model('HomepageVideoSettings', homepageVideoSettingsSchema);
