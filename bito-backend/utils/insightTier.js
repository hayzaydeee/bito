/**
 * Insight Tier Utility
 *
 * Determines a user's data-maturity tier for gating AI insights.
 *
 * Tiers:
 *   seedling  (0–6 entries)   → kickstart insights only, no LLM
 *   sprouting (7–20 entries)  → constrained LLM (no trend claims)
 *   growing   (21+ entries)   → full pipeline
 */

const mongoose = require('mongoose');

const TIER_THRESHOLDS = {
  sprouting: 7,
  growing: 21,
};

/**
 * Get the insight tier for a user based on their total entry count.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<{ tier: string, entryCount: number, thresholds: Object }>}
 */
async function getUserInsightTier(userId) {
  const HabitEntry = mongoose.model('HabitEntry');
  const entryCount = await HabitEntry.countDocuments({ userId });

  let tier;
  if (entryCount >= TIER_THRESHOLDS.growing) {
    tier = 'growing';
  } else if (entryCount >= TIER_THRESHOLDS.sprouting) {
    tier = 'sprouting';
  } else {
    tier = 'seedling';
  }

  return { tier, entryCount, thresholds: TIER_THRESHOLDS };
}

module.exports = { getUserInsightTier, TIER_THRESHOLDS };
