const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  // Core invitation data
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Invited user information
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  invitedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Will be set if user already exists
  },
  
  // Invitation details
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Invitation message cannot exceed 500 characters']
  },
  
  // Security and tracking
  token: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Timestamps
  expiresAt: {
    type: Date,
    index: true
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { updatedAt: 'updatedAt' }
});

// Indexes for performance
invitationSchema.index({ workspaceId: 1, email: 1 });
invitationSchema.index({ status: 1, expiresAt: 1 });
invitationSchema.index({ invitedBy: 1, createdAt: -1 });

// Pre-save middleware to generate token and set expiration
invitationSchema.pre('save', function(next) {
  // Always generate token if not present
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  
  // Always set expiration if not present
  if (!this.expiresAt) {
    // Set expiration to 7 days from now
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Instance methods
invitationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

invitationSchema.methods.canBeAccepted = function() {
  return this.status === 'pending' && !this.isExpired();
};

invitationSchema.methods.accept = function(acceptingUserId) {
  if (!this.canBeAccepted()) {
    throw new Error('Invitation cannot be accepted');
  }
  
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.invitedUserId = acceptingUserId;
  return this.save();
};

invitationSchema.methods.decline = function() {
  if (this.status !== 'pending') {
    throw new Error('Can only decline pending invitations');
  }
  
  this.status = 'declined';
  return this.save();
};

invitationSchema.methods.cancel = function() {
  if (this.status !== 'pending') {
    throw new Error('Can only cancel pending invitations');
  }
  
  this.status = 'cancelled';
  return this.save();
};

// Static methods
invitationSchema.statics.findValidByToken = function(token) {
  return this.findOne({
    token: token,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('workspaceId invitedBy');
};

invitationSchema.statics.findByWorkspace = function(workspaceId, options = {}) {
  const query = { workspaceId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.includeExpired === false) {
    query.expiresAt = { $gt: new Date() };
  }
  
  return this.find(query)
    .populate('invitedBy', 'name email')
    .populate('invitedUserId', 'name email')
    .sort({ createdAt: -1 });
};

invitationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired'
    }
  );
};

module.exports = mongoose.model('Invitation', invitationSchema);
