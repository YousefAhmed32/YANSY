'use strict';
/**
 * One-time repair for two media data-integrity bugs found in production data:
 *
 * 1. Inline base64 `data:` URIs persisted directly as a media asset's `url` (an old migration
 *    edge case) — these bloat the document and the public API response (one project's cover +
 *    gallery totalled ~6.9MB of inline base64, which `withResponsiveMedia` then quadrupled into
 *    a ~28MB JSON payload for a single homepage request). Repaired by decoding and re-uploading
 *    through the real storage pipeline (Cloudinary if configured, local disk otherwise).
 *
 * 2. Local-provider assets with an absolute `http://localhost:PORT` URL baked in at upload time
 *    (pre-fix `uploadToLocal` behaviour) — these break the moment the server runs on a different
 *    host/port. Repaired by stripping the origin so the URL is relative and gets resolved against
 *    the current API origin at render time (see client/src/utils/media.js).
 *
 * Safe to re-run: assets that need no change are left untouched.
 * Usage: node scripts/repairPortfolioMedia.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const PortfolioProject = require('../models/PortfolioProject');
const { uploadPortfolioImage } = require('../utils/portfolioMedia');

const LOCALHOST_PREFIX = /^https?:\/\/localhost(:\d+)?/;

const repairAsset = async (asset) => {
  if (!asset?.url) return null;

  if (asset.url.startsWith('data:')) {
    const match = asset.url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const [, mimeType, base64] = match;
    const fresh = await uploadPortfolioImage(Buffer.from(base64, 'base64'), 'legacy-inline-image.jpg', mimeType);
    return { ...fresh, alt: asset.alt || '', altAr: asset.altAr || '' };
  }

  if (asset.provider === 'local' && LOCALHOST_PREFIX.test(asset.url)) {
    return { ...(asset.toObject ? asset.toObject() : asset), url: asset.url.replace(LOCALHOST_PREFIX, '') };
  }

  return null;
};

const run = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy';
  await mongoose.connect(MONGODB_URI);

  const projects = await PortfolioProject.find({});
  console.log(`[repair] Scanning ${projects.length} portfolio project(s).`);

  let repaired = 0;

  for (const project of projects) {
    let touched = false;

    const cover = await repairAsset(project.coverImage);
    if (cover) { project.coverImage = cover; project.markModified('coverImage'); touched = true; }

    for (let i = 0; i < (project.gallery || []).length; i++) {
      const g = await repairAsset(project.gallery[i]);
      if (g) { project.gallery[i] = g; touched = true; }
    }
    if (touched) project.markModified('gallery');

    if (project.testimonial?.avatar) {
      const avatar = await repairAsset(project.testimonial.avatar);
      if (avatar) { project.testimonial.avatar = avatar; project.markModified('testimonial'); touched = true; }
    }

    if (touched) {
      await project.save();
      repaired += 1;
      console.log(`  ✓ repaired "${project.title}" (${project._id})`);
    }
  }

  console.log(`\n[repair] Done. repaired=${repaired}/${projects.length}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[repair] Fatal error:', err);
  process.exit(1);
});
