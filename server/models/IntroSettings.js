const mongoose = require('mongoose');

/**
 * Singleton document — one row controls the site-wide cinematic intro.
 */
const introSettingsSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },

    // Media
    videoUrl:      { type: String, default: '/Logo reveal luxury AI company.mp4' },
    videoPublicId: { type: String, default: null },
    videoProvider: { type: String, enum: ['static', 'cloudinary', 'local'], default: 'static' },
    videoSizeBytes:{ type: Number, default: null },

    // Targeting
    deviceMode: { type: String, enum: ['both', 'desktop', 'mobile'], default: 'both' },
    playMode:   { type: String, enum: ['once-per-session', 'always'], default: 'always' },
    loop:       { type: Boolean, default: false },

    // Interaction-gated playback — no browser autoplay reliance when enabled.
    // The overlay shows black-only and waits for the visitor's first click / tap /
    // mouse move / wheel / key press, then starts the video (with sound) synchronously
    // inside that gesture's call stack, satisfying browser autoplay-with-audio policy.
    waitForInteraction: { type: Boolean, default: true },
    autoplayMuted:      { type: Boolean, default: true },  // only used when waitForInteraction is off
    playWithSound:      { type: Boolean, default: true },  // only used when waitForInteraction is on

    // Skip control
    skipEnabled:      { type: Boolean, default: true },
    skipDelaySeconds: { type: Number, default: 3, min: 0, max: 30 },

    // Timing
    fadeDurationMs:       { type: Number, default: 600,  min: 0, max: 5000 },
    transitionDurationMs: { type: Number, default: 900,  min: 0, max: 5000 },

    // Analytics counters — updated via atomic $inc from the public beacon endpoint
    analytics: {
      views:            { type: Number, default: 0 },
      completions:      { type: Number, default: 0 },
      skips:            { type: Number, default: 0 },
      totalWatchSeconds:{ type: Number, default: 0 },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Fetch the single settings document, creating it with defaults on first use.
introSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('IntroSettings', introSettingsSchema);
