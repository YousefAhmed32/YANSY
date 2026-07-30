'use strict';
/**
 * Migrates legacy PortfolioProject documents (raw GridFS image ids, flat schema)
 * to the v2 schema (structured Cloudinary media assets, case-study fields, status enum).
 *
 * Safe to re-run: already-migrated docs (coverImage already an object) are skipped.
 * Non-destructive: original GridFS files are left in place, not deleted.
 *
 * Usage: node scripts/migratePortfolioV2.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { getBucket, initGridFS } = require('../config/gridfs');
const { uploadPortfolioImage } = require('../utils/portfolioMedia');
const { slugify } = require('../utils/slugify');

const downloadGridFSFile = (bucket, fileId) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    bucket.openDownloadStream(fileId)
      .on('data', (c) => chunks.push(c))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', reject);
  });

// Convert a legacy image reference (GridFS ObjectId string, inline base64, or already a full URL)
// into a v2 media asset. Inline data: URIs must be decoded and actually uploaded through the
// storage pipeline — persisting the raw base64 blob as `url` bloats the document (and, since the
// schema now rejects data: URIs outright, would fail validation).
const migrateImageRef = async (ref, bucket) => {
  if (!ref) return null;

  if (typeof ref === 'string' && ref.startsWith('data:')) {
    const match = ref.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const [, mimeType, base64] = match;
    return uploadPortfolioImage(Buffer.from(base64, 'base64'), 'legacy-inline-image.jpg', mimeType);
  }

  if (typeof ref === 'string' && ref.startsWith('http')) {
    return { url: ref, provider: ref.includes('res.cloudinary.com') ? 'cloudinary' : 'local', alt: '', altAr: '' };
  }

  if (!mongoose.isValidObjectId(ref)) return null;

  const fileId = new mongoose.Types.ObjectId(ref);
  const files = await bucket.find({ _id: fileId }).toArray();
  if (!files.length) {
    console.warn(`  ! GridFS file ${ref} not found — skipping this image`);
    return null;
  }

  const buffer = await downloadGridFSFile(bucket, fileId);
  return uploadPortfolioImage(buffer, files[0].filename || `${ref}.jpg`, files[0].contentType || 'image/jpeg');
};

const run = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy';
  await mongoose.connect(MONGODB_URI);
  initGridFS();
  const bucket = getBucket();
  const col = mongoose.connection.db.collection('portfolioprojects');

  const usedSlugs = new Set(
    (await col.find({ slug: { $exists: true, $type: 'string' } }).project({ slug: 1 }).toArray())
      .map((d) => d.slug)
  );
  const nextSlug = (title) => {
    const base = slugify(title) || `project-${Date.now()}`;
    let slug = base;
    let n = 1;
    while (usedSlugs.has(slug)) { n += 1; slug = `${base}-${n}`; }
    usedSlugs.add(slug);
    return slug;
  };

  const docs = await col.find({}).toArray();
  console.log(`[migrate] Found ${docs.length} portfolio project(s).`);

  let migrated = 0, skipped = 0, failed = 0;

  for (const doc of docs) {
    if (doc.coverImage && typeof doc.coverImage === 'object') {
      skipped += 1;
      continue;
    }

    try {
      console.log(`[migrate] Migrating "${doc.title}" (${doc._id})...`);

      const coverImage = await migrateImageRef(doc.coverImage, bucket);
      if (!coverImage) throw new Error('cover image missing/unresolvable — cannot migrate without a cover image');

      const gallery = (
        await Promise.all((doc.images || []).map((ref) => migrateImageRef(ref, bucket)))
      ).filter(Boolean);

      const status = doc.isPublished === false ? 'draft' : 'published';

      await col.updateOne(
        { _id: doc._id },
        {
          $set: {
            slug: nextSlug(doc.title),
            coverImage,
            gallery,
            status,
            publishedAt: status === 'published' ? (doc.createdAt || new Date()) : undefined,
            viewCount: 0,
          },
          $unset: { images: '', isPublished: '' },
        }
      );

      migrated += 1;
      console.log(`  ✓ migrated (${gallery.length} gallery image(s))`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ failed: ${err.message}`);
    }
  }

  console.log(`\n[migrate] Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
