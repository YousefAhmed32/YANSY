'use strict';
const AuditLog = require('../models/AuditLog');

/**
 * Log an admin action to the audit trail.
 * Non-blocking — failures are logged to console but never throw.
 */
const audit = async ({ req, action, entityType, entityId, before, after, metadata }) => {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        actor:      req.user._id,
        actorEmail: req.user.email,
        actorRole:  req.user.role,
        action,
        entityType,
        entityId:   entityId || null,
        before:     before   || null,
        after:      after    || null,
        metadata:   metadata || null,
        ip:         req.ip   || req.connection?.remoteAddress || null,
        userAgent:  req.headers?.['user-agent'] || null,
      });
    } catch (err) {
      console.error('[audit] Failed to write audit log:', err.message);
    }
  });
};

module.exports = { audit };
