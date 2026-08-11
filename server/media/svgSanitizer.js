'use strict';

/**
 * Lightweight, dependency-free SVG sanitizer for admin-uploaded logo/icon
 * files (Client, TeamMember, Testimonial... anything with a mediaAssetSchema
 * image field). Not a full SVG-spec parser — it strips the handful of
 * constructs that turn an `<img src="...">` (safe — browsers never execute
 * script inside an <img>) into script execution when the same GridFS URL is
 * opened directly as a top-level document. That matters here because
 * media.routes.js serves the file from a public, unauthenticated GET route,
 * and a browser navigating straight to an image/svg+xml URL renders it as an
 * SVG document and DOES run embedded <script>/on* handlers in that context.
 * Runs once at upload time (server/media/media.service.js) so nothing
 * unsanitized ever reaches storage.
 */
const SVG_ROOT_RE = /^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i;

const DANGEROUS_PAIRED_TAGS = /<\s*(script|iframe|foreignObject)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const DANGEROUS_SELF_CLOSING = /<\s*(script|iframe|foreignObject|embed|object|link)\b[^>]*\/?>/gi;
const EVENT_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URI_ATTR = /\s+(xlink:href|href)\s*=\s*("(\s*javascript:[^"]*)"|'(\s*javascript:[^']*)')/gi;
const DOCTYPE_OR_ENTITY = /<!DOCTYPE[^>[]*(\[[\s\S]*?\])?\s*>|<!ENTITY[^>]*>/gi;

const looksLikeSvg = (buffer) => SVG_ROOT_RE.test(buffer.slice(0, 2048).toString('utf8'));

const sanitizeSvg = (buffer) => {
  const text = buffer.toString('utf8');
  if (!SVG_ROOT_RE.test(text)) {
    const err = new Error('File is not a valid SVG image.');
    err.status = 400;
    throw err;
  }

  const cleaned = text
    .replace(DOCTYPE_OR_ENTITY, '')
    .replace(DANGEROUS_PAIRED_TAGS, '')
    .replace(DANGEROUS_SELF_CLOSING, '')
    .replace(EVENT_ATTR, '')
    .replace(JS_URI_ATTR, '');

  return Buffer.from(cleaned, 'utf8');
};

module.exports = { sanitizeSvg, looksLikeSvg };
