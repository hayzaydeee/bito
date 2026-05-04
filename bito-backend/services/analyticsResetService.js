/**
 * analyticsResetService.js
 *
 * Handles purging completion history while preserving habits themselves.
 * Used by both the personal reset (DELETE /api/users/analytics) and the
 * group admin reset (DELETE /api/groups/:groupId/analytics) endpoints.
 */

const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const Challenge = require('../models/Challenge');
const Activity = require('../models/Activity');
const Group = require('../models/Group');
const GroupHabit = require('../models/GroupHabit');

// Activity types that represent completion events (not structural events).
const COMPLETION_ACTIVITY_TYPES = [
  'habit_completed',
  'streak_milestone',
  'goal_achieved',
  'challenge_completed',
  'challenge_milestone',
];

// ─────────────────────────────────────────────────────────────────────────────
// resetUserAnalytics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Purges all completion data for a single user.
 *
 * @param {ObjectId|string} userId
 * @param {object}          [options]
 * @param {Date|string}     [options.before]  If set, only data strictly before
 *                                            this date is removed. Habits that
 *                                            still have entries after the cutoff
 *                                            will have their stats recomputed
 *                                            rather than zeroed.
 * @param {ObjectId|string} [options.groupId] If set, scope the habit/entry
 *                                            deletion to habits belonging to
 *                                            that group only (used by
 *                                            resetGroupAnalytics).
 * @returns {Promise<object>} Summary of what was changed.
 */
async function resetUserAnalytics(userId, { before, groupId } = {}) {
  const beforeDate = before ? new Date(before) : null;

  // ── 1. Build query filters ──────────────────────────────────────────────

  const habitFilter = { userId };
  if (groupId) {
    habitFilter.groupId = groupId;
    habitFilter.source = 'group';
  }

  const entryFilter = { userId };
  if (beforeDate) entryFilter.date = { $lt: beforeDate };

  // When groupId is provided we only delete entries tied to group habits.
  let affectedHabitIds = null;
  if (groupId) {
    const groupHabits = await Habit.find(habitFilter, '_id').lean();
    affectedHabitIds = groupHabits.map((h) => h._id);

    // If the user has no habits in this group there's nothing to reset.
    if (affectedHabitIds.length === 0) {
      return { habitEntriesDeleted: 0, habitsReset: 0, challengeParticipantsReset: 0, activitiesDeleted: 0 };
    }

    entryFilter.habitId = { $in: affectedHabitIds };
  }

  // ── 2. Delete HabitEntry docs ───────────────────────────────────────────

  const entryResult = await HabitEntry.deleteMany(entryFilter);
  const habitEntriesDeleted = entryResult.deletedCount;

  // ── 3. Reset (or recompute) Habit.stats ────────────────────────────────

  let habitsReset = 0;

  if (beforeDate) {
    // Partial reset: recompute stats from whatever entries remain.
    // We only need to touch habits that had entries we just deleted.
    // If groupId scoping was applied, affectedHabitIds is already set.
    const habitsToRecompute = affectedHabitIds
      ? await Habit.find({ _id: { $in: affectedHabitIds } })
      : await Habit.find(habitFilter);

    await Promise.all(habitsToRecompute.map((h) => h.updateStats()));
    habitsReset = habitsToRecompute.length;
  } else {
    // Full reset: zero all stats directly — no need to load each document.
    const zeroStats = {
      'stats.totalChecks': 0,
      'stats.currentStreak': 0,
      'stats.longestStreak': 0,
      'stats.lastChecked': null,
      'stats.completionRate': 0,
    };

    const habitResult = await Habit.updateMany(habitFilter, { $set: zeroStats });
    habitsReset = habitResult.modifiedCount;
  }

  // ── 4. Reset Challenge participant progress ─────────────────────────────

  // Only zero challenge progress on a full reset. A partial (before-date)
  // reset leaves some habit entries intact; those entries still contributed
  // to challenge progress, so blindly zeroing would corrupt the numbers.
  let challengeParticipantsReset = 0;
  if (!beforeDate) {
    const challengeFilter = { 'participants.userId': userId };
    if (groupId) challengeFilter.groupId = groupId;

    const challengeResult = await Challenge.updateMany(
      challengeFilter,
      {
        $set: {
          'participants.$[p].progress.currentValue': 0,
          'participants.$[p].progress.currentStreak': 0,
          'participants.$[p].progress.bestStreak': 0,
          'participants.$[p].progress.completionRate': 0,
          'participants.$[p].progress.lastLoggedAt': null,
        },
      },
      { arrayFilters: [{ 'p.userId': userId }] }
    );
    challengeParticipantsReset = challengeResult.modifiedCount;
  }

  // ── 5. Delete completion Activity docs ─────────────────────────────────

  const activityFilter = {
    userId,
    type: { $in: COMPLETION_ACTIVITY_TYPES },
  };
  if (groupId) activityFilter.groupId = groupId;
  if (beforeDate) activityFilter.createdAt = { $lt: beforeDate };

  const activityResult = await Activity.deleteMany(activityFilter);
  const activitiesDeleted = activityResult.deletedCount;

  return {
    habitEntriesDeleted,
    habitsReset,
    challengeParticipantsReset,
    activitiesDeleted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// resetGroupAnalytics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Purges completion data for all members of a group, scoped to group-linked
 * habits only. Each member's personal and compass habits are untouched.
 *
 * Also zeroes GroupHabit adoptionStats and Group.stats.totalCompletions.
 *
 * @param {ObjectId|string} groupId
 * @param {object}          [options]
 * @param {Date|string}     [options.before]  Optional cutoff date.
 * @returns {Promise<object>} Aggregated summary.
 */
async function resetGroupAnalytics(groupId, { before } = {}) {
  // ── 1. Resolve group member userIds ────────────────────────────────────

  const group = await Group.findById(groupId).lean();
  if (!group) throw new Error('Group not found');

  const memberUserIds = group.members
    .filter((m) => m.status === 'active')
    .map((m) => m.userId);

  // ── 2. Reset each member's group-scoped analytics ──────────────────────

  const totals = {
    habitEntriesDeleted: 0,
    habitsReset: 0,
    challengeParticipantsReset: 0,
    activitiesDeleted: 0,
  };

  // Run sequentially to avoid hammering the DB with concurrent updateStats calls.
  for (const userId of memberUserIds) {
    const summary = await resetUserAnalytics(userId, { before, groupId });
    totals.habitEntriesDeleted += summary.habitEntriesDeleted;
    totals.habitsReset += summary.habitsReset;
    totals.challengeParticipantsReset += summary.challengeParticipantsReset;
    totals.activitiesDeleted += summary.activitiesDeleted;
  }

  // ── 3. Zero GroupHabit adoptionStats ───────────────────────────────────

  const groupHabitResult = await GroupHabit.updateMany(
    { groupId },
    {
      $set: {
        'adoptionStats.completionRate': 0,
        'adoptionStats.avgStreak': 0,
      },
    }
  );
  const groupHabitsReset = groupHabitResult.modifiedCount;

  // ── 4. Zero Group.stats.totalCompletions ───────────────────────────────

  await Group.findByIdAndUpdate(groupId, {
    $set: { 'stats.totalCompletions': 0 },
  });

  return {
    ...totals,
    groupHabitsReset,
    membersAffected: memberUserIds.length,
  };
}

module.exports = { resetUserAnalytics, resetGroupAnalytics };
