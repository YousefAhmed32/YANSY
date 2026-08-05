'use strict';
const mongoose = require('mongoose');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

// Generic project labels (e.g. "Featured", "Award-winning") — distinct from
// Technology, which is specifically the tech-stack chips.
const tagSchema = new mongoose.Schema({ ...namedLibraryFields() }, librarySchemaOptions);

tagSchema.index({ name: 'text' });

module.exports = mongoose.model('Tag', tagSchema);
