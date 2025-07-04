const mongoose = require('mongoose');

const encouragementSchema = new mongoose.Schema({
  // Who is giving the encouragement
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Who is receiving the encouragement
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Which workspace this encouragement is related to
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  
  // Optional: specific habit this encouragement is about
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    default: null
  },
  
  // Encouragement type
  type: {
    type: String,
    enum: [
      'general_support',      // General encouragement
      'streak_celebration',   // Celebrating a streak milestone
      'goal_achieved',        // Celebrating a goal completion
      'comeback_support',     // Supporting after a missed day
      'milestone_reached',    // Celebrating habit milestones
      'custom_message'        // Custom encouragement message
    ],
    default: 'general_support'
  },
  
  // Message content
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Encouragement message cannot exceed 500 characters'],
    trim: true
  },
  
  // Predefined reaction emojis/types
  reaction: {
    type: String,
    enum: ['👏', '🔥', '💪', '⭐', '🎉', '👊', '💯', '🚀'],
    default: '👏'
  },
  
  // Engagement tracking
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: {
    type: Date,
    default: null
  },
  
  // Response tracking (if the recipient responds)
  response: {
    message: {
      type: String,
      maxlength: [300, 'Response cannot exceed 300 characters'],
      trim: true
    },
    respondedAt: {
      type: Date,
      default: null
    }
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
  timestamps: true
});

// Indexes for performance
encouragementSchema.index({ toUser: 1, createdAt: -1 }); // For fetching user's received encouragements
encouragementSchema.index({ fromUser: 1, createdAt: -1 }); // For fetching user's sent encouragements
encouragementSchema.index({ workspace: 1, createdAt: -1 }); // For workspace-specific encouragements
encouragementSchema.index({ habit: 1, createdAt: -1 }); // For habit-specific encouragements
encouragementSchema.index({ isRead: 1, toUser: 1 }); // For unread notifications

// Compound indexes
encouragementSchema.index({ toUser: 1, isRead: 1, createdAt: -1 }); // For unread notifications timeline
encouragementSchema.index({ workspace: 1, toUser: 1, createdAt: -1 }); // For workspace member encouragements

// Virtual for formatted creation time
encouragementSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Pre-save middleware to update timestamps
encouragementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set readAt when isRead changes to true
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  // Set respondedAt when response is added
  if (this.isModified('response.message') && this.response.message && !this.response.respondedAt) {
    this.response.respondedAt = new Date();
  }
  
  next();
});

// Static methods for common queries
encouragementSchema.statics.getReceivedEncouragements = function(userId, options = {}) {
  const query = { toUser: userId };
  
  if (options.workspaceId) {
    query.workspace = options.workspaceId;
  }
  
  if (options.unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate('fromUser', 'name email avatar')
    .populate('workspace', 'name')
    .populate('habit', 'name')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

encouragementSchema.statics.getSentEncouragements = function(userId, options = {}) {
  const query = { fromUser: userId };
  
  if (options.workspaceId) {
    query.workspace = options.workspaceId;
  }
  
  return this.find(query)
    .populate('toUser', 'name email avatar')
    .populate('workspace', 'name')
    .populate('habit', 'name')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

encouragementSchema.statics.getWorkspaceEncouragements = function(workspaceId, options = {}) {
  const query = { workspace: workspaceId };
  
  return this.find(query)
    .populate('fromUser', 'name email avatar')
    .populate('toUser', 'name email avatar')
    .populate('habit', 'name')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

encouragementSchema.statics.markAsRead = function(encouragementIds, userId) {
  return this.updateMany(
    { 
      _id: { $in: encouragementIds }, 
      toUser: userId,
      isRead: false 
    },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Instance methods
encouragementSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

encouragementSchema.methods.addResponse = function(responseMessage) {
  this.response.message = responseMessage;
  this.response.respondedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Encouragement', encouragementSchema);
