'use strict';
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    clientPhone: {
      type: String,
      trim: true,
      default: '',
    },
    meetingType: {
      type: String,
      enum: ['discovery', 'review', 'technical'],
      default: 'discovery',
    },
    meetingTypeTitle: {
      type: String,
      default: 'Discovery Strategy Call',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    timeZone: {
      type: String,
      default: 'Africa/Cairo',
    },
    status: {
      type: String,
      enum: ['confirmed', 'rescheduled', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    meetingLink: {
      type: String,
      default: 'https://meet.google.com/yansy-consultation',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ scheduledAt: 1, status: 1 });
bookingSchema.index({ clientEmail: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
