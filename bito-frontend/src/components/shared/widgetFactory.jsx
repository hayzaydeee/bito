import React, { lazy, Suspense } from 'react';

// Safe JSON stringifier to prevent circular reference errors
const safeStringify = (obj, maxDepth = 3) => {
  const seen = new WeakSet();
  
  const replacer = (key, value, depth = 0) => {
    // Prevent infinite recursion
    if (depth > maxDepth) return '[Max Depth Exceeded]';
    
    // Handle null/undefined
    if (value === null || value === undefined) return value;
    
    // Handle primitives
    if (typeof value !== 'object') return value;
    
    // Handle circular references
    if (seen.has(value)) return '[Circular Reference]';
    seen.add(value);
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.slice(0, 10); // Limit array length
    }
    
    // Handle objects - only include safe properties
    if (typeof value === 'object') {
      const safeObj = {};
      const keys = Object.keys(value).slice(0, 10); // Limit object properties
      
      for (const k of keys) {
        try {
          if (typeof value[k] !== 'function') {
            safeObj[k] = replacer(k, value[k], depth + 1);
          }
        } catch (error) {
          safeObj[k] = '[Error accessing property]';
        }
      }
      return safeObj;
    }
    
    return value;
  };
  
  try {
    return JSON.stringify(replacer('', obj), null, 2);
  } catch (error) {
    return `[Stringify Error: ${error.message}]`;
  }
};

// Error boundary for widget rendering
class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Safely log errors without circular references
    const safeError = {
      message: String(error?.message || 'Unknown error'),
      name: String(error?.name || 'Error'),
      widgetType: String(this.props.widgetType || 'unknown'),
      // Safe stack trace without potential circular refs
      stack: error?.stack ? String(error.stack).substring(0, 200) + '...' : 'No stack trace'
    };
    
    console.warn('Widget error caught:', safeError);
    
    // Don't log the full errorInfo as it might have circular refs
    if (errorInfo?.componentStack) {
      console.warn('Component stack:', String(errorInfo.componentStack).substring(0, 200) + '...');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)] rounded-xl border border-red-200">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm font-medium mb-1">Widget Error</div>
            <div className="text-xs text-[var(--color-text-quaternary)]">
              {String(this.props.widgetType || 'unknown')}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load widget components for better performance
const ChartWidget = lazy(() => import('../widgets/ChartWidget'));
const DatabaseWidget = lazy(() => import('../../features/dashboard/widgets/database/DatabaseWidget'));
const QuickActionsWidget = lazy(() => import('../widgets/QuickActionsWidget'));
const OverviewCardsWidget = lazy(() => import('../../features/analytics/widgets/OverviewCardsWidget'));
const HabitStreakChartWidget = lazy(() => import('../../features/analytics/widgets/HabitStreakChartWidget'));
const CompletionRateChartWidget = lazy(() => import('../../features/analytics/widgets/CompletionRateChartWidget'));

// Additional analytics widgets
const WeeklyHeatmapWidget = lazy(() => import('../../features/analytics/widgets/WeeklyHeatmapWidget'));
const TopHabitsWidget = lazy(() => import('../../features/analytics/widgets/TopHabitsWidget'));
const InsightsPanelWidget = lazy(() => import('../../features/analytics/widgets/InsightsPanelWidget'));

// Group Accountability widgets
const GroupOverviewWidget = lazy(() => import('../widgets/GroupOverviewWidget'));
const MemberProgressWidget = lazy(() => import('../widgets/MemberProgressWidget'));
const EncouragementFeedWidget = lazy(() => import('../widgets/EncouragementFeedWidget'));
const GroupLeaderboardWidget = lazy(() => import('../widgets/GroupLeaderboardWidget'));
const GroupChallengesWidget = lazy(() => import('../widgets/GroupChallengesWidget'));

// Missing widgets - create placeholder lazy imports
const HabitsListWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area flex items-center justify-center text-[var(--color-text-secondary)]">
        <div className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <div className="text-lg font-semibold mb-2">Habits List</div>
          <div className="text-sm">Coming soon</div>
        </div>
      </div>
    </div>
  )
}));

const HabitStatsWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area flex items-center justify-center text-[var(--color-text-secondary)]">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-lg font-semibold mb-2">Habit Statistics</div>
          <div className="text-sm">Coming soon</div>
        </div>
      </div>
    </div>
  )
}));

const QuickAddHabitWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area flex items-center justify-center text-[var(--color-text-secondary)]">
        <div className="text-center">
          <div className="text-4xl mb-4">➕</div>
          <div className="text-lg font-semibold mb-2">Quick Add Habit</div>
          <div className="text-sm">Coming soon</div>
        </div>
      </div>
    </div>
  )
}));

const RecentActivityWidget = lazy(() => Promise.resolve({ 
  default: () => (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area flex items-center justify-center text-[var(--color-text-secondary)]">
        <div className="text-center">
          <div className="text-4xl mb-4">🕒</div>
          <div className="text-lg font-semibold mb-2">Recent Activity</div>
          <div className="text-sm">Coming soon</div>
        </div>
      </div>
    </div>
  )
}));

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

// Safe value extractor that prevents circular reference issues
const safeGetValue = (obj, key, defaultValue) => {
  try {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    const value = obj[key];
    
    // Return default for undefined/null
    if (value === undefined || value === null) return defaultValue;
    
    // For objects, do a shallow check to prevent circular refs
    if (typeof value === 'object' && !Array.isArray(value)) {
      try {
        // Test if the object can be safely accessed
        JSON.stringify(value);
        return value;
      } catch (error) {
        console.warn(`Circular reference detected in ${key}, using default`);
        return defaultValue;
      }
    }
    
    return value;
  } catch (error) {
    console.warn(`Error accessing ${key}:`, error.message);
    return defaultValue;
  }
};

// Widget renderer component - Fast Refresh friendly
const WidgetRenderer = ({ 
  widgetType, 
  layout, 
  widgetConfig, 
  dependencies = {} 
}) => {
  // Safely extract dependencies with proper fallbacks and validation
  const habits = safeGetValue(dependencies, 'habits', []);
  const entries = safeGetValue(dependencies, 'entries', {});
  const isLoading = Boolean(safeGetValue(dependencies, 'isLoading', false));
  const chartFilters = safeGetValue(dependencies, 'chartFilters', {});
  const databaseFilters = safeGetValue(dependencies, 'databaseFilters', {});
  const chartDateRange = safeGetValue(dependencies, 'chartDateRange', null);
  const databaseDateRange = safeGetValue(dependencies, 'databaseDateRange', null);
  const filterOptions = safeGetValue(dependencies, 'filterOptions', {});
  const timeRange = safeGetValue(dependencies, 'timeRange', '30d');
  
  // Function dependencies (safe extraction)
  const onToggleCompletion = typeof dependencies.onToggleCompletion === 'function' 
    ? dependencies.onToggleCompletion : () => console.warn('onToggleCompletion not provided');
  const onAddHabit = typeof dependencies.onAddHabit === 'function' 
    ? dependencies.onAddHabit : () => console.warn('onAddHabit not provided');
  const onDeleteHabit = typeof dependencies.onDeleteHabit === 'function' 
    ? dependencies.onDeleteHabit : () => console.warn('onDeleteHabit not provided');
  const onEditHabit = typeof dependencies.onEditHabit === 'function' 
    ? dependencies.onEditHabit : () => console.warn('onEditHabit not provided');
  const updateChartFilter = typeof dependencies.updateChartFilter === 'function' 
    ? dependencies.updateChartFilter : () => {};
  const updateChartMonth = typeof dependencies.updateChartMonth === 'function' 
    ? dependencies.updateChartMonth : () => {};
  const updateDatabaseFilter = typeof dependencies.updateDatabaseFilter === 'function' 
    ? dependencies.updateDatabaseFilter : () => {};
  const updateDatabaseMonth = typeof dependencies.updateDatabaseMonth === 'function' 
    ? dependencies.updateDatabaseMonth : () => {};
  const getWidgetProps = typeof dependencies.getWidgetProps === 'function' 
    ? dependencies.getWidgetProps : () => ({});
  const onShowEnhancedCsvImport = typeof dependencies.onShowEnhancedCsvImport === 'function' 
    ? dependencies.onShowEnhancedCsvImport : () => {};
  const onShowLLMSettings = typeof dependencies.onShowLLMSettings === 'function' 
    ? dependencies.onShowLLMSettings : () => {};

  // Component dependencies
  const ChartFilterControls = dependencies.ChartFilterControls || null;
  const DatabaseFilterControls = dependencies.DatabaseFilterControls || null;

  // Safely get widget props with fallbacks
  let props = {};
  try {
    const layoutValue = Array.isArray(layout) ? layout : [];
    props = getWidgetProps(widgetType, layoutValue) || {};
  } catch (error) {
    console.warn(`Error getting widget props for ${widgetType}:`, error.message);
    props = {};
  }

  // Ensure props are serializable and safe
  const safeProps = {
    breakpoint: typeof props?.breakpoint === 'string' ? props.breakpoint : 'lg',
    availableColumns: props?.availableColumns && !isNaN(Number(props.availableColumns)) 
      ? Number(props.availableColumns) : 6,
    availableRows: props?.availableRows && !isNaN(Number(props.availableRows)) 
      ? Number(props.availableRows) : 4,
  };

  // Create safe common props - ensure all values are safe for serialization
  const commonProps = {
    ...safeProps,
    habits: Array.isArray(habits) ? habits.map(habit => ({
      ...habit,
      _id: String(habit._id || habit.id || 'unknown'),
      name: String(habit.name || 'Unnamed Habit'),
    })) : [],
    entries: entries && typeof entries === 'object' && !Array.isArray(entries) ? entries : {},
    isLoading: Boolean(isLoading),
    timeRange: typeof timeRange === 'string' ? timeRange : '30d',
  };

  switch (widgetType) {
    // Dashboard widgets
    case 'habits-overview':
      try {
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
                    mode={safeGetValue(chartFilters, 'mode', 'week')}
                    period={safeGetValue(chartFilters, 'period', 1)}
                    selectedMonth={safeGetValue(chartFilters, 'selectedMonth', new Date().getMonth() + 1)}
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
      } catch (error) {
        console.warn('Error rendering habits-overview widget:', error.message);
        return <div className="w-full h-full flex items-center justify-center text-red-500">Chart Error</div>;
      }

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
      try {
        // Create super safe props for DatabaseWidget to prevent circular references
        const databaseProps = {
          habits: commonProps.habits,
          completions: commonProps.entries,
          onToggleCompletion: onToggleCompletion,
          onAddHabit: onAddHabit,
          onDeleteHabit: onDeleteHabit,
          onEditHabit: onEditHabit,
          viewType: "table",
          dateRange: databaseDateRange && typeof databaseDateRange === 'object' ? {
            start: databaseDateRange.start || null,
            end: databaseDateRange.end || null
          } : null,
          mode: "week",
          isInEditMode: false,
          breakpoint: safeProps.breakpoint,
          availableColumns: safeProps.availableColumns,
          availableRows: safeProps.availableRows,
          // Only include filter component if all required dependencies are available
          filterComponent: (
            DatabaseFilterControls && 
            typeof DatabaseFilterControls === 'function' && 
            databaseFilters && 
            typeof databaseFilters === 'object'
          ) ? (
            <DatabaseFilterControls
              period={Number(safeGetValue(databaseFilters, 'period', 1))}
              selectedMonth={Number(safeGetValue(databaseFilters, 'selectedMonth', new Date().getMonth() + 1))}
              onPeriodChange={updateDatabaseFilter}
              onMonthChange={updateDatabaseMonth}
              options={filterOptions}
            />
          ) : null
        };

        return (
          <Suspense fallback={<WidgetSkeleton title="My Habits" />}>
            <DatabaseWidget {...databaseProps} />
          </Suspense>
        );
      } catch (error) {
        console.error('Error rendering habit-list widget:', error.message);
        return (
          <div className="w-full h-full flex items-center justify-center text-red-500">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">Widget Error</div>
              <div className="text-sm">Failed to load habits list</div>
              <div className="text-xs mt-2 opacity-60">{error.message}</div>
            </div>
          </div>
        );
      }

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
            onAddHabit={onAddHabit}
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
        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated] rounded-xl border-2 border-dashed border-[var(--color-border-primary)]/30">
          <div className="text-4xl mb-4">🏢</div>
          <div className="text-lg font-semibold mb-2">Workspace Overview</div>
          <div className="text-sm text-center">Coming soon - Team progress and insights</div>
        </div>
      );

    case 'team-activity':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated] rounded-xl border-2 border-dashed border-[var(--color-border-primary)]/30">
          <div className="text-4xl mb-4">👥</div>
          <div className="text-lg font-semibold mb-2">Team Activity</div>
          <div className="text-sm text-center">Coming soon - Live team activity feed</div>
        </div>
      );

    case 'workspace-members':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated] rounded-xl border-2 border-dashed border-[var(--color-border-primary)]/30">
          <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
          <div className="text-lg font-semibold mb-2">Workspace Members</div>
          <div className="text-sm text-center">Coming soon - Member management and stats</div>
        </div>
      );

    // Group Accountability widgets
    case 'group-overview':
      return (
        <Suspense fallback={<WidgetSkeleton title="Group Overview" />}>
          <GroupOverviewWidget 
            workspaceData={dependencies.workspaceData}
            {...commonProps}
          />
        </Suspense>
      );

    case 'member-progress':
      return (
        <Suspense fallback={<WidgetSkeleton title="Member Progress" />}>
          <MemberProgressWidget 
            memberData={dependencies.memberData}
            onMemberClick={dependencies.onMemberClick}
            onEncourageMember={dependencies.onEncourageMember}
            {...commonProps}
          />
        </Suspense>
      );

    case 'encouragement-feed':
      return (
        <Suspense fallback={<WidgetSkeleton title="Encouragement Feed" />}>
          <EncouragementFeedWidget 
            encouragements={dependencies.encouragements}
            onSendEncouragement={dependencies.onSendEncouragement}
            {...commonProps}
          />
        </Suspense>
      );

    case 'group-leaderboard':
      return (
        <Suspense fallback={<WidgetSkeleton title="Group Leaderboard" />}>
          <GroupLeaderboardWidget 
            leaderboardData={dependencies.leaderboardData}
            {...commonProps}
          />
        </Suspense>
      );

    case 'group-challenges':
      return (
        <Suspense fallback={<WidgetSkeleton title="Group Challenges" />}>
          <GroupChallengesWidget 
            challenges={dependencies.challenges}
            onCreateChallenge={dependencies.onCreateChallenge}
            {...commonProps}
          />
        </Suspense>
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
        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated] rounded-xl">
          <div className="text-2xl mb-2">⚙️</div>
          <div className="text-sm text-center">Settings widget rendered by page</div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
          Unknown widget type: {String(widgetType)}
        </div>
      );
  }
};

// Main widget component for Fast Refresh compatibility
const WidgetComponent = ({ widgetType, layout, widgetConfig, dependencies = {} }) => {
  return (
    <WidgetErrorBoundary widgetType={widgetType}>
      <WidgetRenderer 
        widgetType={widgetType}
        layout={layout}
        widgetConfig={widgetConfig}
        dependencies={dependencies}
      />
    </WidgetErrorBoundary>
  );
};

// Factory function for creating widget components
export const createWidgetComponent = (widgetType, widgetConfig, dependencies = {}) => {
  return (layout) => (
    <WidgetComponent
      widgetType={widgetType}
      layout={layout}
      widgetConfig={widgetConfig}
      dependencies={dependencies}
    />
  );
};

export default WidgetComponent;
export { WidgetRenderer };
