'use strict';
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');

// In-Memory LRU Caches for fast GridFS access
const META_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_META_CACHE_SIZE = 1000;
const MAX_BUFFER_CACHE_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB total RAM limit
const MAX_SINGLE_FILE_CACHE_BYTES = 4 * 1024 * 1024; // 4MB max single file

const metaCache = new Map(); // idStr -> { file, expiresAt }
const bufferCache = new Map(); // idStr -> Buffer
let currentBufferCacheBytes = 0;

const clearCacheForId = (id) => {
  const idStr = String(id);
  metaCache.delete(idStr);
  if (bufferCache.has(idStr)) {
    const buf = bufferCache.get(idStr);
    currentBufferCacheBytes -= buf.length;
    bufferCache.delete(idStr);
  }
};

const getCachedBuffer = (id) => {
  return bufferCache.get(String(id)) || null;
};

const setCachedBuffer = (id, buffer) => {
  const idStr = String(id);
  if (!buffer || buffer.length > MAX_SINGLE_FILE_CACHE_BYTES) return;

  if (bufferCache.has(idStr)) {
    currentBufferCacheBytes -= bufferCache.get(idStr).length;
    bufferCache.delete(idStr);
  }

  // Evict oldest entries if capacity exceeded
  while (currentBufferCacheBytes + buffer.length > MAX_BUFFER_CACHE_TOTAL_BYTES && bufferCache.size > 0) {
    const oldestKey = bufferCache.keys().next().value;
    currentBufferCacheBytes -= bufferCache.get(oldestKey).length;
    bufferCache.delete(oldestKey);
  }

  if (currentBufferCacheBytes + buffer.length <= MAX_BUFFER_CACHE_TOTAL_BYTES) {
    bufferCache.set(idStr, buffer);
    currentBufferCacheBytes += buffer.length;
  }
};

// Writes a buffer into GridFS and resolves with the new file's ObjectId.
const uploadBuffer = (buffer, filename, { contentType, metadata } = {}) =>
  new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { ...metadata, contentType },
    });
    uploadStream.once('error', reject);
    uploadStream.once('finish', () => {
      const fileId = uploadStream.id;
      if (buffer && buffer.length <= MAX_SINGLE_FILE_CACHE_BYTES) {
        setCachedBuffer(fileId, buffer);
      }
      resolve(fileId);
    });
    uploadStream.end(buffer);
  });

// Cheap metadata lookup — reads `uploads.files` with in-memory caching.
const findFileById = async (id) => {
  const idStr = String(id);
  const now = Date.now();

  const cached = metaCache.get(idStr);
  if (cached && cached.expiresAt > now) {
    return cached.file;
  }

  const bucket = getBucket();
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  const files = await bucket.find({ _id: objectId }).limit(1).toArray();
  const file = files[0] || null;

  if (file) {
    if (metaCache.size >= MAX_META_CACHE_SIZE) {
      const oldestKey = metaCache.keys().next().value;
      metaCache.delete(oldestKey);
    }
    metaCache.set(idStr, { file, expiresAt: now + META_CACHE_TTL_MS });
  }

  return file;
};

// Content-addressed dedupe lookup.
const findFileBySha256 = async (hash) => {
  const bucket = getBucket();
  const files = await bucket.find({ 'metadata.sha256': hash }).limit(1).toArray();
  return files[0] || null;
};

// { start, end } are byte offsets; `end` is EXCLUSIVE per the GridFS driver API
const openDownloadStream = (id, range) => {
  const bucket = getBucket();
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  return range ? bucket.openDownloadStream(objectId, range) : bucket.openDownloadStream(objectId);
};

// Best-effort delete with cache invalidation
const deleteFile = async (id) => {
  clearCacheForId(id);
  const bucket = getBucket();
  const objectId = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  try {
    await bucket.delete(objectId);
  } catch (err) {
    if (!/FileNotFound/i.test(err.message)) {
      console.error('[gridfsRepository] Failed to delete file:', err.message);
    }
  }
};

module.exports = {
  uploadBuffer,
  findFileById,
  findFileBySha256,
  openDownloadStream,
  deleteFile,
  getCachedBuffer,
  setCachedBuffer,
  clearCacheForId,
};
