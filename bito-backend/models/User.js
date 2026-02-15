const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({  // Basic user information
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId; // Password required only if not OAuth user
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // User profile
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },    // OAuth providers
  googleId: {
    type: String,
    default: null
  },
  githubId: {
    type: String,
    default: null
  },
  
  // Account settings
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Onboarding
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: false
    },
    dailyDigestEmail: {
      type: Boolean,
      default: false
    },
    weekStartsOn: {
      type: Number,
      min: 0,
      max: 6,
      default: 1 // Monday
    }
  },

  // Workspace dashboard sharing permissions
  dashboardSharingPermissions: [{
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    allowedMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isPublicToWorkspace: {
      type: Boolean,
      default: false
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Security
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT payload
userSchema.methods.getJWTPayload = function() {
  return {
    userId: this._id,
    email: this.email,
    name: this.name
  };
};

// Static method to find user by OAuth ID
userSchema.statics.findByOAuthId = function(provider, oauthId) {
  const query = {};
  query[`${provider}Id`] = oauthId;
  return this.findOne(query);
};

// Static method to create OAuth user
userSchema.statics.createOAuthUser = function(provider, profile) {
  const userData = {
    email: profile.emails[0].value,
    name: profile.displayName || profile.username,
    isVerified: true,
    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
  };
  
  userData[`${provider}Id`] = profile.id;
  
  return this.create(userData);
};

module.exports = mongoose.model('User', userSchema);
