const mongoose = require('mongoose');

/**
 * Singleton document — controls the "Start Your Project" decision screen
 * (WhatsApp vs. Website Form) shown across the public site.
 */
const localizedString = { en: { type: String, default: '' }, ar: { type: String, default: '' } };

const startProjectSettingsSchema = new mongoose.Schema(
  {
    // ── Channel toggles ──────────────────────────────────────────
    whatsappEnabled: { type: Boolean, default: true },
    formEnabled:     { type: Boolean, default: true },

    // ── WhatsApp channel ─────────────────────────────────────────
    whatsappNumber:      { type: String, default: '+201090385390' },
    whatsappTitle:        { type: localizedString, default: () => ({}) },
    whatsappDescription:  { type: localizedString, default: () => ({}) },
    whatsappResponseTime: { type: localizedString, default: () => ({}) },

    // ── Website Form channel ─────────────────────────────────────
    formTitle:        { type: localizedString, default: () => ({}) },
    formDescription:  { type: localizedString, default: () => ({}) },
    formResponseTime: { type: localizedString, default: () => ({}) },

    // ── Presentation ──────────────────────────────────────────────
    buttonOrder:   { type: String, enum: ['whatsapp-first', 'form-first'], default: 'whatsapp-first' },
    defaultOption: { type: String, enum: ['whatsapp', 'form', null], default: null },

    // ── Analytics counters — updated via atomic $inc from the public beacon ──
    analytics: {
      decisionViews:    { type: Number, default: 0 },
      whatsappChosen:   { type: Number, default: 0 },
      formChosen:       { type: Number, default: 0 },
      whatsappSubmitted:{ type: Number, default: 0 },
      formStepReached:  { type: [Number], default: [0, 0, 0, 0] }, // index = step - 1
      formCompleted:    { type: Number, default: 0 },
      totalCompletionSeconds: { type: Number, default: 0 },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

startProjectSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('StartProjectSettings', startProjectSettingsSchema);
