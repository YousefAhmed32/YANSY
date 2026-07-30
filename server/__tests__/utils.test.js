'use strict';
/**
 * Unit tests for pure utility functions.
 * These tests run without a database connection.
 */

// ── auditLogger ───────────────────────────────────────────────────────────────
describe('auditLogger', () => {
  it('exports an audit function', () => {
    const { audit } = require('../utils/auditLogger');
    expect(typeof audit).toBe('function');
  });

  it('audit() is non-blocking (does not throw synchronously)', () => {
    const { audit } = require('../utils/auditLogger');
    // Mock a minimal req object; DB call will fail silently in test env
    const fakeReq = {
      user: { _id: 'abc123', email: 'test@test.com', role: 'ADMIN' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    };
    expect(() => audit({
      req: fakeReq,
      action: 'user.delete',
      entityType: 'User',
      entityId: 'xyz',
    })).not.toThrow();
  });
});

// ── emailService ──────────────────────────────────────────────────────────────
describe('emailService', () => {
  it('exports all required email functions', () => {
    const svc = require('../utils/emailService');
    const expected = [
      'sendWelcome',
      'sendPasswordReset',
      'sendProjectUpdate',
      'sendProjectStatusChange',
      'sendNewMessage',
      'sendAdminNewProjectRequest',
      'sendInvoice',
    ];
    expected.forEach(fn => {
      expect(typeof svc[fn]).toBe('function');
    });
  });

  it('sendWelcome does not throw when SMTP is not configured', async () => {
    // No SMTP_HOST set in test env — should log to console and return
    const { sendWelcome } = require('../utils/emailService');
    await expect(sendWelcome({ email: 'test@test.com', fullName: 'Test User' })).resolves.not.toThrow();
  });

  it('sendPasswordReset does not throw when SMTP is not configured', async () => {
    const { sendPasswordReset } = require('../utils/emailService');
    await expect(sendPasswordReset({ email: 'test@test.com', fullName: 'Test User' }, 'fake-token')).resolves.not.toThrow();
  });
});

// ── mediaValidators ───────────────────────────────────────────────────────────
// Pure functions only — GridFS I/O (media.service/gridfsRepository) needs a live
// Mongo connection and is verified via the manual checklist, not unit tests here.
describe('mediaValidators', () => {
  const {
    isAllowedMime, extensionFor, sanitizeFilename, sha256Hex, assertSize, assertMagicBytes,
  } = require('../media/mediaValidators');
  const { IMAGE_ONLY_MIMES } = require('../media/mediaConstants');

  it('isAllowedMime checks membership in the given allow-set', () => {
    expect(isAllowedMime('image/png', IMAGE_ONLY_MIMES)).toBe(true);
    expect(isAllowedMime('application/zip', IMAGE_ONLY_MIMES)).toBe(false);
  });

  it('extensionFor derives an extension from a known mime, empty string otherwise', () => {
    expect(extensionFor('image/png')).toBe('.png');
    expect(extensionFor('application/x-made-up')).toBe('');
  });

  it('sanitizeFilename strips path separators and prefixes a uuid', () => {
    const safe = sanitizeFilename('../../etc/passwd');
    expect(safe).not.toMatch(/[./\\]{2}/);
    expect(safe).toMatch(/^[0-9a-f-]{36}-/);
  });

  it('sha256Hex is deterministic for the same bytes', () => {
    const buf = Buffer.from('hello world');
    expect(sha256Hex(buf)).toBe(sha256Hex(Buffer.from('hello world')));
    expect(sha256Hex(buf)).not.toBe(sha256Hex(Buffer.from('goodbye world')));
  });

  it('assertSize throws when the buffer exceeds the limit', () => {
    const buf = Buffer.alloc(10);
    expect(() => assertSize(buf, 5)).toThrow();
    expect(() => assertSize(buf, 10)).not.toThrow();
  });

  it('assertMagicBytes rejects a mime not in the allow-set before even checking bytes', async () => {
    await expect(assertMagicBytes(Buffer.from('irrelevant'), 'application/zip', IMAGE_ONLY_MIMES))
      .rejects.toThrow(/not allowed/);
  });

  it('assertMagicBytes accepts a real PNG buffer claiming image/png', async () => {
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );
    await expect(assertMagicBytes(png1x1, 'image/png', IMAGE_ONLY_MIMES)).resolves.toBeUndefined();
  });
});
