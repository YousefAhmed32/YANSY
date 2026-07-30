'use strict';
/**
 * Migrates every remaining Cloudinary/local-disk media asset, across every
 * feature, into GridFS. Reuses server/media/media.service.js for the actual
 * upload (no duplicated upload logic).
 *
 * Non-destructive: never deletes the Cloudinary asset or local file — only
 * rewrites the referencing document's url/publicId/provider fields to point
 * at the new GridFS copy. Safe to re-run: anything already provider:'gridfs'
 * (or an unrecognized provider) is skipped.
 *
 * Usage:
 *   node scripts/migrateToGridFS.js --dry-run   # preview counts only, no writes
 *   node scripts/migrateToGridFS.js             # migrate for real
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const { initGridFS } = require('../config/gridfs');
const mediaService = require('../media/media.service');
const {
  IMAGE_MIMES, VIDEO_MIMES, AUDIO_MIMES, DOCUMENT_MIMES,
} = require('../media/mediaConstants');

const PortfolioProject     = require('../models/PortfolioProject');
const ClientLogo           = require('../models/ClientLogo');
const HomepageVideoSettings = require('../models/HomepageVideoSettings');
const IntroSettings        = require('../models/IntroSettings');
const File                 = require('../models/File');

const DRY_RUN = process.argv.includes('--dry-run');

// Migration reuses already-trusted, already-stored files — broaden the
// allow-list beyond any single feature's normal upload-time restriction
// rather than risk rejecting a legitimately-stored asset.
const MIGRATION_ALLOWED_MIMES = new Set([...IMAGE_MIMES, ...VIDEO_MIMES, ...AUDIO_MIMES, ...DOCUMENT_MIMES]);
const MIGRATION_MAX_BYTES = 500 * 1024 * 1024;

const EXT_TO_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf', '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip', '.txt': 'text/plain',
};

const counters = { scanned: 0, migrated: 0, skipped: 0, failed: 0 };

// Downloads/reads the current asset's bytes + mime, uploads into GridFS via
// media.service, and returns the new {url, publicId, provider}. Returns null
// (and increments `failed`) if the source can't be retrieved.
const migrateOne = async (url, publicId, provider, label) => {
  counters.scanned += 1;

  // Some singleton settings docs (e.g. HomepageVideoSettings when videoSource
  // is 'intro', not 'own') have a schema-default provider value even though no
  // video/publicId was ever actually stored — nothing to migrate there.
  if (!provider || provider === 'gridfs' || !url || !publicId) {
    counters.skipped += 1;
    return null;
  }

  try {
    let buffer, mimeType, filename;

    if (provider === 'cloudinary') {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
      buffer = Buffer.from(res.data);
      mimeType = res.headers['content-type'] || 'application/octet-stream';
      filename = path.basename(new URL(url).pathname) || 'migrated-file';
    } else if (provider === 'local') {
      const localPath = path.join(__dirname, '../uploads/files', publicId);
      if (!fs.existsSync(localPath)) throw new Error(`local file not found: ${localPath}`);
      buffer = fs.readFileSync(localPath);
      mimeType = EXT_TO_MIME[path.extname(publicId).toLowerCase()] || 'application/octet-stream';
      filename = publicId;
    } else {
      counters.skipped += 1;
      return null;
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] would migrate ${label} (${provider}, ${buffer.length} bytes, ${mimeType})`);
      counters.migrated += 1;
      return null;
    }

    const asset = await mediaService.uploadMedia(buffer, filename, mimeType, {
      allowedMimes: MIGRATION_ALLOWED_MIMES,
      maxSizeBytes: MIGRATION_MAX_BYTES,
    });
    console.log(`  ✓ migrated ${label} (${provider} -> gridfs, ${buffer.length} bytes)`);
    counters.migrated += 1;
    // Pass width/height through too — the old 'local' fallback never computed
    // these (only Cloudinary did), so this is a real gain, not just a copy.
    return { url: asset.url, publicId: asset.publicId, provider: asset.provider, width: asset.width, height: asset.height };
  } catch (err) {
    console.error(`  ✗ failed ${label}: ${err.message}`);
    counters.failed += 1;
    return null;
  }
};

// Applies migrateOne to a mediaAssetSchema-shaped subdocument in place.
const migrateAssetSubdoc = async (obj, label) => {
  if (!obj?.url) return false;
  const result = await migrateOne(obj.url, obj.publicId, obj.provider, label);
  if (!result) return false;
  obj.url = result.url;
  obj.publicId = result.publicId;
  obj.provider = result.provider;
  if (result.width)  obj.width  = result.width;
  if (result.height) obj.height = result.height;
  return true;
};

const migratePortfolioProjects = async () => {
  const projects = await PortfolioProject.find({});
  console.log(`\n[PortfolioProject] ${projects.length} document(s)`);

  for (const project of projects) {
    let touched = false;
    const mark = (field) => { touched = true; project.markModified(field); };

    if (await migrateAssetSubdoc(project.coverImage, `${project.title} / coverImage`)) mark('coverImage');
    if (await migrateAssetSubdoc(project.coverVideo, `${project.title} / coverVideo`)) mark('coverVideo');
    if (await migrateAssetSubdoc(project.clientLogo, `${project.title} / clientLogo`)) mark('clientLogo');

    if (project.testimonial) {
      if (await migrateAssetSubdoc(project.testimonial.avatar, `${project.title} / testimonial.avatar`)) mark('testimonial');
      if (await migrateAssetSubdoc(project.testimonial.audio,  `${project.title} / testimonial.audio`))  mark('testimonial');
    }

    for (let i = 0; i < (project.gallery || []).length; i++) {
      if (await migrateAssetSubdoc(project.gallery[i], `${project.title} / gallery[${i}]`)) mark('gallery');
    }
    for (let i = 0; i < (project.proofScreenshots || []).length; i++) {
      if (await migrateAssetSubdoc(project.proofScreenshots[i], `${project.title} / proofScreenshots[${i}]`)) mark('proofScreenshots');
    }
    for (let i = 0; i < (project.team || []).length; i++) {
      if (await migrateAssetSubdoc(project.team[i].avatar, `${project.title} / team[${i}].avatar`)) mark('team');
    }
    for (let bi = 0; bi < (project.blocks || []).length; bi++) {
      const b = project.blocks[bi];
      if (await migrateAssetSubdoc(b.asset,  `${project.title} / blocks[${bi}].asset`))  mark('blocks');
      if (await migrateAssetSubdoc(b.before, `${project.title} / blocks[${bi}].before`)) mark('blocks');
      if (await migrateAssetSubdoc(b.after,  `${project.title} / blocks[${bi}].after`))  mark('blocks');
      if (await migrateAssetSubdoc(b.poster, `${project.title} / blocks[${bi}].poster`)) mark('blocks');
      for (let ii = 0; ii < (b.images || []).length; ii++) {
        if (await migrateAssetSubdoc(b.images[ii], `${project.title} / blocks[${bi}].images[${ii}]`)) mark('blocks');
      }
    }

    if (touched && !DRY_RUN) await project.save();
  }
};

const migrateClientLogos = async () => {
  const logos = await ClientLogo.find({});
  console.log(`\n[ClientLogo] ${logos.length} document(s)`);
  for (const logo of logos) {
    if (await migrateAssetSubdoc(logo.logo, `${logo.name} / logo`)) {
      logo.markModified('logo');
      if (!DRY_RUN) await logo.save();
    }
  }
};

const migrateHomepageVideoSettings = async () => {
  const doc = await HomepageVideoSettings.findOne();
  if (!doc) return;
  console.log(`\n[HomepageVideoSettings] singleton`);
  let touched = false;

  const videoResult = await migrateOne(doc.videoUrl, doc.videoPublicId, doc.videoProvider, 'homepage showcase video');
  if (videoResult) {
    doc.videoUrl = videoResult.url;
    doc.videoPublicId = videoResult.publicId;
    doc.videoProvider = videoResult.provider;
    touched = true;
  }
  if (await migrateAssetSubdoc(doc.poster, 'homepage showcase poster')) {
    doc.markModified('poster');
    touched = true;
  }

  if (touched && !DRY_RUN) await doc.save();
};

const migrateIntroSettings = async () => {
  const doc = await IntroSettings.findOne();
  if (!doc) return;
  console.log(`\n[IntroSettings] singleton`);

  const videoResult = await migrateOne(doc.videoUrl, doc.videoPublicId, doc.videoProvider, 'intro video');
  if (videoResult) {
    doc.videoUrl = videoResult.url;
    doc.videoPublicId = videoResult.publicId;
    doc.videoProvider = videoResult.provider;
    if (!DRY_RUN) await doc.save();
  }
};

const migrateFiles = async () => {
  const files = await File.find({});
  console.log(`\n[File] ${files.length} document(s)`);
  for (const file of files) {
    const result = await migrateOne(file.url, file.cloudId, file.cloudProvider, `${file.originalName}`);
    if (result) {
      file.url = result.url;
      file.cloudId = result.publicId;
      file.cloudProvider = result.provider;
      if (!DRY_RUN) await file.save();
    }
  }
};

const run = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy';
  await mongoose.connect(MONGODB_URI);
  initGridFS();

  console.log(`[migrateToGridFS] ${DRY_RUN ? 'DRY RUN — no writes will be made' : 'LIVE RUN'}`);

  await migratePortfolioProjects();
  await migrateClientLogos();
  await migrateHomepageVideoSettings();
  await migrateIntroSettings();
  await migrateFiles();

  console.log(`\n[migrateToGridFS] Done. scanned=${counters.scanned} migrated=${counters.migrated} skipped=${counters.skipped} failed=${counters.failed}`);
  await mongoose.disconnect();
  process.exit(counters.failed > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('[migrateToGridFS] Fatal error:', err);
  process.exit(1);
});
