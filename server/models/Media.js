'use strict';
const mongoose = require('mongoose');

const usedInSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioProject' },
    field:   { type: String }, // e.g. 'coverImage' | 'gallery' | 'team.avatar' — informational, for the "used in" panel
  },
  { _id: false }
);

/**
 * Catalog layer over the existing GridFS blob store (server/media/media.service.js
 * already dedupes identical file bytes via sha256; this collection makes that
 * dedup visible/browsable/searchable instead of invisible). `type` is the
 * library-browsing category (image/video/document/logo/icon) — deliberately
 * folding Logo/Icon/Video/Document into one Media collection with a `type`
 * filter rather than four near-empty separate collections.
 */
const mediaSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true }, // GridFS file id
    sha256:   { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    type:     { type: String, enum: ['image', 'video', 'audio', 'document', 'logo', 'icon'], default: 'image' },
    width:    { type: Number },
    height:   { type: Number },
    filename: { type: String, trim: true },
    alt:        { type: String, default: '' },
    altAr:      { type: String, default: '' },
    caption:    { type: String, default: '' },
    captionAr:  { type: String, default: '' },
    tags:       [{ type: String, trim: true }],
    folder:     { type: String, trim: true, default: '' },
    usedIn:     [usedInSchema],
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

mediaSchema.index({ filename: 'text', alt: 'text', altAr: 'text', caption: 'text', tags: 'text' });
mediaSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
