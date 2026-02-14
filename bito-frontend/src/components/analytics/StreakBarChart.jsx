import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

/* -----------------------------------------------------------------
   StreakBarChart — per-habit current streak as horizontal bars
   Rounded bars, habit color, sorted longest→shortest
----------------------------------------------------------------- */

const StreakBarChart = ({ habits, entries }) => {
  const streakData = useMemo(() => {
    if (!habits.length) return [];

    return habits
      .map(habit => {
        const hEntries = entries[habit._id] || {};
        let streak = 0;
        const today = new Date();

        for (let d = new Date(today); ; d.setDate(d.getDate() - 1)) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${dd}`;

          // Respect schedule
          if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) {
            // Skip non-scheduled days without breaking streak
            if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90)) break;
            continue;
          }

          const entry = hEntries[dateStr];
          if (entry && entry.completed) {
            streak++;
          } else {
            break;
          }
        }

        return {
          name: habit.name,
          streak,
          color: habit.color || 'var(--color-brand-400)',
          icon: habit.icon || '🎯',
        };
      })
      .filter(h => h.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 8);
  }, [habits, entries]);

  if (!streakData.length) {
    return (
      <div className="card p-6 flex items-center justify-center h-[260px]">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Complete habits on consecutive days to build streaks
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
        Current Streaks
      </h3>

      <div style={{ width: '100%', height: Math.max(160, streakData.length * 40 + 20) }}>
        <ResponsiveContainer>
          <BarChart
            data={streakData}
            layout="vertical"
            margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--color-text-primary)' }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<StreakTooltip />} cursor={false} />
            <Bar dataKey="streak" radius={[0, 6, 6, 0]} barSize={18}>
              {streakData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const StreakTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card p-2 text-xs font-spartan shadow-lg border border-[var(--color-border-primary)]">
      <p className="font-medium text-[var(--color-text-primary)]">{d.icon} {d.name}</p>
      <p className="text-[var(--color-text-secondary)]">
        🔥 <span className="font-semibold">{d.streak}</span> day streak
      </p>
    </div>
  );
};

export default StreakBarChart;
