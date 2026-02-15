import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   TopHabitsList -- ranked habits with progress bars + sparklines
   Shows top habits sorted by completion rate. Each row:
   rank | color dot | icon+name | progress bar | rate %
----------------------------------------------------------------- */

const TopHabitsList = ({ habits, entries, timeRange }) => {
  const ranked = useMemo(() => {
    if (!habits.length) return [];

    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    return habits
      .map(habit => {
        const hEntries = entries[habit._id] || {};
        let completions = 0;
        let possible = 0;

        // Sparkline: last 14 days (binary dots)
        const sparkDays = Math.min(14, days);
        const sparkStart = new Date(endDate);
        sparkStart.setDate(sparkStart.getDate() - sparkDays + 1);
        const spark = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = fmtDate(d);
          if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
          possible++;
          const entry = hEntries[dateStr];
          const done = !!(entry && entry.completed);
          if (done) completions++;
          if (d >= sparkStart) spark.push(done ? 1 : 0);
        }

        const rate = possible > 0 ? Math.round((completions / possible) * 100) : 0;

        return {
          id: habit._id,
          name: habit.name,
          icon: habit.icon || '🎯',
          color: habit.color || '#818cf8',
          rate,
          completions,
          possible,
          spark,
        };
      })
      .filter(h => h.possible > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 6);
  }, [habits, entries, timeRange]);

  if (!ranked.length) {
    return (
      <div className="analytics-chart-card flex flex-col items-center justify-center h-[240px] gap-2">
        <span className="text-3xl opacity-40">🏆</span>
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Your top habits will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
        Top Habits
      </h3>

      <div className="space-y-1.5">
        {ranked.map((h, i) => (
          <div
            key={h.id}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors group"
          >
            {/* Rank */}
            <span className={`w-5 text-xs font-spartan font-bold ${
              i === 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-tertiary)]'
            }`}>
              {i + 1}
            </span>

            {/* Color dot */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-[var(--color-surface-primary)]"
              style={{ backgroundColor: h.color, ringColor: `${h.color}33` }}
            />

            {/* Icon + Name */}
            <span className="flex-1 text-sm font-spartan text-[var(--color-text-primary)] truncate min-w-0">
              {h.icon} {h.name}
            </span>

            {/* Progress bar */}
            <div className="w-16 sm:w-20 h-1.5 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden flex-shrink-0">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(h.rate, 2)}%`,
                  background: h.rate > 0
                    ? `linear-gradient(90deg, ${h.color}99, ${h.color})`
                    : 'transparent',
                }}
              />
            </div>

            {/* Rate */}
            <span
              className="w-10 text-right text-sm font-spartan font-semibold tabular-nums"
              style={{ color: h.rate > 0 ? h.color : 'var(--color-text-tertiary)' }}
            >
              {h.rate}%
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
