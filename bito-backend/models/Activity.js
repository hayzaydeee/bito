const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
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
  
  // Activity details
  type: {
    type: String,
    enum: [
      'habit_completed',
      'habit_adopted',
      'streak_milestone',
      'goal_achieved',
      'member_joined',
      'member_left',
      'habit_created',
      'challenge_completed',
      'badge_earned'
    ],
    required: true
  },
  
  // Flexible data structure for different activity types
  data: {
    // For habit_completed
    habitId: mongoose.Schema.Types.ObjectId,
    habitName: String,
    streakCount: Number,
    
    // For streak_milestone
    milestoneType: String, // '7_day', '30_day', '100_day', etc.
    
    // For goal_achieved
    goalType: String,
    goalValue: Number,
    
    // For member activities
    memberName: String,
    memberRole: String,
    
    // Additional context
    message: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Visibility and engagement
  visibility: {
    type: String,
    enum: ['public', 'workspace', 'private'],
    default: 'workspace'
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'celebrate', 'fire', 'clap', 'heart'],
      default: 'like'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Comments on activity
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // Using custom createdAt
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
activitySchema.index({ workspaceId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

// Compound index for workspace activity feed
activitySchema.index({ 
  workspaceId: 1, 
  visibility: 1, 
  createdAt: -1 
});

// Virtual for reaction counts
activitySchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Methods
activitySchema.methods.addReaction = function(userId, reactionType = 'like') {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    reaction => reaction.userId.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    userId,
    type: reactionType,
    createdAt: new Date()
  });
  
  return this.save();
};

activitySchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.userId.toString() !== userId.toString()
  );
  
  return this.save();
};

activitySchema.methods.addComment = function(userId, text) {
  this.comments.push({
    userId,
    text: text.trim(),
    createdAt: new Date()
  });
  
  return this.save();
};

activitySchema.methods.canUserSee = function(userId, userRole = 'member') {
  // Private activities only visible to creator
  if (this.visibility === 'private') {
    return this.userId.toString() === userId.toString();
  }
  
  // Public activities visible to all workspace members
  if (this.visibility === 'public' || this.visibility === 'workspace') {
    return true; // Assuming this method is called within workspace context
  }
  
  return false;
};

// Static methods
activitySchema.statics.getWorkspaceFeed = function(workspaceId, options = {}) {
  const {
    page = 1,
    limit = 20,
    userId = null,
    types = null
  } = options;
  
  const query = {
    workspaceId,
    visibility: { $in: ['public', 'workspace'] }
  };
  
  // Filter by user if specified
  if (userId) {
    query.userId = userId;
  }
  
  // Filter by activity types if specified
  if (types && types.length > 0) {
    query.type = { $in: types };
  }
  
  return this.find(query)
    .populate('userId', 'name avatar')
    .populate('reactions.userId', 'name avatar')
    .populate('comments.userId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit * page)
    .skip((page - 1) * limit);
};

activitySchema.statics.createHabitActivity = function(workspaceId, userId, habitData, type = 'habit_completed') {
  return this.create({
    workspaceId,
    userId,
    type,
    data: {
      habitId: habitData.habitId,
      habitName: habitData.habitName,
      streakCount: habitData.streakCount,
      message: habitData.message
    },
    visibility: 'workspace'
  });
};

activitySchema.statics.createMilestoneActivity = function(workspaceId, userId, milestoneData) {
  return this.create({
    workspaceId,
    userId,
    type: 'streak_milestone',
    data: {
      habitId: milestoneData.habitId,
      habitName: milestoneData.habitName,
      milestoneType: milestoneData.milestoneType,
      streakCount: milestoneData.streakCount,
      message: `🔥 ${milestoneData.streakCount} day streak on ${milestoneData.habitName}!`
    },
    visibility: 'workspace'
  });
};

activitySchema.statics.createMemberActivity = function(workspaceId, userId, memberData, type) {
  return this.create({
    workspaceId,
    userId,
    type,
    data: {
      memberName: memberData.memberName,
      memberRole: memberData.memberRole,
      message: memberData.message
    },
    visibility: 'workspace'
  });
};

activitySchema.statics.getActivityStats = function(workspaceId, timeRange = 'week') {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        workspaceId: mongoose.Types.ObjectId(workspaceId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        users: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        uniqueUsers: { $size: '$users' },
        _id: 0
      }
    }
  ]);
};

module.exports = mongoose.model('Activity', activitySchema);
