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

// Virtual for habit entries
habitSchema.virtual('entries', {
  ref: 'HabitEntry',
  localField: '_id',
  foreignField: 'habitId'
});

// Instance methods
habitSchema.methods.updateStats = async function() {
  const HabitEntry = mongoose.model('HabitEntry');
  
  // Get all entries for this habit
  const entries = await HabitEntry.find({ habitId: this._id }).sort({ date: 1 });
  
  // Calculate total checks
  this.stats.totalChecks = entries.reduce((sum, entry) => sum + entry.value, 0);
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
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
  
  // Last checked date
  const lastCompletedEntry = entries.reverse().find(entry => entry.completed);
  this.stats.lastChecked = lastCompletedEntry ? lastCompletedEntry.date : null;
  
  // Completion rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentEntries = entries.filter(entry => entry.date >= thirtyDaysAgo);
  const completedCount = recentEntries.filter(entry => entry.completed).length;
  const totalDays = Math.min(30, Math.ceil((today - this.createdAt) / (1000 * 60 * 60 * 24)));
  
  this.stats.completionRate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  
  await this.save();
};

module.exports = mongoose.model('Habit', habitSchema);
