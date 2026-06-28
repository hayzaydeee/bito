const Challenge = require('../models/Challenge');
const Activity = require('../models/Activity');
const HabitEntry = require('../models/HabitEntry');
const Habit = require('../models/Habit');
const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// VAPID config (reused from notifications/challengeService)
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@bfrnd.io';
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try { webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); } catch {}
}

/**
 * Send a push notification to all participants of a challenge (except sender).
 */
async function notifyParticipants(challenge, senderId, { title, body, tag }) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  try {
    const recipientIds = challenge.participants
      .filter((p) => p.status !== 'dropped' && !p.userId?.equals?.(senderId))
      .map((p) => p.userId?._id || p.userId);
    if (!recipientIds.length) return;

    const subs = await PushSubscription.find({ userId: { $in: recipientIds }, isActive: true });
    const payload = JSON.stringify({
      title,
      body,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      tag: tag || `challenge-${challenge._id}`,
      data: { url: `/app/groups/${challenge.groupId}/challenges/${challenge._id}`, challengeId: challenge._id.toString() },
    });

    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub.subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }
  } catch (err) {
    console.warn('[Challenge] Push notification failed:', err.message);
  }
}

// ── Check-in cache ──
const _challengeHabitCache = new Map();

/**
 * Warm the cache for a user by loading their active challenge participant data.
 */
async function warmCacheForUser(userId) {
  try {
    const challenges = await Challenge.find({
      status: 'active',
      'participants.userId': userId,
      'participants.status': 'active',
    }).select('participants').lean();

    const habitIds = new Set();
    for (const c of challenges) {
      const p = c.participants?.find(
        (participant) => String(participant.userId) === String(userId) && participant.status === 'active'
      );
      if (p?.linkedHabitIds?.length) {
        p.linkedHabitIds.forEach((id) => habitIds.add(String(id)));
      } else if (p?.linkedHabitId) {
        habitIds.add(String(p.linkedHabitId));
      }
    }

    _challengeHabitCache.set(String(userId), habitIds);
  } catch (err) {
    console.warn('[Challenge] Cache warm failed:', err.message);
    _challengeHabitCache.delete(String(userId));
  }
}

/** Invalidate cache for a user (called on join, leave, challenge completion). */
function invalidateCache(userId) {
  _challengeHabitCache.delete(String(userId));
}

// ── Frequency / schedule helpers ──────────────────────────────────────────────

/**
 * Returns true if a habit was "on" (expected to be completed) on a given day-of-week.
 * Weekly and monthly habits are flexible — any day qualifies.
 */
function isHabitScheduledOnDay(habitMeta, utcDayOfWeek) {
  if (!habitMeta || habitMeta.frequency !== 'daily') return true;
  const days = habitMeta.schedule?.days;
  if (!days || days.length === 0) return true; // no specific days = every day
  return days.includes(utcDayOfWeek);
}

/**
 * Returns true if a calendar timestamp is an exempt off-day — i.e., none of the
 * linked habits were scheduled on that day-of-week. Off-days don't break streaks
 * and don't count toward the consistency denominator.
 */
function isDayExempt(dateMs, habitMetas) {
  const dow = new Date(dateMs).getUTCDay();
  return habitMetas.every((h) => !isHabitScheduledOnDay(h, dow));
}

/**
 * Count how many calendar days in [startDate, endDate] have at least one linked habit scheduled.
 * Used as the consistency denominator.
 */
function countScheduledDays(startDate, endDate, habitMetas) {
  let count = 0;
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    if (!isDayExempt(cursor.getTime(), habitMetas)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Process challenge progress after a habit check-in.
 * Called from the habits route after a completed entry is saved.
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

    // Find habit to get group info
    const habit = await Habit.findById(habitId).lean();
    if (!habit) return { processed: false, message: 'Habit not found' };

    // Determine which challenges to update
    const challengeQuery = {
      status: 'active',
      $or: [
        ...(habit.groupHabitId ? [{ habitId: habit.groupHabitId }] : []),
        { 'participants.userId': userId, 'participants.linkedHabitId': habitId },
        { 'participants.userId': userId, 'participants.linkedHabitIds': habitId },
        ...(habit.groupId ? [{ groupId: habit.groupId, habitId: null, habitMatchMode: 'single' }] : []),
      ],
    };

    const activeChallenges = await Challenge.find(challengeQuery);
    if (!activeChallenges.length) {
      return { processed: false, message: 'No active challenges' };
    }

    // Collect all habit IDs across all challenges, then batch-load metadata
    const allHabitIdSet = new Set([String(habitId)]);
    for (const challenge of activeChallenges) {
      const participant = challenge.getParticipant(userId);
      if (!participant || participant.status !== 'active') continue;
      getEffectiveHabitIds(participant, habitId).forEach((id) => allHabitIdSet.add(id));
    }

    const habitDocs = await Habit.find({
      _id: { $in: [...allHabitIdSet] },
    }).select('frequency weeklyTarget schedule.days methodology target').lean();

    const habitMetaMap = new Map(habitDocs.map((h) => [String(h._id), h]));
    // Include the triggering habit we already have loaded
    if (!habitMetaMap.has(String(habitId))) {
      habitMetaMap.set(String(habitId), habit);
    }

    const updates = [];

    for (const challenge of activeChallenges) {
      const participant = challenge.getParticipant(userId);
      if (!participant || participant.status !== 'active') continue;

      const effectiveHabitIds = getEffectiveHabitIds(participant, habitId);

      const progressData = await computeProgress(challenge, userId, effectiveHabitIds, habitMetaMap);
      if (!progressData) continue;

      const updated = challenge.updateParticipantProgress(userId, progressData);
      if (!updated) continue;

      const newMilestones = challenge.checkMilestones(userId);
      await challenge.save();

      for (const milestone of newMilestones) {
        const milestoneActivity = await Activity.create({
          groupId: challenge.groupId,
          userId,
          type: 'challenge_milestone',
          data: {
            challengeId: challenge._id,
            challengeName: challenge.title,
            message: `reached milestone "${milestone.label}" in ${challenge.title}`,
            metadata: { milestoneValue: milestone.value, milestoneLabel: milestone.label },
          },
          visibility: 'group',
        });

        enrichChallengeEvent(milestoneActivity, challenge, userId, 'milestone').catch(() => {});

        await notifyParticipants(challenge, userId, {
          title: '🏅 Milestone Reached!',
          body: `Someone hit "${milestone.label}" in "${challenge.title}"!`,
          tag: `challenge-milestone-${challenge._id}-${milestone.value}`,
        });
      }

      if (updated.status === 'completed') {
        const completionActivity = await Activity.create({
          groupId: challenge.groupId,
          userId,
          type: 'challenge_completed',
          data: {
            challengeId: challenge._id,
            challengeName: challenge.title,
            challengeType: challenge.type,
            message: `completed challenge: ${challenge.title}`,
          },
          visibility: 'group',
        });

        enrichChallengeEvent(completionActivity, challenge, userId, 'completion').catch(() => {});

        await notifyParticipants(challenge, userId, {
          title: '🎉 Challenge Completed!',
          body: `Someone just completed "${challenge.title}"!`,
          tag: `challenge-participant-completed-${challenge._id}-${userId}`,
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

// ── Habit ID resolution ───────────────────────────────────────────────────────

function getEffectiveHabitIds(participant, triggeredHabitId) {
  if (participant.linkedHabitIds?.length) {
    return participant.linkedHabitIds.map(String);
  }
  if (participant.linkedHabitId) {
    return [String(participant.linkedHabitId)];
  }
  return [String(triggeredHabitId)];
}

// ── Progress dispatcher ───────────────────────────────────────────────────────

async function computeProgress(challenge, userId, effectiveHabitIds, habitMetaMap) {
  const matchMode = challenge.habitMatchMode || 'single';

  switch (challenge.type) {
    case 'streak':
      return computeStreakProgress(challenge, userId, effectiveHabitIds, matchMode, habitMetaMap);
    case 'cumulative':
      return computeCumulativeProgress(challenge, userId, effectiveHabitIds, matchMode, habitMetaMap);
    case 'consistency':
      return computeConsistencyProgress(challenge, userId, effectiveHabitIds, matchMode, habitMetaMap);
    case 'team_goal':
      return computeCumulativeProgress(challenge, userId, effectiveHabitIds, matchMode, habitMetaMap);
    default:
      return null;
  }
}

// ── Streak ────────────────────────────────────────────────────────────────────

/**
 * Streak: count consecutive scheduled days ending today where the match mode condition is met.
 * Off-days (days where no linked habit is scheduled) are skipped without breaking the streak.
 *
 * - single/any: a scheduled day counts if ANY linked habit was completed
 * - all: a scheduled day counts only if ALL linked habits were completed
 * - minimum: a scheduled day counts if >= N linked habits were completed
 */
async function computeStreakProgress(challenge, userId, habitIds, matchMode, habitMetaMap) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const entries = await HabitEntry.find({
    habitId: { $in: habitIds },
    userId,
    completed: true,
    date: { $gte: challenge.startDate },
  })
    .sort({ date: -1 })
    .select('date habitId')
    .lean();

  if (!entries.length) return { currentValue: 0, currentStreak: 0, lastLoggedAt: new Date() };

  // Build date → set-of-habitIds map
  const dateHabitMap = new Map();
  for (const e of entries) {
    const d = new Date(e.date);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.getTime();
    if (!dateHabitMap.has(key)) dateHabitMap.set(key, new Set());
    dateHabitMap.get(key).add(String(e.habitId));
  }

  const minRequired = matchMode === 'minimum' ? (challenge.habitMatchMinimum || 1) : habitIds.length;
  const habitMetas = habitIds.map((id) => habitMetaMap.get(id)).filter(Boolean);

  function dayQualifies(dateKey) {
    const habitsOnDay = dateHabitMap.get(dateKey);
    if (!habitsOnDay) return false;
    switch (matchMode) {
      case 'all': return habitsOnDay.size >= habitIds.length;
      case 'minimum': return habitsOnDay.size >= minRequired;
      default: return habitsOnDay.size > 0;
    }
  }

  let streak = 0;
  const cursor = new Date(today);
  const startMs = new Date(challenge.startDate).getTime();
  const MAX_DAYS = 1000; // safety guard

  for (let i = 0; i < MAX_DAYS; i++) {
    const ts = cursor.getTime();
    if (ts < startMs) break;

    if (isDayExempt(ts, habitMetas)) {
      // Off-day — skip without breaking streak
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }

    if (!dayQualifies(ts)) break;

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

// ── Cumulative ────────────────────────────────────────────────────────────────

/**
 * Cumulative / Team Goal: total completed value/count within challenge date range.
 *
 * Methodology-aware:
 * - numeric/duration habits: $sum of value (the actual numeric amount)
 * - boolean/rating habits: count of completions (value is always 1, counting is safer)
 *
 * Match mode for all/minimum: count qualifying days regardless of methodology.
 */
async function computeCumulativeProgress(challenge, userId, habitIds, matchMode, habitMetaMap) {
  const dateFilter = {};
  if (challenge.startDate) dateFilter.$gte = challenge.startDate;
  if (challenge.endDate) dateFilter.$lte = challenge.endDate;
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  if (matchMode === 'single' || matchMode === 'any') {
    // Split by methodology for correct aggregation
    const numericIds = habitIds.filter((id) => {
      const m = habitMetaMap.get(id);
      return m?.methodology === 'numeric' || m?.methodology === 'duration';
    });
    const countIds = habitIds.filter((id) => !numericIds.includes(id));

    let total = 0;

    if (numericIds.length) {
      const baseMatch = {
        habitId: { $in: numericIds },
        userId,
        completed: true,
        ...(hasDateFilter ? { date: dateFilter } : {}),
      };
      const [result] = await HabitEntry.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]);
      total += result?.total || 0;
    }

    if (countIds.length) {
      const baseMatch = {
        habitId: { $in: countIds },
        userId,
        completed: true,
        ...(hasDateFilter ? { date: dateFilter } : {}),
      };
      const [result] = await HabitEntry.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]);
      total += result?.count || 0;
    }

    return { currentValue: total, lastLoggedAt: new Date() };
  }

  // all / minimum: count qualifying days (methodology doesn't change day-level counting)
  const match = {
    habitId: { $in: habitIds },
    userId,
    completed: true,
    ...(hasDateFilter ? { date: dateFilter } : {}),
  };

  const entries = await HabitEntry.find(match).select('date habitId').lean();

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

  return { currentValue: qualifyingDays, lastLoggedAt: new Date() };
}

// ── Consistency ───────────────────────────────────────────────────────────────

/**
 * Consistency: completion rate over scheduled days in the challenge duration.
 *
 * Frequency-aware: the denominator is "scheduled days" not raw calendar days.
 * A day is scheduled if at least one linked habit was expected on that day-of-week.
 * Off-days don't count toward the denominator or numerator.
 */
async function computeConsistencyProgress(challenge, userId, habitIds, matchMode, habitMetaMap) {
  const now = new Date();
  const end = new Date(Math.min(now.getTime(), new Date(challenge.endDate).getTime()));
  const habitMetas = habitIds.map((id) => habitMetaMap.get(id)).filter(Boolean);

  const scheduledDaysTotal = countScheduledDays(challenge.startDate, end, habitMetas);
  if (scheduledDaysTotal <= 0) return null;

  const entryFilter = {
    habitId: { $in: habitIds },
    userId,
    completed: true,
    date: { $gte: challenge.startDate, $lte: now },
  };

  if (matchMode === 'single' || matchMode === 'any') {
    const entries = await HabitEntry.find(entryFilter).select('date').lean();

    // Only count completions on scheduled days
    const completedScheduledDays = new Set();
    for (const e of entries) {
      const d = new Date(e.date);
      d.setUTCHours(0, 0, 0, 0);
      const ts = d.getTime();
      if (!isDayExempt(ts, habitMetas)) {
        completedScheduledDays.add(ts);
      }
    }

    const completedDays = completedScheduledDays.size;
    const rate = Math.round((completedDays / scheduledDaysTotal) * 100);
    return { currentValue: completedDays, completionRate: rate, lastLoggedAt: new Date() };
  }

  // all / minimum
  const entries = await HabitEntry.find({ ...entryFilter, $or: undefined }).select('date habitId').lean();

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
  for (const [dateMs, habitsOnDay] of dateHabitMap) {
    if (!isDayExempt(dateMs, habitMetas) && habitsOnDay.size >= minRequired) {
      completedDays++;
    }
  }

  const rate = Math.round((completedDays / scheduledDaysTotal) * 100);
  return { currentValue: completedDays, completionRate: rate, lastLoggedAt: new Date() };
}

// ── Async progress narrative ──────────────────────────────────────────────────

/**
 * Fire-and-forget: enrich a challenge feed event with a 1-sentence LLM comment.
 * Never throws — all failures are silently swallowed to avoid blocking the check-in path.
 */
async function enrichChallengeEvent(activity, challenge, userId, eventType) {
  try {
    const { isLLMAvailable } = require('../services/llmEnrichment');
    if (!isLLMAvailable()) return;

    const { getLLMClient } = require('../services/llmClient');
    const client = getLLMClient();
    const { buildSystemPrompt, DEFAULT_PERSONALITY } = require('../prompts/buildSystemPrompt');

    // Build rank context
    const leaderboard = challenge.getLeaderboard();
    const rank = leaderboard.findIndex(
      (r) => r.userId && String(r.userId) === String(userId)
    ) + 1;
    const total = leaderboard.length;

    const daysElapsed = Math.ceil(
      (Date.now() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysTotal = challenge.durationDays || 1;

    const context = {
      eventType,
      challengeTitle: challenge.title,
      challengeType: challenge.type,
      rank,
      totalParticipants: total,
      daysElapsed,
      daysTotal,
    };

    const systemPrompt = buildSystemPrompt(DEFAULT_PERSONALITY, 'insight-enrichment');
    const userPrompt = `Write exactly one sentence (no emoji) celebrating or acknowledging this challenge event. Focus on rank and timing.\n\nContext: ${JSON.stringify(context)}`;

    const response = await client.chat.completions.create({
      model: process.env.INSIGHTS_LLM_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 80,
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    if (text) {
      await Activity.updateOne(
        { _id: activity._id },
        { $set: { 'data.enrichment': text } }
      );
    }
  } catch (err) {
    console.warn('[Challenge] enrichChallengeEvent failed:', err.message);
  }
}

module.exports = { processChallengeProgress, invalidateCache, warmCacheForUser };
