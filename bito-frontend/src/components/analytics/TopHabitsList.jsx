import React, { useMemo } from 'react';
import { Trophy } from '@phosphor-icons/react';
import HabitIcon from '../shared/HabitIcon';

/* -----------------------------------------------------------------
   TopHabitsList -- ranked habits with progress bars + sparklines
   Shows top habits sorted by completion rate. Each row:
   rank | color dot | icon+name | progress bar | rate %
----------------------------------------------------------------- */

const TopHabitsList = ({ habits, entries, timeRange, accountAgeDays = 365, stripped = false }) => {
  const ranked = useMemo(() => {
    if (!habits.length) return [];

    const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    return habits
      .map(habit => {
        const hEntries = entries[habit._id] || {};
        let completions = 0;
        let possible = 0;
        const isWeekly = habit.frequency === 'weekly';

        // Clamp start to habit creation date so new habits aren't penalized
        const habitCreatedAt = habit.createdAt ? new Date(habit.createdAt) : startDate;
        const effectiveStart = new Date(Math.max(startDate.getTime(), habitCreatedAt.getTime()));

        // Sparkline: last 14 days (binary dots)
        const sparkDays = Math.min(14, days);
        const sparkStart = new Date(endDate);
        sparkStart.setDate(sparkStart.getDate() - sparkDays + 1);
        const spark = [];

        if (isWeekly) {
          // For weekly habits: count weeks met vs total weeks
          const target = habit.weeklyTarget || 3;
          let weekStart = new Date(effectiveStart);
          // Align to Monday
          const startDay = weekStart.getDay();
          const toMonday = startDay === 0 ? 1 : (startDay === 1 ? 0 : 8 - startDay);
          weekStart.setDate(weekStart.getDate() + toMonday);

          while (weekStart <= endDate) {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            let weekCompletions = 0;
            for (let d = new Date(weekStart); d <= weekEnd && d <= endDate; d.setDate(d.getDate() + 1)) {
              const entry = hEntries[fmtDate(d)];
              if (entry?.completed) weekCompletions++;
            }
            possible++;
            if (weekCompletions >= target) completions++;
            weekStart.setDate(weekStart.getDate() + 7);
          }

          // Sparkline for weekly: last 14 days of individual completions
          for (let d = new Date(sparkStart); d <= endDate; d.setDate(d.getDate() + 1)) {
            const entry = hEntries[fmtDate(d)];
            spark.push(entry?.completed ? 1 : 0);
          }
        } else {
          for (let d = new Date(effectiveStart); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = fmtDate(d);
            if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
            possible++;
            const entry = hEntries[dateStr];
            const done = !!(entry && entry.completed);
            if (done) completions++;
            if (d >= sparkStart) spark.push(done ? 1 : 0);
          }
        }

        const rate = possible > 0 ? Math.round((completions / possible) * 100) : 0;

        return {
          id: habit._id,
          name: habit.name,
          icon: habit.icon || 'Target',
          color: habit.color || '#818cf8',
          rate,
          completions,
          possible,
          spark,
          isWeekly,
          rateLabel: isWeekly ? `${completions}/${possible}w` : `${rate}%`,
        };
      })
      .filter(h => h.possible > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 6);
  }, [habits, entries, timeRange]);

  if (!ranked.length) {
    return (
      <div className={stripped ? 'flex flex-col items-center justify-center h-[220px] gap-2' : 'analytics-chart-card flex flex-col items-center justify-center h-[240px] gap-2'}>
        <Trophy size={24} weight="duotone" className="opacity-40 text-[var(--color-text-tertiary)]" />
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Your top habits will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={stripped ? '' : 'analytics-chart-card'}>
      {!stripped && (
        <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
          Top Habits
        </h3>
      )}

      <div className={stripped ? 'space-y-0' : 'space-y-1.5'}>
        {ranked.map((h, i) => (
          <div
            key={h.id}
            className={`flex items-center gap-3 transition-colors ${
              stripped
                ? 'py-2.5 border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface-2)]'
                : 'p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            {/* Rank */}
            <span
              className={`w-5 tabular-nums flex-shrink-0 ${stripped ? 'std-mono text-[10px]' : 'text-xs font-spartan font-bold'}`}
              style={{ color: i === 0 ? 'var(--signal)' : 'var(--color-text-tertiary)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Icon + Name */}
            <span className={`flex items-center gap-1.5 flex-1 truncate min-w-0 ${stripped ? 'std-mono text-xs text-[var(--ink)]' : 'text-sm font-spartan text-[var(--color-text-primary)]'}`}>
              <HabitIcon icon={h.icon} size={13} />
              <span className="truncate">{h.name}</span>
            </span>

            {/* Progress bar */}
            <div className={`h-1 overflow-hidden flex-shrink-0 ${stripped ? 'w-16 sm:w-24 bg-[var(--line)]' : 'w-16 sm:w-20 rounded-full bg-[var(--color-surface-elevated)]'}`}>
              <div
                className={`h-full transition-all duration-500 ${stripped ? '' : 'rounded-full'}`}
                style={{
                  width: `${Math.max(h.rate, 2)}%`,
                  background: h.rate > 0 ? (stripped ? `var(--signal)` : `linear-gradient(90deg, ${h.color}99, ${h.color})`) : 'transparent',
                  opacity: stripped ? 0.7 : 1,
                }}
              />
            </div>

            {/* Rate */}
            <span
              className={`w-12 text-right tabular-nums flex-shrink-0 ${stripped ? 'std-mono text-[11px]' : 'text-sm font-spartan font-semibold'}`}
              style={{ color: stripped ? (h.rate > 0 ? 'var(--ink)' : 'var(--ink-3)') : (h.rate > 0 ? h.color : 'var(--color-text-tertiary)') }}
            >
              {h.rateLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default TopHabitsList;
