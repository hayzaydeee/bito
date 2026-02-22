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
      // Allow editing system fields (name, description, habits)
      if (system.name) transformer.system.name = system.name;
      if (system.description !== undefined) transformer.system.description = system.description;
      if (system.icon) transformer.system.icon = system.icon;
      if (Array.isArray(system.habits)) {
        transformer.system.habits = system.habits;
        // Track edits
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

    const habits = transformer.system?.habits;
    if (!habits || habits.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transformer has no habits to apply.',
      });
    }

    // NOTE: Active transformer limit check bypassed to unblock testing — restore before launch.
    // const user = await User.findById(userId);
    // const maxActive = user?.subscription?.limits?.maxActiveTransformers || 1;
    // const activeCount = await Transformer.countDocuments({ userId, status: 'active' });
    // if (activeCount >= maxActive) { ... }

    // ── Create real Habit documents ──
    const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const createdHabitIds = [];

    for (const h of habits) {
      // Map transformer frequency → Habit model frequency
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

      // Map target unit to Habit model unit enum
      const unitMap = {
        minutes: 'minutes',
        hours: 'hours',
        pages: 'pages',
        miles: 'miles',
        calories: 'calories',
        glasses: 'glasses',
        reps: 'custom',
        items: 'custom',
      };
      const targetUnit = unitMap[h.target?.unit?.toLowerCase()] || 'times';

      const habitData = {
        userId,
        name: h.name,
        description: h.description || '',
        source: 'transformer',
        transformerId: transformer._id,
        category: h.category || 'other',
        icon: h.icon || '🎯',
        methodology: h.methodology || 'boolean',
        frequency,
        weeklyTarget,
        target: {
          value: h.target?.value || 1,
          unit: targetUnit,
          ...(targetUnit === 'custom' && { customUnit: h.target?.unit || '' }),
        },
        schedule: {
          days: scheduleDays,
        },
      };

      const habit = new Habit(habitData);
      await habit.save();
      createdHabitIds.push(habit._id);
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
