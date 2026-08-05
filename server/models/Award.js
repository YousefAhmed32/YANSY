'use strict';
const mongoose = require('mongoose');
const { libraryMetaFields, librarySchemaOptions } = require('./shared/libraryFields');

// `type` folds certifications in here rather than a near-duplicate model —
// awards and certifications share every field (title, issuing org, year, url).
const awardSchema = new mongoose.Schema(
  {
    ...libraryMetaFields(),
    title:   { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true },
    org:     { type: String, trim: true },
    orgAr:   { type: String, trim: true },
    year:    { type: Number },
    url:     { type: String, trim: true },
    icon:    { type: String, trim: true },
    type:    { type: String, enum: ['award', 'certification'], default: 'award' },
  },
  librarySchemaOptions
);

awardSchema.index({ title: 'text', titleAr: 'text', org: 'text' });

module.exports = mongoose.model('Award', awardSchema);
