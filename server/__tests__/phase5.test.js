'use strict';
/**
 * Phase 5 — Enterprise Admin Panel Tests
 * Tests: SystemSettings, roles/permissions, health, broadcast, CSV export, impersonation
 */

// ── Imports ──────────────────────────────────────────────────────────────────
const SystemSettings = require('../models/SystemSettings');
const { authenticate, requireRole, requirePermission, hasPermission, ROLE_HIERARCHY, PERMISSIONS } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');
const notificationController = require('../controllers/notificationController');
const userController = require('../controllers/userController');
const billingController = require('../controllers/billingController');

// ── SystemSettings model ──────────────────────────────────────────────────────
describe('SystemSettings model', () => {
  it('exports a Mongoose model', () => {
    expect(SystemSettings).toBeDefined();
    expect(typeof SystemSettings.find).toBe('function');
  });

  it('has expected static methods', () => {
    expect(typeof SystemSettings.get).toBe('function');
    expect(typeof SystemSettings.set).toBe('function');
    expect(typeof SystemSettings.getCategory).toBe('function');
  });

  it('schema has required fields', () => {
    const paths = SystemSettings.schema.paths;
    expect(paths.key).toBeDefined();
    expect(paths.value).toBeDefined();
    expect(paths.type).toBeDefined();
    expect(paths.category).toBeDefined();
    expect(paths.isPublic).toBeDefined();
  });

  it('category enum includes all expected values', () => {
    const catEnum = SystemSettings.schema.paths.category.enumValues;
    expect(catEnum).toContain('general');
    expect(catEnum).toContain('security');
    expect(catEnum).toContain('ai');
    expect(catEnum).toContain('features');
    expect(catEnum).toContain('platform');
    expect(catEnum).toContain('files');
  });

  it('type enum is valid', () => {
    const typeEnum = SystemSettings.schema.paths.type.enumValues;
    expect(typeEnum).toContain('string');
    expect(typeEnum).toContain('number');
    expect(typeEnum).toContain('boolean');
    expect(typeEnum).toContain('json');
  });

  it('isPublic defaults to false', () => {
    const defaultVal = SystemSettings.schema.paths.isPublic.defaultValue;
    expect(defaultVal).toBe(false);
  });
});

// ── Settings seed ─────────────────────────────────────────────────────────────
describe('Settings seed', () => {
  it('exports seedSettings function and DEFAULT_SETTINGS', () => {
    const { seedSettings, DEFAULT_SETTINGS } = require('../seeds/settings');
    expect(typeof seedSettings).toBe('function');
    expect(Array.isArray(DEFAULT_SETTINGS)).toBe(true);
    expect(DEFAULT_SETTINGS.length).toBeGreaterThan(10);
  });

  it('default settings include platform.maintenanceMode (boolean)', () => {
    const { DEFAULT_SETTINGS } = require('../seeds/settings');
    const mm = DEFAULT_SETTINGS.find(s => s.key === 'platform.maintenanceMode');
    expect(mm).toBeDefined();
    expect(mm.type).toBe('boolean');
    expect(mm.value).toBe(false);
  });

  it('default settings include ai.enabled (public)', () => {
    const { DEFAULT_SETTINGS } = require('../seeds/settings');
    const aiEnabled = DEFAULT_SETTINGS.find(s => s.key === 'ai.enabled');
    expect(aiEnabled).toBeDefined();
    expect(aiEnabled.isPublic).toBe(true);
  });

  it('default settings include features.search, features.notifications', () => {
    const { DEFAULT_SETTINGS } = require('../seeds/settings');
    const keys = DEFAULT_SETTINGS.map(s => s.key);
    expect(keys).toContain('features.search');
    expect(keys).toContain('features.notifications');
    expect(keys).toContain('features.invoicing');
  });
});

// ── Settings controller ───────────────────────────────────────────────────────
describe('settingsController', () => {
  it('exports all required handlers', () => {
    expect(typeof settingsController.getAll).toBe('function');
    expect(typeof settingsController.getPublic).toBe('function');
    expect(typeof settingsController.update).toBe('function');
    expect(typeof settingsController.bulkUpdate).toBe('function');
    expect(typeof settingsController.seed).toBe('function');
    expect(typeof settingsController.getHealth).toBe('function');
  });

  it('getHealth returns structured response with checks array', async () => {
    const req = { query: {} };
    const res = { json: jest.fn() };
    const next = jest.fn();
    await settingsController.getHealth(req, res, next);
    const call = res.json.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(Array.isArray(call.checks)).toBe(true);
    expect(call.checks.length).toBeGreaterThan(0);
    expect(['ok', 'warning', 'degraded']).toContain(call.status);
    expect(call.checkedAt).toBeDefined();
    expect(call.durationMs).toBeDefined();
  });

  it('getHealth includes expected service checks', async () => {
    const req = { query: {} };
    const res = { json: jest.fn() };
    const next = jest.fn();
    await settingsController.getHealth(req, res, next);
    const { checks } = res.json.mock.calls[0][0];
    const names = checks.map(c => c.name);
    expect(names).toContain('Database');
    expect(names).toContain('Stripe');
    expect(names).toContain('Email (SMTP)');
    expect(names).toContain('AI (Claude)');
    expect(names).toContain('Server');
  });

  it('update rejects missing value', async () => {
    const req = { params: { key: 'some.key' }, body: {}, user: { _id: 'abc' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await settingsController.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('bulkUpdate rejects empty updates array', async () => {
    const req = { body: { updates: [] }, user: { _id: 'abc' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await settingsController.bulkUpdate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── Settings routes ───────────────────────────────────────────────────────────
describe('Settings routes', () => {
  it('settings routes module loads without error', () => {
    expect(() => require('../routes/settings')).not.toThrow();
  });

  it('settings route file exports an Express router', () => {
    const router = require('../routes/settings');
    expect(router).toBeDefined();
    expect(typeof router).toBe('function'); // Express routers are functions
  });

  it('server.js registers settings routes at /api/admin/settings', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../server.js'), 'utf8');
    expect(src).toContain("'/api/admin/settings'");
    expect(src).toContain('settingsRoutes');
  });
});

// ── Role hierarchy ────────────────────────────────────────────────────────────
describe('Auth middleware — role hierarchy', () => {
  it('exports ROLE_HIERARCHY with correct ordering', () => {
    expect(ROLE_HIERARCHY.USER).toBe(0);
    expect(ROLE_HIERARCHY.MANAGER).toBe(1);
    expect(ROLE_HIERARCHY.ADMIN).toBe(2);
    expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(3);
  });

  it('exports PERMISSIONS with expected keys', () => {
    expect(PERMISSIONS['users.impersonate']).toContain('SUPER_ADMIN');
    expect(PERMISSIONS['settings.edit']).toContain('ADMIN');
    expect(PERMISSIONS['notifications.broadcast']).toContain('ADMIN');
    expect(PERMISSIONS['users.export']).toContain('ADMIN');
  });

  it('hasPermission returns true for adequate role', () => {
    const adminUser = { role: 'ADMIN' };
    expect(hasPermission(adminUser, 'settings.edit')).toBe(true);
    expect(hasPermission(adminUser, 'users.view')).toBe(true);
    expect(hasPermission(adminUser, 'notifications.broadcast')).toBe(true);
  });

  it('hasPermission returns false for insufficient role', () => {
    const managerUser = { role: 'MANAGER' };
    expect(hasPermission(managerUser, 'users.impersonate')).toBe(false);
    expect(hasPermission(managerUser, 'system.configure')).toBe(false);
    expect(hasPermission(managerUser, 'settings.edit')).toBe(false);
  });

  it('hasPermission uses hierarchy (SUPER_ADMIN passes ADMIN checks)', () => {
    const superAdmin = { role: 'SUPER_ADMIN' };
    expect(hasPermission(superAdmin, 'settings.edit')).toBe(true);
    expect(hasPermission(superAdmin, 'users.view')).toBe(true);
    expect(hasPermission(superAdmin, 'users.impersonate')).toBe(true);
    expect(hasPermission(superAdmin, 'system.configure')).toBe(true);
  });

  it('requirePermission middleware rejects unauthenticated request', () => {
    const mw = requirePermission('settings.edit');
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mw(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('requirePermission middleware rejects insufficient role', () => {
    const mw = requirePermission('system.configure');
    const req = { user: { role: 'ADMIN' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mw(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requirePermission middleware calls next() for adequate role', () => {
    const mw = requirePermission('settings.view');
    const req = { user: { role: 'MANAGER' } };
    const res = {};
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requireRole supports hierarchical check', () => {
    const mw = requireRole('ADMIN');
    const req = { user: { role: 'SUPER_ADMIN' } };
    const next = jest.fn();
    mw(req, {}, next);
    expect(next).toHaveBeenCalled();
  });
});

// ── User model role enum ──────────────────────────────────────────────────────
describe('User model — extended roles', () => {
  it('role enum includes MANAGER and SUPER_ADMIN', () => {
    const User = require('../models/User');
    const roleEnum = User.schema.paths.role.enumValues;
    expect(roleEnum).toContain('USER');
    expect(roleEnum).toContain('MANAGER');
    expect(roleEnum).toContain('ADMIN');
    expect(roleEnum).toContain('SUPER_ADMIN');
  });
});

// ── User controller — new endpoints ──────────────────────────────────────────
describe('userController — Phase 5 endpoints', () => {
  it('exports changeRole, exportCSV, impersonate', () => {
    expect(typeof userController.changeRole).toBe('function');
    expect(typeof userController.exportCSV).toBe('function');
    expect(typeof userController.impersonate).toBe('function');
  });

  it('changeRole rejects invalid role', async () => {
    const req = { params: { id: 'abc' }, body: { role: 'SUPERUSER' }, user: { _id: 'me', role: 'ADMIN' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await userController.changeRole(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('impersonate handler has 404 guard for nonexistent user', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../controllers/userController.js'), 'utf8');
    expect(src).toContain('User not found');
    expect(src).toContain('exports.impersonate');
    expect(src).toContain('jwt.sign');
  });

  it('user routes include export, role, impersonate endpoints', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../routes/users.js'), 'utf8');
    expect(src).toContain('exportCSV');
    expect(src).toContain('changeRole');
    expect(src).toContain('impersonate');
    expect(src).toContain("requirePermission('users.export')");
    expect(src).toContain("requirePermission('users.impersonate')");
  });
});

// ── Notification controller — broadcast ──────────────────────────────────────
describe('notificationController — broadcast', () => {
  it('exports broadcast function', () => {
    expect(typeof notificationController.broadcast).toBe('function');
  });

  it('broadcast rejects missing title', async () => {
    const req = { body: { message: 'hello' }, user: { _id: 'abc', role: 'ADMIN' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await notificationController.broadcast(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('broadcast rejects missing message', async () => {
    const req = { body: { title: 'hello' }, user: { _id: 'abc', role: 'ADMIN' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await notificationController.broadcast(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('notification routes include broadcast endpoint', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../routes/notifications.js'), 'utf8');
    expect(src).toContain('broadcast');
    expect(src).toContain("requirePermission('notifications.broadcast')");
  });
});

// ── billingController — financial stats ──────────────────────────────────────
describe('billingController — financial stats', () => {
  it('exports adminGetFinancialStats', () => {
    expect(typeof billingController.adminGetFinancialStats).toBe('function');
  });

  it('billing routes include financial-stats endpoint', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../routes/billing.js'), 'utf8');
    expect(src).toContain('financial-stats');
    expect(src).toContain('adminGetFinancialStats');
  });
});

// ── Maintenance mode ──────────────────────────────────────────────────────────
describe('Maintenance mode middleware', () => {
  it('server.js has maintenance mode middleware', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../server.js'), 'utf8');
    expect(src).toContain('maintenanceMode');
    expect(src).toContain('maintenance: true');
    expect(src).toContain('503');
  });

  it('maintenance mode bypasses health and auth routes', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../server.js'), 'utf8');
    expect(src).toContain('/api/health');
    expect(src).toContain('/api/auth/');
  });
});

// ── Frontend page existence ───────────────────────────────────────────────────
describe('Phase 5 frontend pages', () => {
  const path = require('path');
  const fs   = require('fs');
  const pagesDir = path.join(__dirname, '../../client/src/pages');

  const pages = ['AdminSettings.jsx', 'AdminHealth.jsx', 'AdminFinancial.jsx', 'AdminRoles.jsx', 'AdminNotifications.jsx'];

  pages.forEach(page => {
    it(`${page} exists`, () => {
      expect(fs.existsSync(path.join(pagesDir, page))).toBe(true);
    });
  });

  it('App.jsx registers all 5 new admin routes', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../client/src/App.jsx'), 'utf8');
    expect(src).toContain('admin/settings');
    expect(src).toContain('admin/health');
    expect(src).toContain('admin/financial');
    expect(src).toContain('admin/roles');
    expect(src).toContain('admin/notifications');
  });

  it('Layout.jsx includes new admin nav items', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../client/src/components/Layout.jsx'), 'utf8');
    expect(src).toContain('/app/admin/settings');
    expect(src).toContain('/app/admin/health');
    expect(src).toContain('/app/admin/financial');
    expect(src).toContain('/app/admin/roles');
    expect(src).toContain('/app/admin/notifications');
  });
});

// ── Code quality ──────────────────────────────────────────────────────────────
describe('Phase 5 code quality', () => {
  it('settings routes use requirePermission (not just requireAdmin)', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../routes/settings.js'), 'utf8');
    expect(src).toContain('requirePermission');
  });

  it('user routes use granular permissions not just requireAdmin', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../routes/users.js'), 'utf8');
    expect(src).toContain('requirePermission');
    expect(src).toContain("requirePermission('users.view')");
    expect(src).toContain("requirePermission('users.delete')");
  });

  it('impersonation is logged via audit', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../controllers/userController.js'), 'utf8');
    expect(src).toContain('user.impersonate');
    expect(src).toContain('audit(');
  });

  it('broadcast is logged via audit', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../controllers/notificationController.js'), 'utf8');
    expect(src).toContain('notification.broadcast');
    expect(src).toContain('audit(');
  });

  it('CSV export logs audit event', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../controllers/userController.js'), 'utf8');
    expect(src).toContain('user.export');
    expect(src).toContain('audit(');
  });

  it('impersonation token expires in 1h', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../controllers/userController.js'), 'utf8');
    expect(src).toContain("expiresIn: '1h'");
  });
});
