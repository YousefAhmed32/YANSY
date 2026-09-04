const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { GENERIC_FILE_MIMES, GENERIC_FILE_MAX_BYTES } = require('../media/mediaConstants');

// Same pattern as every other upload route in the app (memory storage +
// mimetype prefilter; the real validation — size + magic bytes — happens in
// media.service.js's uploadMedia, the single shared upload path).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: GENERIC_FILE_MAX_BYTES },
  fileFilter: (req, file, cb) => cb(null, GENERIC_FILE_MIMES.has(file.mimetype)),
});

router.get('/threads/search',           authenticate, ctrl.searchThreads);
router.get('/threads',                  authenticate, ctrl.getThreads);
router.get('/threads/:id',              authenticate, ctrl.getThread);
router.get('/projects/:projectId/thread', authenticate, ctrl.getThreadByProject);
router.post('/threads',                 authenticate, ctrl.createThread);
router.post('/threads/:id/messages',    authenticate, ctrl.sendMessage);
// Not thread-scoped — see controller comment: an attachment can be picked
// before a first thread exists (starting a brand-new conversation).
router.post('/attachments',             authenticate, upload.single('file'), ctrl.uploadAttachment);
router.get('/threads/:id/notes',        authenticate, ctrl.getThreadNotes);
router.post('/threads/:id/notes',       authenticate, ctrl.addThreadNote);
router.patch('/threads/:id/status',     authenticate, ctrl.updateThreadStatus);
router.patch('/threads/:id/priority',   authenticate, ctrl.updateThreadPriority);
router.patch('/threads/:id/archive',    authenticate, ctrl.archiveThread);
router.patch('/threads/:id/pin',        authenticate, ctrl.pinThread);
router.patch('/threads/:id/assign',     authenticate, ctrl.assignThread);

module.exports = router;
