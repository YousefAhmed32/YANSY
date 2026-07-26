/* ═══════════════════════════════════════════════════════════════
   Phone normalization + validation — shared across every onboarding
   surface (Register, Start-a-Project form, Onboarding wizard).

   Design goal: never produce a dead-end. Formatting noise (spaces,
   dashes, dots, parens, Arabic-Indic digits, invisible bidi marks
   from a pasted number) is normalized away silently. Only a genuine
   problem (empty, letters mixed in, wildly too short/long) produces
   a `reason`, and even then the caller decides whether that blocks
   or just warns — see `confidence`.
   ═══════════════════════════════════════════════════════════════ */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EXT_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';

// Invisible/bidi marks that sneak in from copy-pasting numbers out of
// WhatsApp, PDFs, or RTL text editors — invisible to the user, fatal
// to a naive regex.
const INVISIBLE_MARKS = /[​-‏‪-‮﻿]/g;

const toAsciiDigits = (str) =>
  str
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)));

/**
 * Normalizes a raw phone string down to an optional leading "+"
 * followed by digits only. Never throws, never returns null.
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  let v = toAsciiDigits(String(raw)).replace(INVISIBLE_MARKS, '');
  const hasLeadingPlus = /^\s*\+/.test(v);
  const digits = v.replace(/\D/g, '');
  return (hasLeadingPlus ? '+' : '') + digits;
}

/**
 * Validates a raw phone string. Returns:
 *   valid       — true if it's safe to submit
 *   confidence  — 'high' | 'low' | 'none'
 *   reason      — machine key describing the issue, or null
 *   normalized  — the cleaned-up value (digits + optional leading +)
 *
 * `confidence: 'low'` on a *valid* result means "looks plausible but
 * possibly missing a country code" — callers should warn, not block.
 */
export function validatePhone(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { valid: false, confidence: 'none', reason: 'empty', normalized: '' };
  }

  const asciiDigits = toAsciiDigits(trimmed).replace(INVISIBLE_MARKS, '');
  const stripped = asciiDigits.replace(/[\s\-.()]/g, '');
  const leadingPlus = stripped.startsWith('+');
  const body = leadingPlus ? stripped.slice(1) : stripped;

  if (/\D/.test(body)) {
    return {
      valid: false,
      confidence: 'none',
      reason: 'invalid_chars',
      normalized: (leadingPlus ? '+' : '') + body.replace(/\D/g, ''),
    };
  }

  const normalized = (leadingPlus ? '+' : '') + body;

  if (body.length < 7) {
    return { valid: false, confidence: 'low', reason: 'too_short', normalized };
  }
  if (body.length > 15) {
    return { valid: false, confidence: 'low', reason: 'too_long', normalized };
  }
  if (body.length <= 8) {
    // Plausible local number, but may be missing a country code — don't block.
    return { valid: true, confidence: 'low', reason: 'maybe_missing_country_code', normalized };
  }
  return { valid: true, confidence: 'high', reason: null, normalized };
}
