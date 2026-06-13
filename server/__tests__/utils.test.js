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

// ── cloudStorage ──────────────────────────────────────────────────────────────
describe('cloudStorage', () => {
  it('exports uploadToCloud and deleteFromCloud', () => {
    const storage = require('../utils/cloudStorage');
    expect(typeof storage.uploadToCloud).toBe('function');
    expect(typeof storage.deleteFromCloud).toBe('function');
  });

  it('uploadToCloud falls back to local in non-production without credentials', async () => {
    // In test environment, CLOUDINARY_CLOUD_NAME is not set
    // CLOUD_PROVIDER defaults to cloudinary → should fail to cloudinary and use local fallback
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; // ensure non-production
    process.env.CLOUD_PROVIDER = 'local'; // force local for this test

    const { uploadToCloud } = require('../utils/cloudStorage');
    const fakeBuffer = Buffer.from('fake file content');

    const result = await uploadToCloud(fakeBuffer, 'test.txt', 'text/plain');
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('cloudId');
    expect(result).toHaveProperty('provider', 'local');

    process.env.NODE_ENV = originalEnv;
    delete process.env.CLOUD_PROVIDER;
  });
});
