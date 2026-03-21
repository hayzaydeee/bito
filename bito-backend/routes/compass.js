const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Compass = require('../models/Compass');
const Habit = require('../models/Habit');
const User = require('../models/User');
const compassEngine = require('../services/compassEngine');
const { buildIdentityActionRateLimitMiddleware } = require('../middleware/identityActionRateLimiter');
const { sanitizeText } = require('../utils/llmSanitizer');

// All routes require authentication
router.use(authenticateJWT);

const limitCompassClarify = buildIdentityActionRateLimitMiddleware({
  action: 'compass_clarify',
  windowMs: 60 * 1000,
  maxRequests: 20,
});

const limitCompassGenerate = buildIdentityActionRateLimitMiddleware({
  action: 'compass_generate',
  windowMs: 60 * 1000,
  maxRequests: 10,
});

// ─────────────────────────────────────────────────────────
// POST /api/compass/clarify
// Assess if clarifying questions are needed before generation
// ─────────────────────────────────────────────────────────
router.post('/clarify', limitCompassClarify, async (req, res) => {
  try {
    const userId = req.user._id;
    const { goalText } = req.body;
    const { sanitizedText: safeGoalText } = sanitizeText(goalText);

    if (!safeGoalText || typeof safeGoalText !== 'string' || safeGoalText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a goal with at least 5 characters.',
      });
    }

    if (!compassEngine.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI is temporarily unavailable. Please try again later.',
      });
    }

    const result = await compassEngine.clarify(safeGoalText.trim(), userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Clarification error:', error.message);
    // Non-fatal — frontend can skip clarification and go straight to generate
    res.json({ success: true, needsClarification: false, reasoning: 'Assessment unavailable.', goalAnalysis: null });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/compass/generate
// Generate a compass from goal text, return preview
// ─────────────────────────────────────────────────────────
router.post('/generate', limitCompassGenerate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { goalText, clarificationAnswers, parsedGoal } = req.body;
    const { sanitizedText: safeGoalText } = sanitizeText(goalText);

    if (!safeGoalText || typeof safeGoalText !== 'string' || safeGoalText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a goal with at least 5 characters.',
      });
    }

    if (safeGoalText.length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Goal text cannot exceed 3000 characters.',
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
    if (!compassEngine.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI generation is temporarily unavailable. Please try again later.',
      });
    }

    // ── Generate ──
    const result = await compassEngine.generate(safeGoalText.trim(), userId, clarificationAnswers, parsedGoal || undefined);

    if (result.goalType === 'multi' && Array.isArray(result.previews)) {
      // ── Suite: create multiple linked compasses ──
      const savedCompasses = [];
      for (const preview of result.previews) {
        const compass = new Compass({
          userId,
          goal: preview.goal,
          system: preview.system,
          status: 'preview',
          generation: preview.generation,
          suiteId: preview.suiteId || result.suiteId,
          suiteIndex: preview.suiteIndex,
          suiteName: preview.suiteName,
        });
        await compass.save();
        savedCompasses.push(compass.toObject({ virtuals: true }));
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
        compasses: savedCompasses,
      });
    } else {
      // ── Single goal: backward-compatible path ──
      const preview = result.preview || result; // support both new and legacy shapes

      const compass = new Compass({
        userId,
        goal: preview.goal,
        system: preview.system,
        status: 'preview',
        generation: preview.generation,
      });
      await compass.save();

      // ── Increment usage counter ──
      await User.findByIdAndUpdate(userId, {
        $inc: { 'subscription.usage.generationsThisMonth': 1 },
      });

      res.status(201).json({
        success: true,
        goalType: 'single',
        compass: compass.toObject({ virtuals: true }),
      });
    }
  } catch (error) {
    console.error('Compass generation error:', error.message, error.stack);

    // Mongoose validation error — likely an LLM output that slipped through sanitization
    if (error.name === 'ValidationError') {
      console.error('Compass validation details:', JSON.stringify(error.errors, null, 2));
      return res.status(502).json({
        success: false,
        error: 'AI generated an unexpected response. Please try again with a simpler goal.',
      });
    }

    // User-friendly error for known LLM/generation issues
    if (
      error.message?.includes('AI returned') ||
      error.message?.includes('AI generat') ||
      error.message?.includes('Failed to generate')
    ) {
      return res.status(502).json({ success: false, error: error.message });
    }

    // OpenAI API errors (rate limit, model errors, etc.)
    if (error.status || error.code || error.type) {
      console.error('OpenAI API error:', error.status, error.code, error.message);
      return res.status(502).json({
        success: false,
        error: 'AI service encountered an error. Please try again in a moment.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate compass. Please try again.',
    });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/compass
// List user's compasses
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

    const compasses = await Compass.find(filter)
      .sort({ suiteId: 1, suiteIndex: 1, createdAt: -1 })
      .lean({ virtuals: true });

    res.json({ success: true, compasses });
  } catch (error) {
    console.error('Error listing compasses:', error);
    res.status(500).json({ success: false, error: 'Failed to list compasses' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/compass/:id
// Get compass details
// ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const compass = await Compass.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('appliedResources.habitIds', 'name icon isActive stats')
      .lean({ virtuals: true });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }

    res.json({ success: true, compass });
  } catch (error) {
    console.error('Error fetching compass:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compass' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/compass/:id
// Update compass (edit habits in preview before applying)
// ─────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const compass = await Compass.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }

    if (compass.status !== 'preview' && compass.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Can only edit compasses in preview or draft status.',
      });
    }

    const { system } = req.body;
    if (system) {
      // Allow editing system fields (name, description, phases, habits)
      if (system.name) compass.system.name = system.name;
      if (system.description !== undefined) compass.system.description = system.description;
      if (system.icon) compass.system.icon = system.icon;
      if (Array.isArray(system.phases)) {
        compass.system.phases = system.phases;
        compass.generation.userEditsBeforeApply =
          (compass.generation.userEditsBeforeApply || 0) + 1;
      }
      if (Array.isArray(system.habits)) {
        compass.system.habits = system.habits;
        compass.generation.userEditsBeforeApply =
          (compass.generation.userEditsBeforeApply || 0) + 1;
      }
    }

    await compass.save();
    res.json({ success: true, compass: compass.toObject({ virtuals: true }) });
  } catch (error) {
    console.error('Error updating compass:', error);
    res.status(500).json({ success: false, error: 'Failed to update compass' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/compass/:id/apply
// Create real Habit documents from the compass
// ─────────────────────────────────────────────────────────
router.post('/:id/apply', async (req, res) => {
  try {
    const userId = req.user._id;
    const compass = await Compass.findOne({
      _id: req.params.id,
      userId,
    });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }

    if (compass.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'This compass has already been applied.',
      });
    }

    if (compass.status === 'archived') {
      return res.status(400).json({
        success: false,
        error: 'Cannot apply an archived compass.',
      });
    }

    // ── Collect all habits (phase-aware) ──
    const phases = compass.system?.phases || [];
    const flatHabits = compass.system?.habits || [];
    const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);

    if (!isPhased && flatHabits.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Compass has no habits to apply.',
      });
    }

    // NOTE: Active compass limit check bypassed to unblock testing — restore before launch.

        // -- Helper: create a Habit doc from a compass habit -- ──
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
        source: 'compass',
        compassId: compass._id,
        compassPhaseId: phaseId || null,
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
      compass.progress = {
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

        // -- Update compass status -- ──
    compass.markApplied(createdHabitIds);
    await compass.save();

    // ── Populate created habits for response ──
    const createdHabits = await Habit.find({ _id: { $in: createdHabitIds } }).lean();

    res.json({
      success: true,
      message: `${createdHabits.length} habits created from "${compass.system.name}".`,
      compass: compass.toObject({ virtuals: true }),
      habits: createdHabits,
    });
  } catch (error) {
    console.error('Error applying compass:', error);
    res.status(500).json({ success: false, error: 'Failed to apply compass' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/compass/:id/advance-phase
// Move to the next phase — activate its habits
// ─────────────────────────────────────────────────────────
router.post('/:id/advance-phase', async (req, res) => {
  try {
    const userId = req.user._id;
    const compass = await Compass.findOne({ _id: req.params.id, userId });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }
    if (compass.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Compass is not active.' });
    }

    const phases = compass.system?.phases || [];
    if (phases.length === 0) {
      return res.status(400).json({ success: false, error: 'Compass has no phases.' });
    }

    const currentIdx = compass.progress?.currentPhaseIndex ?? 0;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= phases.length) {
      return res.status(400).json({ success: false, error: 'Already on the final phase.' });
    }

    // Mark current phase as completed
    const currentPhase = phases[currentIdx];
    if (!compass.progress.completedPhases) compass.progress.completedPhases = [];
    compass.progress.completedPhases.push({
      phaseIndex: currentIdx,
      phaseName: currentPhase.name,
      completedAt: new Date(),
    });

    // Advance index
    compass.progress.currentPhaseIndex = nextIdx;
    compass.progress.overallCompletion = Math.round(
      (compass.progress.completedPhases.length / phases.length) * 100
    );

    await compass.save();

    // Activate next phase's habits and stamp activatedAt for analytics scoping
    const nextPhase = phases[nextIdx];
    if (nextPhase?._id) {
      await Habit.updateMany(
        { userId, compassId: compass._id, compassPhaseId: nextPhase._id },
        { $set: { isActive: true, activatedAt: new Date() } }
      );
    }

    // Fetch updated habits for response
    const activeHabits = await Habit.find({
      userId,
      compassId: compass._id,
      isActive: true,
    }).lean();

    res.json({
      success: true,
      message: `Advanced to phase: ${nextPhase.name}`,
      compass: compass.toObject({ virtuals: true }),
      activeHabits,
    });
  } catch (error) {
    console.error('Error advancing phase:', error);
    res.status(500).json({ success: false, error: 'Failed to advance phase' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/compass/:id/progress
// Get progress data: per-phase completion rates
// ─────────────────────────────────────────────────────────
router.get('/:id/progress', async (req, res) => {
  try {
    const userId = req.user._id;
    const compass = await Compass.findOne({ _id: req.params.id, userId }).lean({ virtuals: true });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }

    const phases = compass.system?.phases || [];
    const progress = compass.progress || { currentPhaseIndex: 0, completedPhases: [], overallCompletion: 0 };

    // Gather habit stats per phase
    const phaseProgress = [];
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const habits = await Habit.find({
        userId,
        compassId: compass._id,
        compassPhaseId: phase._id,
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
// POST /api/compass/:id/refine
// Send a refinement message — get AI patches + reply
// ─────────────────────────────────────────────────────────
router.post('/:id/refine', async (req, res) => {
  try {
    const userId = req.user._id;
    const compass = await Compass.findOne({ _id: req.params.id, userId });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }

    // Allow refinement on preview, draft, and active compasses
    if (compass.status === 'archived' || compass.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot refine archived or completed compasses.',
      });
    }

    const isActive = compass.status === 'active';
    const refinementMode = isActive ? 'active' : 'blueprint';

    // Check refinement limit (each turn = 1 user + 1 assistant message)
    const turnsUsed = Math.floor((compass.refinements?.length || 0) / 2);
    const turnsRemaining = Compass.MAX_REFINEMENTS - turnsUsed;
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

    if (!compassEngine.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI refinement is temporarily unavailable.',
      });
    }

    // Snapshot current state before refinement
    const phasesSnapshot = JSON.parse(JSON.stringify(compass.system.phases || []));

    // Call refine engine with mode context
    const result = await compassEngine.refine(compass, message.trim(), refinementMode);

    // Apply patches to the compass's system blueprint in place
    const changed = compassEngine.applyPatches(compass.system, result.patches);

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
            // Find the real Habit doc linked to this compass + phase
            const phase = compass.system.phases?.[patch.phase];
            if (!phase) continue;
            const habitDef = phase.habits?.[patch.habitIndex];
            if (!habitDef) continue;

            // Find matching Habit document by compassId + phase + name
            const realHabit = await Habit.findOne({
              userId,
              compassId: compass._id,
              compassPhaseId: phase._id,
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
            const phase = compass.system.phases?.[patch.phase];
            if (!phase || !patch.habit) continue;
            const currentPhaseIdx = compass.progress?.currentPhaseIndex ?? 0;
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
              source: 'compass',
              compassId: compass._id,
              compassPhaseId: phase._id,
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
            compass.appliedResources.habitIds.push(newHabit._id);
            habitMutations.push({ op: 'created', habitId: newHabit._id, name: newHabit.name });

          } else if (patch.op === 'removeHabit') {
            const phase = phasesSnapshot[patch.phase];
            if (!phase) continue;
            const habitDef = phase.habits?.[patch.habitIndex];
            if (!habitDef) continue;

            // Archive the real habit (don't delete — preserve data)
            const realHabit = await Habit.findOne({
              userId,
              compassId: compass._id,
              compassPhaseId: compass.system.phases?.[patch.phase]?._id,
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
    compass.refinements.push(
      { role: 'user', message: message.trim(), phasesSnapshot },
      { role: 'assistant', message: result.assistantMessage, phasesSnapshot: null }
    );

    // Track edit count
    compass.generation.userEditsBeforeApply =
      (compass.generation.userEditsBeforeApply || 0) + 1;

    compass.markModified('system');
    compass.markModified('refinements');
    if (isActive) compass.markModified('appliedResources');
    await compass.save();

    res.json({
      success: true,
      refinementMode,
      assistantMessage: result.assistantMessage,
      patches: result.patches,
      changed,
      habitMutations: isActive ? habitMutations : [],
      turnsRemaining: Compass.MAX_REFINEMENTS - Math.floor(compass.refinements.length / 2),
      compass: compass.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error('Error refining compass:', error);

    if (error.message?.includes('AI returned') || error.message?.includes('AI refinement')) {
      return res.status(502).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Failed to refine compass' });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/compass/:id/personalize
// Update user personalization fields (icon, color, notes, pin).
router.patch('/:id/personalize', async (req, res) => {
  try {
    const compass = await Compass.findOne({ _id: req.params.id, userId: req.user._id });
    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
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

    const updated = await Compass.findByIdAndUpdate(
      compass._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('appliedResources.habitIds', 'name icon isActive isArchived');

    res.json({ success: true, compass: updated });
  } catch (error) {
    console.error('Error personalizing compass:', error);
    res.status(500).json({ success: false, error: 'Failed to update personalization' });
  }
});

// POST /api/compass/:id/discard
// Clean discard with cascade options for active compasses.
//   mode: "keep_habits" — archive compass, leave habits untouched
//         "cascade"     — archive compass + archive all linked habits
//         "delete_habits" — archive compass + permanently delete linked habits & entries
// Falls back to simple archive for non-active compasses.
// ─────────────────────────────────────────────────────────
router.post('/:id/discard', async (req, res) => {
  try {
    const { mode = 'keep_habits' } = req.body;

    const compass = await Compass.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }

    if (compass.status === 'archived') {
      return res.status(400).json({ success: false, error: 'Compass is already archived.' });
    }

    const result = { habitsArchived: 0, habitsDeleted: 0, habitNames: [] };

    // For active compasses with linked habits, handle cascade
    if (compass.status === 'active' && compass.appliedResources?.habitIds?.length > 0) {
      const habitIds = compass.appliedResources.habitIds.map(
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

    // Archive the compass itself
    compass.archive();
    await compass.save();

    res.json({
      success: true,
      message: `Compass discarded.${result.habitsArchived ? ` ${result.habitsArchived} habits archived.` : ''}${result.habitsDeleted ? ` ${result.habitsDeleted} habits deleted.` : ''}`,
      mode,
      ...result,
    });
  } catch (error) {
    console.error('Error discarding compass:', error);
    res.status(500).json({ success: false, error: 'Failed to discard compass' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/compass/:id
// Archive (soft delete) a compass — simple version (kept for backward compat)
// ─────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const compass = await Compass.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!compass) {
      return res.status(404).json({ success: false, error: 'Compass not found' });
    }

    compass.archive();
    await compass.save();

    res.json({ success: true, message: 'Compass archived.' });
  } catch (error) {
    console.error('Error archiving compass:', error);
    res.status(500).json({ success: false, error: 'Failed to archive compass' });
  }
});

module.exports = router;
