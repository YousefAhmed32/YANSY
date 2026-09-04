'use strict';
/**
 * Unit tests for server/utils/onboarding.js — the pure decision logic behind
 * `POST /users/onboarding` (userController.completeOnboarding). Pure
 * function, no DB connection needed.
 *
 * These cases exist because of a real, reproduced bug: selecting "Email
 * Only" in the onboarding wizard left `contactValue` empty (no input is
 * rendered for that method), which made the client send `phoneNumber: ''`.
 * The old server check (`(phoneNumber && phoneNumber.trim()) ||
 * existingUser.phoneNumber`) treated the empty string as falsy and fell
 * through to requiring a phone — rejecting a customer who had explicitly
 * chosen not to give one, with no way to complete onboarding.
 */

const { resolvePhoneRequirement } = require('../utils/onboarding');

describe('resolvePhoneRequirement', () => {
  it('allows email-only completion with no phone on file and no phone provided', () => {
    const result = resolvePhoneRequirement({
      communicationPreference: 'email',
      hasExistingPhone: false,
      providedPhone: '',
    });
    expect(result.ok).toBe(true);
  });

  it('allows email-only completion even if a phone string was (incorrectly) sent', () => {
    // Defense in depth: email preference always wins, regardless of payload noise.
    const result = resolvePhoneRequirement({
      communicationPreference: 'email',
      hasExistingPhone: false,
      providedPhone: 'not-a-real-number',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects whatsapp preference with no phone provided', () => {
    const result = resolvePhoneRequirement({
      communicationPreference: 'whatsapp',
      hasExistingPhone: false,
      providedPhone: '',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it('rejects phone preference with a garbage (unparseable) phone value', () => {
    const result = resolvePhoneRequirement({
      communicationPreference: 'phone',
      hasExistingPhone: false,
      providedPhone: 'abc',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/valid/i);
  });

  it('accepts whatsapp preference with a genuinely valid phone', () => {
    const result = resolvePhoneRequirement({
      communicationPreference: 'whatsapp',
      hasExistingPhone: false,
      providedPhone: '+201090385390',
    });
    expect(result.ok).toBe(true);
  });

  it('never re-requires a phone for a customer who already has one on file, regardless of preference', () => {
    for (const communicationPreference of ['whatsapp', 'phone', 'email', undefined]) {
      const result = resolvePhoneRequirement({
        communicationPreference,
        hasExistingPhone: true,
        providedPhone: '',
      });
      expect(result.ok).toBe(true);
    }
  });

  it('defaults to requiring a valid phone when no preference is specified and none is on file', () => {
    const result = resolvePhoneRequirement({
      communicationPreference: undefined,
      hasExistingPhone: false,
      providedPhone: '',
    });
    expect(result.ok).toBe(false);
  });

  it('ignores an invalid/unknown communicationPreference value rather than trusting it as email', () => {
    const result = resolvePhoneRequirement({
      communicationPreference: 'carrier-pigeon',
      hasExistingPhone: false,
      providedPhone: '',
    });
    expect(result.ok).toBe(false);
  });
});
