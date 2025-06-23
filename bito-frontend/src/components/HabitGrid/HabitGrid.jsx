import React, { useMemo } from 'react';
import useHabitStore from '../../store/habitStore.js';
import { habitUtils } from '../../utils/habitLogic.js';
import { HabitRow } from './HabitRow.jsx';
import { WeekHeader } from './WeekHeader.jsx';
import { EmptyState } from './EmptyState.jsx';
import { WeekStats } from './WeekStats.jsx';
import { TableView } from './TableView.jsx';

export const HabitGrid = ({ 
  startDate,
  endDate = null,
  className = "",
  showStats = true,
  showHeader = true,
  tableStyle = false
}) => {// Memoize the start date to prevent infinite re-renders
  const memoizedStartDate = useMemo(() => {
    return startDate || habitUtils.getWeekStart(new Date());
  }, [startDate]);

  // Get data from new store with individual selectors to avoid re-renders
  const habitsMap = useHabitStore(state => state.habits);
  const completions = useHabitStore(state => state.completions);
  const toggleCompletion = useHabitStore(state => state.toggleCompletion);
    // Memoize habits array conversion
  const habits = useMemo(() => Array.from(habitsMap.values()), [habitsMap]);
  
  // Calculate week dates
  const weekDates = useMemo(() => {
    if (endDate) {
      // Custom date range
      const dates = [];
      const current = new Date(memoizedStartDate);
      while (current <= endDate) {
        dates.push({
          date: habitUtils.normalizeDate(current),
          dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
          shortDay: current.toLocaleDateString('en-US', { weekday: 'short' }),
          isToday: habitUtils.isToday(current),
          dateObj: new Date(current)
        });
        current.setDate(current.getDate() + 1);
      }
      return dates;
    } else {
      // Default: current week
      return habitUtils.getWeekDates(memoizedStartDate);
    }  }, [memoizedStartDate, endDate]);

  // DEBUG: Log data to compare views
  // console.log('HabitGrid - Habits count:', habits.length);
  // console.log('HabitGrid - Habits:', habits.map(h => ({ id: h.id, name: h.name })));
  // console.log('HabitGrid - Completions size:', completions.size);
  // console.log('HabitGrid - Sample completions:', Array.from(completions.keys()).slice(0, 5));
  // console.log('HabitGrid - Week dates:', weekDates.map(d => d.date));

  // Calculate week statistics
  const weekStats = useMemo(() => {
    const totalCells = habits.length * weekDates.length;
    let completedCells = 0;
    let perfectDays = 0;

    const dailyCompletions = weekDates.map(({ date }) => {
      const dayCompletions = habits.filter(habit => 
        completions.has(`${date}_${habit.id}`)
      ).length;
      
      completedCells += dayCompletions;
      
      const dayPercentage = habits.length > 0 
        ? Math.round((dayCompletions / habits.length) * 100)
        : 0;
      
      if (dayPercentage === 100) perfectDays++;
      
      return {
        date,
        completions: dayCompletions,
        percentage: dayPercentage
      };
    });

    return {
      totalCells,
      completedCells,
      completionRate: totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0,
      perfectDays,
      averageCompletion: Math.round(
        dailyCompletions.reduce((sum, day) => sum + day.percentage, 0) / weekDates.length
      ),
      dailyCompletions
    };
  }, [habits, completions, weekDates]);

  // Handle habit completion toggle
  const handleToggleCompletion = (habitId, date) => {
    toggleCompletion(habitId, date);
  };
  if (habits.length === 0) {
    return <EmptyState />;
  }

  // If table style is requested, use the TableView component
  if (tableStyle) {
    return (
      <div className={`habit-grid ${className}`}>
        <TableView 
          habits={habits}
          weekDates={weekDates}
          completions={completions}
          onToggle={handleToggleCompletion}
          weekStats={weekStats}
        />
        {showStats && <WeekStats stats={weekStats} />}
      </div>
    );
  }

  // Default card-style layout
  return (
    <div className={`habit-grid ${className}`}>
      {showHeader && <WeekHeader dates={weekDates} />}
      
      <div className="habit-rows space-y-2">
        {habits.map(habit => (
          <HabitRow
            key={habit.id}
            habit={habit}
            weekDates={weekDates}
            completions={completions}
            onToggle={handleToggleCompletion}
          />
        ))}
      </div>
      
      {showStats && <WeekStats stats={weekStats} />}
    </div>
  );
};
