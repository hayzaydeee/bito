const mongoose = require('mongoose');

/**
 * Transformer model — v2 (phased).
 *
 * A Transformer is an AI-generated, multi-phase habit system blueprint.
 * User describes a goal → AI generates phased habits → user previews/refines via chat → applies → real Habit docs created.
 *
 * v2 additions: phases[], progress, refinements[] (conversational studio).
 * Deferred: milestones[], widgets[], adaptations[], context, pendingSuggestions[].
 */

// ── Shared habit sub-schema (reused in flat habits + phases) ──
const habitSubSchema = {
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  methodology: {
    type: String,
    enum: ['boolean', 'numeric', 'duration', 'rating'],
    default: 'boolean',
  },
  frequency: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'specific_days', 'custom'],
      default: 'daily',
    },
    days: [{ type: String }], // ["mon", "wed", "fri"]
    timesPerWeek: { type: Number, default: null },
  },
  target: {
    value: { type: Number, default: null },
    unit: { type: String, default: null }, // "minutes", "pages", "reps"
  },
  icon: { type: String, default: '🎯' },
  category: {
    type: String,
    enum: ['health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social', 'creative', 'other'],
    default: 'other',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  isRequired: { type: Boolean, default: true },
};

const transformerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null, // null = personal transformer
    },

    // ── Input ──
    goal: {
      text: {
        type: String,
        required: [true, 'Goal text is required'],
        trim: true,
        maxlength: [1000, 'Goal text cannot exceed 1000 characters'],
      },
      parsed: {
        intent: {
          type: String,
          enum: [
            'fitness',
            'health_wellness',
            'learning_skill',
            'productivity',
            'finance',
            'event_prep',
            'career',
            'relationships',
            'creative',
            'custom',
          ],
          default: 'custom',
        },
        targetDate: { type: Date, default: null },
        constraints: [{ type: String }],
        keywords: [{ type: String }],
      },
    },

    // ── Output: The Generated System ──
    system: {
      name: {
        type: String,
        trim: true,
        maxlength: 120,
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      icon: {
        type: String,
        default: '🎯',
      },
      category: {
        type: String,
        enum: [
          'fitness',
          'health_wellness',
          'learning_skill',
          'productivity',
          'finance',
          'event_prep',
          'career',
          'relationships',
          'creative',
          'custom',
        ],
        default: 'custom',
      },
      estimatedDuration: {
        value: { type: Number, default: null },
        unit: {
          type: String,
          enum: ['days', 'weeks', 'months'],
          default: 'weeks',
        },
      },

      // v2: Phased habit system (Foundation → Building → Mastery)
      phases: [
        {
          name: { type: String, trim: true, maxlength: 60 },
          order: { type: Number, default: 0 },
          durationDays: { type: Number, default: 14 },
          description: { type: String, trim: true, maxlength: 200 },
          habits: [habitSubSchema],
        },
      ],

      // v1 compat: flat habits array (used by old transformers without phases)
      habits: [habitSubSchema],
    },

    // ── Phase progress tracking ──
    progress: {
      currentPhaseIndex: { type: Number, default: 0 },
      completedPhases: [{ type: Number }], // indices of completed phases
      overallCompletion: { type: Number, default: 0, min: 0, max: 100 },
    },

    // ── Lifecycle ──
    status: {
      type: String,
      enum: ['draft', 'preview', 'active', 'completed', 'archived'],
      default: 'preview',
    },
    activatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // ── What was created when applied ──
    appliedResources: {
      habitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Habit' }],
    },

    // ── Conversational refinement history ──
    refinements: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        message: { type: String, required: true, maxlength: 2000 },
        phasesSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // ── AI generation metadata ──
    generation: {
      model: { type: String, default: null },
      generatedAt: { type: Date, default: null },
      tokenUsage: {
        input: { type: Number, default: 0 },
        output: { type: Number, default: 0 },
      },
      userEditsBeforeApply: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ── Constants ──
transformerSchema.statics.MAX_REFINEMENTS = 5; // 5 user turns = 10 messages total

// ── Indexes ──
transformerSchema.index({ userId: 1, status: 1 });
transformerSchema.index({ userId: 1, createdAt: -1 });

// ── Virtuals ──

/**
 * habitCount — total habits across all phases (or flat if no phases).
 */
transformerSchema.virtual('habitCount').get(function () {
  if (this.system?.phases?.length > 0) {
    return this.system.phases.reduce((sum, p) => sum + (p.habits?.length || 0), 0);
  }
  return this.system?.habits?.length || 0;
});

/**
 * allHabits — flattened array of all habits across phases.
 * For phased transformers: concatenates phase habits with phase metadata.
 * For flat (v1) transformers: returns the habits array directly.
 */
transformerSchema.virtual('allHabits').get(function () {
  if (this.system?.phases?.length > 0) {
    return this.system.phases.flatMap((p, pi) =>
      (p.habits || []).map((h, hi) => ({
        ...h.toObject ? h.toObject() : h,
        _phaseIndex: pi,
        _phaseName: p.name,
        _habitIndex: hi,
      }))
    );
  }
  return this.system?.habits || [];
});

/**
 * isPhased — whether this transformer uses the phased system.
 */
transformerSchema.virtual('isPhased').get(function () {
  return (this.system?.phases?.length || 0) > 0;
});

/**
 * currentPhase — the currently active phase object.
 */
transformerSchema.virtual('currentPhase').get(function () {
  if (!this.isPhased) return null;
  return this.system.phases[this.progress?.currentPhaseIndex || 0] || null;
});

/**
 * refinementTurnsUsed — number of user refinement turns used.
 */
transformerSchema.virtual('refinementTurnsUsed').get(function () {
  return (this.refinements || []).filter((r) => r.role === 'user').length;
});

/**
 * refinementTurnsRemaining — refinement turns left.
 */
transformerSchema.virtual('refinementTurnsRemaining').get(function () {
  return Math.max(0, (this.constructor.MAX_REFINEMENTS || 5) - this.refinementTurnsUsed);
});

// ── Instance methods ──

transformerSchema.methods.markApplied = function (habitIds) {
  this.status = 'active';
  this.activatedAt = new Date();
  this.appliedResources.habitIds = habitIds;
};

transformerSchema.methods.archive = function () {
  this.status = 'archived';
};

/**
 * Advance to the next phase.
 * Returns the new phase index, or -1 if already at the last phase.
 */
transformerSchema.methods.advancePhase = function () {
  if (!this.isPhased) return -1;
  const current = this.progress.currentPhaseIndex || 0;
  if (current >= this.system.phases.length - 1) {
    // Already at last phase — mark completed
    this.status = 'completed';
    this.completedAt = new Date();
    if (!this.progress.completedPhases.includes(current)) {
      this.progress.completedPhases.push(current);
    }
    this.progress.overallCompletion = 100;
    return -1;
  }
  // Mark current phase as completed and advance
  if (!this.progress.completedPhases.includes(current)) {
    this.progress.completedPhases.push(current);
  }
  this.progress.currentPhaseIndex = current + 1;
  return current + 1;
};

// Ensure virtuals are included in JSON
transformerSchema.set('toJSON', { virtuals: true });
transformerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Transformer', transformerSchema);
