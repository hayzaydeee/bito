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
// POST /api/transformers/clarify
// Assess if clarifying questions are needed before generation
// ─────────────────────────────────────────────────────────
router.post('/clarify', async (req, res) => {
  try {
    const userId = req.user._id;
    const { goalText } = req.body;

    if (!goalText || typeof goalText !== 'string' || goalText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a goal with at least 5 characters.',
      });
    }

    if (!transformerEngine.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI is temporarily unavailable. Please try again later.',
      });
    }

    const result = await transformerEngine.clarify(goalText.trim(), userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Clarification error:', error.message);
    // Non-fatal — frontend can skip clarification and go straight to generate
    res.json({ success: true, needsClarification: false, reasoning: 'Assessment unavailable.', goalAnalysis: null });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/transformers/generate
// Generate a transformer from goal text, return preview
// ─────────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user._id;
    const { goalText, clarificationAnswers } = req.body;

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
    const result = await transformerEngine.generate(goalText.trim(), userId, clarificationAnswers);

    if (result.goalType === 'multi' && Array.isArray(result.previews)) {
      // ── Suite: create multiple linked transformers ──
      const savedTransformers = [];
      for (const preview of result.previews) {
        const transformer = new Transformer({
          userId,
          goal: preview.goal,
          system: preview.system,
          status: 'preview',
          generation: preview.generation,
          suiteId: preview.suiteId || result.suiteId,
          suiteIndex: preview.suiteIndex,
          suiteName: preview.suiteName,
        });
        await transformer.save();
        savedTransformers.push(transformer.toObject({ virtuals: true }));
      }

      // ── Increment usage counter (counts as 1 generation even for suites) ──
      await User.findByIdAndUpdate(userId, {
        $inc: { 'subscription.usage.generationsThisMonth': 1 },
      });

      res.status(201).json({
        success: true,
        goalType: 'multi',
        suiteId: result.suiteId,
        suiteName: result.suiteName,
        transformers: savedTransformers,
      });
    } else {
      // ── Single goal: backward-compatible path ──
      const preview = result.preview || result; // support both new and legacy shapes

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
        goalType: 'single',
        transformer: transformer.toObject({ virtuals: true }),
      });
    }
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
      .sort({ suiteId: 1, suiteIndex: 1, createdAt: -1 })
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

      const isFirstPhase = phaseIndex === 0;

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
        isActive: isFirstPhase, // Only Phase 1 habits start active
        activatedAt: isFirstPhase ? new Date() : null, // Analytics scoping: only count entries from activation onwards
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

    // Activate next phase's habits and stamp activatedAt for analytics scoping
    const nextPhase = phases[nextIdx];
    if (nextPhase?._id) {
      await Habit.updateMany(
        { userId, transformerId: transformer._id, transformerPhaseId: nextPhase._id },
        { $set: { isActive: true, activatedAt: new Date() } }
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

    // Allow refinement on preview, draft, and active transformers
    if (transformer.status === 'archived' || transformer.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot refine archived or completed transformers.',
      });
    }

    const isActive = transformer.status === 'active';
    const refinementMode = isActive ? 'active' : 'blueprint';

    // Check refinement limit (each turn = 1 user + 1 assistant message)
    const turnsUsed = Math.floor((transformer.refinements?.length || 0) / 2);
    const turnsRemaining = Transformer.MAX_REFINEMENTS - turnsUsed;
    if (turnsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Maximum refinement turns reached.',
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

    // Call refine engine with mode context
    const result = await transformerEngine.refine(transformer, message.trim(), refinementMode);

    // Apply patches to the transformer's system blueprint in place
    const changed = transformerEngine.applyPatches(transformer.system, result.patches);

    // ── Active mode: propagate patches to real Habit documents ──
    const habitMutations = [];
    if (isActive && result.patches?.length > 0) {
      const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      const unitMap = {
        minutes: 'minutes', hours: 'hours', pages: 'pages', miles: 'miles',
        calories: 'calories', glasses: 'glasses', reps: 'custom', items: 'custom',
      };

      for (const patch of result.patches) {
        try {
          if (patch.op === 'modifyHabit') {
            // Find the real Habit doc linked to this transformer + phase
            const phase = transformer.system.phases?.[patch.phase];
            if (!phase) continue;
            const habitDef = phase.habits?.[patch.habitIndex];
            if (!habitDef) continue;

            // Find matching Habit document by transformerId + phase + name
            const realHabit = await Habit.findOne({
              userId,
              transformerId: transformer._id,
              transformerPhaseId: phase._id,
              name: phasesSnapshot[patch.phase]?.habits?.[patch.habitIndex]?.name,
            });

            if (realHabit) {
              const updates = {};
              const f = patch.fields || {};
              if (f.name) updates.name = f.name;
              if (f.description !== undefined) updates.description = f.description;
              if (f.icon) updates.icon = f.icon;
              if (f.category) updates.category = f.category;
              if (f.methodology) updates.methodology = f.methodology;
              if (f.target) {
                updates['target.value'] = f.target.value || 1;
                updates['target.unit'] = unitMap[f.target?.unit?.toLowerCase()] || 'times';
              }
              if (f.frequency) {
                if (f.frequency.type === 'daily') {
                  updates.frequency = 'daily';
                  updates.weeklyTarget = 7;
                } else if (f.frequency.type === 'weekly') {
                  updates.frequency = 'weekly';
                  updates.weeklyTarget = f.frequency.timesPerWeek || 3;
                } else if (f.frequency.type === 'specific_days') {
                  updates.frequency = 'weekly';
                  const days = (f.frequency.days || []).map(d => DAY_MAP[d?.toLowerCase()]).filter(n => n !== undefined);
                  updates.weeklyTarget = days.length;
                  updates['schedule.days'] = days;
                }
              }

              if (Object.keys(updates).length > 0) {
                await Habit.findByIdAndUpdate(realHabit._id, { $set: updates });
                habitMutations.push({ op: 'modified', habitId: realHabit._id, name: realHabit.name, updates: Object.keys(updates) });
              }
            }
          } else if (patch.op === 'addHabit') {
            const phase = transformer.system.phases?.[patch.phase];
            if (!phase || !patch.habit) continue;
            const currentPhaseIdx = transformer.progress?.currentPhaseIndex ?? 0;
            const isCurrentOrCompleted = patch.phase <= currentPhaseIdx;

            // Build and create a real Habit
            let frequency = 'daily';
            let weeklyTarget = 7;
            const scheduleDays = [];
            const hFreq = patch.habit.frequency;
            if (hFreq?.type === 'weekly') {
              frequency = 'weekly';
              weeklyTarget = hFreq.timesPerWeek || 3;
            } else if (hFreq?.type === 'specific_days') {
              frequency = 'weekly';
              const days = (hFreq.days || []).map(d => DAY_MAP[d?.toLowerCase()]).filter(n => n !== undefined);
              weeklyTarget = days.length;
              scheduleDays.push(...days);
            }

            const newHabit = new Habit({
              userId,
              name: patch.habit.name,
              description: patch.habit.description || '',
              source: 'transformer',
              transformerId: transformer._id,
              transformerPhaseId: phase._id,
              category: patch.habit.category || 'other',
              icon: patch.habit.icon || '🎯',
              methodology: patch.habit.methodology || 'boolean',
              frequency,
              weeklyTarget,
              isActive: isCurrentOrCompleted,
              activatedAt: isCurrentOrCompleted ? new Date() : null,
              target: {
                value: patch.habit.target?.value || 1,
                unit: unitMap[patch.habit.target?.unit?.toLowerCase()] || 'times',
              },
              schedule: { days: scheduleDays },
            });
            await newHabit.save();
            transformer.appliedResources.habitIds.push(newHabit._id);
            habitMutations.push({ op: 'created', habitId: newHabit._id, name: newHabit.name });

          } else if (patch.op === 'removeHabit') {
            const phase = phasesSnapshot[patch.phase];
            if (!phase) continue;
            const habitDef = phase.habits?.[patch.habitIndex];
            if (!habitDef) continue;

            // Archive the real habit (don't delete — preserve data)
            const realHabit = await Habit.findOne({
              userId,
              transformerId: transformer._id,
              transformerPhaseId: transformer.system.phases?.[patch.phase]?._id,
              name: habitDef.name,
            });
            if (realHabit) {
              realHabit.isActive = false;
              realHabit.isArchived = true;
              await realHabit.save();
              habitMutations.push({ op: 'archived', habitId: realHabit._id, name: realHabit.name });
            }
          }
        } catch (mutErr) {
          console.warn('[Refine] Habit mutation failed:', patch.op, mutErr.message);
        }
      }
    }

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
    if (isActive) transformer.markModified('appliedResources');
    await transformer.save();

    res.json({
      success: true,
      refinementMode,
      assistantMessage: result.assistantMessage,
      patches: result.patches,
      changed,
      habitMutations: isActive ? habitMutations : [],
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
// PATCH /api/transformers/:id/personalize
// Update user personalization fields (icon, color, notes, pin).
router.patch('/:id/personalize', async (req, res) => {
  try {
    const transformer = await Transformer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    const allowed = ['icon', 'color', 'notes', 'isPinned'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[`personalization.${key}`] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    const updated = await Transformer.findByIdAndUpdate(
      transformer._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('appliedResources.habitIds', 'name icon isActive isArchived');

    res.json({ success: true, transformer: updated });
  } catch (error) {
    console.error('Error personalizing transformer:', error);
    res.status(500).json({ success: false, error: 'Failed to update personalization' });
  }
});

// POST /api/transformers/:id/discard
// Clean discard with cascade options for active transformers.
//   mode: "keep_habits" — archive transformer, leave habits untouched
//         "cascade"     — archive transformer + archive all linked habits
//         "delete_habits" — archive transformer + permanently delete linked habits & entries
// Falls back to simple archive for non-active transformers.
// ─────────────────────────────────────────────────────────
router.post('/:id/discard', async (req, res) => {
  try {
    const { mode = 'keep_habits' } = req.body;

    const transformer = await Transformer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transformer) {
      return res.status(404).json({ success: false, error: 'Transformer not found' });
    }

    if (transformer.status === 'archived') {
      return res.status(400).json({ success: false, error: 'Transformer is already archived.' });
    }

    const result = { habitsArchived: 0, habitsDeleted: 0, habitNames: [] };

    // For active transformers with linked habits, handle cascade
    if (transformer.status === 'active' && transformer.appliedResources?.habitIds?.length > 0) {
      const habitIds = transformer.appliedResources.habitIds.map(
        (h) => (typeof h === 'object' && h._id ? h._id : h)
      );

      if (mode === 'cascade') {
        // Archive all linked habits
        const habits = await Habit.find({ _id: { $in: habitIds }, userId: req.user._id });
        for (const habit of habits) {
          if (!habit.isArchived) {
            habit.isArchived = true;
            habit.isActive = false;
            await habit.save();
            result.habitsArchived++;
            result.habitNames.push(habit.name);
          }
        }
      } else if (mode === 'delete_habits') {
        // Permanently delete habits and their entries
        const habits = await Habit.find({ _id: { $in: habitIds }, userId: req.user._id });
        const HabitEntry = require('../models/HabitEntry');
        for (const habit of habits) {
          await HabitEntry.deleteMany({ habitId: habit._id });
          await Habit.deleteOne({ _id: habit._id });
          result.habitsDeleted++;
          result.habitNames.push(habit.name);
        }
      }
      // mode === 'keep_habits' — do nothing to habits
    }

    // Archive the transformer itself
    transformer.archive();
    await transformer.save();

    res.json({
      success: true,
      message: `Transformer discarded.${result.habitsArchived ? ` ${result.habitsArchived} habits archived.` : ''}${result.habitsDeleted ? ` ${result.habitsDeleted} habits deleted.` : ''}`,
      mode,
      ...result,
    });
  } catch (error) {
    console.error('Error discarding transformer:', error);
    res.status(500).json({ success: false, error: 'Failed to discard transformer' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/transformers/:id
// Archive (soft delete) a transformer — simple version (kept for backward compat)
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
