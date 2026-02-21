const mongoose = require('mongoose');

/**
 * Transformer model — v1 (simplified).
 *
 * A Transformer is an AI-generated habit system blueprint.
 * User describes a goal → AI generates habits → user previews → applies → real Habit docs created.
 *
 * Deferred for v1: phases[], milestones[], widgets[], adaptations[], context, pendingSuggestions[], progress.
 */
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

      // v1: flat habits array (no phases).
      habits: [
        {
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
        },
      ],
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

// ── Indexes ──
transformerSchema.index({ userId: 1, status: 1 });
transformerSchema.index({ userId: 1, createdAt: -1 });

// ── Virtuals ──
transformerSchema.virtual('habitCount').get(function () {
  return this.system?.habits?.length || 0;
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

// Ensure virtuals are included in JSON
transformerSchema.set('toJSON', { virtuals: true });
transformerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Transformer', transformerSchema);
