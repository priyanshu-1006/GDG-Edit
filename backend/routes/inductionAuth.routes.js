import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { generateToken } from '../utils/auth.utils.js';

const router = express.Router();

// Use the main Google OAuth credentials for induction as well
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ALLOWED_DOMAIN = 'mmmut.ac.in';

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
