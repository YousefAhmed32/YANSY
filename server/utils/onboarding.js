// Pure decision logic for `POST /users/onboarding` (completeOnboarding) —
// extracted so the "when is a phone actually required" contract is unit
// testable without a DB connection, and can't silently drift between the
// route handler and its tests.
//
// Contract:
//   - communicationPreference === 'email'  → never require a phone, even if
//     one was (incorrectly) sent — the customer explicitly opted out.
//   - a phone already on file               → never require a new one,
//     regardless of preference (never re-ask for something we have).
//   - otherwise (whatsapp/phone/unspecified, no phone on file) → a genuinely
//     valid phone is required (presence AND format).
const { phoneLooksReasonable } = require('./phone');

const VALID_COMM_PREF = ['whatsapp', 'phone', 'email'];

/**
 * @param {object} args
 * @param {string|undefined} args.communicationPreference — raw client value
 * @param {boolean} args.hasExistingPhone — does the user already have a phone on file?
 * @param {string|undefined} args.providedPhone — raw phoneNumber from the request body
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function resolvePhoneRequirement({ communicationPreference, hasExistingPhone, providedPhone }) {
  const commPref = VALID_COMM_PREF.includes(communicationPreference) ? communicationPreference : null;
  const trimmedPhone = (providedPhone || '').trim();

  if (commPref === 'email') return { ok: true };
  if (hasExistingPhone) return { ok: true };

  if (!trimmedPhone) {
    return { ok: false, error: 'Phone number is required' };
  }
  if (!phoneLooksReasonable(trimmedPhone)) {
    return { ok: false, error: 'Please enter a valid phone number' };
  }
  return { ok: true };
}

module.exports = { resolvePhoneRequirement, VALID_COMM_PREF };
