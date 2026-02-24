/**
 * Rule-Based Insights Engine (Layer 1)
 * 
 * Analyses habit entries, journal entries, and habit metadata to produce
 * actionable insights / nudges.  Every detector returns an array of
 * { type, title, body, priority, icon, category } objects.
 *
 * Priority: 1 = high  (show first)   2 = medium   3 = low
 */

const mongoose = require('mongoose');

// ─── Helpers ───────────────────────────────────────────────────────────

/** Midnight-normalised date string YYYY-MM-DD */
const toDateKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

/** Day-of-week index (0=Sun) → name */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Days between two date objects (ignoring time) */
const daysBetween = (a, b) => {
  const msPerDay = 86400000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((ub - ua) / msPerDay);
};

/** Get Monday-based week start for a date (ISO week: Mon=start) */
const getWeekStartUTC = (d) => {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Mon=0
  dt.setUTCDate(dt.getUTCDate() - diff);
  return dt;
};

/** Is a habit a weekly-target habit? */
const isWeeklyHabit = (h) => h.frequency === 'weekly';

// ─── Detectors ─────────────────────────────────────────────────────────

/**
 * 1. Streak celebrations & near-record alerts
 */
function detectStreaks(habits) {
  const insights = [];
  for (const h of habits) {
    const { currentStreak, longestStreak } = h.stats || {};
    if (!currentStreak) continue;

    const weekly = isWeeklyHabit(h);
    const unit = weekly ? 'week' : 'day';
    const units = weekly ? 'weeks' : 'days';

    // Milestone streaks (different scales for weekly vs daily)
    const milestones = weekly
      ? [52, 26, 12, 8, 4]          // ~1yr, 6mo, 3mo, 2mo, 1mo
      : [100, 50, 30, 21, 14, 7];

    for (const m of milestones) {
      if (currentStreak === m) {
        insights.push({
          type: 'streak_milestone',
          title: `${m}-${unit} streak! 🔥`,
          body: weekly
            ? `You've met your weekly target for "${h.name}" ${m} weeks running. Incredible consistency!`
            : `You've completed "${h.name}" ${m} days in a row. Incredible dedication!`,
          priority: weekly ? (m >= 12 ? 1 : 2) : (m >= 30 ? 1 : 2),
          icon: '🔥',
          category: 'celebration',
          habitId: h._id,
        });
        break;
      }
    }

    // Approaching personal record
    if (longestStreak > 0 && currentStreak > 0 && currentStreak >= longestStreak - 2 && currentStreak < longestStreak) {
      insights.push({
        type: 'streak_near_record',
        title: 'Almost a new record!',
        body: weekly
          ? `"${h.name}" is at ${currentStreak} ${units} — your record is ${longestStreak}. Just ${longestStreak - currentStreak} more!`
          : `"${h.name}" is at ${currentStreak} days — your record is ${longestStreak}. Just ${longestStreak - currentStreak} more!`,
        priority: 1,
        icon: '🏆',
        category: 'motivation',
        habitId: h._id,
      });
    }

    // New record just set
    const recordThreshold = weekly ? 2 : 3;
    if (longestStreak > 0 && currentStreak === longestStreak && currentStreak > recordThreshold) {
      insights.push({
        type: 'streak_new_record',
        title: 'New personal best! 🎉',
        body: weekly
          ? `"${h.name}" just hit a record ${currentStreak}-week streak of meeting your target!`
          : `"${h.name}" just hit a record ${currentStreak}-day streak!`,
        priority: 1,
        icon: '🎉',
        category: 'celebration',
        habitId: h._id,
      });
    }
  }
  return insights;
}

/**
 * 2. At-risk habits — haven't been completed recently
 *    Weekly habits: late-in-week but below target
 */
function detectAtRisk(habits, entries) {
  const insights = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun

  for (const h of habits) {
    if (!h.isActive || h.isArchived) continue;

    if (isWeeklyHabit(h)) {
      // Weekly habit: check pacing within the current week
      const weekStart = getWeekStartUTC(today);
      const target = h.weeklyTarget || 3;
      const thisWeekEntries = entries.filter(e =>
        String(e.habitId) === String(h._id) &&
        e.completed &&
        new Date(e.date) >= weekStart &&
        new Date(e.date) <= today
      );
      const completed = thisWeekEntries.length;
      const remaining = target - completed;

      if (remaining <= 0) continue; // already met target

      // Days left in the week (Mon=start, Sun=end)
      const daysLeft = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Sun=0 left

      if (daysLeft === 0 && remaining > 0) {
        // Last day of week, still behind
        insights.push({
          type: 'weekly_at_risk',
          title: `Last chance for "${h.name}"`,
          body: `Today's the last day of the week and you still need ${remaining} more to hit your ${target}/week target.`,
          priority: 1,
          icon: '⏰',
          category: 'nudge',
          habitId: h._id,
        });
      } else if (daysLeft <= 2 && remaining > daysLeft) {
        // Very tight — more remaining than days left
        insights.push({
          type: 'weekly_at_risk_mild',
          title: `"${h.name}" needs a push`,
          body: `${completed}/${target} done this week with ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left. You'll need to hit every remaining day!`,
          priority: 2,
          icon: '💡',
          category: 'nudge',
          habitId: h._id,
        });
      }
      continue;
    }

    // Daily habit: original logic
    const last = h.stats?.lastChecked ? new Date(h.stats.lastChecked) : null;
    if (!last) continue;

    const gap = daysBetween(last, today);

    if (gap >= 7) {
      insights.push({
        type: 'at_risk',
        title: `"${h.name}" needs attention`,
        body: `It's been ${gap} days since you last completed this habit. A small step today can reignite the momentum.`,
        priority: 1,
        icon: '⚠️',
        category: 'nudge',
        habitId: h._id,
      });
    } else if (gap >= 3) {
      insights.push({
        type: 'at_risk_mild',
        title: `Missing "${h.name}"?`,
        body: `You haven't logged "${h.name}" in ${gap} days. Jump back in today!`,
        priority: 2,
        icon: '💡',
        category: 'nudge',
        habitId: h._id,
      });
    }
  }
  return insights;
}

/**
 * 3. Day-of-week analysis — strongest & weakest days
 */
function detectDayOfWeek(entries) {
  if (entries.length < 14) return []; // need at least 2 weeks of data

  const dayBuckets = Array.from({ length: 7 }, () => ({ completed: 0, total: 0 }));

  for (const e of entries) {
    const dow = new Date(e.date).getDay();
    dayBuckets[dow].total++;
    if (e.completed) dayBuckets[dow].completed++;
  }

  const rates = dayBuckets.map((b, i) => ({
    day: i,
    name: DAY_NAMES[i],
    rate: b.total > 0 ? b.completed / b.total : null,
    total: b.total,
  })).filter(r => r.rate !== null && r.total >= 2);

  if (rates.length < 3) return [];

  rates.sort((a, b) => b.rate - a.rate);
  const best = rates[0];
  const worst = rates[rates.length - 1];
  const insights = [];

  if (best.rate > 0.7) {
    insights.push({
      type: 'best_day',
      title: `${best.name}s are your power day`,
      body: `You complete ${Math.round(best.rate * 100)}% of your habits on ${best.name}s — your most productive day.`,
      priority: 3,
      icon: '📊',
      category: 'pattern',
    });
  }

  if (worst.rate < 0.4 && best.rate - worst.rate > 0.3) {
    insights.push({
      type: 'weak_day',
      title: `${worst.name}s could use a plan`,
      body: `Your completion drops to ${Math.round(worst.rate * 100)}% on ${worst.name}s. Consider lighter goals or a reminder.`,
      priority: 2,
      icon: '📉',
      category: 'pattern',
    });
  }

  return insights;
}

/**
 * 4. Consistency trend — this week vs last week
 */
function detectConsistencyTrend(entries) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  let thisWeek = { done: 0, total: 0 };
  let lastWeek = { done: 0, total: 0 };

  for (const e of entries) {
    const d = new Date(e.date);
    if (d >= sevenDaysAgo && d <= today) {
      thisWeek.total++;
      if (e.completed) thisWeek.done++;
    } else if (d >= fourteenDaysAgo && d < sevenDaysAgo) {
      lastWeek.total++;
      if (e.completed) lastWeek.done++;
    }
  }

  if (lastWeek.total < 3 || thisWeek.total < 3) return [];

  const thisRate = thisWeek.done / thisWeek.total;
  const lastRate = lastWeek.done / lastWeek.total;
  const diff = thisRate - lastRate;
  const pctChange = Math.round(Math.abs(diff) * 100);

  if (pctChange < 10) return [];

  const insights = [];
  if (diff > 0) {
    insights.push({
      type: 'trend_up',
      title: 'Consistency is climbing ↑',
      body: `Your completion rate improved by ${pctChange} percentage points compared to last week. Keep the momentum going!`,
      priority: 2,
      icon: '📈',
      category: 'trend',
    });
  } else {
    insights.push({
      type: 'trend_down',
      title: 'Slight dip this week',
      body: `Your completion rate dropped ${pctChange} percentage points vs last week. A small reset can turn things around.`,
      priority: 2,
      icon: '📉',
      category: 'trend',
    });
  }
  return insights;
}

/**
 * 5. Mood–habit correlation
 */
function detectMoodCorrelation(entries, journalEntries) {
  // Approach: compare average mood on high-completion days vs low-completion days
  // Group entries by date, compute per-day completion ratio, then correlate with journal mood.

  if (journalEntries.length < 7) return [];

  // Build a mood map from journal
  const moodByDate = {};
  for (const j of journalEntries) {
    if (j.mood) moodByDate[toDateKey(j.date)] = j.mood;
  }

  // Build per-day completion ratio
  const dayMap = {};
  for (const e of entries) {
    const key = toDateKey(e.date);
    if (!dayMap[key]) dayMap[key] = { done: 0, total: 0 };
    dayMap[key].total++;
    if (e.completed) dayMap[key].done++;
  }

  let highMoodSum = 0, highMoodCount = 0;
  let lowMoodSum = 0, lowMoodCount = 0;

  for (const [dateKey, data] of Object.entries(dayMap)) {
    const mood = moodByDate[dateKey];
    if (mood === undefined) continue;
    const rate = data.done / data.total;
    if (rate >= 0.7) {
      highMoodSum += mood;
      highMoodCount++;
    } else if (rate <= 0.3) {
      lowMoodSum += mood;
      lowMoodCount++;
    }
  }

  if (highMoodCount < 3 || lowMoodCount < 3) return [];

  const highAvg = highMoodSum / highMoodCount;
  const lowAvg = lowMoodSum / lowMoodCount;
  const diff = highAvg - lowAvg;

  if (diff < 0.5) return [];

  return [{
    type: 'mood_correlation',
    title: 'Habits lift your mood',
    body: `On days you complete most habits, your mood averages ${highAvg.toFixed(1)} vs ${lowAvg.toFixed(1)} on low-completion days. Every check-off counts!`,
    priority: 2,
    icon: '😊',
    category: 'insight',
  }];
}

/**
 * 6. Journal engagement
 */
function detectJournalEngagement(journalEntries) {
  if (journalEntries.length < 3) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last7 = new Date(today);
  last7.setDate(last7.getDate() - 7);

  const recentCount = journalEntries.filter(j => new Date(j.date) >= last7).length;

  const insights = [];
  if (recentCount >= 6) {
    insights.push({
      type: 'journal_streak',
      title: 'Journaling superstar ✍️',
      body: `You've journaled ${recentCount} of the last 7 days. Reflection is a superpower.`,
      priority: 3,
      icon: '✍️',
      category: 'celebration',
    });
  } else if (recentCount === 0 && journalEntries.length >= 5) {
    insights.push({
      type: 'journal_lapse',
      title: 'Miss journaling?',
      body: `You haven't journaled this week. Even a few sentences can help you reflect and reset.`,
      priority: 3,
      icon: '📓',
      category: 'nudge',
    });
  }
  return insights;
}

/**
 * 7. Completion milestones
 */
function detectMilestones(habits) {
  const insights = [];
  const milestones = [1000, 500, 250, 100, 50];

  for (const h of habits) {
    const total = h.stats?.totalChecks || 0;
    for (const m of milestones) {
      if (total >= m && total < m + 5) {
        insights.push({
          type: 'total_milestone',
          title: `${m} completions! 🏅`,
          body: `"${h.name}" just crossed ${m} total check-ins. That's real commitment.`,
          priority: m >= 500 ? 1 : 2,
          icon: '🏅',
          category: 'celebration',
        });
        break; // only one milestone per habit
      }
    }
  }
  return insights;
}

/**
 * 8. Category balance
 */
function detectCategoryBalance(habits) {
  const activeHabits = habits.filter(h => h.isActive && !h.isArchived);
  if (activeHabits.length < 3) return [];

  const catCounts = {};
  for (const h of activeHabits) {
    catCounts[h.category] = (catCounts[h.category] || 0) + 1;
  }

  const categories = Object.entries(catCounts);
  if (categories.length >= 3) return []; // already diverse

  const dominant = categories.sort((a, b) => b[1] - a[1])[0];
  const pct = Math.round((dominant[1] / activeHabits.length) * 100);

  if (pct >= 70) {
    return [{
      type: 'category_imbalance',
      title: 'Diversify your habits?',
      body: `${pct}% of your habits are "${dominant[0]}". Adding variety (mindfulness, social, creative) can boost overall wellbeing.`,
      priority: 3,
      icon: '🎨',
      category: 'suggestion',
    }];
  }
  return [];
}

/**
 * 9. Completion-time pattern (morning / afternoon / evening)
 */
function detectTimeOfDay(entries) {
  const withTime = entries.filter(e => e.completedAt);
  if (withTime.length < 10) return [];

  const buckets = { morning: 0, afternoon: 0, evening: 0 };
  for (const e of withTime) {
    const h = new Date(e.completedAt).getHours();
    if (h < 12) buckets.morning++;
    else if (h < 17) buckets.afternoon++;
    else buckets.evening++;
  }

  const total = withTime.length;
  const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  const [topPeriod, topCount] = sorted[0];
  const pct = Math.round((topCount / total) * 100);

  if (pct < 50) return [];

  const labels = { morning: 'a morning person 🌅', afternoon: 'an afternoon achiever ☀️', evening: 'an evening closer 🌙' };

  return [{
    type: 'time_of_day',
    title: `You're ${labels[topPeriod]}`,
    body: `${pct}% of your habit completions happen in the ${topPeriod}. Lean into this rhythm!`,
    priority: 3,
    icon: topPeriod === 'morning' ? '🌅' : topPeriod === 'afternoon' ? '☀️' : '🌙',
    category: 'pattern',
  }];
}

/**
 * 10. Weekly habit pacing — front-loaded vs back-loaded vs even
 */
function detectWeeklyPacing(habits, entries) {
  const weeklyHabits = habits.filter(h => isWeeklyHabit(h) && h.isActive && !h.isArchived);
  if (weeklyHabits.length === 0) return [];

  const insights = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Look back 4 weeks for pacing patterns
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  for (const h of weeklyHabits) {
    const hEntries = entries.filter(e =>
      String(e.habitId) === String(h._id) &&
      e.completed &&
      new Date(e.date) >= fourWeeksAgo
    );

    if (hEntries.length < 8) continue; // need enough data

    // Classify each completion's position within its week (Mon=0, Sun=6)
    let earlyCount = 0; // Mon-Wed (positions 0-2)
    let lateCount = 0;  // Thu-Sun (positions 3-6)

    for (const e of hEntries) {
      const d = new Date(e.date);
      const dow = d.getDay(); // 0=Sun
      const weekPos = dow === 0 ? 6 : dow - 1; // Mon=0, Sun=6
      if (weekPos <= 2) earlyCount++;
      else lateCount++;
    }

    const total = earlyCount + lateCount;
    const earlyPct = earlyCount / total;

    if (earlyPct >= 0.7) {
      insights.push({
        type: 'weekly_pacing',
        title: `"${h.name}" front-loader 🏃`,
        body: `You tend to knock out "${h.name}" early in the week — ${Math.round(earlyPct * 100)}% Mon–Wed. Great for staying ahead!`,
        priority: 3,
        icon: '🏃',
        category: 'pattern',
        habitId: h._id,
      });
    } else if (earlyPct <= 0.3) {
      insights.push({
        type: 'weekly_pacing',
        title: `"${h.name}" weekend warrior`,
        body: `Most of your "${h.name}" completions happen Thu–Sun. Consider spreading them out to reduce end-of-week pressure.`,
        priority: 3,
        icon: '📅',
        category: 'suggestion',
        habitId: h._id,
      });
    }
  }
  return insights;
}

/**
 * 11. Weekly habit target met celebration
 */
function detectWeeklyTargetMet(habits, entries) {
  const weeklyHabits = habits.filter(h => isWeeklyHabit(h) && h.isActive && !h.isArchived);
  if (weeklyHabits.length === 0) return [];

  const insights = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = getWeekStartUTC(today);

  for (const h of weeklyHabits) {
    const target = h.weeklyTarget || 3;
    const thisWeekCompleted = entries.filter(e =>
      String(e.habitId) === String(h._id) &&
      e.completed &&
      new Date(e.date) >= weekStart &&
      new Date(e.date) <= today
    ).length;

    // Just met target (exactly at or 1 over)
    if (thisWeekCompleted === target || thisWeekCompleted === target + 1) {
      insights.push({
        type: 'weekly_target_met',
        title: `"${h.name}" target hit! ✅`,
        body: `You've reached your ${target}/week goal for "${h.name}" this week. Keep the momentum going!`,
        priority: 2,
        icon: '✅',
        category: 'celebration',
        habitId: h._id,
      });
    }

    // Over-achiever
    if (thisWeekCompleted >= target + 2) {
      insights.push({
        type: 'weekly_over_target',
        title: `Above and beyond! 🌟`,
        body: `"${h.name}" is at ${thisWeekCompleted}/${target} this week — exceeding your target. Consider raising it!`,
        priority: 3,
        icon: '🌟',
        category: 'suggestion',
        habitId: h._id,
      });
    }
  }
  return insights;
}


// ─── Main Engine ───────────────────────────────────────────────────────

/**
 * Generate all rule-based insights for a user.
 *
 * @param {string} userId
 * @returns {Promise<Object[]>}  sorted insights, highest priority first
 */
async function generateInsights(userId) {
  const Habit = mongoose.model('Habit');
  const HabitEntry = mongoose.model('HabitEntry');
  const JournalEntry = mongoose.model('JournalEntry');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch data in parallel
  const [habits, allEntries, journalEntries] = await Promise.all([
    Habit.find({ userId, isActive: true }).lean(),
    HabitEntry.find({ userId, date: { $gte: thirtyDaysAgo } }).lean(),
    JournalEntry.find({ userId, date: { $gte: thirtyDaysAgo } }).lean(),
  ]);

  // Scope entries to active habits only, respecting activatedAt for transformer habits
  const activeHabitIds = new Set(habits.map(h => String(h._id)));
  const activatedAtMap = new Map(habits.map(h => [String(h._id), h.activatedAt]));
  const entries = allEntries.filter(e => {
    const hid = String(e.habitId);
    if (!activeHabitIds.has(hid)) return false;
    const activatedAt = activatedAtMap.get(hid);
    if (activatedAt && new Date(e.date) < new Date(activatedAt)) return false;
    return true;
  });

  // Run all detectors
  const raw = [
    ...detectStreaks(habits),
    ...detectAtRisk(habits, entries),
    ...detectDayOfWeek(entries),
    ...detectConsistencyTrend(entries),
    ...detectMoodCorrelation(entries, journalEntries),
    ...detectJournalEngagement(journalEntries),
    ...detectMilestones(habits),
    ...detectCategoryBalance(habits),
    ...detectTimeOfDay(entries),
    ...detectWeeklyPacing(habits, entries),
    ...detectWeeklyTargetMet(habits, entries),
  ];

  // De-duplicate by type+habitId, keep highest priority
  const seen = new Set();
  const deduped = [];
  for (const insight of raw) {
    const key = insight.habitId ? `${insight.type}_${insight.habitId}` : insight.type;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(insight);
    }
  }

  // Sort: priority 1 first, then 2, then 3
  deduped.sort((a, b) => a.priority - b.priority);

  return deduped;
}

module.exports = { generateInsights };
