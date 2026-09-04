'use strict';
/**
 * Unit tests for server/utils/phone.js — pure functions, no DB connection
 * needed. Mirrors client/src/utils/phone.js's normalization rules; these
 * cases exist because the two previously disagreed in subtle ways (the
 * client's green-check state used to accept anything >= 5 chars while the
 * server floor used a different length check), which meant a value the
 * client accepted could still be silently mangled or rejected server-side.
 */

const { normalizePhone, phoneLooksReasonable } = require('../utils/phone');

describe('normalizePhone', () => {
  it('strips spaces, dashes, dots, and parens down to digits', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
    expect(normalizePhone('020.109.038.5390')).toBe('0201090385390');
  });

  it('preserves a single leading +', () => {
    expect(normalizePhone('+201090385390')).toBe('+201090385390');
  });

  it('drops a + that appears mid-string (not a real country-code prefix)', () => {
    expect(normalizePhone('20109+0385390')).toBe('201090385390');
  });

  it('converts Arabic-Indic digits (٠-٩) to ASCII', () => {
    expect(normalizePhone('٠١٠٩٠٣٨٥٣٩٠')).toBe('01090385390');
  });

  it('converts Extended Arabic-Indic (Farsi/Urdu) digits (۰-۹) to ASCII', () => {
    expect(normalizePhone('۰۱۰۹۰۳۸۵۳۹۰')).toBe('01090385390');
  });

  it('handles a mix of Arabic-Indic digits and a leading +', () => {
    expect(normalizePhone('+٢٠١٠٩٠٣٨٥٣٩٠')).toBe('+201090385390');
  });

  it('strips invisible bidi marks that sneak in from pasted RTL text', () => {
    // U+200E (LRM) and U+200F (RLM) around/inside a pasted number
    const withBidi = '‏+20‎109‏0385390‎';
    expect(normalizePhone(withBidi)).toBe('+201090385390');
  });

  it('drops non-digit letters entirely rather than throwing', () => {
    expect(normalizePhone('call 555-1234 now')).toBe('5551234');
  });

  it('returns an empty string for empty/null/undefined input', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
  });
});

describe('phoneLooksReasonable', () => {
  it('accepts a well-formed international number', () => {
    expect(phoneLooksReasonable('+201090385390')).toBe(true);
  });

  it('accepts a formatted US number', () => {
    expect(phoneLooksReasonable('+1 (555) 123-4567')).toBe(true);
  });

  it('accepts Arabic-Indic digits', () => {
    expect(phoneLooksReasonable('٠١٠٩٠٣٨٥٣٩٠')).toBe(true);
  });

  it('accepts a pasted RTL number wrapped in bidi marks', () => {
    expect(phoneLooksReasonable('‏+201090385390‎')).toBe(true);
  });

  it('rejects letters-only input (no digits at all)', () => {
    expect(phoneLooksReasonable('not a phone number')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(phoneLooksReasonable('')).toBe(false);
  });

  it('rejects a too-short number (below the 5-digit floor)', () => {
    expect(phoneLooksReasonable('123')).toBe(false);
  });

  it('accepts the boundary case of exactly 5 digits', () => {
    expect(phoneLooksReasonable('12345')).toBe(true);
  });

  it('accepts the boundary case of exactly 20 digits', () => {
    expect(phoneLooksReasonable('1'.repeat(20))).toBe(true);
  });

  it('rejects more than 20 digits', () => {
    expect(phoneLooksReasonable('1'.repeat(21))).toBe(false);
  });

  it('still evaluates length after stripping mixed letters/symbols', () => {
    // "abc-123" -> digits "123" -> 3 digits, below the floor
    expect(phoneLooksReasonable('abc-123')).toBe(false);
  });
});
