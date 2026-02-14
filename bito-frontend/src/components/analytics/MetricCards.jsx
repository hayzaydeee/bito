import React, { useMemo } from 'react';
import { habitUtils } from '../../utils/habitLogic';

/* -----------------------------------------------------------------
   MetricCards — 4 compact stat cards
   Total Habits | Completions | Success Rate | Best Streak
   Desktop: 4-col grid  |  Mobile: horizontal scroll
----------------------------------------------------------------- */

const MetricCards = ({ habits, entries, timeRange }) => {
  const data = useMemo(() => {
    if (!habits.length) return { total: 0, completions: 0, rate: 0, bestStreak: 0 };

    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    let completions = 0;
    let possible = 0;
    let bestStreak = 0;

    habits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      let streak = 0;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dd}`;

        // Check if habit was scheduled for this date
        if (habit.schedule?.days?.length) {
          const dayOfWeek = d.getDay();
          if (!habit.schedule.days.includes(dayOfWeek)) continue;
        }

        possible++;
        const entry = hEntries[dateStr];
        if (entry && entry.completed) {
          completions++;
          streak++;
          if (streak > bestStreak) bestStreak = streak;
        } else {
          streak = 0;
        }
      }
    });

    const rate = possible > 0 ? Math.round((completions / possible) * 100) : 0;

    return {
      total: habits.filter(h => h.isActive !== false).length,
      completions,
      rate,
      bestStreak,
    };
  }, [habits, entries, timeRange]);

  const cards = [
    { label: 'Active Habits', value: data.total, icon: '📋', accent: 'var(--color-brand-400)' },
    { label: 'Completions',   value: data.completions, icon: '✅', accent: 'var(--color-success)' },
    { label: 'Success Rate',  value: `${data.rate}%`, icon: '📈', accent: 'var(--color-info)' },
    { label: 'Best Streak',   value: `${data.bestStreak}d`, icon: '🔥', accent: 'var(--color-warning)' },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible">
      {cards.map(c => (
        <div
          key={c.label}
          className="min-w-[140px] snap-start flex-shrink-0 md:min-w-0 card p-4 flex flex-col gap-1"
        >
          <span className="text-lg">{c.icon}</span>
          <span
            className="text-2xl font-garamond font-bold"
            style={{ color: c.accent }}
          >
            {c.value}
          </span>
          <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;
