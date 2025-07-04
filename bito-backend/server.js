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
const testRoutes = require('./routes/test');
// Temporarily disabled CSV functionality for deployment
// const csvAnalysisRoutes = require('./routes/csvAnalysis');
// const csvRoutes = require('./routes/csv');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
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
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative dev server
  'https://bito.works',    // Production
];

// Add FRONTEND_URL if it's set and not already included
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Simple test endpoint
app.get('/test-endpoint', (req, res) => {
  console.log('Test endpoint hit at:', new Date().toISOString());
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Debug endpoint for workspace data - TEMPORARY
app.get('/debug-workspace-data', async (req, res) => {
  try {
    const Workspace = require('./models/Workspace');
    const workspaces = await Workspace.find({});
    const debugData = workspaces.map(workspace => ({
      id: workspace._id,
      name: workspace.name,
      members: workspace.members.map(member => ({
        userId: member.userId,
        userIdType: typeof member.userId,
        userIdLength: member.userId ? member.userId.length : 0,
        role: member.role,
        status: member.status,
        isStringified: typeof member.userId === 'string' && member.userId.includes('{') && member.userId.includes('_id:')
      }))
    }));
    res.json({ workspaces: debugData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direct database fix for corrupted userId fields - TEMPORARY
app.post('/fix-workspace-members-direct', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    // Find workspaces with corrupted userId data
    const workspaces = await db.collection('workspaces').find({}).toArray();
    let fixedCount = 0;
    
    for (const workspace of workspaces) {
      let needsUpdate = false;
      
      if (workspace.members) {
        for (const member of workspace.members) {
          // Check if userId is a stringified object containing _id
          if (typeof member.userId === 'string' && member.userId.includes('_id: new ObjectId(')) {
            // Extract the actual ObjectId from the stringified object
            const match = member.userId.match(/_id: new ObjectId\('([^']+)'\)/);
            if (match && match[1]) {
              console.log(`Fixing corrupted userId: ${member.userId} -> ${match[1]}`);
              member.userId = new mongoose.Types.ObjectId(match[1]);
              needsUpdate = true;
              fixedCount++;
            }
          }
        }
      }
      
      if (needsUpdate) {
        await db.collection('workspaces').updateOne(
          { _id: workspace._id },
          { $set: { members: workspace.members } }
        );
        console.log(`Updated workspace: ${workspace.name}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Fixed ${fixedCount} member userId fields directly`,
      fixedCount 
    });
  } catch (error) {
    console.error('Fix error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test membership endpoint - TEMPORARY
app.get('/test-membership/:workspaceId/:userId', async (req, res) => {
  try {
    const Workspace = require('./models/Workspace');
    const { workspaceId, userId } = req.params;
    
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.json({ error: 'Workspace not found' });
    }
    
    const member = workspace.members.find(m => m.userId.toString() === userId.toString());
    const isMemberResult = workspace.isMember(userId);
    
    res.json({
      workspaceId,
      userId,
      userIdType: typeof userId,
      member: member ? {
        userId: member.userId,
        userIdType: typeof member.userId,
        userIdString: member.userId.toString(),
        role: member.role,
        status: member.status
      } : null,
      isMemberResult,
      comparison: workspace.members.map(m => ({
        storedUserId: m.userId.toString(),
        providedUserId: userId.toString(),
        matches: m.userId.toString() === userId.toString(),
        status: m.status
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Raw database inspection - TEMPORARY
app.get('/inspect-workspace-raw/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const workspace = await db.collection('workspaces').findOne({ 
      _id: new mongoose.Types.ObjectId(req.params.id) 
    });
    
    res.json({ 
      workspace: workspace,
      members: workspace?.members?.map(member => ({
        userId: member.userId,
        userIdType: typeof member.userId,
        userIdValue: JSON.stringify(member.userId),
        role: member.role,
        status: member.status
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API routes
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/encouragements', encouragementRoutes);
// Temporarily disabled CSV functionality for deployment
// app.use('/api/csv-analysis', csvAnalysisRoutes);
// app.use('/api/csv', csvRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Bito API v1.0.0',
    documentation: 'Available endpoints:',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'GET /api/auth/google',
        'GET /api/auth/github'
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
      // Temporarily disabled CSV functionality for deployment
      // 'csv-analysis': [
      //   'POST /api/csv-analysis/analyze',
      //   'GET /api/csv-analysis/results'
      // ]
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
