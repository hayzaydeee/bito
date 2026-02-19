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
    enum: ['personal', 'workspace', 'transformer'],
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

  // Transformer linkage (v2).
  // When a transformer generates habits, these link back to it.
  transformerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transformer',
    default: null
  },
  transformerPhaseId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
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

  // How this habit is measured (v2). Transformers set this explicitly.
  // v1 inferred it from target.unit; v2 makes it a first-class field.
  methodology: {
    type: String,
    enum: ['boolean', 'numeric', 'duration', 'rating'],
    default: 'boolean'
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

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // 1. Total checks — aggregate sum (no documents loaded into memory)
  const [totals] = await HabitEntry.aggregate([
    { $match: { habitId: this._id } },
    { $group: { _id: null, totalChecks: { $sum: '$value' } } }
  ]);
  const totalChecks = totals?.totalChecks || 0;

  // 2. Last checked — single targeted query
  const lastCompleted = await HabitEntry.findOne(
    { habitId: this._id, completed: true },
    { date: 1 },
    { sort: { date: -1 } }
  ).lean();
  const lastChecked = lastCompleted?.date || null;

  // 3. Streaks and completion rate (frequency-dependent)
  let currentStreak, longestStreak, completionRate;

  if (this.frequency === 'weekly') {
    ({ currentStreak, longestStreak, completionRate } =
      await this._computeWeeklyStats(HabitEntry, today));
  } else {
    ({ currentStreak, longestStreak, completionRate } =
      await this._computeDailyStats(HabitEntry, today));
  }

  // 4. Atomic $set — avoids triggering pre-save hooks / validation on whole doc
  await mongoose.model('Habit').updateOne(
    { _id: this._id },
    { $set: {
      'stats.totalChecks': totalChecks,
      'stats.lastChecked': lastChecked,
      'stats.currentStreak': currentStreak,
      'stats.longestStreak': longestStreak,
      'stats.completionRate': completionRate
    }}
  );

  // Keep in-memory copy in sync for callers that read habit.stats after
  this.stats.totalChecks = totalChecks;
  this.stats.lastChecked = lastChecked;
  this.stats.currentStreak = currentStreak;
  this.stats.longestStreak = longestStreak;
  this.stats.completionRate = completionRate;
};

// ── Daily stats: query only dates+completed, walk backward for streak ──
habitSchema.methods._computeDailyStats = async function(HabitEntry, today) {
  // Load only date+completed for completed entries, descending, lean
  const completedDates = await HabitEntry.find(
    { habitId: this._id, completed: true },
    { date: 1, _id: 0 }
  ).sort({ date: -1 }).lean();

  // Current streak: walk backward from today
  let currentStreak = 0;
  const dateSet = new Set(
    completedDates.map(e => {
      const d = new Date(e.date);
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const cursor = new Date(today);
  while (dateSet.has(cursor.getTime())) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Longest streak: walk forward through sorted dates
  const sortedTimestamps = Array.from(dateSet).sort((a, b) => a - b);
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedTimestamps.length; i++) {
    const diff = (sortedTimestamps[i] - sortedTimestamps[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  if (sortedTimestamps.length === 0) longestStreak = 0;

  // Completion rate (last 30 days) — countDocuments, no loading
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const completedCount = await HabitEntry.countDocuments({
    habitId: this._id,
    completed: true,
    date: { $gte: thirtyDaysAgo, $lte: today }
  });

  const totalDays = Math.min(30, Math.ceil((today - this.createdAt) / (1000 * 60 * 60 * 24)));
  const completionRate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  return { currentStreak, longestStreak, completionRate };
};

// ── Weekly stats: aggregate completed entries by week ──
habitSchema.methods._computeWeeklyStats = async function(HabitEntry, today) {
  const target = this.weeklyTarget || 3;

  // Aggregate: count completed entries per ISO week (Mon-Sun)
  const weekCounts = await HabitEntry.aggregate([
    { $match: { habitId: this._id, completed: true } },
    { $group: {
      _id: {
        // Shift Sunday (1) to end of week: (dayOfWeek + 5) % 7 → Mon=0..Sun=6
        // Then compute week-start as date minus that offset
        weekStart: {
          $dateFromParts: {
            isoWeekYear: { $isoWeekYear: '$date' },
            isoWeek: { $isoWeek: '$date' },
            isoDayOfWeek: 1
          }
        }
      },
      count: { $sum: 1 }
    }},
    { $sort: { '_id.weekStart': 1 } }
  ]);

  // Build a map of weekStart → count
  const weekMap = new Map();
  weekCounts.forEach(w => {
    const key = w._id.weekStart.getTime();
    weekMap.set(key, w.count);
  });

  const currentWeekStart = getWeekStartUTC(today);

  // Current streak: walk backward from current week
  let currentStreak = 0;
  let cursor = new Date(currentWeekStart);

  // Check current week first
  if ((weekMap.get(cursor.getTime()) || 0) >= target) {
    currentStreak = 1;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  } else {
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }

  const createdWeekStart = getWeekStartUTC(this.createdAt);
  while (cursor >= createdWeekStart) {
    if ((weekMap.get(cursor.getTime()) || 0) >= target) {
      currentStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    } else {
      break;
    }
  }

  // Longest streak: scan all weeks from creation to now
  let longestStreak = 0;
  let tempStreak = 0;
  const scan = new Date(createdWeekStart);

  while (scan <= currentWeekStart) {
    if ((weekMap.get(scan.getTime()) || 0) >= target) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
    scan.setUTCDate(scan.getUTCDate() + 7);
  }

  // Completion rate: last 4 weeks
  const fourWeeksAgo = new Date(currentWeekStart);
  fourWeeksAgo.setUTCDate(fourWeeksAgo.getUTCDate() - 21);
  let weeksMet = 0;
  let totalWeeks = 0;
  const rateCursor = new Date(fourWeeksAgo);

  while (rateCursor <= currentWeekStart) {
    if (rateCursor >= createdWeekStart) {
      totalWeeks++;
      if ((weekMap.get(rateCursor.getTime()) || 0) >= target) weeksMet++;
    }
    rateCursor.setUTCDate(rateCursor.getUTCDate() + 7);
  }
  const completionRate = totalWeeks > 0 ? Math.round((weeksMet / totalWeeks) * 100) : 0;

  return { currentStreak, longestStreak, completionRate };
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
