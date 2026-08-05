'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

// Replaces the hardcoded string enum that used to live on PortfolioProject
// (see client/src/utils/portfolioTaxonomy.js) — now a real, admin-manageable
// library, pre-seeded 1:1 from that enum by the migration script.
const categorySchema = new mongoose.Schema(
  {
    ...namedLibraryFields(),
    icon:     { type: String, trim: true },
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  librarySchemaOptions
);

categorySchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);
