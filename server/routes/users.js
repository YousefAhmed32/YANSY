const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.get('/:id', authenticate, requireAdmin, userController.getUserById);
router.get('/:id/client-details', authenticate, requireAdmin, userController.getClientDetails);
router.patch('/:id', authenticate, requireAdmin, userController.updateUser);
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;

