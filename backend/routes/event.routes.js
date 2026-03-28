import express from 'express';
import Event from '../models/Event.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all published events
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { type, search, upcoming, limit } = req.query;

    let query = { published: true, draft: false };

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter upcoming events
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    let eventsQuery = Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    // Limit results
    if (limit) {
      eventsQuery = eventsQuery.limit(parseInt(limit));
    }

    const events = await eventsQuery;

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/category/:category
// @desc    Get events by category (study-jam, immerse, hackblitz)
// @access  Public
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;

    const events = await Event.find({
      eventCategory: category,
      published: true,
      draft: false,
    })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Admin only)
router.post('/', protect, authorize('admin', 'event_manager', 'super_admin'), async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin', 'event_manager', 'super_admin'), async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
