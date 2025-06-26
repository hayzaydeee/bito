const mongoose = require('mongoose');

const memberHabitSchema = new mongoose.Schema({
  // References
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workspaceHabitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceHabit',
    required: true
  },
  
  // Personal customizations (overrides workspace defaults)
  personalSettings: {
    // Custom name (if different from workspace habit)
    customName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    
    // Personal target (overrides workspace default)
    target: {
      value: Number,
      unit: String,
      customUnit: String
    },
    
    // Personal schedule
    schedule: {
      days: [Number], // 0-6, Sunday to Saturday
      reminderTime: String,
      reminderEnabled: {
        type: Boolean,
        default: false
      }
    },
    
    // Privacy settings
    shareProgress: {
      type: String,
      enum: ['full', 'progress-only', 'streaks-only', 'private'],
      default: 'progress-only'
    },
    shareInActivity: {
      type: Boolean,
      default: true // Show completions in workspace activity feed
    }
  },
  
  // Tracking state
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  totalCompletions: {
    type: Number,
    default: 0
  },
  lastCompletedAt: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  pausedUntil: Date,
  
  // Workspace interaction
  adoptedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  
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
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes
memberHabitSchema.index({ workspaceId: 1, userId: 1 });
memberHabitSchema.index({ userId: 1, isActive: 1 });
memberHabitSchema.index({ workspaceHabitId: 1, isActive: 1 });

// Virtual properties
memberHabitSchema.virtual('effectiveName').get(function() {
  return this.personalSettings.customName || this.workspaceHabit?.name || 'Unnamed Habit';
});

memberHabitSchema.virtual('completionRate').get(function() {
  // Calculate completion rate based on days since adoption
  const daysSinceAdoption = Math.ceil((Date.now() - this.adoptedAt) / (1000 * 60 * 60 * 24));
  return daysSinceAdoption > 0 ? (this.totalCompletions / daysSinceAdoption) * 100 : 0;
});

// Methods
memberHabitSchema.methods.getVisibleData = function(viewerRole = 'member') {
  const baseData = {
    _id: this._id,
    workspaceId: this.workspaceId,
    userId: this.userId,
    workspaceHabitId: this.workspaceHabitId,
    isActive: this.isActive,
    adoptedAt: this.adoptedAt
  };
  
  // Privacy controls
  const shareLevel = this.personalSettings.shareProgress;
  
  switch (shareLevel) {
    case 'full':
      return {
        ...baseData,
        personalSettings: this.personalSettings,
        currentStreak: this.currentStreak,
        longestStreak: this.longestStreak,
        totalCompletions: this.totalCompletions,
        lastCompletedAt: this.lastCompletedAt,
        completionRate: this.completionRate
      };
      
    case 'progress-only':
      return {
        ...baseData,
        currentStreak: this.currentStreak,
        totalCompletions: this.totalCompletions,
        completionRate: this.completionRate
      };
      
    case 'streaks-only':
      return {
        ...baseData,
        currentStreak: this.currentStreak,
        longestStreak: this.longestStreak
      };
      
    case 'private':
    default:
      // Only basic info for private habits
      return viewerRole === 'owner' ? this.toObject() : baseData;
  }
};

memberHabitSchema.methods.updateStreak = function(completed, date = new Date()) {
  if (completed) {
    this.currentStreak += 1;
    this.totalCompletions += 1;
    this.lastCompletedAt = date;
    
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else {
    this.currentStreak = 0;
  }
  
  return this.save();
};

// Static methods
memberHabitSchema.statics.findByUserAndWorkspace = function(userId, workspaceId) {
  return this.find({
    userId,
    workspaceId,
    isActive: true
  })
  .populate('workspaceHabitId')
  .sort({ adoptedAt: -1 });
};

memberHabitSchema.statics.getWorkspaceLeaderboard = function(workspaceId, metric = 'currentStreak', limit = 10) {
  const sortField = {};
  sortField[metric] = -1;
  
  return this.find({
    workspaceId,
    isActive: true,
    'personalSettings.shareProgress': { $ne: 'private' }
  })
  .populate('userId', 'name avatar')
  .populate('workspaceHabitId', 'name icon')
  .sort(sortField)
  .limit(limit);
};

memberHabitSchema.statics.getWorkspaceStats = function(workspaceId) {
  return this.aggregate([
    { $match: { workspaceId: mongoose.Types.ObjectId(workspaceId), isActive: true } },
    {
      $group: {
        _id: '$workspaceId',
        totalHabits: { $sum: 1 },
        totalCompletions: { $sum: '$totalCompletions' },
        avgStreak: { $avg: '$currentStreak' },
        activeMembers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        totalHabits: 1,
        totalCompletions: 1,
        avgStreak: { $round: ['$avgStreak', 1] },
        activeMemberCount: { $size: '$activeMembers' }
      }
    }
  ]);
};

module.exports = mongoose.model('MemberHabit', memberHabitSchema);
