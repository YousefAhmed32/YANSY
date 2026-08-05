'use strict';
const mongoose = require('mongoose');
const { mediaAssetSchema } = require('./shared/mediaAssetSchema');
const { libraryMetaFields, librarySchemaOptions } = require('./shared/libraryFields');

// No namedLibraryFields() here — a testimonial's identity is its quote/author,
// not a generic "name", so it only takes the shared usage/pin metadata.
const testimonialSchema = new mongoose.Schema(
  {
    ...libraryMetaFields(),
    quote:    { type: String, required: true },
    quoteAr:  { type: String },
    author:   { type: String, required: true, trim: true },
    authorAr: { type: String, trim: true },
    role:     { type: String, trim: true },
    roleAr:   { type: String, trim: true },
    avatar:   { type: mediaAssetSchema },
    audio:    { type: mediaAssetSchema },
    client:   { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  },
  librarySchemaOptions
);

testimonialSchema.index({ author: 'text', authorAr: 'text', quote: 'text' });

module.exports = mongoose.model('Testimonial', testimonialSchema);
