const mongoose = require('mongoose');

const habitEntrySchema = new mongoose.Schema({
  // References
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Entry data
  date: {
    type: Date,
    required: true,
    index: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  value: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Optional metadata
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters'],
    trim: true
  },
  mood: {
    type: Number,
    min: 1,
    max: 5 // 1 = very bad, 5 = very good
  },
  
  // Tracking metadata
  completedAt: {
    type: Date
  },
  source: {
    type: String,
    enum: ['manual', 'reminder', 'import', 'api'],
    default: 'manual'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for performance
habitEntrySchema.index({ habitId: 1, date: -1 });
habitEntrySchema.index({ userId: 1, date: -1 });
habitEntrySchema.index({ habitId: 1, userId: 1, date: -1 });

// Ensure one entry per habit per day
habitEntrySchema.index({ habitId: 1, date: 1 }, { unique: true });

// Pre-save middleware
habitEntrySchema.pre('save', function(next) {
  // Set completion timestamp when marked as completed
  if (this.completed && !this.completedAt) {
    this.completedAt = new Date();
  } else if (!this.completed) {
    this.completedAt = null;
  }
  
  // Normalize date to start of day
  if (this.date) {
    const normalizedDate = new Date(this.date);
    normalizedDate.setHours(0, 0, 0, 0);
    this.date = normalizedDate;
  }
  
  next();
});

// Post-save middleware to update habit stats
habitEntrySchema.post('save', async function() {
  try {
    const Habit = mongoose.model('Habit');
    const habit = await Habit.findById(this.habitId);
    if (habit) {
      await habit.updateStats();
    }
  } catch (error) {
    console.error('Error updating habit stats:', error);
  }
});

// Post-remove middleware to update habit stats
habitEntrySchema.post('remove', async function() {
  try {
    const Habit = mongoose.model('Habit');
    const habit = await Habit.findById(this.habitId);
    if (habit) {
      await habit.updateStats();
    }
  } catch (error) {
    console.error('Error updating habit stats after removal:', error);
  }
});

// Static methods
habitEntrySchema.statics.getEntriesForDateRange = function(habitId, startDate, endDate) {
  return this.find({
    habitId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });
};

habitEntrySchema.statics.getUserStatsForPeriod = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        completedEntries: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        totalValue: { $sum: '$value' },
        averageMood: { $avg: '$mood' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalEntries: 0,
    completedEntries: 0,
    totalValue: 0,
    averageMood: null
  };
};

module.exports = mongoose.model('HabitEntry', habitEntrySchema);
