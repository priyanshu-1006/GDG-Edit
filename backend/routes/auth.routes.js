import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import Induction from '../models/Induction.js';
import Settings from '../models/Settings.js';
import { sendTokenResponse, generateToken } from '../utils/auth.utils.js';
import { protect } from '../middleware/auth.middleware.js';
import imageUpload from '../middleware/imageUpload.middleware.js';
import emailService from '../services/emailService.js';
import { sendGlobalEmail } from '../utils/unifiedEmail.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

const requireResendForOtp =
  process.env.NODE_ENV === 'production' || process.env.REQUIRE_RESEND_FOR_OTP === 'true';

const isCloudinaryConfigured =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

const INDUCTION_STATUS_META = {
  applied: {
    label: 'Application Submitted',
    roundLabel: 'Application Review',
  },
  shortlisted_online: {
    label: 'Shortlisted For Online Round',
    roundLabel: 'Online PI Round',
  },
  shortlisted_offline: {
    label: 'Shortlisted For Offline Round',
    roundLabel: 'Offline PI Round',
  },
  selected: {
    label: 'Selected',
    roundLabel: 'Final Result',
  },
  rejected: {
    label: 'Not Selected',
    roundLabel: 'Final Result',
  },
};
const MAX_TEAM_2026_EDITS = 1;

const uploadProfilePhotoToCloudinary = (buffer, userId) => {
  const publicId = `profile-${userId}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'gdg/profile-photos',
        resource_type: 'image',
        public_id: publicId,
        transformation: [
          { width: 600, height: 600, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Admin OTP Email Template
 */
const getAdminOTPEmailHTML = (otp, adminName) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4285f4 0%, #1967d2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .otp-box { background: linear-gradient(135deg, #4285f4 0%, #1967d2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 42px; font-weight: bold; letter-spacing: 10px; font-family: 'Courier New', monospace; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          .warning { color: #d32f2f; font-size: 14px; margin-top: 20px; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>GDG MMMUT</h1>
              <p>Admin Portal Login Verification</p>
          </div>
          <div class="content">
              <p>Hi ${adminName},</p>
              <p>You have requested to login to GDG Admin Portal. Please use the following One-Time Password (OTP) to complete your login:</p>
              <div class="otp-box">
                  <div class="otp-code">${otp}</div>
              </div>
              <p><strong>This OTP will expire in 2 minutes.</strong></p>
              <p class="warning">⚠️ If you did not request this OTP, please ignore this email. Your account remains secure.</p>
          </div>
          <div class="footer">
              <p>Google Developers Group - MMMUT Gorakhpur<br>© 2026 All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `;
};

const isGoogleConfigured =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID.trim() !== "your-google-client-id";

const isGithubConfigured =
  !!process.env.GITHUB_CLIENT_ID &&
  !!process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_CLIENT_ID !== "your-github-client-id";

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

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Password login is not available for this account',
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

// ==================== ADMIN OTP LOGIN FLOW ====================

/**
 * @route   POST /api/auth/admin/initiate-login
 * @desc    Initiate admin login - verify email/password and send OTP
 * @access  Public
 */
router.post('/admin/initiate-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Password login is not available for this account'
      });
    }

    // Check if user has admin/event_manager/super_admin role
    if (!['admin', 'event_manager', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have admin access'
      });
    }

    if (user.suspended) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been suspended'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to database
    await OTP.findOneAndDelete({ email }); // Remove old OTP if exists
    await OTP.create({
      email,
      otp
    });

    // Send OTP email
    const emailSent = await sendGlobalEmail({
      to: email,
      subject: 'Your GDG Admin Login OTP - Valid for 2 Minutes',
      html: getAdminOTPEmailHTML(otp, user.name),
      requireResend: requireResendForOtp,
    });

    if (!emailSent) {
      return res.status(503).json({
        success: false,
        message: 'Unable to deliver OTP email right now. Please try again in a moment.',
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/admin/verify-otp
 * @desc    Verify OTP and complete admin login
 * @access  Public
 */
router.post('/admin/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Check OTP
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Get user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Double-check admin role
    if (!['admin', 'event_manager', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have admin access'
      });
    }

    if (user.suspended) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been suspended'
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

  if (!isGoogleConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured on server',
    });
  }

  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  (req, res, next) => {
    if (!isGoogleConfigured) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=google_oauth_not_configured`);
    }
    next();
  },
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
router.get('/github', (req, res, next) => {
  if (!isGithubConfigured) {
    return res.status(503).json({
      success: false,
      message: 'GitHub OAuth is not configured on server',
    });
  }

  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

// @route   GET /api/auth/github/callback
// @desc    GitHub OAuth callback
// @access  Public
router.get('/github/callback',
  (req, res, next) => {
    if (!isGithubConfigured) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=github_oauth_not_configured`);
    }
    next();
  },
  passport.authenticate('github', {
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=github_auth_failed`,
    session: false
  }),
  (req, res) => {
    // Successful authentication
    const token = generateToken(req.user._id);

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
    const profile = user.toPublicJSON();

    if (user.role === 'student') {
      const induction = await Induction.findOne({
        email: String(user.email || '').toLowerCase().trim(),
      })
        .select('status createdAt updatedAt rollNumber linkedinUrl githubId xUrl selectedProfilePhoto selectedDetailsSubmittedAt selectedDetailsEditCount team2026Approved team2026ReviewedAt')
        .sort({ createdAt: -1 });

      const settings = await Settings.findOne().select('piRound isPiStarted piStartedAt');

      if (!induction) {
        profile.induction = {
          hasSubmitted: false,
          status: 'not_applied',
          statusLabel: 'Not Applied Yet',
          roundLabel: 'No Active Round',
          submittedAt: null,
          updatedAt: null,
          rollNumber: null,
          team2026: {
            hasSubmitted: false,
            linkedinUrl: '',
            githubId: '',
            xUrl: '',
            profilePhoto: '',
            submittedAt: null,
            editCount: 0,
            remainingEdits: MAX_TEAM_2026_EDITS,
            isApproved: false,
            reviewedAt: null,
          },
          activePiRound: settings?.piRound || null,
          isPiStarted: !!settings?.isPiStarted,
          piStartedAt: settings?.piStartedAt || null,
        };
      } else {
        const statusKey = induction.status || 'applied';
        const statusMeta = INDUCTION_STATUS_META[statusKey] || INDUCTION_STATUS_META.applied;
        const hasSubmittedTeam2026 = !!(
          induction.selectedDetailsSubmittedAt &&
          induction.selectedProfilePhoto &&
          induction.linkedinUrl &&
          induction.githubId
        );
        const team2026EditCount = Number(induction.selectedDetailsEditCount || 0);
        const remainingTeam2026Edits = hasSubmittedTeam2026
          ? Math.max(MAX_TEAM_2026_EDITS - team2026EditCount, 0)
          : MAX_TEAM_2026_EDITS;

        profile.induction = {
          hasSubmitted: true,
          status: statusKey,
          statusLabel: statusMeta.label,
          roundLabel: statusMeta.roundLabel,
          submittedAt: induction.createdAt || null,
          updatedAt: induction.updatedAt || null,
          rollNumber: induction.rollNumber || null,
          team2026: {
            hasSubmitted: hasSubmittedTeam2026,
            linkedinUrl: induction.linkedinUrl || '',
            githubId: induction.githubId || '',
            xUrl: induction.xUrl || '',
            profilePhoto: induction.selectedProfilePhoto || '',
            submittedAt: induction.selectedDetailsSubmittedAt || null,
            editCount: team2026EditCount,
            remainingEdits: remainingTeam2026Edits,
            isApproved: !!induction.team2026Approved,
            reviewedAt: induction.team2026ReviewedAt || null,
          },
          activePiRound: settings?.piRound || null,
          isPiStarted: !!settings?.isPiStarted,
          piStartedAt: settings?.piStartedAt || null,
        };
      }
    }

    // Return user data directly (not nested in a user object)
    res.json(profile);
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
    if (year !== undefined) {
      const numericYear = Number(year);

      if (!Number.isInteger(numericYear) || numericYear < 1 || numericYear > 5) {
        return res.status(400).json({
          success: false,
          message: 'Year must be a number between 1 and 5'
        });
      }

      user.year = numericYear;
    }
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

// @route   POST /api/auth/profile/photo
// @desc    Upload profile photo to Cloudinary and update user profile
// @access  Private
router.post('/profile/photo', protect, imageUpload.single('photo'), async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Profile photo upload is not configured',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded',
      });
    }

    const uploadResult = await uploadProfilePhotoToCloudinary(req.file.buffer, req.user._id);

    const user = await User.findById(req.user._id);
    user.profilePhoto = uploadResult.secure_url;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      profilePhoto: user.profilePhoto,
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

// ============================================
// EVENT MANAGER SELF-REGISTRATION FLOW
// ============================================

// @route   POST /api/auth/event-manager/send-otp
// @desc    Send OTP to @mmmut.ac.in email for event manager registration
// @access  Public
router.post('/event-manager/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Validate domain
    if (!email.toLowerCase().endsWith('@mmmut.ac.in')) {
      return res.status(400).json({
        success: false,
        message: 'Only @mmmut.ac.in email addresses are allowed',
      });
    }

    // Check if user already exists with event_manager or higher role
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && ['event_manager', 'admin', 'super_admin'].includes(existingUser.role)) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please login instead.',
      });
    }

    // Delete any previous OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP (auto-expires in 2 minutes via TTL index)
    await OTP.create({ email: email.toLowerCase(), otp });

    // Send OTP email
    const emailSent = await sendGlobalEmail({
      to: email,
      from: '"GDG MMMUT" <team@gdg.mmmut.app>',
      subject: 'Your GDG MMMUT Event Manager Verification Code',
      requireResend: requireResendForOtp,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
          <div style="background:#4285f4;padding:30px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">GDG MMMUT</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Event Manager Verification</p>
          </div>
          <div style="padding:40px;">
            <p style="color:#202124;font-size:16px;margin:0 0 20px;">Your verification code is:</p>
            <div style="background:#f8f9fa;border:2px solid #4285f4;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4285f4;">${otp}</span>
            </div>
            <p style="color:#5f6368;font-size:14px;margin:0 0 8px;">⏱ This code expires in <strong>2 minutes</strong>.</p>
            <p style="color:#5f6368;font-size:14px;margin:0;">If you didn't request this, please ignore this email.</p>
          </div>
          <div style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e8eaed;">
            <p style="color:#9aa0a6;font-size:12px;margin:0;">Google Developer Group — MMMUT Gorakhpur</p>
          </div>
        </div>
      `,
    });

    if (!emailSent) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
    }

    console.log(`📧 OTP sent to ${email} for event manager registration`);
    res.json({ success: true, message: 'OTP sent to your email. It will expire in 2 minutes.' });
  } catch (error) {
    console.error('Event manager send-otp error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @route   POST /api/auth/event-manager/verify-otp
// @desc    Verify OTP and issue temporary registration token
// @access  Public
router.post('/event-manager/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    // OTP is valid — delete it so it can't be reused
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Issue a short-lived temporary JWT for registration (10 min validity)
    const tempToken = jwt.sign(
      { email: email.toLowerCase(), purpose: 'event_manager_register' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now set your password.',
      tempToken,
    });
  } catch (error) {
    console.error('Event manager verify-otp error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @route   POST /api/auth/event-manager/register
// @desc    Complete event manager registration with password
// @access  Public (requires tempToken from verify-otp)
router.post('/event-manager/register', async (req, res) => {
  try {
    const { tempToken, name, password } = req.body;

    if (!tempToken || !name || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Verify the temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Registration session expired. Please start over.',
      });
    }

    if (decoded.purpose !== 'event_manager_register') {
      return res.status(401).json({ success: false, message: 'Invalid registration token' });
    }

    const email = decoded.email;

    // Check if a user already exists with this email
    let user = await User.findOne({ email });

    if (user) {
      // If they exist as a student, upgrade them to event_manager
      if (user.role === 'student') {
        user.role = 'event_manager';
        user.name = name;
        user.password = password; // Will be hashed by the pre-save hook
        user.emailVerified = true;
        user.isApproved = false; // Make them pending approval
        await user.save();
      } else {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered with a higher role. Please login instead.',
        });
      }
    } else {
      // Create a brand new user with event_manager role
      user = await User.create({
        name,
        email,
        password,
        role: 'event_manager',
        oauthProvider: 'email',
        emailVerified: true,
        isApproved: false, // Flag as pending super_admin approval
      });
    }

    console.log(`🎉 New event manager registered and awaiting approval: ${email}`);

    // Return success message without token since they need manual approval
    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is currently pending Super Admin approval. You will be able to log in once your account is verified.'
    });
  } catch (error) {
    console.error('Event manager register error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

export default router;
