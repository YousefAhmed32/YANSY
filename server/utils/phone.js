// Phone normalization for API input — mirrors client/src/utils/phone.js.
// Deliberately permissive: the client already coaches the user toward a
// good number (and offers a "continue anyway" escape hatch), so the
// server floor only guards against genuinely empty/garbage input. It
// must never re-reject a value the client already accepted, or the
// user is dropped right back into the validation loop this exists to
// prevent.

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EXT_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';
const INVISIBLE_MARKS = /[​-‏‪-‮﻿]/g;

const toAsciiDigits = (str) =>
  str
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXT_ARABIC_INDIC.indexOf(d)));

function normalizePhone(raw) {
  if (!raw) return '';
  const v = toAsciiDigits(String(raw)).replace(INVISIBLE_MARKS, '');
  const hasLeadingPlus = /^\s*\+/.test(v);
  const digits = v.replace(/\D/g, '');
  return (hasLeadingPlus ? '+' : '') + digits;
}

function phoneLooksReasonable(raw) {
  const digits = normalizePhone(raw).replace(/^\+/, '');
  return digits.length >= 5 && digits.length <= 20;
}

module.exports = { normalizePhone, phoneLooksReasonable };
