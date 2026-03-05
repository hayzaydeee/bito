const mongoose = require('mongoose');

const memberHabitSchema = new mongoose.Schema({
  // References
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  groupHabitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupHabit',
    required: true
  },
  
  // Personal customizations (overrides group defaults)
  personalSettings: {
    // Custom name (if different from group habit)
    customName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    
    // Personal target (overrides group default)
    target: {
      value: Number,
      unit: String,
      customUnit: String
    },

    // Personal weekly target (overrides group default for weekly habits)
    weeklyTarget: {
      type: Number,
      min: 1,
      max: 7,
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
      default: true // Show completions in group activity feed
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
  
  // Group interaction
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
memberHabitSchema.index({ groupId: 1, userId: 1 });
memberHabitSchema.index({ userId: 1, isActive: 1 });
memberHabitSchema.index({ groupHabitId: 1, isActive: 1 });

// Virtual properties
memberHabitSchema.virtual('effectiveName').get(function() {
  return this.personalSettings.customName || this.groupHabit?.name || 'Unnamed Habit';
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
    groupId: this.groupId,
    userId: this.userId,
    groupHabitId: this.groupHabitId,
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
memberHabitSchema.statics.findByUserAndGroup = function(userId, groupId) {
  return this.find({
    userId,
    groupId,
    isActive: true
  })
  .populate('groupHabitId')
  .sort({ adoptedAt: -1 });
};

memberHabitSchema.statics.getGroupLeaderboard = function(groupId, metric = 'currentStreak', limit = 10) {
  const sortField = {};
  sortField[metric] = -1;
  
  return this.find({
    groupId,
    isActive: true,
    'personalSettings.shareProgress': { $ne: 'private' }
  })
  .populate('userId', 'name avatar')
  .populate('groupHabitId', 'name icon')
  .sort(sortField)
  .limit(limit);
};

memberHabitSchema.statics.getGroupStats = function(groupId) {
  return this.aggregate([
    { $match: { groupId: new mongoose.Types.ObjectId(groupId), isActive: true } },
    {
      $group: {
        _id: '$groupId',
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
