import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';

/* -----------------------------------------------------------------
   StreakBarChart -- per-habit current streak as horizontal bars
   Rounded bars with per-habit color, subtle grid, fire emoji empty state
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

          if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) {
            if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90)) break;
            continue;
          }

          const entry = hEntries[dateStr];
          if (entry && entry.completed) { streak++; }
          else { break; }
        }

        return {
          name: habit.name.length > 14 ? habit.name.slice(0, 13) + '\u2026' : habit.name,
          fullName: habit.name,
          streak,
          color: habit.color || '#818cf8',
          icon: habit.icon || '\uD83C\uDFAF',
        };
      })
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 8);
  }, [habits, entries]);

  // Empty state -- show even habits with 0 streaks for visual context
  const hasStreaks = streakData.some(d => d.streak > 0);

  if (!streakData.length) {
    return (
      <div className="analytics-chart-card flex flex-col items-center justify-center h-[280px] gap-2">
        <span className="text-3xl opacity-40">\uD83D\uDD25</span>
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Complete habits on consecutive days to build streaks
        </p>
      </div>
    );
  }

  if (!hasStreaks) {
    return (
      <div className="analytics-chart-card flex flex-col items-center justify-center h-[280px] gap-2">
        <span className="text-3xl opacity-40">\uD83D\uDD25</span>
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)] text-center leading-relaxed">
          Complete habits on consecutive days to build streaks
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-xs">
          {streakData.slice(0, 5).map((h, i) => (
            <span key={i} className="text-[10px] font-spartan px-2 py-0.5 rounded-full border border-[var(--color-border-primary)] text-[var(--color-text-tertiary)]">
              {h.icon} {h.fullName}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const displayData = streakData.filter(d => d.streak > 0);
  const maxStreak = Math.max(...displayData.map(d => d.streak), 1);

  return (
    <div className="analytics-chart-card">
      <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
        Current Streaks
      </h3>

      <div style={{ width: '100%', height: Math.max(160, displayData.length * 44 + 20) }}>
        <ResponsiveContainer>
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="var(--color-border-primary)"
              strokeOpacity={0.3}
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, Math.ceil(maxStreak * 1.15)]}
              tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)', fontFamily: 'League Spartan' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}d`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--color-text-primary)', fontFamily: 'League Spartan' }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip content={<StreakTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="streak" radius={[0, 8, 8, 0]} barSize={20} animationDuration={600}>
              {displayData.map((entry, i) => (
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
    <div className="analytics-tooltip">
      <p className="font-medium text-[var(--color-text-primary)]">{d.icon} {d.fullName}</p>
      <p style={{ color: d.color }}>
        \uD83D\uDD25 <span className="font-semibold">{d.streak}</span> day streak
      </p>
    </div>
  );
};

export default StreakBarChart;
