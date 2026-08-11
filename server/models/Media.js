'use strict';
const mongoose = require('mongoose');

const usedInSchema = new mongoose.Schema(
  {
    model: { type: String },                                  // Mongoose model name, e.g. 'Client' | 'TeamMember' | 'Testimonial'
    id:    { type: mongoose.Schema.Types.ObjectId },           // that document's _id
    field: { type: String },                                   // field on it, e.g. 'logo' | 'avatar' | 'audio'
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
 *
 * `usedIn`/`usageCount` are kept in sync by server/media/mediaCatalog.service.js,
 * called from the reusable-content-library router (libraryRouter.factory.js)
 * whenever a Client/TeamMember/Testimonial (etc.) attaches, replaces, or
 * removes one of these catalog items on an embedded media field — see that
 * file for why an asset with zero remaining references is deleted outright
 * instead of lingering as an orphan.
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
