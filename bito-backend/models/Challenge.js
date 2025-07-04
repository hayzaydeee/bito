const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['streak', 'collective', 'completion', 'habit-specific'],
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'expired'],
      default: 'upcoming',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    current: {
      type: Number,
      default: 0,
    },
    reward: {
      type: String,
      default: '🏆 Challenge Completion Badge',
    },
    habitIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'WorkspaceHabit',
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    progressUpdateRule: {
      type: String,
      enum: ['automatic', 'manual'],
      default: 'automatic',
    },
  },
  { timestamps: true }
);

// Add indexes for common queries
challengeSchema.index({ workspaceId: 1, status: 1 });
challengeSchema.index({ endDate: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // TTL index for auto-cleanup

// Add middleware to auto-update status based on dates
challengeSchema.pre('save', function (next) {
  const now = new Date();
  if (this.endDate < now) {
    this.status = 'expired';
  } else if (this.startDate <= now && this.status === 'upcoming') {
    this.status = 'active';
  }
  next();
});

// Add pre-save hook to update participant progress
challengeSchema.methods.updateProgress = async function (userId, progress) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );
  if (participant) {
    participant.progress = progress;
    if (progress >= this.target) {
      participant.completed = true;
    }
    await this.save();
    return true;
  }
  return false;
};

// Static method to find active challenges for a workspace
challengeSchema.statics.findActiveForWorkspace = function (workspaceId) {
  return this.find({
    workspaceId,
    status: { $in: ['active', 'upcoming'] },
  }).sort({ startDate: 1 });
};

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
