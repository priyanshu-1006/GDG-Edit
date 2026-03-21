import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Debug OAuth credentials
console.log('🔍 Checking OAuth credentials...');
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('GitHub Client ID:', process.env.GITHUB_CLIENT_ID ? 'Present' : 'Missing');
console.log('GitHub Client Secret:', process.env.GITHUB_CLIENT_SECRET ? 'Present' : 'Missing');

// Google OAuth Strategy (only configure if credentials are provided)
if (
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID.trim() !== 'your-google-client-id'
) {
  console.log('✅ Configuring Google OAuth Strategy');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
  passport.use('google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const primaryEmail = profile.emails?.[0]?.value;
          if (!primaryEmail) {
            return done(new Error('Google account email not available'), null);
          }

          console.log('Google OAuth callback received for:', primaryEmail);
          // Check if user already exists
          let user = await User.findOne({ 
            $or: [
              { googleId: profile.id },
              { email: primaryEmail }
            ]
          });

          if (user) {
            // Update Google ID and profile photo if not set or changed
            let updated = false;
            if (!user.googleId) {
              user.googleId = profile.id;
              updated = true;
            }
            if (!user.profilePhoto || user.profilePhoto !== profile.photos[0]?.value) {
              user.profilePhoto = profile.photos[0]?.value;
              updated = true;
            }
            if (updated) {
              await user.save();
            }
            console.log('✅ Existing user logged in via Google:', user.email);
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: primaryEmail,
            profilePhoto: profile.photos[0]?.value,
            googleId: profile.id,
            oauthProvider: 'google',
            emailVerified: true,
          });

          console.log('✅ New user created via Google:', user.email);
          done(null, user);
        } catch (error) {
          console.error('❌ Google OAuth error:', error);
          done(error, null);
        }
      }
    )
  );
} else {
  console.log('⚠️ Google OAuth not configured - missing or invalid credentials');
}

// GitHub OAuth Strategy (only configure if credentials are provided)
if (
  process.env.GITHUB_CLIENT_ID && 
  process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_CLIENT_ID !== 'your-github-client-id'
) {
  console.log('✅ Configuring GitHub OAuth Strategy');
  passport.use('github',
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;

          // Check if user already exists
          let user = await User.findOne({ 
            $or: [
              { githubId: profile.id },
              { email: email }
            ]
          });

          if (user) {
            // Update GitHub ID and profile photo if not set or changed
            let updated = false;
            if (!user.githubId) {
              user.githubId = profile.id;
              updated = true;
            }
            if (!user.profilePhoto || user.profilePhoto !== profile.photos[0]?.value) {
              user.profilePhoto = profile.photos[0]?.value;
              updated = true;
            }
            if (updated) {
              await user.save();
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName || profile.username,
            email: email,
            profilePhoto: profile.photos[0]?.value,
            githubId: profile.id,
            oauthProvider: 'github',
            emailVerified: true,
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
} else {
  console.log('⚠️ GitHub OAuth not configured - missing or invalid credentials');
}

export default passport;
