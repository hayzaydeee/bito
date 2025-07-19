import React, { useMemo } from 'react';
import { useHabits } from '@contexts/HabitContext';
import InsightsPanel from '../components/InsightsPanel';

const InsightsPanelWidget = ({ 
  timeRange = '30d',
  breakpoint,
  availableColumns,
  availableRows,
  analyticsData,
  ...props 
}) => {
  const { habits, entries, isLoading } = useHabits();

  // Generate analytics data if not provided
  const computedAnalyticsData = useMemo(() => {
    if (analyticsData) return analyticsData;
    
    if (isLoading || !habits.length) {
      return {
        totalHabits: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
        longestStreak: 0,
        activeHabits: 0
      };
    }

    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    let totalCompletions = 0;
    let totalPossibleCompletions = 0;

    habits.forEach(habit => {
      const habitEntries = entries[habit._id] || {};
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const entry = habitEntries[dateStr];
        
        totalPossibleCompletions++;
        if (entry && entry.completed) {
          totalCompletions++;
        }
      }
    });

    return {
      totalHabits: habits.length,
      totalCompletions,
      averageCompletionRate: totalPossibleCompletions > 0 
        ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
        : 0,
      longestStreak: 0, // Could be computed if needed
      activeHabits: habits.length
    };
  }, [habits, entries, timeRange, isLoading, analyticsData]);

  // Add responsive behavior based on widget size
  const responsiveProps = useMemo(() => {
    const isMobile = breakpoint === 'xs' || breakpoint === 'xxs';
    const isSmall = availableColumns < 8 || availableRows < 4;
    
    return {
      compact: isMobile || isSmall,
      maxInsights: isMobile ? 2 : isSmall ? 3 : 4,
      singleColumn: isMobile || availableColumns < 6
    };
  }, [breakpoint, availableColumns, availableRows]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-tertiary)]">
          Loading insights...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area">
        <InsightsPanel 
          habits={habits}
          entries={entries}
          analyticsData={computedAnalyticsData}
          timeRange={timeRange}
          {...responsiveProps}
          {...props}
        />
      </div>
    </div>
  );
};

export default InsightsPanelWidget;