import React, { useMemo } from 'react';
import { useHabits } from '../../../contexts/HabitContext';
import WeeklyHeatmap from '../components/WeeklyHeatmap';

const WeeklyHeatmapWidget = ({ 
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
    const isSmall = availableColumns < 6 || availableRows < 4;
    
    return {
      compact: isMobile || isSmall,
      showStats: !isMobile && availableRows >= 5,
      maxWeeks: isMobile ? 4 : isSmall ? 6 : 8
    };
  }, [breakpoint, availableColumns, availableRows]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-tertiary)]">
          Loading heatmap...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area">
        <WeeklyHeatmap 
          habits={habits}
          entries={entries}
          timeRange={timeRange}
          {...responsiveProps}
          {...props}
        />
      </div>
    </div>
  );
};

export default WeeklyHeatmapWidget;