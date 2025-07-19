import React, { useMemo } from 'react';
import { useHabits } from '../../../contexts/HabitContext';
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import CompletionRateChart from '../components/CompletionRateChart.jsx';

const CompletionRateChartWidget = ({ 
  timeRange = '30d',
  breakpoint,
  availableColumns,
  availableRows,
  ...props 
}) => {
  const { habits, entries, isLoading } = useHabits();
  // Calculate trend data for display in header
  const trendData = useMemo(() => {
    if (!habits.length) return { trend: 0 };

    const days = parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Group by weeks to calculate trend
    const weeks = [];
    let currentWeekStart = new Date(startDate);
    
    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());

      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd)
      });

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    const weeklyRates = weeks.map(week => {
      let totalCompletions = 0;
      let totalPossible = 0;

      habits.forEach(habit => {
        const habitEntries = entries[habit._id] || {};
        
        for (let d = new Date(week.start); d <= week.end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const entry = habitEntries[dateStr];
          
          totalPossible++;
          if (entry && entry.completed) {
            totalCompletions++;
          }
        }
      });

      const rate = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;
      return rate;
    });

    // Calculate trend
    const trend = weeklyRates.length >= 2 
      ? weeklyRates[weeklyRates.length - 1] - weeklyRates[weeklyRates.length - 2]
      : 0;

    return { trend };
  }, [habits, entries, timeRange]);

  // Add responsive behavior based on widget size
  // Add responsive behavior based on widget size
  const responsiveProps = useMemo(() => {
    const isMobile = breakpoint === 'xs' || breakpoint === 'xxs';
    const isSmall = availableColumns < 6 || availableRows < 5;
    
    return {
      showWeeklyBreakdown: !isMobile && availableRows >= 5,
      chartHeight: isMobile ? 160 : isSmall ? 180 : 200,
      showSummaryStats: !isMobile && availableRows >= 4
    };
  }, [breakpoint, availableColumns, availableRows]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-tertiary)]">
          Loading completion rates...
        </div>
      </div>
    );
  }

  // Pass the chart without the outer card since BaseGridContainer handles that
  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {/* Custom header for widget mode */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)] font-outfit mb-4">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            Success over time
          </div>
          <div className="flex items-center gap-1">
            {trendData.trend > 0 ? (
              <ArrowUpIcon className="w-3 h-3 text-[var(--color-success)]" />
            ) : trendData.trend < 0 ? (
              <ArrowDownIcon className="w-3 h-3 text-[var(--color-error)]" />
            ) : null}
            <span className={`text-sm font-medium font-outfit ${
              trendData.trend > 0 
                ? 'text-[var(--color-success)]' 
                : trendData.trend < 0 
                  ? 'text-[var(--color-error)]' 
                  : 'text-[var(--color-text-secondary)]'
            }`}>
              {trendData.trend > 0 ? '+' : ''}{trendData.trend.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Chart content without the outer card wrapper */}
      <div className="widget-content-area">
        <CompletionRateChart 
          habits={habits}
          entries={entries}
          timeRange={timeRange}
          responsiveMode={true} // Flag to indicate this is in widget mode
          hideTrendInResponsiveMode={true} // Hide trend display since we show it in header
          {...responsiveProps}
          {...props}
        />
      </div>
    </div>
  );
};

export default CompletionRateChartWidget;