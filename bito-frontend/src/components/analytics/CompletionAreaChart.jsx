import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

/* -----------------------------------------------------------------
   CompletionAreaChart -- daily completion % as a gradient area
   Smooth curve, subtle grid, average reference line, rich tooltip.
   Only tracks daily habits — weekly habits have separate metrics.
----------------------------------------------------------------- */

const CompletionAreaChart = ({ habits, entries, timeRange, accountAgeDays = 365 }) => {
  const { chartData, average } = useMemo(() => {
    // Filter to daily habits only — weekly habits shouldn't drag down daily %
    const dailyHabits = habits.filter(h => h.frequency !== 'weekly');
    if (!dailyHabits.length) return { chartData: [], average: 0 };

    const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const data = [];
    let sum = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = fmtDate(d);
      let completed = 0;
      let possible = 0;

      dailyHabits.forEach(habit => {
        if (habit.schedule?.days?.length) {
          if (!habit.schedule.days.includes(new Date(d).getDay())) return;
        }
        possible++;
        const entry = (entries[habit._id] || {})[dateStr];
        if (entry && entry.completed) completed++;
      });

      const rate = possible > 0 ? Math.round((completed / possible) * 100) : 0;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      data.push({ date: dateStr, label, rate, completed, possible });
      sum += rate;
    }

    return { chartData: data, average: data.length > 0 ? Math.round(sum / data.length) : 0 };
  }, [habits, entries, timeRange]);

  if (!habits.length || !habits.some(h => h.frequency !== 'weekly')) {
    return (
      <div className="analytics-chart-card flex items-center justify-center h-[280px]">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Track daily habits to see completion trends
        </p>
      </div>
    );
  }

  return (
    <div className="analytics-chart-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)]">
          Daily Completion Rate
        </h3>
        {average > 0 && (
          <span className="text-xs font-spartan px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-brand-400)' }}>
            avg {average}%
          </span>
        )}
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>

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
              domain={[0, 100]}
              tick={{ fontSize: '0.6875rem', fill: 'var(--color-text-tertiary)', fontFamily: 'League Spartan' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
            />

            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke="var(--color-brand-300)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}

            <Tooltip
              content={<CompletionTooltip />}
              cursor={{ stroke: 'var(--color-brand-400)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotoneX"
              dataKey="rate"
              stroke="#818cf8"
              strokeWidth={2.5}
              fill="url(#completionGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#818cf8', stroke: 'var(--color-surface-primary)', strokeWidth: 2 }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ---------- tooltip ---------- */
const CompletionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="analytics-tooltip">
      <p className="font-medium text-[var(--color-text-primary)]">{d.label}</p>
      <p className="text-[var(--color-text-secondary)]">
        {d.completed}/{d.possible} completed
      </p>
      <p className="font-semibold" style={{ color: '#818cf8' }}>{d.rate}%</p>
    </div>
  );
};

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default CompletionAreaChart;
