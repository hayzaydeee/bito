const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Transformer = require('../models/Transformer');
const Habit = require('../models/Habit');
const User = require('../models/User');
const transformerEngine = require('../services/transformerEngine');

// All routes require authentication
router.use(authenticateJWT);

// ─────────────────────────────────────────────────────────
// POST /api/transformers/generate
// Generate a transformer from goal text, return preview
// ─────────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user._id;
    const { goalText } = req.body;

    if (!goalText || typeof goalText !== 'string' || goalText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a goal with at least 5 characters.',
      });
    }

    if (goalText.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Goal text cannot exceed 1000 characters.',
      });
    }

    // ── Rate limiting ──
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // NOTE: Generation limit check bypassed to unblock testing — restore before launch.
    // const limits = user.subscription?.limits || {};
    // const usage = user.subscription?.usage || {};
    // const maxGen = limits.maxGenerationsPerMonth || 3;
    // ... (monthly counter reset & limit enforcement skipped)

    // ── Check LLM availability ──
    if (!transformerEngine.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI generation is temporarily unavailable. Please try again later.',
      });
    }

    // ── Generate ──
    const preview = await transformerEngine.generate(goalText.trim(), userId);

    // ── Save as preview transformer ──
    const transformer = new Transformer({
      userId,
      goal: preview.goal,
      system: preview.system,
      status: 'preview',
      generation: preview.generation,
    });
    await transformer.save();

    // ── Increment usage counter ──
    await User.findByIdAndUpdate(userId, {
      $inc: { 'subscription.usage.generationsThisMonth': 1 },
    });

    res.status(201).json({
      success: true,
      transformer: transformer.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error('Transformer generation error:', error.message, error.stack);

    // Mongoose validation error — likely an LLM output that slipped through sanitization
    if (error.name === 'ValidationError') {
      console.error('Transformer validation details:', JSON.stringify(error.errors, null, 2));
      return res.status(502).json({
        success: false,
        error: 'AI generated an unexpected response. Please try again with a simpler goal.',
      });
    }

    // User-friendly error for known LLM issues
    if (error.message?.includes('AI returned') || error.message?.includes('AI generation')) {
      return res.status(502).json({ success: false, error: error.message });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate transformer. Please try again.',
    });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/transformers
// List user's transformers
// ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const filter = { userId };
    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }
    // Don't show archived by default
    if (!status) {
      filter.status = { $ne: 'archived' };
    }

    const transformers = await Transformer.find(filter)
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    res.json({ success: true, transformers });
  } catch (error) {
    console.error('Error listing transformers:', error);
    res.status(500).json({ success: false, error: 'Failed to list transformers' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/transformers/:id
// Get transformer details
// ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const transformer = await Transformer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('appliedResources.habitIds', 'name icon isActive stats')
      .lean({ virtuals: true });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    res.json({ success: true, transformer });
  } catch (error) {
    console.error('Error fetching transformer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transformer' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/transformers/:id
// Update transformer (edit habits in preview before applying)
// ─────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const transformer = await Transformer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    if (transformer.status !== 'preview' && transformer.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Can only edit transformers in preview or draft status.',
      });
    }

    const { system } = req.body;
    if (system) {
      // Allow editing system fields (name, description, phases, habits)
      if (system.name) transformer.system.name = system.name;
      if (system.description !== undefined) transformer.system.description = system.description;
      if (system.icon) transformer.system.icon = system.icon;
      if (Array.isArray(system.phases)) {
        transformer.system.phases = system.phases;
        transformer.generation.userEditsBeforeApply =
          (transformer.generation.userEditsBeforeApply || 0) + 1;
      }
      if (Array.isArray(system.habits)) {
        transformer.system.habits = system.habits;
        transformer.generation.userEditsBeforeApply =
          (transformer.generation.userEditsBeforeApply || 0) + 1;
      }
    }

    await transformer.save();
    res.json({ success: true, transformer: transformer.toObject({ virtuals: true }) });
  } catch (error) {
    console.error('Error updating transformer:', error);
    res.status(500).json({ success: false, error: 'Failed to update transformer' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/transformers/:id/apply
// Create real Habit documents from the transformer
// ─────────────────────────────────────────────────────────
router.post('/:id/apply', async (req, res) => {
  try {
    const userId = req.user._id;
    const transformer = await Transformer.findOne({
      _id: req.params.id,
      userId,
    });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    if (transformer.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'This transformer has already been applied.',
      });
    }

    if (transformer.status === 'archived') {
      return res.status(400).json({
        success: false,
        error: 'Cannot apply an archived transformer.',
      });
    }

    // ── Collect all habits (phase-aware) ──
    const phases = transformer.system?.phases || [];
    const flatHabits = transformer.system?.habits || [];
    const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);

    if (!isPhased && flatHabits.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transformer has no habits to apply.',
      });
    }

    // NOTE: Active transformer limit check bypassed to unblock testing — restore before launch.

    // ── Helper: create a Habit doc from a transformer habit ──
    const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const unitMap = {
      minutes: 'minutes', hours: 'hours', pages: 'pages', miles: 'miles',
      calories: 'calories', glasses: 'glasses', reps: 'custom', items: 'custom',
    };

    function buildHabitData(h, phaseId, phaseIndex) {
      let frequency = 'daily';
      let weeklyTarget = 3;
      const scheduleDays = [];

      if (h.frequency?.type === 'weekly') {
        frequency = 'weekly';
        weeklyTarget = h.frequency.timesPerWeek || 3;
      } else if (h.frequency?.type === 'specific_days') {
        frequency = 'weekly';
        if (Array.isArray(h.frequency.days)) {
          weeklyTarget = h.frequency.days.length;
          for (const d of h.frequency.days) {
            const num = DAY_MAP[d.toLowerCase()];
            if (num !== undefined) scheduleDays.push(num);
          }
        }
      }

      const targetUnit = unitMap[h.target?.unit?.toLowerCase()] || 'times';

      return {
        userId,
        name: h.name,
        description: h.description || '',
        source: 'transformer',
        transformerId: transformer._id,
        transformerPhaseId: phaseId || null,
        category: h.category || 'other',
        icon: h.icon || '🎯',
        methodology: h.methodology || 'boolean',
        frequency,
        weeklyTarget,
        isActive: phaseIndex === 0, // Only Phase 1 habits start active
        target: {
          value: h.target?.value || 1,
          unit: targetUnit,
          ...(targetUnit === 'custom' && { customUnit: h.target?.unit || '' }),
        },
        schedule: { days: scheduleDays },
      };
    }

    // ── Create Habit documents ──
    const createdHabitIds = [];

    if (isPhased) {
      for (let pi = 0; pi < phases.length; pi++) {
        const phase = phases[pi];
        const phaseId = phase._id;
        for (const h of phase.habits || []) {
          const habit = new Habit(buildHabitData(h, phaseId, pi));
          await habit.save();
          createdHabitIds.push(habit._id);
        }
      }
      // Initialize progress tracking
      transformer.progress = {
        currentPhaseIndex: 0,
        completedPhases: [],
        overallCompletion: 0,
      };
    } else {
      // Legacy flat habits — all active
      for (const h of flatHabits) {
        const habit = new Habit(buildHabitData(h, null, 0));
        await habit.save();
        createdHabitIds.push(habit._id);
      }
    }

    // ── Update transformer status ──
    transformer.markApplied(createdHabitIds);
    await transformer.save();

    // ── Populate created habits for response ──
    const createdHabits = await Habit.find({ _id: { $in: createdHabitIds } }).lean();

    res.json({
      success: true,
      message: `${createdHabits.length} habits created from "${transformer.system.name}".`,
      transformer: transformer.toObject({ virtuals: true }),
      habits: createdHabits,
    });
  } catch (error) {
    console.error('Error applying transformer:', error);
    res.status(500).json({ success: false, error: 'Failed to apply transformer' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/transformers/:id/advance-phase
// Move to the next phase — activate its habits
// ─────────────────────────────────────────────────────────
router.post('/:id/advance-phase', async (req, res) => {
  try {
    const userId = req.user._id;
    const transformer = await Transformer.findOne({ _id: req.params.id, userId });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }
    if (transformer.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Transformer is not active.' });
    }

    const phases = transformer.system?.phases || [];
    if (phases.length === 0) {
      return res.status(400).json({ success: false, error: 'Transformer has no phases.' });
    }

    const currentIdx = transformer.progress?.currentPhaseIndex ?? 0;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= phases.length) {
      return res.status(400).json({ success: false, error: 'Already on the final phase.' });
    }

    // Mark current phase as completed
    const currentPhase = phases[currentIdx];
    if (!transformer.progress.completedPhases) transformer.progress.completedPhases = [];
    transformer.progress.completedPhases.push({
      phaseIndex: currentIdx,
      phaseName: currentPhase.name,
      completedAt: new Date(),
    });

    // Advance index
    transformer.progress.currentPhaseIndex = nextIdx;
    transformer.progress.overallCompletion = Math.round(
      (transformer.progress.completedPhases.length / phases.length) * 100
    );

    await transformer.save();

    // Activate next phase's habits
    const nextPhase = phases[nextIdx];
    if (nextPhase?._id) {
      await Habit.updateMany(
        { userId, transformerId: transformer._id, transformerPhaseId: nextPhase._id },
        { $set: { isActive: true } }
      );
    }

    // Fetch updated habits for response
    const activeHabits = await Habit.find({
      userId,
      transformerId: transformer._id,
      isActive: true,
    }).lean();

    res.json({
      success: true,
      message: `Advanced to phase: ${nextPhase.name}`,
      transformer: transformer.toObject({ virtuals: true }),
      activeHabits,
    });
  } catch (error) {
    console.error('Error advancing phase:', error);
    res.status(500).json({ success: false, error: 'Failed to advance phase' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/transformers/:id/progress
// Get progress data: per-phase completion rates
// ─────────────────────────────────────────────────────────
router.get('/:id/progress', async (req, res) => {
  try {
    const userId = req.user._id;
    const transformer = await Transformer.findOne({ _id: req.params.id, userId }).lean({ virtuals: true });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    const phases = transformer.system?.phases || [];
    const progress = transformer.progress || { currentPhaseIndex: 0, completedPhases: [], overallCompletion: 0 };

    // Gather habit stats per phase
    const phaseProgress = [];
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const habits = await Habit.find({
        userId,
        transformerId: transformer._id,
        transformerPhaseId: phase._id,
      }).select('name isActive stats streak').lean();

      const isCompleted = progress.completedPhases?.some((cp) => cp.phaseIndex === i);
      const isCurrent = i === progress.currentPhaseIndex;
      const isLocked = i > progress.currentPhaseIndex && !isCompleted;

      phaseProgress.push({
        phaseIndex: i,
        name: phase.name,
        durationDays: phase.durationDays,
        description: phase.description,
        status: isCompleted ? 'completed' : isCurrent ? 'active' : isLocked ? 'locked' : 'upcoming',
        habits: habits.map((h) => ({
          _id: h._id,
          name: h.name,
          isActive: h.isActive,
          completionRate: h.stats?.completionRate || 0,
          currentStreak: h.streak?.current || 0,
        })),
      });
    }

    res.json({
      success: true,
      progress: {
        currentPhaseIndex: progress.currentPhaseIndex,
        overallCompletion: progress.overallCompletion,
        completedPhases: progress.completedPhases,
        phases: phaseProgress,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch progress' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/transformers/:id/refine
// Send a refinement message — get AI patches + reply
// ─────────────────────────────────────────────────────────
router.post('/:id/refine', async (req, res) => {
  try {
    const userId = req.user._id;
    const transformer = await Transformer.findOne({ _id: req.params.id, userId });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    if (transformer.status !== 'preview' && transformer.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Can only refine transformers in preview or draft status.',
      });
    }

    // Check refinement limit
    const turnsRemaining = Transformer.MAX_REFINEMENTS - (transformer.refinements?.length || 0);
    if (turnsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Maximum refinement turns reached. Please apply or regenerate.',
      });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a refinement message.',
      });
    }

    if (!transformerEngine.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI refinement is temporarily unavailable.',
      });
    }

    // Snapshot current state before refinement
    const phasesSnapshot = JSON.parse(JSON.stringify(transformer.system.phases || []));

    // Call refine engine
    const result = await transformerEngine.refine(transformer, message.trim());

    // Apply patches to system in place
    const changed = transformerEngine.applyPatches(transformer.system, result.patches);

    // Record refinement messages
    transformer.refinements.push(
      { role: 'user', message: message.trim(), phasesSnapshot },
      { role: 'assistant', message: result.assistantMessage, phasesSnapshot: null }
    );

    // Track edit count
    transformer.generation.userEditsBeforeApply =
      (transformer.generation.userEditsBeforeApply || 0) + 1;

    transformer.markModified('system');
    transformer.markModified('refinements');
    await transformer.save();

    res.json({
      success: true,
      assistantMessage: result.assistantMessage,
      patches: result.patches,
      changed,
      turnsRemaining: Transformer.MAX_REFINEMENTS - Math.floor(transformer.refinements.length / 2),
      transformer: transformer.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error('Error refining transformer:', error);

    if (error.message?.includes('AI returned') || error.message?.includes('AI refinement')) {
      return res.status(502).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Failed to refine transformer' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/transformers/:id
// Archive (soft delete) a transformer
// ─────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const transformer = await Transformer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    transformer.archive();
    await transformer.save();

    res.json({ success: true, message: 'Transformer archived.' });
  } catch (error) {
    console.error('Error archiving transformer:', error);
    res.status(500).json({ success: false, error: 'Failed to archive transformer' });
  }
});

module.exports = router;
