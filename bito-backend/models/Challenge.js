const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Core fields ──
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [60, 'Title cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    icon: {
      type: String,
      default: '🏆',
    },

    // ── Challenge type ──
    // Phase 1 ships streak + cumulative + consistency + team_goal.
    // head_to_head is defined but deferred.
    type: {
      type: String,
      enum: ['streak', 'cumulative', 'consistency', 'head_to_head', 'team_goal'],
      required: true,
    },

    // The workspace habit this challenge is tied to (optional).
    // If null, participants can link their own habit.
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkspaceHabit',
      default: null,
    },

    // ── Rules ──
    rules: {
      targetValue: {
        type: Number,
        required: [true, 'Target value is required'],
        min: 1,
      },
      targetUnit: {
        type: String,
        enum: ['days', 'completions', 'minutes', 'hours', 'percent', 'custom'],
        default: 'days',
      },
      minimumDailyValue: {
        type: Number,
        default: null,
      },
      allowMakeupDays: {
        type: Boolean,
        default: false,
      },
      gracePeriodHours: {
        type: Number,
        default: 4,
        min: 0,
        max: 12,
      },
    },

    // ── Schedule ──
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
    },

    // ── Participants ──
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        linkedHabitId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Habit',
          default: null,
        },
        progress: {
          currentValue: { type: Number, default: 0 },
          currentStreak: { type: Number, default: 0 },
          bestStreak: { type: Number, default: 0 },
          completionRate: { type: Number, default: 0 },
          lastLoggedAt: { type: Date, default: null },
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'dropped'],
          default: 'active',
        },
        completedAt: { type: Date, default: null },
      },
    ],

    // ── Milestones ──
    milestones: [
      {
        value: { type: Number, required: true },
        label: { type: String, required: true, maxlength: 100 },
        reachedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],

    // ── Cached stats ──
    stats: {
      participantCount: { type: Number, default: 0 },
      completedCount: { type: Number, default: 0 },
      averageProgress: { type: Number, default: 0 },
      topStreak: { type: Number, default: 0 },
    },

    // ── Settings ──
    settings: {
      maxParticipants: { type: Number, default: null },
      allowLateJoin: { type: Boolean, default: true },
      showLeaderboard: { type: Boolean, default: true },
      anonymizeLeaderboard: { type: Boolean, default: false },
    },

    // ── Reward (cosmetic) ──
    reward: {
      type: String,
      default: '🏆 Challenge Completion Badge',
      maxlength: 100,
    },
  },
  { timestamps: true }
);

// ── Indexes ──
challengeSchema.index({ workspaceId: 1, status: 1 });
challengeSchema.index({ workspaceId: 1, createdAt: -1 });
challengeSchema.index({ 'participants.userId': 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });

// ── Virtuals ──
challengeSchema.virtual('daysRemaining').get(function () {
  if (this.status !== 'active') return null;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

challengeSchema.virtual('durationDays').get(function () {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// ── Instance methods ──

challengeSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (p) => p.userId?.equals(userId) && p.status === 'active'
  );
};

challengeSchema.methods.getParticipant = function (userId) {
  return this.participants.find(
    (p) => p.userId?.equals(userId) && p.status !== 'dropped'
  );
};

challengeSchema.methods.addParticipant = function (userId, linkedHabitId = null) {
  if (this.isParticipant(userId)) return null;

  const activeCount = this.participants.filter((p) => p.status === 'active').length;
  if (this.settings.maxParticipants && activeCount >= this.settings.maxParticipants) return null;
  if (this.status === 'active' && !this.settings.allowLateJoin) return null;

  const participant = {
    userId,
    joinedAt: new Date(),
    linkedHabitId,
    progress: { currentValue: 0, currentStreak: 0, bestStreak: 0, completionRate: 0, lastLoggedAt: null },
    status: 'active',
    completedAt: null,
  };

  this.participants.push(participant);
  this.stats.participantCount = this.participants.filter((p) => p.status === 'active').length;
  return participant;
};

challengeSchema.methods.dropParticipant = function (userId) {
  const p = this.participants.find(
    (p) => p.userId?.equals(userId) && p.status === 'active'
  );
  if (!p) return false;
  p.status = 'dropped';
  this.stats.participantCount = this.participants.filter((p) => p.status === 'active').length;
  return true;
};

// Update progress for a participant. Returns the participant or null.
challengeSchema.methods.updateParticipantProgress = function (userId, progressData) {
  const participant = this.getParticipant(userId);
  if (!participant || participant.status !== 'active') return null;

  Object.assign(participant.progress, progressData);

  const completed = this._checkCompletion(participant);
  if (completed && participant.status !== 'completed') {
    participant.status = 'completed';
    participant.completedAt = new Date();
    this.stats.completedCount = this.participants.filter((p) => p.status === 'completed').length;
  }

  this._refreshStats();
  return participant;
};

challengeSchema.methods._checkCompletion = function (participant) {
  const target = this.rules.targetValue;
  switch (this.type) {
    case 'streak':
      return participant.progress.currentStreak >= target;
    case 'cumulative':
      return participant.progress.currentValue >= target;
    case 'consistency':
      return participant.progress.completionRate >= target;
    case 'team_goal': {
      const totalValue = this.participants
        .filter((p) => p.status !== 'dropped')
        .reduce((sum, p) => sum + (p.progress.currentValue || 0), 0);
      return totalValue >= target;
    }
    default:
      return participant.progress.currentValue >= target;
  }
};

challengeSchema.methods._refreshStats = function () {
  const active = this.participants.filter((p) => p.status !== 'dropped');
  this.stats.participantCount = active.filter((p) => p.status === 'active' || p.status === 'completed').length;
  this.stats.completedCount = active.filter((p) => p.status === 'completed').length;
  this.stats.averageProgress =
    active.length > 0
      ? Math.round(active.reduce((sum, p) => sum + (p.progress.currentValue || 0), 0) / active.length)
      : 0;
  this.stats.topStreak = Math.max(0, ...active.map((p) => p.progress.currentStreak || 0));

  if (this.type === 'team_goal') {
    const totalValue = active.reduce((sum, p) => sum + (p.progress.currentValue || 0), 0);
    if (totalValue >= this.rules.targetValue && this.status === 'active') {
      this.status = 'completed';
    }
  }
};

// Check milestones for a participant, returns newly reached milestones
challengeSchema.methods.checkMilestones = function (userId) {
  const participant = this.getParticipant(userId);
  if (!participant) return [];

  const newlyReached = [];
  for (const milestone of this.milestones) {
    const alreadyReached = milestone.reachedBy.some((id) => id.equals(userId));
    if (alreadyReached) continue;

    const value =
      this.type === 'team_goal'
        ? this.participants.filter((p) => p.status !== 'dropped').reduce((s, p) => s + (p.progress.currentValue || 0), 0)
        : participant.progress.currentValue;

    if (value >= milestone.value) {
      milestone.reachedBy.push(userId);
      newlyReached.push(milestone);
    }
  }
  return newlyReached;
};

challengeSchema.methods.getLeaderboard = function () {
  const active = this.participants.filter((p) => p.status !== 'dropped');

  const sorted = [...active].sort((a, b) => {
    switch (this.type) {
      case 'streak':
        return (b.progress.currentStreak || 0) - (a.progress.currentStreak || 0);
      case 'consistency':
        return (b.progress.completionRate || 0) - (a.progress.completionRate || 0);
      default:
        return (b.progress.currentValue || 0) - (a.progress.currentValue || 0);
    }
  });

  return sorted.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    progress: p.progress,
    status: p.status,
    completedAt: p.completedAt,
    joinedAt: p.joinedAt,
  }));
};

// ── Static methods ──

challengeSchema.statics.findActiveForWorkspace = function (workspaceId) {
  return this.find({
    workspaceId,
    status: { $in: ['active', 'upcoming'] },
  })
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar')
    .sort({ startDate: 1 });
};

challengeSchema.statics.findByWorkspace = function (workspaceId, options = {}) {
  const query = { workspaceId };
  if (options.status) {
    query.status = Array.isArray(options.status) ? { $in: options.status } : options.status;
  }
  return this.find(query)
    .populate('createdBy', 'name avatar')
    .populate('participants.userId', 'name avatar')
    .sort({ createdAt: -1 });
};

// Status transitions — called by cron job
challengeSchema.statics.transitionStatuses = async function () {
  const now = new Date();
  const results = { activated: 0, completed: 0 };

  const toActivate = await this.updateMany(
    { status: 'upcoming', startDate: { $lte: now } },
    { $set: { status: 'active' } }
  );
  results.activated = toActivate.modifiedCount;

  const toComplete = await this.updateMany(
    { status: 'active', endDate: { $lte: now } },
    { $set: { status: 'completed' } }
  );
  results.completed = toComplete.modifiedCount;

  return results;
};

module.exports = mongoose.model('Challenge', challengeSchema);
