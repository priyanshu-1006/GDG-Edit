import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import { sendTokenResponse, generateToken } from '../utils/auth.utils.js';
import { protect } from '../middleware/auth.middleware.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      oauthProvider: 'email',
    });

    // Send welcome email
    emailService.sendWelcomeEmail(user)
      .catch(err => console.error('Failed to send welcome email:', err));

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', (req, res, next) => {
  console.log('🔵 Initiating Google OAuth flow');
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=google_auth_failed`,
    session: false
  }),
  (req, res) => {
    console.log('🟢 Google OAuth successful for user:', req.user.email);
    // Successful authentication
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
    console.log('🔄 Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  }
);

// @route   GET /api/auth/github
// @desc    GitHub OAuth login
// @access  Public
router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

// @route   GET /api/auth/github/callback
// @desc    GitHub OAuth callback
// @access  Public
router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=github_auth_failed`,
    session: false
  }),
  (req, res) => {
    // Successful authentication
    const token = require('../utils/auth.utils.js').generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Return user data directly (not nested in a user object)
    res.json(user.toPublicJSON());
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, college, year, branch } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (college) user.college = college;
    if (year) user.year = year;
    if (branch) user.branch = branch;

    await user.save();

    res.json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
