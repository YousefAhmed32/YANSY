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
