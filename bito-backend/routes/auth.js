const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { validateMagicLinkRequest, validateMagicLinkVerify } = require('../middleware/validation');
const { sendWelcomeEmail } = require('../services/welcomeEmailService');
const emailService = require('../services/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    user.getJWTPayload(),
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Simple in-memory rate limiter for magic link requests
const magicLinkAttempts = new Map();
const MAGIC_LINK_RATE_LIMIT = 5;       // max requests
const MAGIC_LINK_RATE_WINDOW = 15 * 60 * 1000; // per 15 minutes

function checkMagicLinkRateLimit(email) {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = magicLinkAttempts.get(key);

  if (!record || now - record.windowStart > MAGIC_LINK_RATE_WINDOW) {
    magicLinkAttempts.set(key, { windowStart: now, count: 1 });
    return true;
  }

  if (record.count >= MAGIC_LINK_RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// @route   POST /api/auth/magic-link
// @desc    Send a magic link to the user's email (login or signup)
// @access  Public
router.post('/magic-link', validateMagicLinkRequest, async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit per email
    if (!checkMagicLinkRateLimit(normalizedEmail)) {
      return res.status(429).json({
        success: false,
        error: 'Too many sign-in requests. Please wait a few minutes before trying again.'
      });
    }

    // Always respond with the same message to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If this email is associated with an account, a sign-in link has been sent.'
    };

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Auto-create account for new users (profile fields filled in later)
      user = new User({
        email: normalizedEmail,
      });
      await user.save({ validateBeforeSave: false });

      // Fire-and-forget welcome email
      sendWelcomeEmail(user);
    }

    if (!user.isActive) {
      // Don't reveal that the account is deactivated
      return res.json(successResponse);
    }

    // Generate magic link token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.magicLinkToken = hashedToken;
    user.magicLinkExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Build magic link URL
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLinkUrl = `${frontendUrl.replace('://www.', '://')}/auth/verify?token=${rawToken}`;

    // Send email
    try {
      await emailService.sendMagicLinkEmail(user, magicLinkUrl);
    } catch (emailError) {
      console.error('Failed to send magic link email:', emailError);
      // Clear the token if email fails
      user.magicLinkToken = undefined;
      user.magicLinkExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: 'Failed to send sign-in email. Please try again later.'
      });
    }

    res.json(successResponse);
  } catch (error) {
    console.error('Magic link error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again later.'
    });
  }
});

// @route   POST /api/auth/magic-link/verify
// @desc    Verify a magic link token and authenticate the user
// @access  Public
router.post('/magic-link/verify', validateMagicLinkVerify, async (req, res) => {
  try {
    const { token } = req.body;

    // Hash the token from the URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      magicLinkToken: hashedToken,
      magicLinkExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Sign-in link is invalid or has expired'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Determine if this is a brand-new user (never logged in before)
    const isNewUser = !user.lastLogin;

    // Clear magic link token (one-time use)
    user.magicLinkToken = undefined;
    user.magicLinkExpires = undefined;
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT
    const jwtToken = generateToken(user);

    res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        token: jwtToken,
        isNewUser,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar,
          preferences: user.preferences,
          aiPersonality: user.aiPersonality,
          personalityCustomized: user.personalityCustomized,
          personalityPromptDismissed: user.personalityPromptDismissed,
          onboardingComplete: user.onboardingComplete,
          profileComplete: user.profileComplete,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Magic link verify error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again later.'
    });
  }
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
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        username: req.user.username,
        avatar: req.user.avatar,
        preferences: req.user.preferences,
        aiPersonality: req.user.aiPersonality,
        personalityCustomized: req.user.personalityCustomized,
        personalityPromptDismissed: req.user.personalityPromptDismissed,
        onboardingComplete: req.user.onboardingComplete,
        profileComplete: req.user.profileComplete,
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
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ success: false, error: 'Google OAuth is not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
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

    if (provider !== 'google') {
      return res.status(400).json({
        success: false,
        error: 'Invalid OAuth provider'
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
