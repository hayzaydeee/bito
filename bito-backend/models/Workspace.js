const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  // Basic workspace information
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [100, 'Workspace name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['family', 'team', 'fitness', 'study', 'community', 'personal'],
    default: 'personal'
  },
  
  // Ownership and management
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Workspace settings
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    privacyLevel: {
      type: String,
      enum: ['open', 'members-only', 'invite-only'],
      default: 'invite-only'
    },
    allowMemberHabitCreation: {
      type: Boolean,
      default: true
    },
    defaultHabitVisibility: {
      type: String,
      enum: ['public', 'progress-only', 'streaks-only', 'private'],
      default: 'progress-only'
    }
  },
  
  // Members array with roles and status
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active'
    },
    permissions: {
      canInviteMembers: { type: Boolean, default: false },
      canCreateHabits: { type: Boolean, default: true },
      canViewAllProgress: { type: Boolean, default: true },
      canManageSettings: { type: Boolean, default: false }
    }
  }],
  
  // Workspace statistics
  stats: {
    totalMembers: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    totalHabits: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 }
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

// Indexes for performance
workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ 'members.userId': 1 });
workspaceSchema.index({ type: 1, 'settings.isPublic': 1 });
workspaceSchema.index({ createdAt: -1 });

// Virtual for member count
workspaceSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Methods
workspaceSchema.methods.isMember = function(userId) {
  if (!userId) return false;
  return this.members.some(m => m.userId?.equals(userId) && m.status === 'active');
};

workspaceSchema.methods.getMemberRole = function(userId) {
  if (!userId) return null;
  const member = this.members.find(m => m.userId?.equals(userId) && m.status === 'active');
  return member ? member.role : null;
};

workspaceSchema.methods.canUserAccess = function(userId, action) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString() && 
    member.status === 'active'
  );
  
  if (!member) return false;
  
  // Owner has all permissions
  if (this.ownerId.toString() === userId.toString()) {
    return true;
  }
  
  const rolePermissions = {
    owner: ['all'],
    admin: ['invite', 'manage_habits', 'view_all', 'manage_members'],
    member: ['create_habits', 'view_progress'],
    viewer: ['view_progress']
  };
  
  const userPermissions = rolePermissions[member.role] || [];
  return userPermissions.includes('all') || userPermissions.includes(action);
};

// Get default permissions for a role
workspaceSchema.methods.getDefaultPermissions = function(role) {
  const defaultPermissions = {
    owner: {
      canInviteMembers: true,
      canCreateHabits: true,
      canViewAllProgress: true,
      canManageSettings: true
    },
    admin: {
      canInviteMembers: true,
      canCreateHabits: true,
      canViewAllProgress: true,
      canManageSettings: false
    },
    member: {
      canInviteMembers: false,
      canCreateHabits: true,
      canViewAllProgress: true,
      canManageSettings: false
    },
    viewer: {
      canInviteMembers: false,
      canCreateHabits: false,
      canViewAllProgress: true,
      canManageSettings: false
    }
  };
  
  return defaultPermissions[role] || defaultPermissions.viewer;
};

// Static methods
workspaceSchema.statics.findByUserId = function(userId) {
  return this.find({
    'members.userId': userId,
    'members.status': 'active'
  })
  .populate('ownerId', 'name email avatar')
  .populate('members.userId', 'name email avatar');
};

workspaceSchema.statics.getPublicWorkspaces = function(limit = 20) {
  return this.find({
    'settings.isPublic': true,
    'settings.privacyLevel': 'open'
  })
  .populate('ownerId', 'name avatar')
  .limit(limit)
  .sort({ 'stats.activeMembers': -1 });
};

module.exports = mongoose.model('Workspace', workspaceSchema);
