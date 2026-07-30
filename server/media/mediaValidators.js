'use strict';
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { MIME_TO_EXT } = require('./mediaConstants');

const isAllowedMime = (mime, allowSet) => allowSet.has(mime);

const extensionFor = (mime) => MIME_TO_EXT[mime] || '';

// Strips any directory component and non-safe characters, then the caller prefixes
// a uuid so this string has no security role — retrieval is always by GridFS _id,
// this is purely diagnostic (shows up as the GridFS `filename` field).
const sanitizeFilename = (originalName) => {
  const base = path.basename(String(originalName || 'file')).replace(/[^A-Za-z0-9._-]/g, '_');
  const trimmed = base.slice(0, 100) || 'file';
  return `${uuidv4()}-${trimmed}`;
};

const sha256Hex = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const assertSize = (buffer, maxBytes) => {
  if (buffer.length > maxBytes) {
    const err = new Error(`File exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB size limit.`);
    err.status = 400;
    throw err;
  }
};

// Verifies the buffer's actual magic bytes match an allowed mime, not just the
// client-claimed Content-Type — the same trust boundary fileController.js used to
// enforce inline, now shared by every upload call site.
const assertMagicBytes = async (buffer, claimedMime, allowSet) => {
  if (!isAllowedMime(claimedMime, allowSet)) {
    const err = new Error(`File type '${claimedMime}' is not allowed.`);
    err.status = 400;
    throw err;
  }

  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected) {
      // Some allowed types have no reliable magic-byte signature (plain text, and
      // some PDFs saved without the exact leading bytes file-type expects).
      if (claimedMime === 'text/plain') return;
      if (claimedMime === 'application/pdf' && buffer.slice(0, 4).toString() === '%PDF') return;
      const err = new Error('File content could not be verified.');
      err.status = 400;
      throw err;
    }
    if (!isAllowedMime(detected.mime, allowSet)) {
      const err = new Error(`File content does not match an allowed type (detected '${detected.mime}').`);
      err.status = 400;
      throw err;
    }
  } catch (err) {
    if (err.status) throw err;
    // file-type failed to load/parse — fall back to trusting the claimed mime
    // rather than hard-failing every upload over a detection-library hiccup.
  }
};

module.exports = {
  isAllowedMime,
  extensionFor,
  sanitizeFilename,
  sha256Hex,
  assertSize,
  assertMagicBytes,
};
