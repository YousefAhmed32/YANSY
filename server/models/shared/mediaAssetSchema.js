'use strict';
const mongoose = require('mongoose');

/**
 * Extracted from PortfolioProject.js so library models (TeamMember avatars,
 * Client logos, Testimonial avatars/audio, ...) share the exact same asset
 * shape instead of redefining it — a single embedded-asset contract across
 * every collection that carries an image/video/audio reference.
 */
const mediaAssetSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v) => !v || !v.startsWith('data:'),
        message: 'Media assets must be uploaded via the media upload endpoint — inline data URIs are not allowed.',
      },
    },
    publicId:    { type: String },
    provider:    { type: String, enum: ['cloudinary', 'local', 'gridfs'], default: 'gridfs' },
    kind:        { type: String, enum: ['image', 'video', 'audio'], default: 'image' },
    width:       { type: Number },
    height:      { type: Number },
    duration:    { type: Number },
    blurDataURL: { type: String },
    dominantColor: { type: String },
    alt:         { type: String, default: '' },
    altAr:       { type: String, default: '' },
    caption:     { type: String, default: '' },
    captionAr:   { type: String, default: '' },
    // Optional back-reference into the Media catalog (server/models/Media.js)
    // so a picked/uploaded asset stays searchable/reusable/"replace
    // everywhere"-able even though the fields above are cached inline for
    // render-without-populate performance.
    asset:       { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  },
  { _id: false }
);

module.exports = { mediaAssetSchema };
