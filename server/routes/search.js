const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { globalSearch } = require('../controllers/searchController');

router.get('/', authenticate, globalSearch);

module.exports = router;
