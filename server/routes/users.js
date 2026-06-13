const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin, requirePermission, requireSuperAdmin } = require('../middleware/auth');

// ── Self-service (authenticated user) ────────────────────────────────────────
router.put('/profile',            authenticate, userController.updateProfile);
router.post('/onboarding',        authenticate, userController.completeOnboarding);
router.put('/change-password',    authenticate, userController.changePassword);
router.delete('/me',              authenticate, userController.deleteOwnAccount);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/export',              authenticate, requirePermission('users.export'),      userController.exportCSV);
router.get('/',                    authenticate, requirePermission('users.view'),        userController.getAllUsers);
router.get('/:id',                 authenticate, requirePermission('users.view'),        userController.getUserById);
router.get('/:id/client-details',  authenticate, requirePermission('users.view'),        userController.getClientDetails);
router.patch('/:id',               authenticate, requirePermission('users.edit'),        userController.updateUser);
router.patch('/:id/role',          authenticate, requirePermission('users.edit'),        userController.changeRole);
router.patch('/:id/toggle-status', authenticate, requirePermission('users.edit'),        userController.toggleUserStatus);
router.post('/:id/impersonate',    authenticate, requirePermission('users.impersonate'), userController.impersonate);
router.delete('/:id',              authenticate, requirePermission('users.delete'),      userController.deleteUser);

module.exports = router;

