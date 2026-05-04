import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  /* ── derive effective age from actual entry data ── */
  const effectiveAccountAgeDays = useMemo(() => {
    let earliestMs = null;
    habits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      Object.values(hEntries).forEach(entry => {
        if (!entry?.date) return;
        const ms = new Date(entry.date).getTime();
        if (!isNaN(ms) && (earliestMs === null || ms < earliestMs)) earliestMs = ms;
      });
    });
    if (earliestMs === null) {
      return habits.length > 0 ? 1 : accountAgeDays;
    }
    const diff = Date.now() - earliestMs;
    return Math.max(1, Math.ceil(diff / 86400000));
  }, [habits, entries, accountAgeDays]);

  const hasAnyEntries = useMemo(() => {
    return habits.some(habit => {
      const hEntries = entries[habit._id] || {};
      return Object.values(hEntries).some(e => e?.completed);
    });
  }, [habits, entries]);

  /* ── listen for analytics reset to snap to present ── */
  useEffect(() => {
    const handleReset = () => {
      setTimeRange('7d');
      try { localStorage.setItem(LS_KEY, '7d'); } catch { /* ignore */ }
    };
    window.addEventListener('analyticsReset', handleReset);
    return () => window.removeEventListener('analyticsReset', handleReset);
  }, []);

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

      {/* ── Empty state after reset ─────────────── */}
      {habits.length > 0 && !hasAnyEntries && (
        <div className="rounded-xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)] p-4 text-center">
          <p className="text-sm font-spartan text-[var(--color-text-secondary)]">
            No completion data yet. Start checking off habits to see your stats here.
          </p>
        </div>
      )}

      {/* ── Metric cards ───────────────────────── */}
      <div data-tour="analytics-metrics">
      <MetricCards habits={habits} entries={entries} timeRange={timeRange} accountAgeDays={effectiveAccountAgeDays} />
      </div>

      {/* ── Daily completion rate: full-width row ─── */}
      <div data-tour="analytics-charts">
        <CompletionAreaChart habits={habits} entries={entries} timeRange={timeRange} accountAgeDays={effectiveAccountAgeDays} />
      </div>

      {/* ── Current streaks + Top habits: 2-col ──── */}
      <div className="grid gap-4 lg:grid-cols-2" data-tour="analytics-streaks-grid">
        <StreakBarChart habits={habits} entries={entries} />
        <TopHabitsList habits={habits} entries={entries} timeRange={timeRange} accountAgeDays={effectiveAccountAgeDays} />
      </div>

      {/* ── Activity heatmap (disabled — WeekStrip covers this) ──
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityHeatmap habits={habits} entries={entries} timeRange={timeRange} accountAgeDays={accountAgeDays} />
      </div>
      */}

      {/* ── Streak timeline: full-width row ──── */}
      <div data-tour="analytics-streak-timeline">
        {habits.length > 0 && (
          <HabitStreakChart
            habits={habits}
            entries={entries}
            timeRange={timeRange}
            maxHabitsDisplayed={5}
            accountAgeDays={effectiveAccountAgeDays}
          />
        )}
      </div>

      {/* ── AI Insights ────────────────────────── */}
      {user?.preferences?.aiAnalytics !== false && (
        <div data-tour="analytics-ai-insights">
          <AnalyticsInsights timeRange={timeRange} />
        </div>
      )}

      {/* ── Analytics tour ─────────────────────── */}
      <AnalyticsTour userId={user?._id || user?.id} />
    </div>
  );
};

export default AnalyticsPage;