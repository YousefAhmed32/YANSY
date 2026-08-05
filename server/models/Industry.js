'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

// Replaces the free-text `industry` string that used to live directly on
// PortfolioProject (and on Client) — now a real, admin-manageable library.
const industrySchema = new mongoose.Schema(
  {
    ...namedLibraryFields(),
    icon:     { type: String, trim: true },
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  librarySchemaOptions
);

industrySchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Industry', industrySchema);
