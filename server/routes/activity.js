const express = require('express');
const router  = express.Router();
const { getMyActivity, getUserActivity } = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

router.get('/',                    authenticate, getMyActivity);
router.get('/user/:userId',        authenticate, getUserActivity);

module.exports = router;
