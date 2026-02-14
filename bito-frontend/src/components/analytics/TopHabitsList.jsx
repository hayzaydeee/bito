import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   TopHabitsList — ranked list with inline sparklines
   Shows top habits sorted by completion rate, each row has:
   rank • color dot • name • sparkline (last 14 days) • rate %
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

        // Daily series for sparkline (last 14 days or timeRange, whichever is less)
        const sparkDays = Math.min(14, days);
        const sparkStart = new Date(endDate);
        sparkStart.setDate(sparkStart.getDate() - sparkDays + 1);
        const spark = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${dd}`;

          if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;

          possible++;
          const entry = hEntries[dateStr];
          const done = !!(entry && entry.completed);
          if (done) completions++;

          if (d >= sparkStart) {
            spark.push(done ? 1 : 0);
          }
        }

        const rate = possible > 0 ? Math.round((completions / possible) * 100) : 0;

        return {
          id: habit._id,
          name: habit.name,
          icon: habit.icon || '🎯',
          color: habit.color || '#6366f1',
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
      <div className="card p-6 flex items-center justify-center h-[200px]">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Your top habits will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
        Top Habits
      </h3>

      <div className="space-y-2">
        {ranked.map((h, i) => (
          <div
            key={h.id}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            {/* Rank */}
            <span className="w-5 text-xs font-spartan font-bold text-[var(--color-text-tertiary)]">
              {i + 1}
            </span>

            {/* Color dot */}
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />

            {/* Name */}
            <span className="flex-1 text-sm font-spartan text-[var(--color-text-primary)] truncate">
              {h.icon} {h.name}
            </span>

            {/* Sparkline */}
            <Sparkline data={h.spark} color={h.color} />

            {/* Rate */}
            <span className="w-12 text-right text-sm font-spartan font-semibold" style={{ color: h.color }}>
              {h.rate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- tiny SVG sparkline ---------- */
const Sparkline = ({ data, color, width = 60, height = 20 }) => {
  if (!data.length) return <div style={{ width, height }} />;

  // Build polyline points — each point is spaced evenly
  const step = width / Math.max(data.length - 1, 1);
  const points = data
    .map((v, i) => `${i * step},${v ? 2 : height - 2}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="flex-shrink-0 opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default TopHabitsList;
