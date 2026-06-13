'use strict';
const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  key: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string',
  },
  category: {
    type: String,
    enum: ['general', 'security', 'email', 'payments', 'ai', 'platform', 'features', 'files'],
    default: 'general',
  },
  label:       { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  isPublic:    { type: Boolean, default: false }, // safe to expose to frontend
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
});

systemSettingsSchema.index({ category: 1 });
systemSettingsSchema.index({ isPublic: 1 });

// Static: get a setting value by key with fallback
systemSettingsSchema.statics.get = async function (key, fallback = null) {
  const setting = await this.findOne({ key }).lean();
  if (!setting) return fallback;
  return setting.value;
};

// Static: set a setting value by key (upsert)
systemSettingsSchema.statics.set = async function (key, value, updatedBy = null) {
  return this.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy } },
    { new: true, upsert: false }
  );
};

// Static: get all settings in a category
systemSettingsSchema.statics.getCategory = async function (category) {
  const settings = await this.find({ category }).lean();
  return settings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
