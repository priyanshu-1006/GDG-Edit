import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateToken } from '../utils/auth.utils.js';
import { sendGlobalEmail } from '../utils/unifiedEmail.js';

const router = express.Router();

// Use the main Google OAuth credentials for induction as well
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ALLOWED_DOMAIN = 'mmmut.ac.in';
const requireResendForOtp =
  process.env.NODE_ENV === 'production' || process.env.REQUIRE_RESEND_FOR_OTP === 'true';

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const deriveNameParts = (fullName = '') => {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
};

const resolveInductionIdentity = async ({ email, fallbackName = '', fallbackAvatar = '' }) => {
  let studentData = null;

  try {
    studentData = await Student.findOne({ email }).lean();
  } catch (error) {
    console.error('Failed to fetch student data for induction auth:', error);
  }

  const baseName = String(studentData?.name || fallbackName || '').trim() || email.split('@')[0];
  const { firstName, lastName } = deriveNameParts(baseName);

  return {
    email,
    name: baseName,
    firstName,
    lastName,
    avatar: fallbackAvatar || '',
    rollNo: studentData?.rollNo || '',
    department: studentData?.department || '',
    section: studentData?.section || '',
  };
};

const createInductionToken = async ({ email, name = '', avatar = '' }) => {
  const identity = await resolveInductionIdentity({
    email,
    fallbackName: name,
    fallbackAvatar: avatar,
  });

  const token = jwt.sign(
    {
      email: identity.email,
      name: identity.name,
      firstName: identity.firstName,
      lastName: identity.lastName,
      avatar: identity.avatar,
      rollNo: identity.rollNo,
      department: identity.department,
      section: identity.section,
      purpose: 'induction',
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return { token, identity };
};

// POST /api/induction/auth/send-otp — Send OTP to induction email
router.post('/auth/send-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser?.password) {
      return res.status(409).json({
        success: false,
        message: 'Account already exists for this email. Please sign in with your password.',
      });
    }

    await OTP.deleteMany({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp });

    const emailSent = await sendGlobalEmail({
      to: email,
      from: '"GDG MMMUT" <team@gdg.mmmut.app>',
      subject: 'Your GDG MMMUT Induction Verification Code',
      requireResend: requireResendForOtp,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
          <div style="background:#4285f4;padding:30px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">GDG MMMUT</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Induction Verification</p>
          </div>
          <div style="padding:40px;">
            <p style="color:#202124;font-size:16px;margin:0 0 20px;">Your one-time verification code is:</p>
            <div style="background:#f8f9fa;border:2px solid #4285f4;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4285f4;">${otp}</span>
            </div>
            <p style="color:#5f6368;font-size:14px;margin:0 0 8px;">⏱ This code expires in <strong>2 minutes</strong>.</p>
            <p style="color:#5f6368;font-size:14px;margin:0;">If you did not request this, please ignore this email.</p>
          </div>
          <div style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e8eaed;">
            <p style="color:#9aa0a6;font-size:12px;margin:0;">Google Developer Group — MMMUT Gorakhpur</p>
          </div>
        </div>
      `,
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent to your email. It will expire in 2 minutes.',
    });
  } catch (error) {
    console.error('Induction send-otp error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/induction/auth/verify-otp — Verify induction OTP and issue temporary registration token
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    await OTP.deleteMany({ email });

    const tempToken = jwt.sign(
      { email, purpose: 'induction_register' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      success: true,
      message: 'OTP verified successfully. You can now create your account password.',
      tempToken,
    });
  } catch (error) {
    console.error('Induction verify-otp error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/induction/auth/register — Complete induction account registration
router.post('/auth/register', async (req, res) => {
  try {
    const { tempToken, name, password } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanPassword = String(password || '');

    if (!tempToken || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Registration token and password are required' });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Registration session expired. Please verify OTP again.',
      });
    }

    if (decoded.purpose !== 'induction_register') {
      return res.status(401).json({ success: false, message: 'Invalid registration token' });
    }

    const email = normalizeEmail(decoded.email);

    let user = await User.findOne({ email }).select('+password');
    if (user && user.password) {
      return res.status(409).json({
        success: false,
        message: 'Account already exists for this email. Please sign in instead.',
      });
    }

    if (user) {
      if (cleanName) {
        user.name = cleanName;
      }
      user.password = cleanPassword;
      user.oauthProvider = 'email';
      user.emailVerified = true;
      await user.save();
    } else {
      const identity = await resolveInductionIdentity({ email, fallbackName: cleanName });
      user = await User.create({
        name: cleanName || identity.name,
        email,
        password: cleanPassword,
        oauthProvider: 'email',
        emailVerified: true,
      });
    }

    const mainToken = generateToken(user._id);
    const { token: inductionToken } = await createInductionToken({
      email,
      name: user.name,
      avatar: user.profilePhoto || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now fill your induction form.',
      token: mainToken,
      inductionToken,
    });
  } catch (error) {
    console.error('Induction register error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/induction/auth/login — Sign in with induction email and password
router.post('/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'No induction account found for this email. Please verify OTP and create an account first.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const mainToken = generateToken(user._id);
    const { token: inductionToken } = await createInductionToken({
      email,
      name: user.name,
      avatar: user.profilePhoto || '',
    });

    return res.json({
      success: true,
      message: 'Login successful. Continue with your induction form.',
      token: mainToken,
      inductionToken,
    });
  } catch (error) {
    console.error('Induction login error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/induction/auth/forgot-password/send-otp — Send OTP for induction password reset
router.post('/auth/forgot-password/send-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'No induction account found for this email. Please create an account first.',
      });
    }

    await OTP.deleteMany({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp });

    const emailSent = await sendGlobalEmail({
      to: email,
      from: '"GDG MMMUT" <team@gdg.mmmut.app>',
      subject: 'Your GDG MMMUT Password Reset Code',
      requireResend: requireResendForOtp,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
          <div style="background:#4285f4;padding:30px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">GDG MMMUT</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Password Reset Verification</p>
          </div>
          <div style="padding:40px;">
            <p style="color:#202124;font-size:16px;margin:0 0 20px;">Use this OTP to reset your induction account password:</p>
            <div style="background:#f8f9fa;border:2px solid #4285f4;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4285f4;">${otp}</span>
            </div>
            <p style="color:#5f6368;font-size:14px;margin:0 0 8px;">⏱ This code expires in <strong>2 minutes</strong>.</p>
            <p style="color:#5f6368;font-size:14px;margin:0;">If you did not request this, please ignore this email.</p>
          </div>
          <div style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e8eaed;">
            <p style="color:#9aa0a6;font-size:12px;margin:0;">Google Developer Group — MMMUT Gorakhpur</p>
          </div>
        </div>
      `,
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent to your email. It will expire in 2 minutes.',
    });
  } catch (error) {
    console.error('Induction forgot-password send-otp error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/induction/auth/forgot-password/verify-otp — Verify OTP for password reset
router.post('/auth/forgot-password/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    await OTP.deleteMany({ email });

    const resetToken = jwt.sign(
      { email, purpose: 'induction_reset_password' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      resetToken,
    });
  } catch (error) {
    console.error('Induction forgot-password verify-otp error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/induction/auth/forgot-password/reset — Reset induction account password
router.post('/auth/forgot-password/reset', async (req, res) => {
  try {
    const { resetToken, password } = req.body || {};
    const cleanPassword = String(password || '');

    if (!resetToken || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and password are required' });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Reset session expired. Please verify OTP again.',
      });
    }

    if (decoded.purpose !== 'induction_reset_password') {
      return res.status(401).json({ success: false, message: 'Invalid reset token' });
    }

    const email = normalizeEmail(decoded.email);
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No induction account found for this email. Please create an account first.',
      });
    }

    user.password = cleanPassword;
    user.oauthProvider = 'email';
    user.emailVerified = true;
    user.lastLogin = Date.now();
    await user.save();

    const mainToken = generateToken(user._id);
    const { token: inductionToken } = await createInductionToken({
      email,
      name: user.name,
      avatar: user.profilePhoto || '',
    });

    return res.json({
      success: true,
      message: 'Password reset successful. Continue with your induction form.',
      token: mainToken,
      inductionToken,
    });
  } catch (error) {
    console.error('Induction forgot-password reset error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Register a separate Passport strategy for induction
passport.use('google-induction', new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/induction/auth/google/callback`,
  scope: ['profile', 'email']
}, (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0]?.value || '';
  const domain = email.split('@')[1];

  if (domain !== ALLOWED_DOMAIN) {
    return done(null, false, { message: `Only @${ALLOWED_DOMAIN} emails are allowed.` });
  }

  return done(null, {
    googleId: profile.id,
    email: email,
    name: profile.displayName,
    firstName: profile.name?.givenName || '',
    lastName: profile.name?.familyName || '',
    avatar: profile.photos?.[0]?.value || ''
  });
}));

// GET /api/induction/auth/google — Redirect to Google Sign-In
router.get('/auth/google', (req, res, next) => {
  passport.authenticate('google-induction', {
    scope: ['profile', 'email'],
    hd: ALLOWED_DOMAIN, // Hint to Google to show only @mmmut.ac.in accounts
    prompt: 'select_account'
  })(req, res, next);
});

// GET /api/induction/auth/google/callback — Handle Google callback
router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google-induction', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/induction?error=unauthorized`
  }, async (err, user, info) => {
    if (err || !user) {
      const errorMsg = info?.message || 'Authentication failed. Only @mmmut.ac.in emails are allowed.';
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/induction?error=${encodeURIComponent(errorMsg)}`
      );
    }

    // Try to find the student in our database
    let studentData = null;
    try {
      studentData = await Student.findOne({ email: user.email });
    } catch (dbErr) {
      console.error('Error fetching student data:', dbErr);
    }

    // Use DB name if available, otherwise fallback to Google
    let finalFirstName = user.firstName;
    let finalLastName = user.lastName;
    
    if (studentData?.name) {
      const nameParts = studentData.name.split(' ');
      finalFirstName = nameParts[0];
      finalLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }

    // Generate JWT token for induction access
    const inductionToken = jwt.sign(
      {
        email: user.email,
        name: studentData?.name || user.name,
        firstName: finalFirstName,
        lastName: finalLastName,
        googleId: user.googleId,
        avatar: user.avatar,
        rollNo: studentData?.rollNo || '',
        department: studentData?.department || '',
        section: studentData?.section || '',
        purpose: 'induction'
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Also create/find the user in the main User model for global site auth
    let mainToken = '';
    try {
      let mainUser = await User.findOne({
        $or: [{ googleId: user.googleId }, { email: user.email }]
      });

      if (mainUser) {
        // Update Google ID and profile photo if needed
        let updated = false;
        if (!mainUser.googleId) { mainUser.googleId = user.googleId; updated = true; }
        if (!mainUser.profilePhoto || mainUser.profilePhoto !== user.avatar) {
          mainUser.profilePhoto = user.avatar; updated = true;
        }
        if (updated) await mainUser.save();
      } else {
        // Create new main-app user
        mainUser = await User.create({
          name: studentData?.name || user.name,
          email: user.email,
          profilePhoto: user.avatar,
          googleId: user.googleId,
          oauthProvider: 'google',
          emailVerified: true,
        });
      }

      mainToken = generateToken(mainUser._id);
    } catch (mainErr) {
      console.error('Error creating/finding main user during induction OAuth:', mainErr);
      // Non-fatal — induction still works even if main auth fails
    }

    // Redirect to frontend with both tokens
    const params = new URLSearchParams({ token: inductionToken });
    if (mainToken) params.append('mainToken', mainToken);

    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/induction?${params.toString()}`
    );
  })(req, res, next);
});

// GET /api/induction/auth/verify — Verify induction JWT
router.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== 'induction') {
      return res.status(401).json({ success: false, message: 'Invalid token purpose' });
    }

    res.json({
      success: true,
      user: {
        email: decoded.email,
        name: decoded.name,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        avatar: decoded.avatar,
        rollNo: decoded.rollNo,
        department: decoded.department,
        section: decoded.section
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

export default router;
