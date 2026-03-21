const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/securityConfig');
const { securityLogger } = require('../utils/securityLogger');

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      securityLogger.append({
        type: 'auth_failure',
        details: {
          action_taken: 'blocked',
          surface: 'api',
          reason: 'jwt_auth_error',
          path: req.originalUrl,
        },
      });
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    if (!user) {
      securityLogger.append({
        type: 'auth_failure',
        details: {
          action_taken: 'blocked',
          surface: 'api',
          reason: 'jwt_user_not_found',
          path: req.originalUrl,
          info: info?.message,
        },
      });
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional JWT Authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    User.findById(decoded.userId)
      .then(user => {
        if (user && user.isActive) {
          req.user = user;
        }
        next();
      })
      .catch(() => next());
  } catch (error) {
    securityLogger.append({
      type: 'auth_failure',
      details: {
        action_taken: 'blocked',
        surface: 'api',
        reason: 'optional_jwt_invalid',
        path: req.originalUrl,
      },
    });
    next();
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Rate limiting for sensitive operations
const sensitiveOpLimit = (req, res, next) => {
  // Additional rate limiting could be implemented here
  // For now, just pass through
  next();
};

// Validate user ownership of resource
const validateOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params.userId || req.body[resourceField] || req.resource?.[resourceField];
    
    if (!resourceUserId) {
      return res.status(400).json({ error: 'Resource user ID not found' });
    }
    
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
    }
    
    next();
  };
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  requireAdmin,
  sensitiveOpLimit,
  validateOwnership
};
