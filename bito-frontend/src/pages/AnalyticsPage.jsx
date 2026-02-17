import React, { useState, useEffect, useCallback } from 'react';
import { useHabits } from '../contexts/HabitContext';
import { useAuth } from '../contexts/AuthContext';
import TimeRangePills from '../components/analytics/TimeRangePills';
import MetricCards from '../components/analytics/MetricCards';
import CompletionAreaChart from '../components/analytics/CompletionAreaChart';
import StreakBarChart from '../components/analytics/StreakBarChart';
import ActivityHeatmap from '../components/analytics/ActivityHeatmap';
import TopHabitsList from '../components/analytics/TopHabitsList';
import AnalyticsInsights from '../components/analytics/AnalyticsInsights';
import HabitStreakChart from '../components/analytics/HabitStreakChart';
import AnalyticsTour from '../components/analytics/AnalyticsTour';

const LS_KEY = 'bito_analytics_timeRange';

const AnalyticsPage = () => {
  const { habits, entries, isLoading, fetchHabitEntries } = useHabits();
  const { user } = useAuth();

  /* ── time range ────────────────────────────── */
  const [timeRange, setTimeRange] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved && ['7d', '30d', '90d', 'all'].includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'all';
  });

  const handleTimeRangeChange = useCallback((v) => {
    setTimeRange(v);
    try { localStorage.setItem(LS_KEY, v); } catch { /* ignore */ }
  }, []);

  /* ── compute account age for 'all' range ── */
  const accountAgeDays = (() => {
    if (!user?.createdAt) return 365;
    const diff = Date.now() - new Date(user.createdAt).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  })();

  /* ── fetch entries for the visible range ──── */
  useEffect(() => {
    if (!habits.length) return;
    const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
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
      <div className="flex items-center justify-between flex-wrap gap-3" data-tour="analytics-header">
        <h1 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)]">
          Analytics
        </h1>
        <TimeRangePills value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      {/* ── Metric cards ───────────────────────── */}
      <div data-tour="analytics-metrics">
      <MetricCards habits={habits} entries={entries} timeRange={timeRange} accountAgeDays={accountAgeDays} />
      </div>

      {/* ── Charts: 2-col on desktop ───────────── */}
      <div className="grid gap-4 lg:grid-cols-2" data-tour="analytics-charts">
        <CompletionAreaChart habits={habits} entries={entries} timeRange={timeRange} accountAgeDays={accountAgeDays} />
        <StreakBarChart habits={habits} entries={entries} />
      </div>

      {/* ── Heatmap + Top habits: 2-col ────────── */}
      {/* <div className="grid gap-4 lg:grid-cols-2">
        <ActivityHeatmap habits={habits} entries={entries} timeRange={timeRange} />
        <TopHabitsList habits={habits} entries={entries} timeRange={timeRange} />
      </div> */}

      {/* ── Streak timeline: full-width row ──── */}
      {habits.length > 0 && (
        <div data-tour="analytics-streak-timeline">
        <HabitStreakChart
          habits={habits}
          entries={entries}
          timeRange={timeRange}
          maxHabitsDisplayed={5}
          accountAgeDays={accountAgeDays}
        />
        </div>
      )}

      {/* ── AI Insights ────────────────────────── */}
      <div data-tour="analytics-ai-insights">
        <AnalyticsInsights habits={habits} entries={entries} timeRange={timeRange} />
      </div>

      {/* ── Analytics tour ─────────────────────── */}
      <AnalyticsTour userId={user?._id || user?.id} />
    </div>
  );
};

export default AnalyticsPage;