import React, { useMemo } from 'react';
import { useHabits } from '../../../contexts/HabitContext';
import TopHabits from '../TopHabits';
import { STORAGE_KEYS } from '../../shared/widgetRegistry';

const TopHabitsWidget = ({ 
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
    const isSmall = availableColumns < 5 || availableRows < 5;
    
    return {
      compact: isMobile || isSmall,
      maxItems: isMobile ? 3 : isSmall ? 4 : 5,
      showSubtitles: !isMobile && availableRows >= 4
    };
  }, [breakpoint, availableColumns, availableRows]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-tertiary)]">
          Loading top habits...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area">
        <TopHabits 
          habits={habits}
          entries={entries}
          timeRange={timeRange}
          persistenceKey={STORAGE_KEYS.analytics.topHabitsCategory}
          {...responsiveProps}
          {...props}
        />
      </div>
    </div>
  );
};

export default TopHabitsWidget;