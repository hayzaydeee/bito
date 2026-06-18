/**
 * Insight Tier Utility
 *
 * Determines a user's data-maturity tier for gating AI insights based on 
 * both time (days active since first tracking) and volume (total entries).
 *
 * Tiers:
 *   seedling  (<3 days or <3 entries) -> kickstart insights only, no LLM
 *   sprouting (3-6 days, 3+ entries)  -> early observation, basic nudges (no deep trends)
 *   growing   (7+ days, 7+ entries)   -> full deep dive LLM pipeline and weekly reports
 */

const mongoose = require('mongoose');

const TIER_THRESHOLDS = {
  sproutingDays: 3,
  growingDays: 7,
  sproutingEntries: 3,
  growingEntries: 7,
};

/**
 * Get the insight tier for a user based on their tracked data maturity.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<{ tier: string, entryCount: number, daysActive: number, thresholds: Object }>}
 */
async function getUserInsightTier(userId) {
  const HabitEntry = mongoose.model('HabitEntry');
  
  // Get total count
  const entryCount = await HabitEntry.countDocuments({ userId });
  
  let daysActive = 0;
  
  if (entryCount > 0) {
    // Find earliest entry date
    const earliestEntry = await HabitEntry.findOne({ userId }).sort({ date: 1 }).select('date');
    if (earliestEntry && earliestEntry.date) {
      const firstDate = new Date(earliestEntry.date);
      firstDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const msPerDay = 86400000;
      daysActive = Math.floor((today - firstDate) / msPerDay);
      // Ensure daysActive is at least 0 (if entry is today)
      if (daysActive < 0) daysActive = 0;
    }
  }

  let tier = 'seedling';
  
  if (daysActive >= TIER_THRESHOLDS.growingDays && entryCount >= TIER_THRESHOLDS.growingEntries) {
    tier = 'growing';
  } else if (daysActive >= TIER_THRESHOLDS.sproutingDays && entryCount >= TIER_THRESHOLDS.sproutingEntries) {
    tier = 'sprouting';
  }

  return { tier, entryCount, daysActive, thresholds: TIER_THRESHOLDS };
}

module.exports = { getUserInsightTier, TIER_THRESHOLDS };
