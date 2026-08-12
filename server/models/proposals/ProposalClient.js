'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('../shared/libraryFields');

/**
 * The recipient of a Proposal — distinct from `models/Client.js`, which is
 * the unrelated portfolio-CMS "who is this case study about" library. Kept
 * as its own model (not reused) because the two represent different
 * business objects that only coincidentally share a name: a portfolio
 * Client is public-facing marketing content, a ProposalClient is a private
 * CRM-style lead/contact record with proposal history.
 */
const proposalClientSchema = new mongoose.Schema(
  {
    ...namedLibraryFields(), // name, nameAr, slug, usageCount, lastUsedAt, isPinned
    company:  { type: String, trim: true },
    email:    { type: String, trim: true, lowercase: true },
    phone:    { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    country:  { type: String, trim: true },
    city:     { type: String, trim: true },
    notes:    { type: String, trim: true },
  },
  librarySchemaOptions
);

proposalClientSchema.index({ name: 'text', company: 'text', email: 'text' });

module.exports = mongoose.model('ProposalClient', proposalClientSchema);
