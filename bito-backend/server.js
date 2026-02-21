require('dotenv').config();
require('express-async-errors');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

// Import configurations
require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const habitRoutes = require('./routes/habits');
const workspaceRoutes = require('./routes/workspaces');
const encouragementRoutes = require('./routes/encouragements');
const journalRoutes = require('./routes/journal');
const journalV2Routes = require('./routes/journalV2');
const templateRoutes = require('./routes/templates');
const insightsRoutes = require('./routes/insights');
const notificationRoutes = require('./routes/notifications');
const challengeRoutes = require('./routes/challenges');
const transformerRoutes = require('./routes/transformers');
const testRoutes = require('./routes/test');

// Import services
const reminderService = require('./services/reminderService');
const weeklyReportService = require('./services/weeklyReportService');
const challengeService = require('./services/challengeService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  permissionsPolicy: {
    features: {
      geolocation: ["'self'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      // Explicitly exclude browsing-topics (deprecated feature)
      // This prevents the "Unrecognized feature" error
    }
  }
}));
app.use(compression());

// Rate limiting (only in production)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for testing
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for OPTIONS requests (CORS preflight)
      if (req.method === 'OPTIONS') return true;
      // Skip rate limiting for auth endpoints to avoid login issues
      if (req.path.startsWith('/api/auth/')) return true;
      return false;
    }
  });
  app.use('/api/', limiter);
  console.log('Rate limiting enabled for production');
} else {
  console.log('Rate limiting disabled for development');
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server (default)
  'http://localhost:5174', // Vite dev server (alternative)
  'http://localhost:3000', // Alternative dev server
  'http://localhost:4173', // Vite preview server
  'https://bito.works',    // Production
  // Add your public domain here if needed
  // 'https://your-domain.com',
];

// Add FRONTEND_URL if it's set and not already included
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Support multiple frontend URLs via comma-separated FRONTEND_URLS
if (process.env.FRONTEND_URLS) {
  const additionalUrls = process.env.FRONTEND_URLS.split(',').map(url => url.trim());
  additionalUrls.forEach(url => {
    if (url && !allowedOrigins.includes(url)) {
      allowedOrigins.push(url);
    }
  });
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log(`✅ Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/bito-db',
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/encouragements', encouragementRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/journal-v2', journalV2Routes);
app.use('/api/templates', templateRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', challengeRoutes);
app.use('/api/transformers', transformerRoutes);
// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Bito API v1.0.0',
    documentation: 'Available endpoints:',
    endpoints: {
      auth: [
        'POST /api/auth/magic-link',
        'POST /api/auth/magic-link/verify',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'GET /api/auth/google'
      ],
      users: [
        'GET /api/users/profile',
        'PUT /api/users/profile',
        'DELETE /api/users/account'
      ],
      habits: [
        'GET /api/habits',
        'POST /api/habits',
        'PUT /api/habits/:id',
        'DELETE /api/habits/:id',
        'POST /api/habits/:id/check',
        'GET /api/habits/stats'
      ]
    }
  });
});

// Catch-all for undefined routes
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bito-db', {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.log('Server will start without database connection. Please ensure MongoDB is running.');
    return false;
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection:', err.message);
  // Don't exit the process, just log the error
});

// Start server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Start the server first, then try to connect to database
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API documentation: http://localhost:${PORT}/api`);
  });

  // Try to connect to database after server starts
  connectDB().then((connected) => {
    if (!connected) {
      console.log('\n⚠️  WARNING: MongoDB is not connected!');
      console.log('   To use all features, please:');
      console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
      console.log('   2. Start MongoDB service');
      console.log('   3. Restart this server');
      console.log('   OR use MongoDB Atlas cloud database');
    } else {
      console.log('\n✅ Database connected successfully!');
      console.log('   You can now use all API features.');

      // Start cron jobs after DB is connected
      reminderService.start();
      weeklyReportService.start();
      challengeService.start();
    }
  });

  // Handle MongoDB connection errors after initial connection
  mongoose.connection.on('error', (err) => {
    console.error('Database connection lost:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Database disconnected');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close();
        console.log('Database connection closed.');
      } catch (err) {
        console.error('Error closing database connection:', err.message);
      }
      process.exit(0);
    });
  });
}

module.exports = app;
