'use strict';

/**
 * Consolidated in-memory cache for challenge ↔ habit linkage.
 *
 * The cache answers "is this habit linked to any active challenge for this user?"
 * in O(1) without hitting the database on every check-in.
 *
 * Cache is intentionally NOT persisted — it warms on first check-in and is
 * invalidated on join/leave/habit-change.
 */

const Challenge = require('../models/Challenge');

const _cache = new Map(); // userId (string) → Set<habitId (string)>

/**
 * Warm the cache for a user by loading their active challenge participant records.
 * Replaces any existing cached entry.
 */
async function warmForUser(userId) {
  try {
    const challenges = await Challenge.find({
      status: 'active',
      'participants.userId': userId,
      'participants.status': 'active',
    }).select('participants').lean();

    const habitIds = new Set();
    for (const c of challenges) {
      const p = c.participants?.find(
        (participant) =>
          String(participant.userId) === String(userId) && participant.status === 'active'
      );
      if (p?.linkedHabitIds?.length) {
        p.linkedHabitIds.forEach((id) => habitIds.add(String(id)));
      } else if (p?.linkedHabitId) {
        habitIds.add(String(p.linkedHabitId));
      }
    }

    _cache.set(String(userId), habitIds);
  } catch (err) {
    console.warn('[ChallengeCache] Warm failed:', err.message);
    _cache.delete(String(userId));
  }
}

/**
 * Invalidate the cache for a user (call on join, leave, or habit-link change).
 */
function invalidate(userId) {
  _cache.delete(String(userId));
}

/**
 * Check whether a habit is linked to any challenge for this user.
 * Returns:
 *   true  — definitely linked
 *   false — definitely NOT linked (cache is warm and habit is absent)
 *   null  — cache miss (caller should warm then re-check, or skip the fast path)
 */
function has(userId, habitId) {
  const cached = _cache.get(String(userId));
  if (cached === undefined) return null;
  return cached.has(String(habitId));
}

module.exports = { warmForUser, invalidate, has };
