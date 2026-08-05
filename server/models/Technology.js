'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

const technologySchema = new mongoose.Schema(
  {
    ...namedLibraryFields(),
    icon:     { type: String, trim: true }, // icon identifier or URL, rendered by TechTagInput
    color:    { type: String, trim: true }, // brand accent color for the chip
    category: { type: String, trim: true }, // freeform grouping, e.g. "Frontend"/"Backend"/"Design"
  },
  librarySchemaOptions
);

technologySchema.index({ name: 'text' });

module.exports = mongoose.model('Technology', technologySchema);
