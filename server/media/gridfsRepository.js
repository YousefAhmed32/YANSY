'use strict';
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');

// Writes a buffer into GridFS and resolves with the new file's ObjectId.
// No temp file, no full-file buffering on the read side later — GridFS chunks
// the buffer internally on write and streams chunks back out on read.
//
// The driver's top-level `contentType` upload option was removed from the
// GridFS spec years ago and is a silent no-op on current `mongodb` driver
// versions (verified: writes with it set store no contentType at all) — so
// it's stored inside `metadata.contentType` instead and read back from there.
const uploadBuffer = (buffer, filename, { contentType, metadata } = {}) =>
  new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { ...metadata, contentType },
    });
    uploadStream.once('error', reject);
    uploadStream.once('finish', () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });

// Cheap metadata lookup — reads the `uploads.files` document only, never touches chunks.
const findFileById = async (id) => {
  const bucket = getBucket();
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  const files = await bucket.find({ _id: objectId }).limit(1).toArray();
  return files[0] || null;
};

// Content-addressed dedupe lookup.
const findFileBySha256 = async (hash) => {
  const bucket = getBucket();
  const files = await bucket.find({ 'metadata.sha256': hash }).limit(1).toArray();
  return files[0] || null;
};

// { start, end } are byte offsets; `end` is EXCLUSIVE per the GridFS driver API
// (callers computing an inclusive HTTP Range end must pass end + 1).
const openDownloadStream = (id, range) => {
  const bucket = getBucket();
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  return range ? bucket.openDownloadStream(objectId, range) : bucket.openDownloadStream(objectId);
};

// Best-effort delete — same semantics as the old deleteFromLocal/deleteFromCloudinary:
// log and swallow rather than throw, since a failed cleanup delete shouldn't fail the
// caller's already-successful primary operation (e.g. a document save that already succeeded).
const deleteFile = async (id) => {
  const bucket = getBucket();
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  try {
    await bucket.delete(objectId);
  } catch (err) {
    // GridFSBucket.delete rejects with "FileNotFound" if already gone — not an error for us.
    if (!/FileNotFound/i.test(err.message)) {
      console.error('[gridfsRepository] Failed to delete file:', err.message);
    }
  }
};

module.exports = { uploadBuffer, findFileById, findFileBySha256, openDownloadStream, deleteFile };
