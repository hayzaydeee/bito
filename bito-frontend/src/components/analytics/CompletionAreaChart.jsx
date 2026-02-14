import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/* -----------------------------------------------------------------
   CompletionAreaChart — daily completion % as a gradient area
   Purple → blue gradient fill, no grid lines, rounded tooltip
----------------------------------------------------------------- */

const CompletionAreaChart = ({ habits, entries, timeRange }) => {
  const chartData = useMemo(() => {
    if (!habits.length) return [];

    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const data = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dd}`;

      let completed = 0;
      let possible = 0;

      habits.forEach(habit => {
        // Check schedule
        if (habit.schedule?.days?.length) {
          const dow = new Date(d).getDay();
          if (!habit.schedule.days.includes(dow)) return;
        }
        possible++;
        const entry = (entries[habit._id] || {})[dateStr];
        if (entry && entry.completed) completed++;
      });

      const rate = possible > 0 ? Math.round((completed / possible) * 100) : 0;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      data.push({ date: dateStr, label, rate, completed, possible });
    }

    return data;
  }, [habits, entries, timeRange]);

  if (!habits.length) {
    return (
      <div className="card p-6 flex items-center justify-center h-[260px]">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Track habits to see completion trends
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
        Completion Rate
      </h3>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradPurpleBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--color-brand-400)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="var(--color-brand-500)"
              strokeWidth={2}
              fill="url(#gradPurpleBlue)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-brand-500)', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ---------- tooltip ---------- */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card p-2 text-xs font-spartan shadow-lg border border-[var(--color-border-primary)]">
      <p className="font-medium text-[var(--color-text-primary)]">{d.label}</p>
      <p className="text-[var(--color-text-secondary)]">
        {d.completed}/{d.possible} — <span className="font-semibold text-[var(--color-brand-400)]">{d.rate}%</span>
      </p>
    </div>
  );
};

export default CompletionAreaChart;
