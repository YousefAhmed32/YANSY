'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

// New library — PortfolioProject had no `services` field before this
// redesign, so there is no legacy data to migrate; admins backfill manually.
const serviceSchema = new mongoose.Schema(
  {
    ...namedLibraryFields(),
    icon:          { type: String, trim: true },
    description:   { type: String },
    descriptionAr: { type: String },
    order:         { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
  },
  librarySchemaOptions
);

serviceSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Service', serviceSchema);
