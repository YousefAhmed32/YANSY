const mongoose = require('mongoose');

const localized = { en: { type: String, default: '' }, ar: { type: String, default: '' } };

/**
 * Singleton document — controls the homepage "Trusted by Our Clients" section
 * as a whole (on/off, headline copy), independent of the individual ClientLogo
 * list items it displays. Same singleton pattern as HomepageVideoSettings.
 */
const clientLogoSettingsSchema = new mongoose.Schema(
  {
    enabled:  { type: Boolean, default: true },
    title:    localized,
    subtitle: localized,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

clientLogoSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({
      title:    { en: 'Trusted by Our Clients', ar: 'موثوق بنا من قِبل عملائنا' },
      subtitle: {
        en: "We're proud to collaborate with businesses across multiple industries.",
        ar: 'نفخر بالتعاون مع شركات في قطاعات متعددة.',
      },
    });
  }
  return doc;
};

module.exports = mongoose.model('ClientLogoSettings', clientLogoSettingsSchema);
