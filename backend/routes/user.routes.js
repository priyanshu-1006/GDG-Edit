import express from 'express';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { role, search, limit, page = 1 } = req.query;

    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageSize = limit ? parseInt(limit) : 50;
    const skip = (parseInt(page) - 1) * pageSize;

    const users = await User.find(query)
      .select('-password')
      .limit(pageSize)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / pageSize),
      users,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics
// @access  Private (Admin)
router.get('/stats/overview', protect, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ 
      role: { $in: ['admin', 'event_manager', 'super_admin'] } 
    });

    // Users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalAdmins,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's registrations
    const registrations = await Registration.find({ user: user._id })
      .populate('event', 'name date')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user: user.toPublicJSON(),
      registrations,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Private (Super Admin only)
router.put('/:id/role', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const { role } = req.body;

    const validRoles = ['student', 'admin', 'event_manager', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
