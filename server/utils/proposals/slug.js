'use strict';
const crypto = require('crypto');
const { slugify } = require('../slugify');

// 6-char lowercase alphanumeric suffix — enough entropy that a slug is not
// guessable (this is what stands between a random visitor and someone
// else's proposal, since the public route requires no login), while still
// short enough to read out over a phone/WhatsApp message.
const randomSuffix = (len = 6) =>
  crypto.randomBytes(8).toString('base64url').replace(/[^a-z0-9]/gi, '').slice(0, len).toLowerCase();

/**
 * Builds a human-readable-but-unguessable public slug, e.g.
 * "quran-academy-platform-8f72k1". Uniqueness against the DB is enforced by
 * the caller (proposalController's `ensureUniqueSlug`), matching the same
 * two-step pattern as the content-library routers' slug handling.
 */
const buildProposalSlug = (baseText) => {
  const base = slugify(baseText) || 'proposal';
  return `${base}-${randomSuffix(6)}`;
};

module.exports = { buildProposalSlug, randomSuffix };
