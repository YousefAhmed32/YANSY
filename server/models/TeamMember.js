'use strict';
const mongoose = require('mongoose');
const { mediaAssetSchema } = require('./shared/mediaAssetSchema');
const { namedLibraryFields, librarySchemaOptions } = require('./shared/libraryFields');

const socialsSchema = new mongoose.Schema(
  { linkedin: String, twitter: String, github: String, instagram: String, website: String },
  { _id: false }
);

const teamMemberSchema = new mongoose.Schema(
  {
    ...namedLibraryFields(),
    avatar:     { type: mediaAssetSchema },
    position:   { type: String, trim: true },
    positionAr: { type: String, trim: true },
    email:      { type: String, trim: true, lowercase: true },
    socials:    { type: socialsSchema, default: () => ({}) },
    status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  librarySchemaOptions
);

teamMemberSchema.index({ name: 'text', nameAr: 'text', position: 'text' });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
