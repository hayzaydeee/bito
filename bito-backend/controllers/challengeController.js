const Challenge = require('../models/Challenge');
const Activity = require('../models/Activity');
const HabitEntry = require('../models/HabitEntry');
const Habit = require('../models/Habit');

// ── Check-in cache ──
// Maps userId (string) → Set of habitId strings that are linked to active challenges.
// Used as a fast-path check in processChallengeProgress to skip DB queries
// when a checked-in habit isn't part of any challenge.
const _challengeHabitCache = new Map();

/**
 * Warm the cache for a user by loading their active challenge participant data.
 * Called on join/leave and lazily on first check-in.
 */
async function warmCacheForUser(userId) {
  try {
    const challenges = await Challenge.find({
      status: 'active',
      'participants.userId': userId,
      'participants.status': 'active',
    }).select('participants.$').lean();

    const habitIds = new Set();
    for (const c of challenges) {
      const p = c.participants?.[0];
      if (p?.linkedHabitIds?.length) {
        p.linkedHabitIds.forEach((id) => habitIds.add(String(id)));
      } else if (p?.linkedHabitId) {
        habitIds.add(String(p.linkedHabitId));
      }
    }

    _challengeHabitCache.set(String(userId), habitIds);
  } catch (err) {
    console.warn('[Challenge] Cache warm failed:', err.message);
    // On failure, delete cache entry so we fall through to DB
    _challengeHabitCache.delete(String(userId));
  }
}

/** Invalidate cache for a user (called on join, leave, challenge completion). */
function invalidateCache(userId) {
  _challengeHabitCache.delete(String(userId));
}

/**
 * Process challenge progress after a habit check-in.
 * Called from the habits route after a completed entry is saved.
 *
 * For workspace habits: looks up active challenges in the workspace.
 * For personal habits linked to a challenge: updates that challenge.
 */
const processChallengeProgress = async (userId, habitId) => {
  try {
    // Check cache first — skip if this habit isn't linked to any challenge
    if (_challengeHabitCache.size > 0) {
      const userKey = String(userId);
      const cached = _challengeHabitCache.get(userKey);
      if (cached && !cached.has(String(habitId))) {
        return { processed: false, message: 'Habit not in any active challenge (cached)' };
      }
    }

    // Find habit to get workspace info
    const habit = await Habit.findById(habitId).lean();
    if (!habit) return { processed: false, message: 'Habit not found' };

    // Determine which challenges to update
    const challengeQuery = {
      status: 'active',
      $or: [
        // Challenges tied to a specific workspace habit that this habit adopted
        ...(habit.workspaceHabitId ? [{ habitId: habit.workspaceHabitId }] : []),
        // Challenges where this user linked this habit directly (singular or array)
        { 'participants.userId': userId, 'participants.linkedHabitId': habitId },
        { 'participants.userId': userId, 'participants.linkedHabitIds': habitId },
        // General workspace challenges (no specific habit, mode=single so any habit counts)
        ...(habit.workspaceId ? [{ workspaceId: habit.workspaceId, habitId: null, habitMatchMode: 'single' }] : []),
      ],
    };

    const activeChallenges = await Challenge.find(challengeQuery);
    if (!activeChallenges.length) {
      return { processed: false, message: 'No active challenges' };
    }

    const updates = [];

    for (const challenge of activeChallenges) {
      const participant = challenge.getParticipant(userId);
      if (!participant || participant.status !== 'active') continue;

      // Determine effective habit IDs for this participant
      const effectiveHabitIds = getEffectiveHabitIds(participant, habitId);

      // Compute progress based on challenge type and match mode
      const progressData = await computeProgress(challenge, userId, effectiveHabitIds, habit);
      if (!progressData) continue;

      const updated = challenge.updateParticipantProgress(userId, progressData);
      if (!updated) continue;

      // Check milestones
      const newMilestones = challenge.checkMilestones(userId);

      await challenge.save();

      // Generate milestone feed events
      for (const milestone of newMilestones) {
        await Activity.create({
          workspaceId: challenge.workspaceId,
          userId,
          type: 'challenge_milestone',
          data: {
            challengeId: challenge._id,
            challengeName: challenge.title,
            message: `reached milestone "${milestone.label}" in ${challenge.title}`,
            metadata: { milestoneValue: milestone.value, milestoneLabel: milestone.label },
          },
          visibility: 'workspace',
        });
      }

      // If participant just completed, generate feed event
      if (updated.status === 'completed') {
        await Activity.create({
          workspaceId: challenge.workspaceId,
          userId,
          type: 'challenge_completed',
          data: {
            challengeId: challenge._id,
            challengeName: challenge.title,
            challengeType: challenge.type,
            message: `completed challenge: ${challenge.title}`,
          },
          visibility: 'workspace',
        });
      }

      updates.push({
        challengeId: challenge._id,
        type: challenge.type,
        progress: updated.progress,
        status: updated.status,
      });
    }

    return { processed: updates.length > 0, updates };
  } catch (error) {
    console.error('Error processing challenge progress:', error);
    return { processed: false, error: error.message };
  }
};

/**
 * Get the effective habit IDs for progress computation.
 * Uses linkedHabitIds (v2 array) if available, falls back to linkedHabitId (v1 singular).
 */
function getEffectiveHabitIds(participant, triggeredHabitId) {
  if (participant.linkedHabitIds?.length) {
    return participant.linkedHabitIds.map(String);
  }
  if (participant.linkedHabitId) {
    return [String(participant.linkedHabitId)];
  }
  // No linked habits — use the triggered habit as fallback
  return [String(triggeredHabitId)];
}

/**
 * Compute progress data for a participant based on challenge type and match mode.
 * Supports multi-habit aggregation via habitMatchMode.
 */
async function computeProgress(challenge, userId, effectiveHabitIds, habit) {
  const matchMode = challenge.habitMatchMode || 'single';

  switch (challenge.type) {
    case 'streak': {
      return await computeStreakProgress(challenge, userId, effectiveHabitIds, matchMode);
    }

    case 'cumulative': {
      return await computeCumulativeProgress(challenge, userId, effectiveHabitIds, matchMode);
    }

    case 'consistency': {
      return await computeConsistencyProgress(challenge, userId, effectiveHabitIds, matchMode);
    }

    case 'team_goal': {
      return await computeCumulativeProgress(challenge, userId, effectiveHabitIds, matchMode);
    }

    default:
      return null;
  }
}

/**
 * Streak: count consecutive days ending today where the match mode condition is met.
 *
 * - single/any: a day counts if ANY linked habit was completed
 * - all: a day counts only if ALL linked habits were completed
 * - minimum: a day counts if >= N linked habits were completed
 */
async function computeStreakProgress(challenge, userId, habitIds, matchMode) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const entries = await HabitEntry.find({
    habitId: { $in: habitIds },
    userId,
    completed: true,
  })
    .sort({ date: -1 })
    .select('date habitId')
    .lean();

  if (!entries.length) return { currentValue: 0, currentStreak: 0, lastLoggedAt: new Date() };

  // Build date→set-of-habitIds map
  const dateHabitMap = new Map();
  for (const e of entries) {
    const d = new Date(e.date);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.getTime();
    if (!dateHabitMap.has(key)) dateHabitMap.set(key, new Set());
    dateHabitMap.get(key).add(String(e.habitId));
  }

  const minRequired = matchMode === 'minimum' ? (challenge.habitMatchMinimum || 1) : habitIds.length;

  function dayQualifies(dateKey) {
    const habitsOnDay = dateHabitMap.get(dateKey);
    if (!habitsOnDay) return false;
    switch (matchMode) {
      case 'all': return habitsOnDay.size >= habitIds.length;
      case 'minimum': return habitsOnDay.size >= minRequired;
      case 'single':
      case 'any':
      default: return habitsOnDay.size > 0;
    }
  }

  let streak = 0;
  const cursor = new Date(today);
  while (dayQualifies(cursor.getTime())) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const participant = challenge.getParticipant(userId);
  const bestStreak = Math.max(participant?.progress?.bestStreak || 0, streak);

  return {
    currentValue: streak,
    currentStreak: streak,
    bestStreak,
    lastLoggedAt: new Date(),
  };
}

/**
 * Cumulative / Team Goal: total completed value/count within challenge date range.
 *
 * - single/any: sum across all linked habits
 * - all: count only days where ALL habits completed, sum 1 per qualifying day
 * - minimum: count only days where >= N habits completed
 */
async function computeCumulativeProgress(challenge, userId, habitIds, matchMode) {
  const dateFilter = {};
  if (challenge.startDate) dateFilter.$gte = challenge.startDate;
  if (challenge.endDate) dateFilter.$lte = challenge.endDate;

  if (matchMode === 'single' || matchMode === 'any') {
    // Simple sum across all linked habits
    const match = {
      habitId: { $in: habitIds },
      userId,
      completed: true,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    };

    const [result] = await HabitEntry.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$value' }, count: { $sum: 1 } } },
    ]);

    return {
      currentValue: result?.total || result?.count || 0,
      lastLoggedAt: new Date(),
    };
  }

  // all / minimum: count qualifying days
  const match = {
    habitId: { $in: habitIds },
    userId,
    completed: true,
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
  };

  const entries = await HabitEntry.find(match).select('date habitId').lean();

  // Group by date
  const dateHabitMap = new Map();
  for (const e of entries) {
    const d = new Date(e.date);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.getTime();
    if (!dateHabitMap.has(key)) dateHabitMap.set(key, new Set());
    dateHabitMap.get(key).add(String(e.habitId));
  }

  const minRequired = matchMode === 'minimum' ? (challenge.habitMatchMinimum || 1) : habitIds.length;
  let qualifyingDays = 0;
  for (const [, habitsOnDay] of dateHabitMap) {
    if (habitsOnDay.size >= minRequired) qualifyingDays++;
  }

  return {
    currentValue: qualifyingDays,
    lastLoggedAt: new Date(),
  };
}

/**
 * Consistency: completion rate over challenge duration.
 *
 * - single/any: a day counts if any linked habit was completed
 * - all: a day counts only if all linked habits were completed
 * - minimum: a day counts if >= N linked habits were completed
 */
async function computeConsistencyProgress(challenge, userId, habitIds, matchMode) {
  const durationDays = Math.ceil(
    (Math.min(Date.now(), challenge.endDate) - challenge.startDate) / (1000 * 60 * 60 * 24)
  );
  if (durationDays <= 0) return null;

  if (matchMode === 'single' || matchMode === 'any') {
    // Count unique days with any habit completed
    const entries = await HabitEntry.find({
      habitId: { $in: habitIds },
      userId,
      completed: true,
      date: { $gte: challenge.startDate, $lte: new Date() },
    }).select('date').lean();

    const uniqueDays = new Set(
      entries.map((e) => {
        const d = new Date(e.date);
        d.setUTCHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    const completedDays = uniqueDays.size;
    const rate = Math.round((completedDays / durationDays) * 100);
    return {
      currentValue: completedDays,
      completionRate: rate,
      lastLoggedAt: new Date(),
    };
  }

  // all / minimum: count qualifying days
  const entries = await HabitEntry.find({
    habitId: { $in: habitIds },
    userId,
    completed: true,
    date: { $gte: challenge.startDate, $lte: new Date() },
  }).select('date habitId').lean();

  const dateHabitMap = new Map();
  for (const e of entries) {
    const d = new Date(e.date);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.getTime();
    if (!dateHabitMap.has(key)) dateHabitMap.set(key, new Set());
    dateHabitMap.get(key).add(String(e.habitId));
  }

  const minRequired = matchMode === 'minimum' ? (challenge.habitMatchMinimum || 1) : habitIds.length;
  let completedDays = 0;
  for (const [, habitsOnDay] of dateHabitMap) {
    if (habitsOnDay.size >= minRequired) completedDays++;
  }

  const rate = Math.round((completedDays / durationDays) * 100);
  return {
    currentValue: completedDays,
    completionRate: rate,
    lastLoggedAt: new Date(),
  };
}

module.exports = { processChallengeProgress, invalidateCache, warmCacheForUser };
