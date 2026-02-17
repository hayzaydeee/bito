import React, { useState, useEffect, useCallback } from 'react';
import { useHabits } from '../contexts/HabitContext';
import TimeRangePills from '../components/analytics/TimeRangePills';
import MetricCards from '../components/analytics/MetricCards';
import CompletionAreaChart from '../components/analytics/CompletionAreaChart';
import StreakBarChart from '../components/analytics/StreakBarChart';
import ActivityHeatmap from '../components/analytics/ActivityHeatmap';
import TopHabitsList from '../components/analytics/TopHabitsList';
import AnalyticsInsights from '../components/analytics/AnalyticsInsights';
import HabitStreakChart from '../components/analytics/HabitStreakChart';

const LS_KEY = 'bito_analytics_timeRange';

const AnalyticsPage = () => {
  const { habits, entries, isLoading, fetchHabitEntries } = useHabits();

  /* ── time range ────────────────────────────── */
  const [timeRange, setTimeRange] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved && ['7d', '30d', '90d', 'all'].includes(saved)) return saved;
    } catch { /* ignore */ }
    return '30d';
  });

  const handleTimeRangeChange = useCallback((v) => {
    setTimeRange(v);
    try { localStorage.setItem(LS_KEY, v); } catch { /* ignore */ }
  }, []);

  /* ── fetch entries for the visible range ──── */
  useEffect(() => {
    if (!habits.length) return;
    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    habits.forEach(h => {
      fetchHabitEntries(h._id, start.toISOString(), end.toISOString());
    });
  }, [habits.length, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── loading skeleton ─────────────────────── */
  if (isLoading) {
    return (
      <div className="page-container p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-40" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-surface-elevated)] rounded-xl" />
            ))}
          </div>
          <div className="h-56 bg-[var(--color-surface-elevated)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Header row ─────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)]">
          Analytics
        </h1>
        <TimeRangePills value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      {/* ── Metric cards ───────────────────────── */}
      <MetricCards habits={habits} entries={entries} timeRange={timeRange} />

      {/* ── Charts: 2-col on desktop ───────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CompletionAreaChart habits={habits} entries={entries} timeRange={timeRange} />
        <StreakBarChart habits={habits} entries={entries} />
      </div>

      {/* ── Heatmap + Top habits: 2-col ────────── */}
      {/* <div className="grid gap-4 lg:grid-cols-2">
        <ActivityHeatmap habits={habits} entries={entries} timeRange={timeRange} />
        <TopHabitsList habits={habits} entries={entries} timeRange={timeRange} />
      </div> */}

      {/* ── Streak timeline: full-width row ──── */}
      {habits.length > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{
            background: 'var(--color-surface-elevated)',
            borderColor: 'var(--color-border-primary)',
          }}
        >
          <HabitStreakChart
            habits={habits}
            entries={entries}
            timeRange={timeRange}
            widgetMode={false}
            maxHabitsDisplayed={5}
            chartHeight={300}
            showLegend={true}
            showTopStreaks={true}
          />
        </div>
      )}

      {/* ── AI Insights ────────────────────────── */}
      <AnalyticsInsights habits={habits} entries={entries} timeRange={timeRange} />
    </div>
  );
};

export default AnalyticsPage;