'use strict';
const AuditLog = require('../models/AuditLog');

/**
 * Log an admin action to the audit trail.
 * Non-blocking — failures are logged to console but never throw.
 */
const audit = async ({ req, action, entityType, entityId, before, after, metadata }) => {
  setImmediate(async () => {
    try {
      // Flag actions taken during an impersonated session (see auth.js) so
      // they're never audit-indistinguishable from the target user's own.
      const taggedMetadata = req.impersonatedBy
        ? { ...(metadata || {}), impersonatedBy: req.impersonatedBy }
        : (metadata || null);

      await AuditLog.create({
        actor:      req.user._id,
        actorEmail: req.user.email,
        actorRole:  req.user.role,
        action,
        entityType,
        entityId:   entityId || null,
        before:     before   || null,
        after:      after    || null,
        metadata:   taggedMetadata,
        ip:         req.ip   || req.connection?.remoteAddress || null,
        userAgent:  req.headers?.['user-agent'] || null,
      });
    } catch (err) {
      console.error('[audit] Failed to write audit log:', err.message);
    }
  });
};

module.exports = { audit };
