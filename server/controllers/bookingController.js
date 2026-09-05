'use strict';
const Booking = require('../models/Booking');
const ProjectRequest = require('../models/ProjectRequest');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const DEFAULT_SLOTS = ['10:30', '12:00', '14:00', '15:30', '17:00'];
const MAX_CALLS_PER_DAY = 4;

/**
 * Public: Get available slots for a given date
 * GET /api/bookings/availability?date=YYYY-MM-DD
 */
exports.getAvailability = async (req, res, next) => {
  try {
    const { date, meetingType } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date (YYYY-MM-DD) is required' });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Egypt/Gulf working days: Sunday (0) to Thursday (4). Friday (5) & Saturday (6) are off.
    const dayOfWeek = targetDate.getUTCDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return res.json({ availableSlots: [], message: 'Weekend / Off days' });
    }

    // Don't allow booking in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(targetDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) {
      return res.json({ availableSlots: [], message: 'Past dates are not available' });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    }).lean();

    // Respect daily engineering focus quota
    if (existingBookings.length >= MAX_CALLS_PER_DAY) {
      return res.json({
        availableSlots: [],
        message: 'Daily meeting capacity reached for this day',
        dailyLimitReached: true,
      });
    }

    // Extract booked time strings
    const bookedTimes = existingBookings.map(b => {
      const d = new Date(b.scheduledAt);
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const mins  = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    });

    const availableSlots = DEFAULT_SLOTS.filter(slot => !bookedTimes.includes(slot));

    res.json({
      date,
      availableSlots,
      remainingSlots: availableSlots.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Reserve a meeting slot
 * POST /api/bookings
 */
exports.createBooking = async (req, res, next) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      meetingType = 'discovery',
      date,
      time,
      timeZone = 'Africa/Cairo',
      notes = '',
    } = req.body;

    if (!clientName || !clientEmail || !date || !time) {
      return res.status(400).json({ error: 'Name, email, date, and time slot are required' });
    }

    // Parse combined scheduledAt
    const [hours, minutes] = time.split(':');
    const scheduledAt = new Date(date);
    scheduledAt.setUTCHours(Number(hours), Number(minutes), 0, 0);

    // Double-booking collision check
    const clash = await Booking.findOne({
      scheduledAt,
      status: { $ne: 'cancelled' },
    });
    if (clash) {
      return res.status(409).json({ error: 'This time slot was just booked by another client. Please choose another.' });
    }

    const typeTitles = {
      discovery: 'Discovery Strategy Call (30 min)',
      review:    'Project Scope Review (45 min)',
      technical: 'Technical Architecture Deep Dive (60 min)',
    };

    const durationMap = {
      discovery: 30,
      review:    45,
      technical: 60,
    };

    const booking = await Booking.create({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone: clientPhone ? clientPhone.trim() : '',
      meetingType,
      meetingTypeTitle: typeTitles[meetingType] || 'Strategy Call',
      scheduledAt,
      durationMinutes: durationMap[meetingType] || 30,
      timeZone,
      notes: notes.trim(),
      status: 'confirmed',
      meetingLink: 'https://meet.google.com/yansy-consultation',
    });

    // Auto-create or connect to ProjectRequest lead
    setImmediate(async () => {
      try {
        let existingLead = await ProjectRequest.findOne({ email: booking.clientEmail });
        if (!existingLead) {
          existingLead = await ProjectRequest.create({
            fullName: booking.clientName,
            email: booking.clientEmail,
            phoneNumber: booking.clientPhone,
            projectType: 'other',
            projectDescription: `Scheduled ${booking.meetingTypeTitle} on ${date} at ${time}. Notes: ${booking.notes || 'None'}`,
            status: 'qualified',
            tags: ['meeting_booked', booking.meetingType],
            nextFollowUpDate: booking.scheduledAt,
          });
        } else {
          existingLead.status = 'qualified';
          existingLead.nextFollowUpDate = booking.scheduledAt;
          if (!existingLead.tags.includes('meeting_booked')) {
            existingLead.tags.push('meeting_booked');
          }
          await existingLead.save();
        }

        // Notify admins
        const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
        admins.forEach(admin => {
          createNotification({
            userId: admin._id,
            type: 'alert',
            title: 'New Client Meeting Booked',
            message: `${booking.clientName} booked a ${booking.meetingTypeTitle} on ${date} at ${time} (Cairo Time).`,
            link: '/app/admin/crm',
            priority: 'high',
            io: req.io,
          });
        });
      } catch (leadErr) {
        console.error('[Booking Lead Sync Error]:', leadErr.message);
      }
    });

    res.status(201).json({
      message: 'Meeting booked successfully',
      booking,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: List all bookings
 * GET /api/bookings
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .sort({ scheduledAt: -1 })
      .limit(Number(limit) || 50)
      .lean();

    res.json({ bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update booking status (cancel, reschedule)
 * PATCH /api/bookings/:id/status
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (status) booking.status = status;
    if (cancellationReason) booking.cancellationReason = cancellationReason.trim();
    await booking.save();

    res.json({ message: 'Booking status updated', booking });
  } catch (err) {
    next(err);
  }
};
