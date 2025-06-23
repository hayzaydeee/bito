const express = require('express');
const router = express.Router();

// @route   GET /api/test
// @desc    Basic test endpoint (no database required)
// @access  Public
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bito API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me'
      ],
      users: [
        'GET /api/users/profile',
        'PUT /api/users/profile'
      ],
      habits: [
        'GET /api/habits',
        'POST /api/habits'
      ]
    },
    note: 'Database connection required for full functionality'
  });
});

// @route   GET /api/test/ping
// @desc    Simple ping endpoint
// @access  Public
router.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
