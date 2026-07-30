'use strict';
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Role hierarchy (higher = more privileged) ─────────────────────────────────
const ROLE_HIERARCHY = { USER: 0, MANAGER: 1, ADMIN: 2, SUPER_ADMIN: 3 };

// ── Permission matrix ─────────────────────────────────────────────────────────
const PERMISSIONS = {
  'projects.view.all':       ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'projects.edit':           ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'projects.delete':         ['ADMIN',   'SUPER_ADMIN'],
  'users.view':              ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'users.edit':              ['ADMIN',   'SUPER_ADMIN'],
  'users.delete':            ['ADMIN',   'SUPER_ADMIN'],
  'users.impersonate':       ['SUPER_ADMIN'],
  'users.export':            ['ADMIN',   'SUPER_ADMIN'],
  'billing.view':            ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'billing.manage':          ['ADMIN',   'SUPER_ADMIN'],
  'settings.view':           ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'settings.edit':           ['ADMIN',   'SUPER_ADMIN'],
  'system.configure':        ['SUPER_ADMIN'],
  'ai.configure':            ['ADMIN',   'SUPER_ADMIN'],
  'audit.view':              ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'feedback.manage':         ['ADMIN',   'SUPER_ADMIN'],
  'notifications.broadcast': ['ADMIN',   'SUPER_ADMIN'],
};

/**
 * Authentication Middleware — verifies JWT, checks isActive, attaches user.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    req.user = user;
    // Impersonation tokens (issued by userController.impersonate, SUPER_ADMIN
    // only) carry `impersonatedBy` in the payload. Propagate it so every
    // audit() call made during an impersonated session can record which
    // admin was actually behind the action — otherwise those actions are
    // audit-indistinguishable from the target user's own, which defeats the
    // one feature that most needs accountability if that SUPER_ADMIN account
    // is ever compromised.
    req.impersonatedBy = decoded.impersonatedBy || null;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Invalid token. Please login again.' });
    if (error.name === 'TokenExpiredError')  return res.status(401).json({ error: 'Token expired. Please login again.' });
    return res.status(401).json({ error: 'Authentication failed. Please try again.' });
  }
};

/**
 * Role-based authorization — supports hierarchy (ADMIN matches SUPER_ADMIN too).
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
  const allowed   = roles.flat();

  // User passes if their level >= any required role level
  const passes = allowed.some(r => userLevel >= (ROLE_HIERARCHY[r] ?? 999));

  if (!passes) {
    return res.status(403).json({
      error: `Access denied. Required role: ${allowed.join(' or ')}`,
      yourRole: req.user.role,
    });
  }

  next();
};

/**
 * Granular permission middleware.
 */
const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const allowedRoles = PERMISSIONS[permission] || [];
  const userLevel    = ROLE_HIERARCHY[req.user.role] ?? -1;
  const passes       = allowedRoles.some(r => userLevel >= (ROLE_HIERARCHY[r] ?? 999));

  if (!passes) {
    return res.status(403).json({
      error:      `Permission denied: '${permission}'`,
      yourRole:   req.user.role,
      permission,
    });
  }

  next();
};

// Convenience aliases
const requireAdmin      = requireRole('ADMIN');
const requireSuperAdmin = requireRole('SUPER_ADMIN');
const requireManager    = requireRole('MANAGER');

// Utility: check permission without middleware
const hasPermission = (user, permission) => {
  const allowedRoles = PERMISSIONS[permission] || [];
  const userLevel    = ROLE_HIERARCHY[user?.role] ?? -1;
  return allowedRoles.some(r => userLevel >= (ROLE_HIERARCHY[r] ?? 999));
};

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  requireAdmin,
  requireSuperAdmin,
  requireManager,
  hasPermission,
  ROLE_HIERARCHY,
  PERMISSIONS,
};

