const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    if (!user) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    User.findById(decoded.userId)
      .then(user => {
        if (user && user.isActive) {
          req.user = user;
        }
        next();
      })
      .catch(() => next());
  } catch (error) {
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
