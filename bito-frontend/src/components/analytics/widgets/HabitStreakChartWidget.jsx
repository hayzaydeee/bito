import React, { useMemo } from 'react';
import { useHabits } from '../../../contexts/HabitContext';
import HabitStreakChart from '../HabitStreakChart';

const HabitStreakChartWidget = ({ 
  timeRange = '30d',
  dateRange,
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
      showLegend: !isMobile && !isSmall,
      maxHabitsDisplayed: isMobile ? 2 : isSmall ? 3 : 5,
      chartHeight: isMobile ? 240 : isSmall ? 280 : 320,
      showTopStreaks: !isMobile && availableRows >= 4
    };
  }, [breakpoint, availableColumns, availableRows]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-tertiary)]">
          Loading chart...
        </div>
      </div>
    );
  }

  // Return the chart content directly - BaseGridContainer handles the wrapper
  return (
    <div className="w-full h-full overflow-hidden">
      <HabitStreakChart 
        habits={habits}
        entries={entries}
        timeRange={timeRange}
        dateRange={dateRange}
        widgetMode={true} // Flag to indicate this is in widget mode
        {...responsiveProps}
        {...props}
      />
    </div>
  );
};

export default HabitStreakChartWidget;