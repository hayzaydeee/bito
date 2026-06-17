import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHabits } from '../contexts/HabitContext';
import { useAuth } from '../contexts/AuthContext';
import TimeRangePillsStd from '../components/analytics/TimeRangePillsStd';
import MetricCardsStd from '../components/analytics/MetricCardsStd';
import CompletionAreaChart from '../components/analytics/CompletionAreaChart';
import StreakBarChart from '../components/analytics/StreakBarChart';
import TopHabitsList from '../components/analytics/TopHabitsList';
import AnalyticsInsightsStd from '../components/analytics/AnalyticsInsightsStd';
import HabitStreakChart from '../components/analytics/HabitStreakChart';
import AnalyticsTour from '../components/analytics/AnalyticsTour';
import FeatureHeader from '../components/shared/standard/FeatureHeader';

const LS_KEY = 'bito_analytics_timeRange';

/* ─────────────────────────────────────────────────────────────────────
   AnalyticsPageStd — DRILL "Signal Observatory" variant.
   Architecture: Standard DS shows this; Legacy DS keeps AnalyticsPage.
   Chart sub-components are reused as-is — they use var(--color-*) tokens
   that auto-map to the DRILL palette under the .std scope.
───────────────────────────────────────────────────────────────────── */
const AnalyticsPageStd = () => {
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

  /* ── account age ───────────────────────────── */
  const accountAgeDays = (() => {
    if (!user?.createdAt) return 365;
    const diff = Date.now() - new Date(user.createdAt).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  })();

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
    if (earliestMs === null) return habits.length > 0 ? 1 : accountAgeDays;
    return Math.max(1, Math.ceil((Date.now() - earliestMs) / 86400000));
  }, [habits, entries, accountAgeDays]);

  const hasAnyEntries = useMemo(() =>
    habits.some(habit =>
      Object.values(entries[habit._id] || {}).some(e => e?.completed)
    ), [habits, entries]);

  /* ── analytics reset → snap to 7d ─────────── */
  useEffect(() => {
    const handleReset = () => {
      setTimeRange('7d');
      try { localStorage.setItem(LS_KEY, '7d'); } catch { /* ignore */ }
    };
    window.addEventListener('analyticsReset', handleReset);
    return () => window.removeEventListener('analyticsReset', handleReset);
  }, []);

  /* ── fetch entries for visible range ──────── */
  useEffect(() => {
    if (!habits.length) return;
    const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    habits.forEach(h => fetchHabitEntries(h._id, start.toISOString(), end.toISOString()));
  }, [habits.length, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = habits.filter(h => h.isActive !== false && !h.isArchived).length;
  const windowLabel = timeRange === 'all' ? `${effectiveAccountAgeDays}D TOTAL` : `${timeRange.toUpperCase()} WINDOW`;

  /* ── loading skeleton ─────────────────────── */
  if (isLoading) {
    return (
      <div className="std h-full flex flex-col min-h-0 px-4 sm:px-8 py-7 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-[var(--surface-2)] rounded w-48" />
          <div className="h-24 bg-[var(--surface-2)] rounded std-card" />
          <div className="h-56 bg-[var(--surface-2)] rounded std-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="std px-4 sm:px-8 py-7 sm:py-12 h-full flex flex-col min-h-0 space-y-0">
      <div className="max-w-5xl mx-auto flex-shrink-0 space-y-8 pb-8 w-full">

        {/* ── Masthead ──────────────────────────── */}
        <div data-tour="analytics-header">
          <FeatureHeader
            kicker="Signal Report"
            title="Analytics"
            stats={
              <>
                <span className="text-[var(--signal)]">{String(activeCount).padStart(2, '0')}</span> ACTIVE HABITS
                {"  ·  "}
                <span className="text-[var(--ink-2)]">{windowLabel}</span>
              </>
            }
            actions={<TimeRangePillsStd value={timeRange} onChange={handleTimeRangeChange} />}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-20 scrollbar-hide -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* ── Empty state ──────────────────────── */}
        {habits.length > 0 && !hasAnyEntries && (
          <div className="std-card p-5 border-l-2 border-l-[var(--line-2)]">
            <p className="std-mono text-xs text-[var(--ink-3)]">
              No completion data yet. Start checking off habits to see your signal here.
            </p>
          </div>
        )}

        {/* ── Metric ledger strip ──────────────── */}
        <div data-tour="analytics-metrics">
          <MetricCardsStd
            habits={habits}
            entries={entries}
            timeRange={timeRange}
            accountAgeDays={effectiveAccountAgeDays}
          />
        </div>

        {/* ── Daily completion area chart ──────── */}
        <div data-tour="analytics-charts">
          <div className="std-card p-5 sm:p-6">
            <p className="std-kicker text-[var(--ink-3)] mb-4">Daily Performance</p>
            <CompletionAreaChart
              habits={habits}
              entries={entries}
              timeRange={timeRange}
              accountAgeDays={effectiveAccountAgeDays}
              stripped
            />
          </div>
        </div>

        {/* ── Streaks + Top habits 2-col ────────── */}
        <div className="grid gap-4 lg:grid-cols-2" data-tour="analytics-streaks-grid">
          <div className="std-card p-5 sm:p-6">
            <p className="std-kicker text-[var(--ink-3)] mb-4">Current Streaks</p>
            <StreakBarChart habits={habits} entries={entries} stripped />
          </div>
          <div className="std-card p-5 sm:p-6">
            <p className="std-kicker text-[var(--ink-3)] mb-4">Top Habits</p>
            <TopHabitsList
              habits={habits}
              entries={entries}
              timeRange={timeRange}
              accountAgeDays={effectiveAccountAgeDays}
              stripped
            />
          </div>
        </div>

        {/* ── Streak timeline ───────────────────── */}
        {habits.length > 0 && (
          <div data-tour="analytics-streak-timeline">
            <div className="std-card p-5 sm:p-6">
              <p className="std-kicker text-[var(--ink-3)] mb-4">Streak Timeline</p>
              <HabitStreakChart
                habits={habits}
                entries={entries}
                timeRange={timeRange}
                maxHabitsDisplayed={5}
                accountAgeDays={effectiveAccountAgeDays}
                chartHeight={260}
                stripped
              />
            </div>
          </div>
        )}

        {/* ── AI Insights ──────────────────────── */}
        {user?.preferences?.aiAnalytics !== false && (
          <div data-tour="analytics-ai-insights">
            <AnalyticsInsightsStd timeRange={timeRange} />
          </div>
        )}

        <AnalyticsTour userId={user?._id || user?.id} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPageStd;
