'use strict';
const express = require('express');
const router = express.Router();
const { getMedia } = require('./media.controller');

// Public — matches today's Cloudinary URLs, which were also unauthenticated.
// GridFS lookup is exclusively by ObjectId, never a filesystem path, so there is
// no path-traversal surface on this route.
router.get('/:id', getMedia);

module.exports = router;
