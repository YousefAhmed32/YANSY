'use strict';
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public booking endpoints
router.get('/availability', bookingController.getAvailability);
router.post('/',            bookingController.createBooking);

// Admin-only endpoints
router.get('/',             authenticate, requireAdmin, bookingController.getAllBookings);
router.patch('/:id/status', authenticate, requireAdmin, bookingController.updateBookingStatus);

module.exports = router;
