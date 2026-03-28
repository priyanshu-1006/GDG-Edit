import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Setup endpoints are high-risk and should never be publicly active in production
// unless explicitly enabled by environment configuration.
const setupRoutesEnabled =
  process.env.ENABLE_SETUP_ROUTES === 'true' ||
  process.env.NODE_ENV !== 'production';

router.use((req, res, next) => {
  if (!setupRoutesEnabled) {
    return res.status(403).json({
      success: false,
      message:
        'Setup routes are disabled. Enable with ENABLE_SETUP_ROUTES=true only during controlled setup.',
    });
  }
  next();
});

/**
 * @desc    Create initial admin user (only works if no admin exists)
 * @route   POST /api/setup/create-admin
 * @access  Public (but only works once)
 */
router.post('/create-admin', async (req, res) => {
  try {
    // Check if any admin already exists
    const adminExists = await User.findOne({ 
      role: { $in: ['admin', 'super_admin', 'event_manager'] } 
    });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists. For security, this endpoint is disabled.'
      });
    }

    const { name, email, password, role = 'super_admin' } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Validate role
    const validRoles = ['event_manager', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: event_manager, admin, or super_admin'
      });
    }

    // Check if user with email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      oauthProvider: 'email',
      emailVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
});

/**
 * @desc    Promote existing user to admin (requires admin secret key)
 * @route   POST /api/setup/promote-to-admin
 * @access  Public (but requires secret key)
 */
router.post('/promote-to-admin', async (req, res) => {
  try {
    const { email, role = 'admin', secretKey } = req.body;

    // Require an explicit secret key from environment; never use a hardcoded fallback.
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

    if (!ADMIN_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_SECRET_KEY is not configured',
      });
    }
    
    if (secretKey !== ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Invalid secret key'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role
    const validRoles = ['event_manager', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: event_manager, admin, or super_admin'
      });
    }

    // Update user role
    user.role = role;
    user.emailVerified = true; // Auto-verify admins
    await user.save();

    res.json({
      success: true,
      message: `User promoted to ${role} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Promote user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote user',
      error: error.message
    });
  }
});

export default router;
