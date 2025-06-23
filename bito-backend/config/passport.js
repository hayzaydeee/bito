const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy for email/password authentication
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return done(null, false, { message: 'Account is deactivated' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return done(null, false, { message: 'Invalid email or password' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// JWT Strategy for API authentication
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback-secret'
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId);
    
    if (!user || !user.isActive) {
      return done(null, false);
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findByOAuthId('google', profile.id);
      
      if (user) {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails[0].value;
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.isVerified = true;
        user.lastLogin = new Date();
        
        // Update avatar if not set
        if (!user.avatar && profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      user = await User.createOAuthUser('google', profile);
      return done(null, user);
      
    } catch (error) {
      return done(error, null);
    }
  }));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this GitHub ID
      let user = await User.findByOAuthId('github', profile.id);
      
      if (user) {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
          // Link GitHub account to existing user
          user.githubId = profile.id;
          user.isVerified = true;
          user.lastLogin = new Date();
          
          // Update avatar if not set
          if (!user.avatar && profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          
          await user.save();
          return done(null, user);
        }
      }
      
      // Create new user (only if email is available)
      if (email) {
        user = await User.createOAuthUser('github', profile);
        return done(null, user);
      } else {
        return done(null, false, { message: 'GitHub account must have a public email address' });
      }
      
    } catch (error) {
      return done(error, null);
    }
  }));
}

module.exports = passport;
