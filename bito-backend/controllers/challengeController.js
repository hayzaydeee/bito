const Challenge = require('../models/Challenge');
const Activity = require('../models/Activity');
const HabitEntry = require('../models/HabitEntry');
const Habit = require('../models/Habit');

/**
 * Process challenge progress after a habit check-in.
 * Called from the habits route after a completed entry is saved.
 *
 * For workspace habits: looks up active challenges in the workspace.
 * For personal habits linked to a challenge: updates that challenge.
 */
const processChallengeProgress = async (userId, habitId) => {
  try {
    // Find habit to get workspace info
    const habit = await Habit.findById(habitId).lean();
    if (!habit) return { processed: false, message: 'Habit not found' };

    // Determine which challenges to update
    const challengeQuery = {
      status: 'active',
      $or: [
        // Challenges tied to a specific workspace habit that this habit adopted
        ...(habit.workspaceHabitId ? [{ habitId: habit.workspaceHabitId }] : []),
        // Challenges where this user linked this habit directly
        { 'participants.userId': userId, 'participants.linkedHabitId': habitId },
        // General workspace challenges (no specific habit)
        ...(habit.workspaceId ? [{ workspaceId: habit.workspaceId, habitId: null }] : []),
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

      // Compute progress based on challenge type
      const progressData = await computeProgress(challenge, userId, habitId, habit);
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
 * Compute progress data for a participant based on challenge type.
 */
async function computeProgress(challenge, userId, habitId, habit) {
  const effectiveHabitId = habitId;

  switch (challenge.type) {
    case 'streak': {
      // Count consecutive completed days ending today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const entries = await HabitEntry.find({
        habitId: effectiveHabitId,
        userId,
        completed: true,
      })
        .sort({ date: -1 })
        .select('date')
        .lean();

      if (!entries.length) return { currentValue: 0, currentStreak: 0, lastLoggedAt: new Date() };

      // Build date set and count streak backward from today
      const dateSet = new Set(
        entries.map((e) => {
          const d = new Date(e.date);
          d.setUTCHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      let streak = 0;
      const cursor = new Date(today);
      while (dateSet.has(cursor.getTime())) {
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

    case 'cumulative': {
      // Total completions/value within challenge date range
      const match = { habitId: effectiveHabitId, userId, completed: true };
      if (challenge.startDate) match.date = { $gte: challenge.startDate };
      if (challenge.endDate) {
        match.date = { ...match.date, $lte: challenge.endDate };
      }

      const [result] = await HabitEntry.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$value' }, count: { $sum: 1 } } },
      ]);

      return {
        currentValue: result?.total || result?.count || 0,
        lastLoggedAt: new Date(),
      };
    }

    case 'consistency': {
      // Completion rate over the challenge duration
      const durationDays = Math.ceil(
        (Math.min(Date.now(), challenge.endDate) - challenge.startDate) / (1000 * 60 * 60 * 24)
      );
      if (durationDays <= 0) return null;

      const completedDays = await HabitEntry.countDocuments({
        habitId: effectiveHabitId,
        userId,
        completed: true,
        date: { $gte: challenge.startDate, $lte: new Date() },
      });

      const rate = Math.round((completedDays / durationDays) * 100);
      return {
        currentValue: completedDays,
        completionRate: rate,
        lastLoggedAt: new Date(),
      };
    }

    case 'team_goal': {
      // Individual contribution — the model sums all participants for completion check
      const match = {
        habitId: effectiveHabitId,
        userId,
        completed: true,
        date: { $gte: challenge.startDate, $lte: challenge.endDate },
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

    default:
      return null;
  }
}

module.exports = { processChallengeProgress };
