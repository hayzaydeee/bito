const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  // Basic habit information
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [100, 'Habit name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Workspace adoption tracking
  source: {
    type: String,
    enum: ['personal', 'workspace'],
    default: 'personal'
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: function() {
      return this.source === 'workspace';
    }
  },
  workspaceHabitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceHabit',
    required: function() {
      return this.source === 'workspace';
    }
  },
  adoptedAt: {
    type: Date,
    required: function() {
      return this.source === 'workspace';
    }
  },
  
  // Workspace privacy settings (only for workspace-sourced habits)
  workspaceSettings: {
    shareProgress: {
      type: String,
      enum: ['full', 'progress-only', 'streaks-only', 'private'],
      default: 'progress-only'
    },
    allowInteraction: {
      type: Boolean,
      default: false // Allow other members to mark completions
    },
    shareInActivity: {
      type: Boolean,
      default: true // Show completions in workspace activity feed
    }
  },
  
  // Habit configuration
  category: {
    type: String,
    enum: ['health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social', 'creative', 'other'],
    default: 'other'
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: '🎯'
  },
  
  // Tracking settings
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  // Weekly target: number of days per week to complete (only used when frequency === 'weekly')
  weeklyTarget: {
    type: Number,
    default: 3,
    min: 1,
    max: 7
  },
  target: {
    value: {
      type: Number,
      default: 1,
      min: 1
    },
    unit: {
      type: String,
      enum: ['times', 'minutes', 'hours', 'pages', 'miles', 'calories', 'glasses', 'custom'],
      default: 'times'
    },
    customUnit: {
      type: String,
      maxlength: 20
    }
  },
  
  // Scheduling
  schedule: {
    days: [{
      type: Number,
      min: 0,
      max: 6
    }], // 0 = Sunday, 1 = Monday, etc.
    reminderTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    reminderEnabled: {
      type: Boolean,
      default: false
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Statistics cache (updated periodically)
  stats: {
    totalChecks: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastChecked: {
      type: Date,
      default: null
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
habitSchema.index({ userId: 1, createdAt: -1 });
habitSchema.index({ userId: 1, isActive: 1 });
habitSchema.index({ userId: 1, category: 1 });
habitSchema.index({ userId: 1, isArchived: 1 });
// Workspace-related indexes
habitSchema.index({ workspaceId: 1, source: 1 });
habitSchema.index({ workspaceHabitId: 1 });
habitSchema.index({ userId: 1, workspaceId: 1, source: 1 });
habitSchema.index({ source: 1, isActive: 1 });

// Virtual for habit entries
habitSchema.virtual('entries', {
  ref: 'HabitEntry',
  localField: '_id',
  foreignField: 'habitId'
});

// Helper: get Monday 00:00 UTC for the week containing a given date
function getWeekStartUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? 6 : day - 1); // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

// Helper: get Sunday 23:59:59 UTC for the week containing a given date
function getWeekEndUTC(weekStart) {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// Instance methods
habitSchema.methods.updateStats = async function() {
  const HabitEntry = mongoose.model('HabitEntry');
  
  // Get all entries for this habit
  const entries = await HabitEntry.find({ habitId: this._id }).sort({ date: 1 });
  
  // Calculate total checks
  this.stats.totalChecks = entries.reduce((sum, entry) => sum + entry.value, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.frequency === 'weekly') {
    // ── Weekly habit streak logic ──
    // Streak = consecutive weeks where completed entries >= weeklyTarget
    const target = this.weeklyTarget || 3;
    const completedEntries = entries.filter(e => e.completed);

    // Group completed entries by week (Mon-Sun)
    const weekMap = new Map(); // weekStartStr -> count
    completedEntries.forEach(entry => {
      const ws = getWeekStartUTC(entry.date);
      const key = ws.toISOString().split('T')[0];
      weekMap.set(key, (weekMap.get(key) || 0) + 1);
    });

    // Build sorted list of week-start dates
    const weekKeys = Array.from(weekMap.keys()).sort();

    // Current streak: walk backward from current week
    let currentStreak = 0;
    const currentWeekStart = getWeekStartUTC(today);
    const cursor = new Date(currentWeekStart);

    // Check current week (in-progress)
    const currentWeekKey = cursor.toISOString().split('T')[0];
    const currentWeekCount = weekMap.get(currentWeekKey) || 0;
    const currentWeekMet = currentWeekCount >= target;

    if (currentWeekMet) {
      currentStreak = 1;
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    } else {
      // Current week not met yet — check if previous week was met to continue streak
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    }

    // Walk backward through previous weeks
    for (let i = 0; i < 520; i++) { // ~10 years max
      const key = cursor.toISOString().split('T')[0];
      const count = weekMap.get(key) || 0;
      // Don't count weeks before habit was created
      if (cursor < this.createdAt) break;
      if (count >= target) {
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 7);
      } else {
        break;
      }
    }

    this.stats.currentStreak = currentStreak;

    // Longest streak: scan all weeks from creation to now
    let longestStreak = 0;
    let tempStreak = 0;
    const scanCursor = getWeekStartUTC(this.createdAt);
    const nowWeekStart = getWeekStartUTC(today);

    while (scanCursor <= nowWeekStart) {
      const key = scanCursor.toISOString().split('T')[0];
      const count = weekMap.get(key) || 0;
      if (count >= target) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
      scanCursor.setUTCDate(scanCursor.getUTCDate() + 7);
    }

    this.stats.longestStreak = longestStreak;

    // Completion rate: weeks met / total weeks in last ~30 days (4 weeks)
    const fourWeeksAgo = new Date(currentWeekStart);
    fourWeeksAgo.setUTCDate(fourWeeksAgo.getUTCDate() - 21); // 3 previous weeks + current = 4
    let weeksMet = 0;
    let totalWeeks = 0;
    const rateCursor = new Date(fourWeeksAgo);
    while (rateCursor <= currentWeekStart) {
      if (rateCursor >= this.createdAt) {
        totalWeeks++;
        const key = rateCursor.toISOString().split('T')[0];
        if ((weekMap.get(key) || 0) >= target) weeksMet++;
      }
      rateCursor.setUTCDate(rateCursor.getUTCDate() + 7);
    }
    this.stats.completionRate = totalWeeks > 0 ? Math.round((weeksMet / totalWeeks) * 100) : 0;

  } else {
    // ── Daily habit streak logic (original) ──
    let currentStreak = 0;
    
    for (let i = entries.length - 1; i >= 0; i--) {
      const entryDate = new Date(entries[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak && entries[i].completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    this.stats.currentStreak = currentStreak;
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    
    entries.forEach(entry => {
      if (entry.completed) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });
    
    this.stats.longestStreak = longestStreak;

    // Completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntries = entries.filter(entry => entry.date >= thirtyDaysAgo);
    const completedCount = recentEntries.filter(entry => entry.completed).length;
    const totalDays = Math.min(30, Math.ceil((today - this.createdAt) / (1000 * 60 * 60 * 24)));
    
    this.stats.completionRate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  }
  
  // Last checked date (shared)
  const sortedDesc = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCompletedEntry = sortedDesc.find(entry => entry.completed);
  this.stats.lastChecked = lastCompletedEntry ? lastCompletedEntry.date : null;
  
  await this.save();
};

// Workspace-specific methods
habitSchema.methods.isWorkspaceHabit = function() {
  return this.source === 'workspace';
};

habitSchema.methods.getVisibleDataForWorkspace = function(viewerRole = 'member', viewerId = null) {
  // Return data based on privacy settings for workspace viewing
  const baseData = {
    _id: this._id,
    name: this.name,
    description: this.description,
    category: this.category,
    color: this.color,
    icon: this.icon,
    userId: this.userId,
    workspaceId: this.workspaceId,
    workspaceHabitId: this.workspaceHabitId,
    isActive: this.isActive,
    adoptedAt: this.adoptedAt,
    createdAt: this.createdAt
  };
  
  // If not a workspace habit, return minimal data
  if (!this.isWorkspaceHabit()) {
    return baseData;
  }
  
  const shareLevel = this.workspaceSettings?.shareProgress || 'progress-only';
  const isOwner = this.userId.toString() === viewerId?.toString();
  
  // Owner can always see everything
  if (isOwner) {
    return this.toObject();
  }
  
  switch (shareLevel) {
    case 'full':
      return {
        ...baseData,
        target: this.target,
        schedule: this.schedule,
        stats: this.stats,
        workspaceSettings: this.workspaceSettings
      };
      
    case 'progress-only':
      return {
        ...baseData,
        stats: {
          currentStreak: this.stats.currentStreak,
          totalChecks: this.stats.totalChecks,
          completionRate: this.stats.completionRate
        }
      };
      
    case 'streaks-only':
      return {
        ...baseData,
        stats: {
          currentStreak: this.stats.currentStreak,
          longestStreak: this.stats.longestStreak
        }
      };
      
    case 'private':
    default:
      // Only basic info for private habits
      return {
        ...baseData,
        stats: viewerRole === 'owner' ? this.stats : undefined
      };
  }
};

habitSchema.methods.canUserInteract = function(userId, userRole = 'member') {
  // Owner can always interact
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check workspace interaction permissions
  if (this.isWorkspaceHabit() && this.workspaceSettings?.allowInteraction) {
    return ['owner', 'admin', 'member'].includes(userRole);
  }
  
  return false;
};

// Static methods for workspace habits
habitSchema.statics.findWorkspaceHabits = function(workspaceId, options = {}) {
  const query = {
    workspaceId: workspaceId,
    source: 'workspace',
    isActive: true
  };
  
  if (options.userId) {
    query.userId = options.userId;
  }
  
  return this.find(query)
    .populate('userId', 'name email avatar')
    .populate('workspaceHabitId', 'name description category icon')
    .sort({ adoptedAt: -1 });
};

habitSchema.statics.getWorkspaceStats = function(workspaceId) {
  return this.aggregate([
    { 
      $match: { 
        workspaceId: new mongoose.Types.ObjectId(workspaceId), 
        source: 'workspace',
        isActive: true 
      } 
    },
    {
      $group: {
        _id: '$workspaceId',
        totalAdoptedHabits: { $sum: 1 },
        totalCompletions: { $sum: '$stats.totalChecks' },
        avgCompletionRate: { $avg: '$stats.completionRate' },
        avgCurrentStreak: { $avg: '$stats.currentStreak' },
        activeMembers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        totalAdoptedHabits: 1,
        totalCompletions: 1,
        avgCompletionRate: { $round: ['$avgCompletionRate', 1] },
        avgCurrentStreak: { $round: ['$avgCurrentStreak', 1] },
        activeMemberCount: { $size: '$activeMembers' }
      }
    }
  ]);
};

module.exports = mongoose.model('Habit', habitSchema);
