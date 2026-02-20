const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateJWT } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Challenge = require('../models/Challenge');
const Workspace = require('../models/Workspace');
const Activity = require('../models/Activity');
const Habit = require('../models/Habit');
const { invalidateCache } = require('../controllers/challengeController');

// All routes require auth
router.use(authenticateJWT);

// ─────────────────────────────────────────────────────────
// GET /api/workspaces/:workspaceId/challenges
// List challenges for a workspace
// ─────────────────────────────────────────────────────────
router.get('/workspaces/:workspaceId/challenges', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { status } = req.query; // optional filter: active, upcoming, completed, cancelled

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const options = {};
    if (status) options.status = status.split(',');

    const challenges = await Challenge.findByWorkspace(workspaceId, options);

    res.json({ success: true, challenges });
  } catch (error) {
    console.error('Error listing challenges:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch challenges' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/challenges
// Create a challenge
// ─────────────────────────────────────────────────────────
router.post('/workspaces/:workspaceId/challenges', [
  body('title').trim().isLength({ min: 3, max: 60 }).withMessage('Title must be 3-60 characters'),
  body('type').isIn(['streak', 'cumulative', 'consistency', 'team_goal']).withMessage('Invalid challenge type'),
  body('rules.targetValue').isNumeric({ min: 1 }).withMessage('Target value must be a positive number'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('icon').optional().isString(),
  body('habitId').optional().isMongoId(),
  body('habitSlot').optional().trim().isLength({ max: 200 }),
  body('habitMatchMode').optional().isIn(['single', 'all', 'any', 'minimum']),
  body('habitMatchMinimum').optional().isInt({ min: 1 }),
  body('rules.targetUnit').optional().isIn(['days', 'completions', 'minutes', 'hours', 'percent', 'custom']),
  body('rules.gracePeriodHours').optional().isInt({ min: 0, max: 12 }),
  body('rules.allowMakeupDays').optional().isBoolean(),
  body('rules.minimumDailyValue').optional().isNumeric(),
  body('settings.maxParticipants').optional().isInt({ min: 2 }),
  body('settings.allowLateJoin').optional().isBoolean(),
  body('settings.showLeaderboard').optional().isBoolean(),
  body('reward').optional().trim().isLength({ max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { workspaceId } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Only owner/admin/member can create (not viewer)
    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      return res.status(403).json({ success: false, error: 'Viewers cannot create challenges' });
    }

    const { title, description, icon, type, habitId, habitSlot, habitMatchMode, habitMatchMinimum, rules, startDate, endDate, settings, reward, milestones } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({ success: false, error: 'End date must be after start date' });
    }

    // Determine initial status
    const now = new Date();
    let status = 'upcoming';
    if (start <= now) status = 'active';

    const challenge = new Challenge({
      workspaceId,
      createdBy: userId,
      title,
      description,
      icon: icon || '🏆',
      type,
      habitId: habitId || null,
      habitSlot: habitSlot || null,
      habitMatchMode: habitMatchMode || 'single',
      habitMatchMinimum: habitMatchMode === 'minimum' ? (habitMatchMinimum || 1) : null,
      rules: {
        targetValue: rules.targetValue,
        targetUnit: rules.targetUnit || 'days',
        minimumDailyValue: rules.minimumDailyValue || null,
        allowMakeupDays: rules.allowMakeupDays || false,
        gracePeriodHours: rules.gracePeriodHours ?? 4,
      },
      startDate: start,
      endDate: end,
      status,
      participants: [
        {
          userId,
          joinedAt: new Date(),
          progress: { currentValue: 0, currentStreak: 0, bestStreak: 0, completionRate: 0, lastLoggedAt: null },
          status: 'active',
        },
      ],
      milestones: milestones || [],
      stats: { participantCount: 1, completedCount: 0, averageProgress: 0, topStreak: 0 },
      settings: {
        maxParticipants: settings?.maxParticipants || null,
        allowLateJoin: settings?.allowLateJoin !== false,
        showLeaderboard: settings?.showLeaderboard !== false,
        anonymizeLeaderboard: settings?.anonymizeLeaderboard || false,
      },
      reward: reward || '🏆 Challenge Completion Badge',
    });

    await challenge.save();

    // Generate feed event
    await Activity.create({
      workspaceId,
      userId,
      type: 'challenge_started',
      data: {
        challengeId: challenge._id,
        challengeName: challenge.title,
        challengeType: challenge.type,
        message: `started challenge: ${challenge.title}`,
      },
      visibility: 'workspace',
    });

    // Populate for response
    await challenge.populate('createdBy', 'name avatar');
    await challenge.populate('participants.userId', 'name avatar');

    res.status(201).json({ success: true, challenge });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to create challenge' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/challenges/:id
// Get challenge details
// ─────────────────────────────────────────────────────────
router.get('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('participants.userId', 'name avatar')
      .populate('habitId', 'name icon');

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    // Verify membership
    const workspace = await Workspace.findById(challenge.workspaceId);
    if (!workspace || !workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      challenge: {
        ...challenge.toObject({ virtuals: true }),
        leaderboard: challenge.settings.showLeaderboard ? challenge.getLeaderboard() : null,
      },
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch challenge' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/challenges/:id
// Update challenge (creator/admin only, only before active)
// ─────────────────────────────────────────────────────────
router.put('/challenges/:id', [
  body('title').optional().trim().isLength({ min: 3, max: 60 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('icon').optional().isString(),
  body('rules.targetValue').optional().isNumeric({ min: 1 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('reward').optional().trim().isLength({ max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    // Only creator or workspace admin/owner can edit
    const workspace = await Workspace.findById(challenge.workspaceId);
    const role = workspace?.getMemberRole(req.user._id);
    const isCreator = challenge.createdBy.equals(req.user._id);
    if (!isCreator && !['owner', 'admin'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Only the creator or admins can edit challenges' });
    }

    // Only editable while upcoming
    if (challenge.status !== 'upcoming') {
      return res.status(400).json({ success: false, error: 'Cannot edit an active or completed challenge' });
    }

    const allowedFields = ['title', 'description', 'icon', 'reward', 'startDate', 'endDate', 'habitSlot', 'habitMatchMode', 'habitMatchMinimum'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) challenge[field] = req.body[field];
    });

    if (req.body.rules) {
      Object.assign(challenge.rules, req.body.rules);
    }
    if (req.body.settings) {
      Object.assign(challenge.settings, req.body.settings);
    }

    await challenge.save();
    await challenge.populate('createdBy', 'name avatar');
    await challenge.populate('participants.userId', 'name avatar');

    res.json({ success: true, challenge });
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to update challenge' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/challenges/:id
// Cancel challenge (creator/admin only)
// ─────────────────────────────────────────────────────────
router.delete('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const workspace = await Workspace.findById(challenge.workspaceId);
    const role = workspace?.getMemberRole(req.user._id);
    const isCreator = challenge.createdBy.equals(req.user._id);
    if (!isCreator && !['owner', 'admin'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Only the creator or admins can cancel challenges' });
    }

    challenge.status = 'cancelled';
    await challenge.save();

    res.json({ success: true, message: 'Challenge cancelled' });
  } catch (error) {
    console.error('Error cancelling challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel challenge' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/challenges/:id/join
// Join a challenge
// ─────────────────────────────────────────────────────────
router.post('/challenges/:id/join', [
  body('linkedHabitId').optional().isMongoId(),
  body('linkedHabitIds').optional().isArray(),
  body('linkedHabitIds.*').optional().isMongoId(),
], async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    if (!['upcoming', 'active'].includes(challenge.status)) {
      return res.status(400).json({ success: false, error: 'Challenge is not open for joining' });
    }

    const workspace = await Workspace.findById(challenge.workspaceId);
    if (!workspace || !workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Normalize: accept linkedHabitIds (array) or linkedHabitId (singular, backward compat)
    let habitIds = req.body.linkedHabitIds || [];
    if (!habitIds.length && req.body.linkedHabitId) {
      habitIds = [req.body.linkedHabitId];
    }

    // Validate that all habit IDs belong to this user
    if (habitIds.length) {
      const validCount = await Habit.countDocuments({
        _id: { $in: habitIds },
        userId: req.user._id,
      });
      if (validCount !== habitIds.length) {
        return res.status(400).json({ success: false, error: 'One or more habit IDs are invalid or do not belong to you' });
      }
    }

    // Validate match mode requirements
    if (challenge.habitMatchMode === 'all' || challenge.habitMatchMode === 'any') {
      // These modes typically expect at least 1 habit
      if (!habitIds.length) {
        return res.status(400).json({ success: false, error: 'This challenge requires you to link at least one habit' });
      }
    }
    if (challenge.habitMatchMode === 'minimum' && challenge.habitMatchMinimum) {
      if (habitIds.length < challenge.habitMatchMinimum) {
        return res.status(400).json({
          success: false,
          error: `This challenge requires at least ${challenge.habitMatchMinimum} linked habit(s)`,
        });
      }
    }

    const participant = challenge.addParticipant(req.user._id, habitIds.length ? habitIds : null);
    if (!participant) {
      return res.status(400).json({ success: false, error: 'Cannot join — already participating or challenge is full' });
    }

    await challenge.save();

    // Invalidate check-in cache for this user
    invalidateCache(req.user._id);

    // Feed event
    await Activity.create({
      workspaceId: challenge.workspaceId,
      userId: req.user._id,
      type: 'challenge_joined',
      data: {
        challengeId: challenge._id,
        challengeName: challenge.title,
        message: `joined challenge: ${challenge.title}`,
      },
      visibility: 'workspace',
    });

    await challenge.populate('participants.userId', 'name avatar');

    res.json({ success: true, challenge });
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to join challenge' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/challenges/:id/leave
// Leave a challenge
// ─────────────────────────────────────────────────────────
router.post('/challenges/:id/leave', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    // Creator cannot leave their own challenge
    if (challenge.createdBy.equals(req.user._id)) {
      return res.status(400).json({ success: false, error: 'Creator cannot leave — cancel the challenge instead' });
    }

    const dropped = challenge.dropParticipant(req.user._id);
    if (!dropped) {
      return res.status(400).json({ success: false, error: 'Not an active participant' });
    }

    await challenge.save();

    // Invalidate check-in cache for this user
    invalidateCache(req.user._id);

    res.json({ success: true, message: 'Left the challenge' });
  } catch (error) {
    console.error('Error leaving challenge:', error);
    res.status(500).json({ success: false, error: 'Failed to leave challenge' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/challenges/:id/suggest-habits
// AI-assisted habit matching for challenge join
// ─────────────────────────────────────────────────────────
router.post('/challenges/:id/suggest-habits', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const workspace = await Workspace.findById(challenge.workspaceId);
    if (!workspace || !workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get user's personal habits in this workspace
    const userHabits = await Habit.find({
      userId: req.user._id,
      workspaceId: challenge.workspaceId,
      archived: { $ne: true },
    }).select('name description category methodology target frequency icon').lean();

    if (!userHabits.length) {
      return res.json({ success: true, suggestions: [], habits: [] });
    }

    // Build challenge context for matching
    const challengeContext = {
      title: challenge.title,
      description: challenge.description || '',
      type: challenge.type,
      habitSlot: challenge.habitSlot || '',
      targetUnit: challenge.rules?.targetUnit || '',
      targetValue: challenge.rules?.targetValue,
    };

    // Try LLM-based matching first
    let suggestions = [];
    try {
      const { isLLMAvailable } = require('../services/llmEnrichment');
      if (isLLMAvailable()) {
        const OpenAIModule = require('openai');
        const OpenAI = OpenAIModule.default || OpenAIModule.OpenAI || OpenAIModule;
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
        });

        const habitList = userHabits.map((h, i) => ({
          index: i,
          name: h.name,
          description: h.description || '',
          category: h.category || '',
          unit: h.target?.unit || '',
        }));

        const prompt = `You are a habit-matching assistant. Given a challenge and a user's habits, rank each habit by relevance to the challenge.

Challenge:
- Title: ${challengeContext.title}
- Description: ${challengeContext.description}
- Type: ${challengeContext.type}
- Habit Slot: ${challengeContext.habitSlot || '(open)'}
- Target: ${challengeContext.targetValue} ${challengeContext.targetUnit}

User's habits:
${JSON.stringify(habitList, null, 2)}

Return a JSON array of objects with { index, score, reason } where score is 0-100 (relevance to the challenge) and reason is a short 1-sentence explanation. Sort by score descending. Only include habits with score > 0.

Return ONLY the JSON array, no markdown or extra text.`;

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        });

        const text = response.choices?.[0]?.message?.content?.trim();
        if (text) {
          const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, ''));
          suggestions = parsed.map((s) => ({
            habitId: userHabits[s.index]?._id,
            name: userHabits[s.index]?.name,
            score: s.score,
            reason: s.reason,
          })).filter((s) => s.habitId);
        }
      }
    } catch (llmErr) {
      console.warn('[Challenge] LLM suggest-habits fallback:', llmErr.message);
    }

    // Fallback: keyword overlap scoring
    if (!suggestions.length) {
      const keywords = `${challengeContext.title} ${challengeContext.description} ${challengeContext.habitSlot}`
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

      suggestions = userHabits.map((h) => {
        const text = `${h.name} ${h.description || ''} ${h.category || ''}`.toLowerCase();
        const matches = keywords.filter((kw) => text.includes(kw)).length;
        const score = keywords.length > 0 ? Math.round((matches / keywords.length) * 100) : 0;
        return { habitId: h._id, name: h.name, score, reason: 'Keyword match' };
      }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    }

    res.json({
      success: true,
      suggestions,
      habits: userHabits.map((h) => ({
        _id: h._id,
        name: h.name,
        description: h.description,
        category: h.category,
        icon: h.icon,
        frequency: h.frequency,
        target: h.target,
      })),
    });
  } catch (error) {
    console.error('Error suggesting habits:', error);
    res.status(500).json({ success: false, error: 'Failed to suggest habits' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/challenges/:id/leaderboard
// Get challenge leaderboard
// ─────────────────────────────────────────────────────────
router.get('/challenges/:id/leaderboard', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('participants.userId', 'name avatar');

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const workspace = await Workspace.findById(challenge.workspaceId);
    if (!workspace || !workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!challenge.settings.showLeaderboard) {
      return res.status(403).json({ success: false, error: 'Leaderboard is disabled for this challenge' });
    }

    const leaderboard = challenge.getLeaderboard();

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/feed/:eventId/reactions
// Add/change reaction on a feed event
// ─────────────────────────────────────────────────────────
router.post('/feed/:eventId/reactions', [
  body('type').isIn(['like', 'celebrate', 'fire', 'clap', 'heart']).withMessage('Invalid reaction type'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const activity = await Activity.findById(req.params.eventId);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Feed event not found' });
    }

    // Verify workspace membership
    const workspace = await Workspace.findById(activity.workspaceId);
    if (!workspace || !workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await activity.addReaction(req.user._id, req.body.type);

    res.json({ success: true, reactions: activity.reactions });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, error: 'Failed to add reaction' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/feed/:eventId/reactions
// Remove reaction from a feed event
// ─────────────────────────────────────────────────────────
router.delete('/feed/:eventId/reactions', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.eventId);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Feed event not found' });
    }

    const workspace = await Workspace.findById(activity.workspaceId);
    if (!workspace || !workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await activity.removeReaction(req.user._id);

    res.json({ success: true, reactions: activity.reactions });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ success: false, error: 'Failed to remove reaction' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/workspaces/:workspaceId/kudos
// Send kudos to a workspace member
// ─────────────────────────────────────────────────────────
router.post('/workspaces/:workspaceId/kudos', [
  body('targetUserId').isMongoId().withMessage('Target user ID is required'),
  body('message').optional().trim().isLength({ max: 280 }).withMessage('Message cannot exceed 280 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { workspaceId } = req.params;
    const { targetUserId, message } = req.body;
    const userId = req.user._id;

    // Can't kudos yourself
    if (userId.equals(targetUserId)) {
      return res.status(400).json({ success: false, error: 'Cannot send kudos to yourself' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Target must also be a member
    if (!workspace.isMember(targetUserId)) {
      return res.status(400).json({ success: false, error: 'Target user is not a workspace member' });
    }

    // Get target user name for the feed event
    const User = require('../models/User');
    const targetUser = await User.findById(targetUserId).select('name').lean();

    const activity = await Activity.create({
      workspaceId,
      userId,
      type: 'kudos',
      data: {
        targetUserId,
        targetUserName: targetUser?.name || 'a member',
        message: message || null,
      },
      visibility: 'workspace',
    });

    await activity.populate('userId', 'name avatar');

    res.status(201).json({ success: true, activity });
  } catch (error) {
    console.error('Error sending kudos:', error);
    res.status(500).json({ success: false, error: 'Failed to send kudos' });
  }
});

module.exports = router;
