import React, { lazy, Suspense } from 'react';

// Lazy load widget components for better performance
const ChartWidget = lazy(() => import('../widgets/ChartWidget'));
const DatabaseWidgetBridge = lazy(() => import('../widgets/database/components/DatabaseWidgetBridge'));
const QuickActionsWidget = lazy(() => import('../widgets/QuickActionsWidget'));
const OverviewCardsWidget = lazy(() => import('../analytics/widgets/OverviewCardsWidget'));
const HabitStreakChartWidget = lazy(() => import('../analytics/widgets/HabitStreakChartWidget'));
const CompletionRateChartWidget = lazy(() => import('../analytics/widgets/CompletionRateChartWidget'));

// Additional analytics widgets
const WeeklyHeatmapWidget = lazy(() => import('../analytics/widgets/WeeklyHeatmapWidget'));
const TopHabitsWidget = lazy(() => import('../analytics/widgets/TopHabitsWidget'));
const InsightsPanelWidget = lazy(() => import('../analytics/widgets/InsightsPanelWidget'));

// Missing widgets - create placeholder lazy imports
const HabitsListWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
      <div className="text-center">
        <div className="text-4xl mb-4">📋</div>
        <div className="text-lg font-semibold mb-2">Habits List</div>
        <div className="text-sm">Coming soon</div>
      </div>
    </div>
  )
}));

const HabitStatsWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
      <div className="text-center">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-lg font-semibold mb-2">Habit Statistics</div>
        <div className="text-sm">Coming soon</div>
      </div>
    </div>
  )
}));

const QuickAddHabitWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
      <div className="text-center">
        <div className="text-4xl mb-4">➕</div>
        <div className="text-lg font-semibold mb-2">Quick Add Habit</div>
        <div className="text-sm">Coming soon</div>
      </div>
    </div>
  )
}));

const RecentActivityWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
      <div className="text-center">
        <div className="text-4xl mb-4">🕒</div>
        <div className="text-lg font-semibold mb-2">Recent Activity</div>
        <div className="text-sm">Coming soon</div>
      </div>
    </div>
  )
}));

// Workspace collaboration widgets (placeholder components for now)
// const WorkspaceOverviewWidget = lazy(() => import('../widgets/WorkspaceOverviewWidget'));
// const TeamActivityWidget = lazy(() => import('../widgets/TeamActivityWidget'));
// const WorkspaceMembersWidget = lazy(() => import('../widgets/WorkspaceMembersWidget'));

// Widget skeleton for loading states
const WidgetSkeleton = ({ title }) => (
  <div className="w-full h-full rounded-xl p-4 animate-pulse">
    <div className="h-4 bg-[var(--color-surface-elevated)] rounded mb-3 w-1/2"></div>
    <div className="space-y-2">
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-3/4"></div>
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-1/2"></div>
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-2/3"></div>
    </div>
  </div>
);

export const createWidgetComponent = (widgetType, widgetConfig, dependencies = {}) => {
  const {
    habits = [],
    entries = {},
    isLoading = false,
    chartFilters = {},
    databaseFilters = {},
    chartDateRange = null,
    databaseDateRange = null,
    filterOptions = {},
    onToggleCompletion = () => {},
    onAddHabit = () => {},
    onDeleteHabit = () => {},
    onEditHabit = () => {},
    updateChartFilter = () => {},
    updateChartMonth = () => {},
    updateDatabaseFilter = () => {},
    updateDatabaseMonth = () => {},
    getWidgetProps = () => ({}),
    // Additional dependencies for modals and such
    onShowEnhancedCsvImport = () => {},
    onShowLLMSettings = () => {},
    ChartFilterControls = null,
    DatabaseFilterControls = null,
  } = dependencies;

  return (layout) => {
    const props = getWidgetProps(widgetType, layout);

    const commonProps = {
      ...props,
      habits,
      entries,
      isLoading,
    };

    switch (widgetType) {
      // Dashboard widgets
      case 'habits-overview':
        return (
          <Suspense fallback={<WidgetSkeleton title="Daily Habits Completion" />}>
            <ChartWidget
              title="Daily Habits Completion"
              type="line"
              chartType="completion"
              dateRange={chartDateRange}
              color="var(--color-brand-400)"
              filterComponent={
                ChartFilterControls ? (
                  <ChartFilterControls
                    mode={chartFilters.mode}
                    period={chartFilters.period}
                    selectedMonth={chartFilters.selectedMonth}
                    onModeChange={(mode) => updateChartFilter(mode, 1)}
                    onPeriodChange={(period) => updateChartFilter(chartFilters.mode, period)}
                    onMonthChange={updateChartMonth}
                    options={filterOptions}
                  />
                ) : null
              }
              {...commonProps}
            />
          </Suspense>
        );

      case 'weekly-progress':
        return (
          <Suspense fallback={<WidgetSkeleton title="Weekly Progress" />}>
            <ChartWidget
              title="Weekly Habit Streaks"
              type="line"
              chartType="weekly"
              dateRange={chartDateRange}
              color="var(--color-brand-400)"
              {...commonProps}
            />
          </Suspense>
        );

      case 'quick-actions':
        return (
          <Suspense fallback={<WidgetSkeleton title="Quick Actions" />}>
            <QuickActionsWidget 
              onToggleCompletion={onToggleCompletion}
              onAddHabit={onAddHabit}
              onShowCsvImport={onShowEnhancedCsvImport}
              onShowLLMSettings={onShowLLMSettings}
              {...commonProps}
            />
          </Suspense>
        );

      case 'habit-list':
        return (
          <Suspense fallback={<WidgetSkeleton title="My Habits" />}>
            <DatabaseWidgetBridge
              completions={entries}
              onToggleCompletion={onToggleCompletion}
              onAddHabit={onAddHabit}
              onDeleteHabit={onDeleteHabit}
              onEditHabit={onEditHabit}
              viewType="table"
              dateRange={databaseDateRange}
              mode="week"
              filterComponent={
                DatabaseFilterControls ? (
                  <DatabaseFilterControls
                    period={databaseFilters.period}
                    selectedMonth={databaseFilters.selectedMonth}
                    onPeriodChange={updateDatabaseFilter}
                    onMonthChange={updateDatabaseMonth}
                    options={filterOptions}
                  />
                ) : null
              }
              {...commonProps}
            />
          </Suspense>
        );

      // Analytics widgets
      case 'overview-cards':
        return (
          <Suspense fallback={<WidgetSkeleton title="Overview Cards" />}>
            <OverviewCardsWidget 
              timeRange="30d"
              {...commonProps}
            />
          </Suspense>
        );

      case 'habit-streak-chart':
        return (
          <Suspense fallback={<WidgetSkeleton title="Habit Streaks" />}>
            <HabitStreakChartWidget 
              timeRange="30d"
              {...commonProps}
            />
          </Suspense>
        );

      case 'completion-rate-chart':
        return (
          <Suspense fallback={<WidgetSkeleton title="Completion Rates" />}>
            <CompletionRateChartWidget 
              timeRange="30d"
              {...commonProps}
            />
          </Suspense>
        );

      case 'weekly-heatmap':
        return (
          <Suspense fallback={<WidgetSkeleton title="Weekly Heatmap" />}>
            <WeeklyHeatmapWidget 
              timeRange="30d"
              {...commonProps}
            />
          </Suspense>
        );

      case 'top-habits':
        return (
          <Suspense fallback={<WidgetSkeleton title="Top Performers" />}>
            <TopHabitsWidget 
              timeRange="30d"
              {...commonProps}
            />
          </Suspense>
        );

      case 'insights-panel':
        return (
          <Suspense fallback={<WidgetSkeleton title="AI Insights" />}>
            <InsightsPanelWidget 
              timeRange="30d"
              {...commonProps}
            />
          </Suspense>
        );

      // Habits widgets
      case 'habits-list-widget':
        return (
          <Suspense fallback={<WidgetSkeleton title="Habits Manager" />}>
            <HabitsListWidget 
              {...commonProps}
            />
          </Suspense>
        );

      case 'habit-stats':
        return (
          <Suspense fallback={<WidgetSkeleton title="Habit Statistics" />}>
            <HabitStatsWidget 
              timeRange="30d"
              {...commonProps}
            />
          </Suspense>
        );

      case 'quick-add-habit':
        return (
          <Suspense fallback={<WidgetSkeleton title="Quick Add" />}>
            <QuickAddHabitWidget 
              {...commonProps}
            />
          </Suspense>
        );

      case 'recent-activity':
        return (
          <Suspense fallback={<WidgetSkeleton title="Recent Activity" />}>
            <RecentActivityWidget 
              timeRange="7d"
              {...commonProps}
            />
          </Suspense>
        );

      // Workspace collaboration widgets (placeholders)
      case 'workspace-overview':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] rounded-xl border-2 border-dashed border-[var(--color-border-primary)]/30">
            <div className="text-4xl mb-4">🏢</div>
            <div className="text-lg font-semibold mb-2">Workspace Overview</div>
            <div className="text-sm text-center">Coming soon - Team progress and insights</div>
          </div>
        );

      case 'team-activity':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] rounded-xl border-2 border-dashed border-[var(--color-border-primary)]/30">
            <div className="text-4xl mb-4">👥</div>
            <div className="text-lg font-semibold mb-2">Team Activity</div>
            <div className="text-sm text-center">Coming soon - Live team activity feed</div>
          </div>
        );

      case 'workspace-members':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] rounded-xl border-2 border-dashed border-[var(--color-border-primary)]/30">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <div className="text-lg font-semibold mb-2">Workspace Members</div>
            <div className="text-sm text-center">Coming soon - Member management and stats</div>
          </div>
        );

      // Settings widgets
      case 'profile-widget':
      case 'notifications-widget':
      case 'privacy-widget':
      case 'appearance-widget':
      case 'data-management-widget':
      case 'help-support-widget':
        // Settings widgets are handled differently - they use the components from SettingsPage
        // For the widget factory, we'll return a placeholder that indicates this should be handled by the settings page
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] rounded-xl">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="text-sm text-center">Settings widget rendered by page</div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
            Unknown widget type: {widgetType}
          </div>
        );
    }
  };
};