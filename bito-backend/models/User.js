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
  firstName: {
    type: String,
    trim: true,
    maxlength: [30, 'First name cannot exceed 30 characters'],
    default: null
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [30, 'Last name cannot exceed 30 characters'],
    default: null
  },
  username: {
    type: String,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    default: null
  },
  // Computed from firstName + lastName (auto-set via pre-save hook)
  name: {
    type: String,
    trim: true,
    maxlength: [61, 'Name cannot exceed 61 characters']
  },
  // Whether the user has completed their profile setup (firstName, lastName, username)
  profileComplete: {
    type: Boolean,
    default: false
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
      enum: ['light', 'dark', 'auto', 'bw'],
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
    journalDefaultView: {
      type: String,
      enum: ['day', 'list', 'feed'],
      default: 'day'
    },
    scale: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'small'
    },
    aiDashboard: {
      type: Boolean,
      default: true
    },
    aiAnalytics: {
      type: Boolean,
      default: true
    },

    // Journal AI privacy tiers (all off by default — opt-in via tour)
    journalAI: {
      // Tier 1: Pattern detection from mood/tags only (no content reading)
      insightNudges: {
        type: Boolean,
        default: false
      },
      // Tier 2: AI reads plain text to surface themes and correlations
      contentAnalysis: {
        type: Boolean,
        default: false
      },
      // Tier 3: AI generates weekly narrative summaries from journal content
      weeklySummaries: {
        type: Boolean,
        default: false
      },
      // Whether user has completed the Journal Intelligence tour
      tourCompleted: {
        type: Boolean,
        default: false
      },
      // Whether the first-week nudge has been dismissed
      nudgeDismissed: {
        type: Boolean,
        default: false
      }
    }
  },

  // Timestamp of when the user last marked notifications as read
  lastReadNotificationsAt: {
    type: Date,
    default: null // null = never read; treat all notifications as unread
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
  
  // Subscription & billing (v2)
  // Embedded for fast lookups — every feature gate reads this.
  // All existing users default to 'free' / 'active'.
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'team'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'cancelled', 'expired'],
      default: 'active'
    },
    provider: {
      type: String,
      enum: ['stripe', 'apple', 'google', null],
      default: null
    },
    providerId: { type: String, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    trialEnd: { type: Date, default: null },
    trialUsed: { type: Boolean, default: false },

    // Cached limits (computed from plan via PLAN_LIMITS constant).
    // Services read this instead of computing from the plan string.
    // NOTE: Limits raised to unblock testing — restore before launch.
    limits: {
      maxHabits: { type: Number, default: 999 },
      maxActiveTransformers: { type: Number, default: 999 },
      maxGenerationsPerMonth: { type: Number, default: 999 },
      maxWorkspacesJoined: { type: Number, default: 999 },
      maxWorkspacesCreated: { type: Number, default: 999 },
      maxWorkspaceMembers: { type: Number, default: 999 },
      historyRetentionDays: { type: Number, default: 36500 }
    },

    // Usage counters (reset monthly)
    usage: {
      generationsThisMonth: { type: Number, default: 0 },
      generationsResetAt: { type: Date, default: null }
    }
  },

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

// Pre-save hook: compute name from firstName + lastName
userSchema.pre('save', function(next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(' ') || null;
  }
  next();
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });

// Instance method to generate JWT payload
userSchema.methods.getJWTPayload = function() {
  return {
    userId: this._id,
    email: this.email,
    name: this.name,
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username
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
  const displayName = profile.displayName || profile.username || '';
  const nameParts = displayName.split(' ');
  const userData = {
    email: profile.emails[0].value,
    firstName: nameParts[0] || null,
    lastName: nameParts.slice(1).join(' ') || null,
    name: displayName, // will be recomputed by pre-save hook
    isVerified: true,
    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
  };
  
  userData[`${provider}Id`] = profile.id;
  
  return this.create(userData);
};

module.exports = mongoose.model('User', userSchema);
