'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('../shared/libraryFields');

/**
 * Reusable priced service/feature line item an admin can drop into a
 * Proposal's scope while building it. Distinct from `models/Service.js`
 * (the portfolio-CMS "services we offer" marketing tags) — this one carries
 * a price and a feature list meant for a specific proposal's scope section,
 * not for public display on the services page.
 */
const proposalServiceSchema = new mongoose.Schema(
  {
    ...namedLibraryFields(), // name, nameAr, slug, usageCount, lastUsedAt, isPinned
    category:      { type: String, trim: true },
    description:   { type: String },
    descriptionAr: { type: String },
    defaultPrice:  { type: Number, min: 0, default: null },
    features:      [{ type: String, trim: true }],
    isActive:      { type: Boolean, default: true },
    order:         { type: Number, default: 0 },
  },
  librarySchemaOptions
);

proposalServiceSchema.index({ isActive: 1, order: 1 });
proposalServiceSchema.index({ category: 1 });

module.exports = mongoose.model('ProposalService', proposalServiceSchema);
