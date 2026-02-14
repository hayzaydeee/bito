import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   AnalyticsInsights — bottom-of-page insight cards
   Client-side heuristics analysing day-of-week, streaks, trends.
   Clean card layout, no glass, font-spartan body.
----------------------------------------------------------------- */

const AnalyticsInsights = ({ habits, entries, timeRange }) => {
  const insights = useMemo(() => {
    if (!habits.length) return [];

    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const results = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // ----- Day-of-week analysis -----
    const weekdayHits = Array(7).fill(0);
    const weekdayTotal = Array(7).fill(0);

    habits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(dow)) continue;
        weekdayTotal[dow]++;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const entry = hEntries[`${y}-${m}-${dd}`];
        if (entry && entry.completed) weekdayHits[dow]++;
      }
    });

    const weekdayRates = weekdayTotal.map((t, i) => ({ day: i, rate: t > 0 ? weekdayHits[i] / t : 0 }));
    const best = weekdayRates.reduce((a, b) => (b.rate > a.rate ? b : a));
    const worst = weekdayRates.reduce((a, b) => (b.rate < a.rate ? b : a));

    if (best.rate > 0) {
      results.push({
        emoji: '💪',
        title: `${dayNames[best.day]}s are your best`,
        body: `${Math.round(best.rate * 100)}% completion rate — lean into that rhythm.`,
        type: 'success',
      });
    }

    if (worst.rate < best.rate - 0.15 && worst.rate > 0) {
      results.push({
        emoji: '📉',
        title: `${dayNames[worst.day]}s could use love`,
        body: `Only ${Math.round(worst.rate * 100)}% on ${dayNames[worst.day]}s. Try lighter goals that day.`,
        type: 'warning',
      });
    }

    // ----- Streak champion -----
    let longestStreak = 0;
    let streakHabitName = '';

    habits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      let streak = 0;
      const today = new Date();

      for (let d = new Date(today); ; d.setDate(d.getDate() - 1)) {
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) {
          if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90)) break;
          continue;
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const entry = hEntries[`${y}-${m}-${dd}`];
        if (entry && entry.completed) { streak++; } else { break; }
      }

      if (streak > longestStreak) {
        longestStreak = streak;
        streakHabitName = habit.name;
      }
    });

    if (longestStreak >= 3) {
      results.push({
        emoji: '🔥',
        title: `${longestStreak}-day streak on "${streakHabitName}"`,
        body: longestStreak >= 7
          ? 'Incredible consistency — this habit is becoming second nature.'
          : "Keep going — a few more days and it'll be automatic.",
        type: 'success',
      });
    }

    // ----- Week-over-week trend -----
    const recentWeekRate = computeWeekRate(habits, entries, 0);
    const prevWeekRate = computeWeekRate(habits, entries, 7);

    if (recentWeekRate !== null && prevWeekRate !== null) {
      const delta = recentWeekRate - prevWeekRate;
      if (delta > 10) {
        results.push({
          emoji: '📈',
          title: `Up ${Math.round(delta)}% from last week`,
          body: 'Nice momentum — whatever changed is working.',
          type: 'success',
        });
      } else if (delta < -10) {
        results.push({
          emoji: '⚠️',
          title: `Down ${Math.round(Math.abs(delta))}% from last week`,
          body: 'A dip is normal. Try simplifying one habit to rebuild momentum.',
          type: 'warning',
        });
      }
    }

    return results.slice(0, 4);
  }, [habits, entries, timeRange]);

  if (!insights.length) return null;

  const borderColors = { success: 'var(--color-success)', warning: 'var(--color-warning)' };

  return (
    <div className="card p-5">
      <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
        Insights
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((ins, i) => (
          <div
            key={i}
            className="p-3 rounded-lg border-l-[3px] bg-[var(--color-surface-elevated)]"
            style={{ borderLeftColor: borderColors[ins.type] || 'var(--color-brand-400)' }}
          >
            <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)] mb-0.5">
              {ins.emoji} {ins.title}
            </p>
            <p className="text-xs font-spartan text-[var(--color-text-secondary)] leading-relaxed">
              {ins.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* helper: completion rate for the 7-day window starting `offsetDays` ago */
function computeWeekRate(habits, entries, offsetDays) {
  const end = new Date();
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  let hits = 0;
  let total = 0;

  habits.forEach(h => {
    const hE = entries[h._id] || {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (h.schedule?.days?.length && !h.schedule.days.includes(d.getDay())) continue;
      total++;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const entry = hE[`${y}-${m}-${dd}`];
      if (entry && entry.completed) hits++;
    }
  });

  return total > 0 ? Math.round((hits / total) * 100) : null;
}

export default AnalyticsInsights;
