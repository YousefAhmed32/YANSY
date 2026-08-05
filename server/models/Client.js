'use strict';
const mongoose = require('mongoose');
const { mediaAssetSchema } = require('./shared/mediaAssetSchema');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

// This is the CMS "who is the client" library referenced by PortfolioProject.
// Distinct from ClientLogo.js, which powers the unrelated homepage brand
// carousel and is not linked to individual projects.
const clientSchema = new mongoose.Schema(
  {
    ...namedLibraryFields(),
    logo:          { type: mediaAssetSchema },
    country:       { type: String, trim: true },
    website:       { type: String, trim: true },
    industry:      { type: mongoose.Schema.Types.ObjectId, ref: 'Industry' },
    description:   { type: String },
    descriptionAr: { type: String },
  },
  librarySchemaOptions
);

clientSchema.index({ name: 'text', nameAr: 'text' });

module.exports = mongoose.model('Client', clientSchema);
