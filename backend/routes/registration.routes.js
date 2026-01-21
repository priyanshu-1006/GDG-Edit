import express from 'express';
import QRCode from 'qrcode';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

import emailService from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/registrations
// @desc    Register for an event
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { eventId, formData } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if registration is open
    if (!event.registrationOpen) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this event',
      });
    }

    // Check if event is full
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is full',
      });
    }

    // Check if user already registered
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      event: eventId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event',
      });
    }

    // Generate QR code
    const qrData = JSON.stringify({
      userId: req.user._id,
      eventId: eventId,
      registrationId: Date.now(),
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // Create registration
    const registration = await Registration.create({
      user: req.user._id,
      event: eventId,
      formData,
      qrCode,
      status: 'approved', // Auto-approve
    });

    // Update event registered count
    event.registeredCount += 1;
    await event.save();
    await registration.populate('event', 'name date time location');

    // Send confirmation email (async, don't wait)
    emailService.sendRegistrationConfirmation(req.user, registration.event, registration._id.toString())
      .catch(err => console.error('Failed to send registration email:', err));

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event',
      registration,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/registrations/my-events
// @desc    Get user's registered events
// @access  Private
router.get('/my-events', protect, async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 });

    // Separate upcoming and past events
    const now = new Date();
    const upcoming = registrations.filter(r => new Date(r.event.date) >= now);
    const past = registrations.filter(r => new Date(r.event.date) < now);

    res.json({
      success: true,
      upcoming,
      past,
      total: registrations.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/registrations/event/:eventId
// @desc    Get all registrations for an event
// @access  Private (Admin only)
router.get('/event/:eventId', protect, authorize('admin', 'event_manager', 'super_admin'), async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = { event: req.params.eventId };

    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .populate('user', 'name email phone college year branch')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/registrations/:id/status
// @desc    Update registration status (approve/reject)
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin', 'event_manager', 'super_admin'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'waitlist'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    res.json({
      success: true,
      registration,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/registrations/:id/attendance
// @desc    Mark attendance
// @access  Private (Admin only)
router.put('/:id/attendance', protect, authorize('admin', 'event_manager', 'super_admin'), async (req, res, next) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      {
        attended: true,
        attendanceTime: Date.now(),
      },
      { new: true }
    ).populate('user event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      registration,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/registrations/:id/qr-code
// @desc    Get QR code for registration
// @access  Private
router.get('/:id/qr-code', protect, async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    res.json({
      success: true,
      qrCode: registration.qrCode,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
