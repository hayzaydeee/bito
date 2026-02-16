const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { sendWelcomeEmail } = require('../services/welcomeEmailService');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    user.getJWTPayload(),
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name: name.trim()
    });

    await user.save();

    // Fire-and-forget welcome email
    sendWelcomeEmail(user);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          preferences: user.preferences,
          aiPersonality: user.aiPersonality,
          personalityCustomized: user.personalityCustomized,
          personalityPromptDismissed: user.personalityPromptDismissed,
          onboardingComplete: user.onboardingComplete,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: info.message || 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          preferences: user.preferences,
          aiPersonality: user.aiPersonality,
          personalityCustomized: user.personalityCustomized,
          personalityPromptDismissed: user.personalityPromptDismissed,
          onboardingComplete: user.onboardingComplete,
          lastLogin: user.lastLogin
        }
      }
    });
  })(req, res, next);
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        preferences: req.user.preferences,
        aiPersonality: req.user.aiPersonality,
        personalityCustomized: req.user.personalityCustomized,
        personalityPromptDismissed: req.user.personalityPromptDismissed,
        onboardingComplete: req.user.onboardingComplete,
        isVerified: req.user.isVerified,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    }
  });
});

// @route   PUT /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.put('/refresh', authenticateJWT, (req, res) => {
  try {
    const token = generateToken(req.user);
    
    res.json({
      success: true,
      message: 'Token refreshed',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// OAuth Routes

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/login/success?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_callback_failed`);
    }
  }
);

// @route   GET /api/auth/github
// @desc    GitHub OAuth login
// @access  Public
router.get('/github',
  passport.authenticate('github', {
    scope: ['user:email']
  })
);

// @route   GET /api/auth/github/callback
// @desc    GitHub OAuth callback
// @access  Public
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/login/success?token=${token}`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_callback_failed`);
    }
  }
);

// @route   DELETE /api/auth/oauth/:provider
// @desc    Unlink OAuth provider
// @access  Private
router.delete('/oauth/:provider', authenticateJWT, async (req, res) => {
  try {
    const { provider } = req.params;
    const user = req.user;

    if (!['google', 'github'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OAuth provider'
      });
    }

    // Check if user has password or another OAuth method
    const hasPassword = !!user.password;
    const hasOtherOAuth = (provider === 'google' && user.githubId) || 
                         (provider === 'github' && user.googleId);

    if (!hasPassword && !hasOtherOAuth) {
      return res.status(400).json({
        success: false,
        error: 'Cannot unlink the only authentication method. Please set a password first.'
      });
    }

    // Remove OAuth ID
    user[`${provider}Id`] = undefined;
    await user.save();

    res.json({
      success: true,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`
    });
  } catch (error) {
    console.error('OAuth unlink error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink OAuth account'
    });
  }
});

module.exports = router;
