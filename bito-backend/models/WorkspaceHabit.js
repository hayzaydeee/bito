const mongoose = require('mongoose');

const workspaceHabitSchema = new mongoose.Schema({
  // Workspace reference
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  
  // Basic habit information (template for workspace)
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
  
  // Created by (workspace member)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  
  // Workspace-specific settings
  workspaceSettings: {
    isRequired: {
      type: Boolean,
      default: false  // Must all workspace members track this habit?
    },
    isTemplate: {
      type: Boolean,
      default: true   // Can members customize this habit?
    },
    allowCustomization: {
      type: Boolean,
      default: true   // Can members modify target, schedule, etc?
    },
    visibility: {
      type: String,
      enum: ['all', 'admins-only', 'creator-only'],
      default: 'all'
    },
    autoAssign: {
      type: Boolean,
      default: false  // Automatically add to new members' dashboards?
    }
  },
  
  // Default tracking settings (can be overridden by members)
  defaultSettings: {
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
    schedule: {
      days: [{
        type: Number,
        min: 0,
        max: 6
      }], // 0 = Sunday, 1 = Monday, etc.
      reminderTime: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
      }
    }
  },
  
  // Adoption tracking
  adoptionStats: {
    totalAdopted: { type: Number, default: 0 },
    activelyTracking: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    avgStreak: { type: Number, default: 0 }
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

// Indexes
workspaceHabitSchema.index({ workspaceId: 1, isActive: 1 });
workspaceHabitSchema.index({ createdBy: 1 });
workspaceHabitSchema.index({ category: 1 });

// Methods
workspaceHabitSchema.methods.canUserModify = function(userId, workspaceRole) {
  // Creator can always modify
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // Admins and owners can modify if visibility allows
  if (['owner', 'admin'].includes(workspaceRole)) {
    return this.workspaceSettings.visibility !== 'creator-only';
  }
  
  return false;
};

workspaceHabitSchema.methods.canUserAdopt = function(userId, workspaceRole) {
  // Check visibility settings
  if (this.workspaceSettings.visibility === 'admins-only' && 
      !['owner', 'admin'].includes(workspaceRole)) {
    return false;
  }
  
  if (this.workspaceSettings.visibility === 'creator-only' && 
      this.createdBy.toString() !== userId.toString()) {
    return false;
  }
  
  return this.isActive && !this.isArchived;
};

// Static methods
workspaceHabitSchema.statics.findByWorkspace = function(workspaceId, userRole = 'member') {
  const visibilityFilter = {
    workspaceId,
    isActive: true
  };
  
  // Filter based on user role
  if (userRole === 'member') {
    visibilityFilter['workspaceSettings.visibility'] = { $in: ['all'] };
  } else if (userRole === 'admin') {
    visibilityFilter['workspaceSettings.visibility'] = { $in: ['all', 'admins-only'] };
  }
  // Owners can see everything
  
  return this.find(visibilityFilter)
    .populate('createdBy', 'name avatar')
    .sort({ createdAt: -1 });
};

workspaceHabitSchema.statics.getPopularHabits = function(workspaceId, limit = 10) {
  return this.find({
    workspaceId,
    isActive: true
  })
  .sort({ 'adoptionStats.totalAdopted': -1 })
  .limit(limit)
  .populate('createdBy', 'name avatar');
};

module.exports = mongoose.model('WorkspaceHabit', workspaceHabitSchema);
