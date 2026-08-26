'use strict';

/**
 * Shared server-side pieces of the Portfolio "portable JSON" import/export
 * system — see client/src/utils/portfolioPortable.js for the client-side
 * serializer/parser these constants and helpers are kept in lockstep with,
 * and docs/PORTFOLIO_PORTABLE_FORMAT.md for the documented format.
 *
 * Server-side responsibilities are deliberately narrow:
 *   1. Own the format id / schema version as the single source of truth a
 *      client-side "unsupported version" check can't silently drift from.
 *   2. Defense-in-depth shape guards (size/depth/prototype-pollution) on
 *      whatever the client sends to the relation-resolve endpoint — the
 *      client already validates the raw file, but the server never trusts
 *      that a request actually came from that code path.
 *   3. Deterministic relation resolution against the real content
 *      libraries (slug match, then unambiguous normalized-name fallback) —
 *      see resolveRelations. Never creates library records; an unresolved
 *      or ambiguous reference is reported back, never guessed.
 */

const FORMAT_ID = 'yansy-portfolio-project';
const CURRENT_SCHEMA_VERSION = 1;
// Every schema version this server can still import, oldest first. Version 1
// needs no migration (it's current); a future version 2 would add a
// `2: (project) => { ...migrate... }` migration function here, applied to
// bring an older-but-supported payload up to the current in-memory shape
// before resolution/merge. An unsupported version (too new, or older than
// anything listed) is rejected outright — see assertSupportedVersion.
const SCHEMA_MIGRATIONS = {
  1: (project) => project,
};

const assertSupportedVersion = (schemaVersion) => {
  if (!SCHEMA_MIGRATIONS[schemaVersion]) {
    const err = new Error(`Unsupported portfolio export schema version: ${schemaVersion}. This server supports version(s) ${Object.keys(SCHEMA_MIGRATIONS).join(', ')}.`);
    err.status = 400;
    err.code = 'UNSUPPORTED_SCHEMA_VERSION';
    throw err;
  }
};

// ── Defense-in-depth payload guards ─────────────────────────────────────────
// The client already refuses to parse/apply a malformed or oversized file —
// these exist because the server must never trust that a request to the
// relation-resolve endpoint actually went through that client code.
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 8;
const MAX_ARRAY_LEN = 200;
const MAX_STRING_LEN = 2000;
const MAX_JSON_BYTES = 2 * 1024 * 1024; // 2MB — generous for a media-free JSON document

class PortablePayloadError extends Error {
  constructor(message, code = 'INVALID_PAYLOAD') {
    super(message);
    this.status = 400;
    this.code = code;
  }
}

// Recursively rejects prototype-pollution keys, excessive nesting, oversized
// arrays, and oversized strings. Throws on the first violation rather than
// collecting every one — this only ever runs against a payload the client
// should have already produced correctly, so a single clear rejection is
// enough for a developer/attacker to act on; it's not meant to be
// user-facing field-level validation (that's handled separately for the
// fields that actually reach Mongoose).
const assertSafeShape = (value, depth = 0) => {
  if (depth > MAX_DEPTH) throw new PortablePayloadError('Payload is nested too deeply.', 'PAYLOAD_TOO_DEEP');
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LEN) throw new PortablePayloadError('A field in the payload is too long.', 'PAYLOAD_FIELD_TOO_LONG');
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LEN) throw new PortablePayloadError('A list in the payload has too many items.', 'PAYLOAD_ARRAY_TOO_LARGE');
    value.forEach((v) => assertSafeShape(v, depth + 1));
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key)) throw new PortablePayloadError('Payload contains a disallowed key.', 'PAYLOAD_UNSAFE_KEY');
      assertSafeShape(value[key], depth + 1);
    }
  }
};

const assertSafePayloadSize = (raw) => {
  const bytes = Buffer.byteLength(typeof raw === 'string' ? raw : JSON.stringify(raw || {}), 'utf8');
  if (bytes > MAX_JSON_BYTES) throw new PortablePayloadError('Payload is too large.', 'PAYLOAD_TOO_LARGE');
};

// ── Relation resolution ─────────────────────────────────────────────────────
const normalize = (s) => (s || '').toString().trim().toLowerCase();

/**
 * Resolves ONE portable relation descriptor ({ slug, name, nameAr }) against
 * a library Model. Slug match wins outright (it's the stable portable
 * identity — see the format doc); otherwise falls back to an unambiguous
 * case-insensitive exact match on `name` OR `nameAr`. Never creates a
 * record. Returns one of:
 *   { status: 'resolved', item }
 *   { status: 'unresolved' }               — no match at all
 *   { status: 'ambiguous', candidates }     — more than one equally-valid name match
 */
const resolveOneRelation = async (Model, descriptor) => {
  if (!descriptor || (!descriptor.slug && !descriptor.name && !descriptor.nameAr)) return { status: 'unresolved' };

  if (descriptor.slug) {
    const bySlug = await Model.findOne({ slug: normalize(descriptor.slug) });
    if (bySlug) return { status: 'resolved', item: bySlug };
  }

  const candidateNames = [descriptor.name, descriptor.nameAr].filter(Boolean).map(normalize);
  if (!candidateNames.length) return { status: 'unresolved' };

  // Case-insensitive exact match on either name field — a $or of anchored,
  // escaped regexes rather than a collation-based equality match, consistent
  // with how the rest of this codebase does case-insensitive matching (see
  // libraryRouter.factory.js's buildSearchFilter).
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const or = candidateNames.flatMap((n) => [
    { name: new RegExp(`^${escape(n)}$`, 'i') },
    { nameAr: new RegExp(`^${escape(n)}$`, 'i') },
  ]);
  const matches = await Model.find({ $or: or }).limit(5);
  if (matches.length === 1) return { status: 'resolved', item: matches[0] };
  if (matches.length > 1) return { status: 'ambiguous', candidates: matches };
  return { status: 'unresolved' };
};

/**
 * Resolves every relation field a portable project may reference, in
 * parallel per field. `fieldModels` maps portable field name -> { Model,
 * multiple }. Never resolves/creates Testimonial or Award entries — those
 * ship in the portable JSON as read-only reference text only (see the format
 * doc) precisely because they don't have the simple name/slug identity every
 * other library here does, and auto-matching free-text quotes/awards risks a
 * false positive match far more than it saves a manual pick.
 */
const resolveRelations = async (fieldModels, relations = {}) => {
  const result = {};
  await Promise.all(
    Object.entries(fieldModels).map(async ([field, { Model, multiple }]) => {
      const raw = relations[field];
      if (multiple) {
        const list = Array.isArray(raw) ? raw : [];
        result[field] = await Promise.all(list.map((d) => resolveOneRelation(Model, d).then((r) => ({ ...r, requested: d }))));
      } else if (raw) {
        result[field] = { ...(await resolveOneRelation(Model, raw)), requested: raw };
      } else {
        result[field] = { status: 'empty' };
      }
    })
  );
  return result;
};

module.exports = {
  FORMAT_ID,
  CURRENT_SCHEMA_VERSION,
  SCHEMA_MIGRATIONS,
  assertSupportedVersion,
  PortablePayloadError,
  assertSafeShape,
  assertSafePayloadSize,
  resolveOneRelation,
  resolveRelations,
  MAX_ARRAY_LEN,
  MAX_STRING_LEN,
};
