const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({  // Basic user information
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
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

  // Onboarding data (persisted for personality derivation)
  onboardingData: {
    goals: [{
      type: String,
      enum: ['health', 'productivity', 'mindfulness', 'learning', 'social', 'creative']
    }],
    capacity: {
      type: String,
      enum: ['light', 'balanced', 'full']
    },
    preferredTimes: [{
      type: String,
      enum: ['morning', 'afternoon', 'evening']
    }]
  },

  // AI Personality — how Bito communicates with this user
  aiPersonality: {
    tone: {
      type: String,
      enum: ['warm', 'direct', 'playful', 'neutral'],
      default: 'warm'
    },
    focus: {
      type: String,
      enum: ['wins', 'patterns', 'actionable', 'balanced'],
      default: 'balanced'
    },
    verbosity: {
      type: String,
      enum: ['concise', 'detailed'],
      default: 'concise'
    },
    accountability: {
      type: String,
      enum: ['gentle', 'honest', 'tough'],
      default: 'gentle'
    }
  },

  // Personality system flags
  personalityCustomized: {
    type: Boolean,
    default: false
  },
  personalityPromptDismissed: {
    type: Boolean,
    default: false
  },

  // Kickstart insights (generated once at onboarding, served until data matures)
  kickstartInsights: {
    summary: { type: String },
    insights: [{
      title: { type: String },
      body: { type: String },
      icon: { type: String },
      category: { type: String },
    }],
    generatedAt: { type: Date },
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
    },
    scale: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'small'
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
  // Magic link authentication
  magicLinkToken: String,
  magicLinkExpires: Date,
  
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
      delete ret.magicLinkToken;
      delete ret.magicLinkExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ createdAt: -1 });

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
