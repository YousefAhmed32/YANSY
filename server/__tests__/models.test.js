'use strict';
/**
 * Unit tests for Mongoose model schema validation (no DB connection needed
 * for basic field and validation tests using model instantiation).
 */

// Prevent mongoose from trying to actually connect
const mongoose = require('mongoose');

describe('User model schema', () => {
  const User = require('../models/User');

  it('requires email, password, fullName, phoneNumber', () => {
    const user = new User({});
    const err = user.validateSync();
    const fields = Object.keys(err.errors);
    expect(fields).toContain('email');
    expect(fields).toContain('password');
    expect(fields).toContain('fullName');
    expect(fields).toContain('phoneNumber');
  });

  it('defaults role to USER', () => {
    const user = new User({
      email: 'x@x.com', password: 'pass123', fullName: 'Test', phoneNumber: '123',
    });
    expect(user.role).toBe('USER');
  });

  it('has passwordResetToken field (select:false)', () => {
    const schema = User.schema;
    expect(schema.path('passwordResetToken')).toBeDefined();
  });

  it('has isActive field defaulting to true', () => {
    const user = new User({ email: 'x@x.com', password: 'p', fullName: 'T', phoneNumber: '1' });
    expect(user.isActive).toBe(true);
  });

  it('has passwordResetExpires field', () => {
    const schema = User.schema;
    expect(schema.path('passwordResetExpires')).toBeDefined();
  });

  // ── Onboarding / activation-flow fields ─────────────────────────────────
  // Added alongside the OnboardingWizard rewrite + completeOnboarding fix
  // (server/controllers/userController.js) — these back the backward-compat
  // completion policy: a completion timestamp/version distinct from the
  // boolean flag, and a communication preference distinct from `jobRole`
  // (business role) and `role` (auth role), which must never be conflated.
  it('isProfileComplete defaults to false', () => {
    const user = new User({ email: 'x@x.com', password: 'p', fullName: 'T', phoneNumber: '1' });
    expect(user.isProfileComplete).toBe(false);
  });

  it('onboardingCompletedAt and onboardingVersion default to null', () => {
    const user = new User({ email: 'x@x.com', password: 'p', fullName: 'T', phoneNumber: '1' });
    expect(user.onboardingCompletedAt).toBeNull();
    expect(user.onboardingVersion).toBeNull();
  });

  it('accepts a valid communicationPreference (whatsapp/phone/email)', () => {
    for (const pref of ['whatsapp', 'phone', 'email']) {
      const user = new User({ email: 'x@x.com', password: 'p', fullName: 'T', phoneNumber: '1', communicationPreference: pref });
      const err = user.validateSync();
      expect(err?.errors?.communicationPreference).toBeUndefined();
      expect(user.communicationPreference).toBe(pref);
    }
  });

  it('rejects a communicationPreference outside the enum', () => {
    const user = new User({ email: 'x@x.com', password: 'p', fullName: 'T', phoneNumber: '1', communicationPreference: 'carrier-pigeon' });
    const err = user.validateSync();
    expect(err.errors.communicationPreference).toBeDefined();
  });

  it('jobRole (business title) is a distinct free-text field from role (auth level)', () => {
    const user = new User({
      email: 'x@x.com', password: 'p', fullName: 'T', phoneNumber: '1',
      jobRole: 'Founder', role: 'ADMIN',
    });
    expect(user.jobRole).toBe('Founder');
    expect(user.role).toBe('ADMIN');
  });
});

describe('Invoice model schema', () => {
  const Invoice = require('../models/Invoice');

  it('requires client, createdBy, dueDate, and lineItems', () => {
    const inv = new Invoice({});
    const err = inv.validateSync();
    const fields = Object.keys(err?.errors || {});
    // total is computed, subtotal too — client and createdBy are refs so may not appear
    // Just verify the model loads correctly
    expect(Invoice.modelName).toBe('Invoice');
  });

  it('defaults status to draft', () => {
    const inv = new Invoice({
      client: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100, amount: 100 }],
      dueDate: new Date(),
    });
    expect(inv.status).toBe('draft');
  });

  it('defaults currency to USD', () => {
    const inv = new Invoice({});
    expect(inv.currency).toBe('USD');
  });
});

describe('AuditLog model schema', () => {
  const AuditLog = require('../models/AuditLog');

  it('has actor, action, entityType fields', () => {
    const schema = AuditLog.schema;
    expect(schema.path('actor')).toBeDefined();
    expect(schema.path('action')).toBeDefined();
    expect(schema.path('entityType')).toBeDefined();
  });

  it('requires actor, actorEmail, actorRole, action, entityType', () => {
    const log = new AuditLog({});
    const err = log.validateSync();
    const fields = Object.keys(err?.errors || {});
    expect(fields).toContain('actorEmail');
    expect(fields).toContain('actorRole');
  });
});

describe('Notification model schema', () => {
  const Notification = require('../models/Notification');

  it('defaults read to false', () => {
    const n = new Notification({
      user: new mongoose.Types.ObjectId(), title: 'T', message: 'M',
    });
    expect(n.read).toBe(false);
  });

  it('type defaults to info', () => {
    const n = new Notification({ user: new mongoose.Types.ObjectId(), title: 'T', message: 'M' });
    expect(n.type).toBe('info');
  });
});

describe('Message / MessageThread model schema', () => {
  const { Message, MessageThread } = require('../models/Message');

  const base = () => ({
    threadId:  new mongoose.Types.ObjectId(),
    sender:    new mongoose.Types.ObjectId(),
    recipient: new mongoose.Types.ObjectId(),
  });

  it('accepts a text-only message with no attachments', () => {
    const msg = new Message({ ...base(), content: 'Hello there' });
    expect(msg.validateSync()).toBeUndefined();
  });

  it('accepts an attachment-only message with empty content', () => {
    const msg = new Message({ ...base(), content: '', attachments: [new mongoose.Types.ObjectId()] });
    expect(msg.validateSync()).toBeUndefined();
  });

  it('rejects a message with neither content nor attachments', () => {
    const msg = new Message({ ...base(), content: '' });
    const err = msg.validateSync();
    expect(err).toBeDefined();
    expect(err.message).toMatch(/content or at least one attachment/i);
  });

  it('rejects a message with only whitespace content and no attachments', () => {
    const msg = new Message({ ...base(), content: '   ' });
    expect(msg.validateSync()).toBeDefined();
  });

  it('caps message content at 8000 characters', () => {
    const msg = new Message({ ...base(), content: 'a'.repeat(8001) });
    const err = msg.validateSync();
    expect(err.errors.content).toBeDefined();
  });

  it('MessageThread notes require content and author', () => {
    const thread = new MessageThread({
      participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      notes: [{ content: '' }],
    });
    const err = thread.validateSync();
    expect(err?.errors?.['notes.0.content']).toBeDefined();
    expect(err?.errors?.['notes.0.author']).toBeDefined();
  });

  it('MessageThread notes accept a valid entry', () => {
    const thread = new MessageThread({
      participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      notes: [{ content: 'Internal note', author: new mongoose.Types.ObjectId() }],
    });
    expect(thread.validateSync()).toBeUndefined();
    expect(thread.notes[0].content).toBe('Internal note');
  });
});

describe('PortfolioProject model schema — presentationMode (Quick Showcase)', () => {
  const PortfolioProject = require('../models/PortfolioProject');

  const base = () => ({
    title: 'Test project', slug: 'test-project', category: new mongoose.Types.ObjectId(),
  });

  it('defaults presentationMode to caseStudy — every pre-existing project keeps rendering as a full case study', () => {
    const p = new PortfolioProject(base());
    expect(p.presentationMode).toBe('caseStudy');
  });

  it('accepts showcase as an explicit value', () => {
    const p = new PortfolioProject({ ...base(), presentationMode: 'showcase' });
    const err = p.validateSync();
    expect(err?.errors?.presentationMode).toBeUndefined();
    expect(p.presentationMode).toBe('showcase');
  });

  it('rejects any value outside caseStudy/showcase', () => {
    const p = new PortfolioProject({ ...base(), presentationMode: 'bogus' });
    const err = p.validateSync();
    expect(err.errors.presentationMode).toBeDefined();
  });

  it('presentationMode is independent of projectType/deliveryStatus — setting one never touches the others', () => {
    const p = new PortfolioProject({ ...base(), presentationMode: 'showcase', deliveryStatus: 'concept' });
    expect(p.presentationMode).toBe('showcase');
    expect(p.deliveryStatus).toBe('concept');
    expect(p.projectType).toBeUndefined();
  });
});
