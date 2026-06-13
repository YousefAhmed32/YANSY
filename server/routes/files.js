const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');

router.post('/upload', authenticate, fileController.uploadFiles);
router.get('/', authenticate, fileController.getFiles);
router.get('/:id', authenticate, fileController.getFileById);
router.delete('/:id', authenticate, fileController.deleteFile);

module.exports = router;

