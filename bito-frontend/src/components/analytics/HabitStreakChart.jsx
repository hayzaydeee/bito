import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* -----------------------------------------------------------------
   HabitStreakChart -- running streak over time for top habits
   Multi-line chart showing how each habit's streak evolves day-by-day.
   Matches analytics design language: .analytics-chart-card, League
   Spartan, Garamond titles, dashed cursor, analytics-tooltip.
----------------------------------------------------------------- */

const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

/* ── Color palette ─────────────────────────────────────────────── */
const COLORS = [
  '#818cf8', // indigo (brand)
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f87171', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
];

const HabitStreakChart = ({
  habits = [],
  entries = {},
  timeRange = '30d',
  dateRange,
  widgetMode = false,
  maxHabitsDisplayed = 5,
  chartHeight = 320,
  showLegend = true,
  showTopStreaks = true,
  onAddHabit,
  accountAgeDays = 365,
}) => {
  const { chartData, topHabits, peakStreak, hasWeeklyHabits } = useMemo(() => {
    if (!habits.length) return { chartData: [], topHabits: [], peakStreak: 0, hasWeeklyHabits: false };

    // Split daily and weekly habits
    const dailyHabits = habits.filter(h => h.frequency !== 'weekly');
    const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
    const hasWeekly = weeklyHabits.length > 0;

    // Determine date range
    let startDate, endDate;
    if (dateRange?.start && dateRange?.end) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
    } else {
      endDate = new Date();
      startDate = new Date();
      const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
      startDate.setDate(endDate.getDate() - days);
    }

    // Rank daily habits by total completions in period
    const habitCompletions = dailyHabits.map(habit => {
      const habitEntries = entries[habit._id] || {};
      let total = 0;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const entry = habitEntries[fmtDate(d)];
        if (entry?.completed) total++;
      }
      return { habit, total, color: habit.color || null };
    });

    const topHabitsData = habitCompletions
      .filter(({ total }) => total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, maxHabitsDisplayed)
      .map((h, i) => ({ ...h, color: h.color || COLORS[i % COLORS.length], isWeekly: false }));

    // Build per-day running-streak data for daily habits
    let peak = 0;
    const data = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = fmtDate(d);
      const dayData = {
        date: dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };

      topHabitsData.forEach(({ habit }) => {
        const he = entries[habit._id] || {};
        let streak = 0;
        for (let s = new Date(d); s >= startDate; s.setDate(s.getDate() - 1)) {
          if (he[fmtDate(s)]?.completed) streak++;
          else break;
        }
        dayData[habit._id] = streak;
        if (streak > peak) peak = streak;
      });

      data.push(dayData);
    }

    return { chartData: data, topHabits: topHabitsData, peakStreak: peak, hasWeeklyHabits: hasWeekly };
  }, [habits, entries, timeRange, dateRange, maxHabitsDisplayed]);

  /* ── Empty states ─────────────────────────────── */
  if (!habits.length || !topHabits.length) {
    return (
      <div className="analytics-chart-card flex flex-col items-center justify-center h-[280px] gap-2">
        <span className="text-3xl opacity-40">📈</span>
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)] text-center leading-relaxed">
          Complete habits on consecutive days to see streak timelines
        </p>
      </div>
    );
  }

  /* ── Shared chart elements ───────────────────── */
  const chartContent = (
    <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
      <CartesianGrid
        strokeDasharray="3 6"
        stroke="var(--color-border-primary)"
        strokeOpacity={0.4}
        vertical={false}
      />
      <XAxis
        dataKey="label"
        tick={{ fontSize: '0.6875rem', fill: 'var(--color-text-tertiary)', fontFamily: 'League Spartan' }}
        tickLine={false}
        axisLine={false}
        interval="preserveStartEnd"
      />
      <YAxis
        tick={{ fontSize: '0.6875rem', fill: 'var(--color-text-tertiary)', fontFamily: 'League Spartan' }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => `${Math.round(v)}d`}
        domain={[0, (max) => Math.max(max + 1, 3)]}
      />
      <Tooltip
        content={<StreakTimelineTooltip topHabits={topHabits} />}
        cursor={{ stroke: 'var(--color-brand-400)', strokeWidth: 1, strokeDasharray: '4 4' }}
      />
      {topHabits.map((habitData) => (
        <Line
          key={habitData.habit._id}
          type="monotone"
          dataKey={habitData.habit._id}
          stroke={habitData.color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{
            r: 5,
            fill: habitData.color,
            stroke: 'var(--color-surface-primary)',
            strokeWidth: 2,
          }}
          name={habitData.habit.name}
          animationDuration={600}
          animationEasing="ease-out"
        />
      ))}
    </LineChart>
  );

  /* ── Widget mode: plain wrapper, no chrome ───── */
  if (widgetMode) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            {chartContent}
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  /* ── Analytics mode: full card with header + legend */
  return (
    <div className="analytics-chart-card">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)]">
          Streak Timeline
        </h3>
        {peakStreak > 0 && (
          <span
            className="text-xs font-spartan px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-brand-400)' }}
          >
            peak {peakStreak}d
          </span>
        )}
      </div>

      {/* ── Chart ──────────────────────────────── */}
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          {chartContent}
        </ResponsiveContainer>
      </div>

      {/* ── Legend (inline pills) ──────────────── */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[var(--color-border-primary)]">
        {topHabits.map((h) => (
          <div key={h.habit._id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="text-xs font-spartan text-[var(--color-text-secondary)]">
              {h.habit.name}
            </span>
            <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
              ({h.total})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Tooltip ────────────────────────────────────────────────────── */
const StreakTimelineTooltip = ({ active, payload, topHabits }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="analytics-tooltip">
      <p className="font-medium text-[var(--color-text-primary)] mb-1">{d?.label}</p>
      {payload.map((entry, i) => {
        const habit = topHabits?.find((h) => h.habit._id === entry.dataKey);
        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--color-text-secondary)]">
              {habit?.habit.name}:
            </span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.value}d
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default HabitStreakChart;
