'use strict';

// Simple HTML/script sanitization — removes dangerous tags and event handlers
// Protects against stored XSS without requiring external packages

const DANGEROUS_TAGS = /<(script|iframe|object|embed|form|base|meta|link|style)\b[^>]*>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URLS = /\bhref\s*=\s*["']?\s*javascript:/gi;
const DATA_URIS = /\bsrc\s*=\s*["']?\s*data:/gi;

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(DANGEROUS_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URLS, 'href="about:blank"')
    .replace(DATA_URIS, 'src=""');
};

const sanitizeValue = (val) => {
  if (typeof val === 'string') return sanitizeString(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === 'object') return sanitizeObject(val);
  return val;
};

const sanitizeObject = (obj) => {
  const clean = {};
  for (const key of Object.keys(obj)) {
    clean[key] = sanitizeValue(obj[key]);
  }
  return clean;
};

// Fields that may contain intentional HTML (none in this project — everything is plaintext)
const ALLOWED_HTML_FIELDS = new Set([]);

/**
 * Middleware: sanitize req.body recursively.
 * Safe to apply globally — does not modify non-string values.
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware: sanitize req.query params.
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }
  next();
};

module.exports = { sanitizeBody, sanitizeQuery };
