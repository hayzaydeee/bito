import React, { useMemo } from 'react';
import { useHabits } from '../../../contexts/HabitContext';
import CompletionRateChart from '../CompletionRateChart';

const CompletionRateChartWidget = ({ 
  timeRange = '30d',
  breakpoint,
  availableColumns,
  availableRows,
  ...props 
}) => {
  const { habits, entries, isLoading } = useHabits();

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
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit mb-4">
          <span>🎯</span>
          Success over time
        </div>
      </div>
      
      {/* Chart content without the outer card wrapper */}
      <div className="flex-1 min-h-0">
        <CompletionRateChart 
          habits={habits}
          entries={entries}
          timeRange={timeRange}
          responsiveMode={true} // Flag to indicate this is in widget mode
          {...responsiveProps}
          {...props}
        />
      </div>
    </div>
  );
};

export default CompletionRateChartWidget;