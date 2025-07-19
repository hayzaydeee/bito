import React, { useMemo } from 'react';
import { useHabits } from '@contexts/HabitContext';
import OverviewCards from '../components/OverviewCards';

const OverviewCardsWidget = ({ 
  timeRange = '30d',
  breakpoint,
  availableColumns,
  availableRows,
  ...props 
}) => {
  const { habits, entries, isLoading } = useHabits();

  const analyticsData = useMemo(() => {
    if (isLoading || !habits.length) {
      return {
        totalHabits: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
        longestStreak: 0,
        currentStreaks: 0,
        activeHabits: 0
      };
    }

    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    let totalCompletions = 0;
    let totalPossibleCompletions = 0;
    let longestStreak = 0;
    let activeHabits = 0;

    habits.forEach(habit => {
      const habitEntries = entries[habit._id] || {};
      let habitCompletions = 0;
      let habitPossible = 0;
      let currentStreak = 0;
      let hasRecentActivity = false;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const entry = habitEntries[dateStr];
        
        habitPossible++;
        if (entry && entry.completed) {
          habitCompletions++;
          totalCompletions++;
          currentStreak++;
          hasRecentActivity = true;
        } else {
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
          currentStreak = 0;
        }
      }

      if (hasRecentActivity) {
        activeHabits++;
      }

      totalPossibleCompletions += habitPossible;
    });

    return {
      totalHabits: habits.length,
      totalCompletions,
      averageCompletionRate: totalPossibleCompletions > 0 
        ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
        : 0,
      longestStreak,
      activeHabits
    };
  }, [habits, entries, timeRange, isLoading]);

  // Add responsive behavior based on widget size
  const responsiveProps = useMemo(() => {
    const isMobile = breakpoint === 'xs' || breakpoint === 'xxs';
    const isSmall = availableColumns < 8 || availableRows < 4;
    
    return {
      className: isMobile ? 'grid-cols-1 gap-3' : isSmall ? 'grid-cols-2 gap-4' : ''
    };
  }, [breakpoint, availableColumns, availableRows]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-tertiary)]">
          Loading analytics...
        </div>
      </div>
    );
  }

  // Return JUST the cards without any wrapper - BaseGridContainer handles the card
  return (
    <div className="w-full h-full flex flex-col">
      <div className="widget-content-area p-2">
        <OverviewCards 
          data={analyticsData} 
          timeRange={timeRange}
          className={responsiveProps.className}
          {...props}
        />
      </div>
    </div>
  );
};

export default OverviewCardsWidget;