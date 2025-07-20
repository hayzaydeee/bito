import { useMemo, useCallback } from "react";
import { habitUtils } from "../../../../utils/habitLogic.js";
import { useWeekUtils } from "../../../../hooks/useWeekUtils.js";

/**
 * Custom hook for managing habit data and calculations
 * Now uses reactive week utilities that respect user's week start preference
 */
export const useHabitData = ({ habits, completions, dateRange = null, mode = "week" }) => {
  const weekUtils = useWeekUtils();
  
  // Get the actual dates to display based on dateRange or current week
  const weekDates = useMemo(() => {
    if (dateRange && dateRange.start && dateRange.end) {
      // Use the provided date range with user's week preference
      return weekUtils.generateDateRange(dateRange.start, dateRange.end);
    } else {
      // Use current week with user's preferred start day
      const currentWeek = weekUtils.getCurrentWeek();
      console.log('useHabitData - current week dates:', currentWeek.map(d => ({ date: d.date, day: d.dayName })));
      return currentWeek;
    }
  }, [dateRange, weekUtils]);

  // Extract day names from the actual dates
  const daysOfWeek = useMemo(() => {
    return weekDates.map(d => d.dayName);
  }, [weekDates]);
  // Helper function to get current week dates (now uses the actual date range)
  const getCurrentWeekDates = weekDates;

  // Use the provided habits (no default habits)
  const displayHabits = habits || [];

  // Use the provided completions (no default completions)
  const displayCompletions = completions || {};

  // Get completion status for a specific day and habit
  const getCompletionStatus = useCallback(
    (day, habitId) => {
      // Try to find the date for this day
      const dayInfo = getCurrentWeekDates.find((d) => d.dayName === day);
      if (dayInfo) {
        // When we have a specific date (from dateRange), only use date-based keys
        // This ensures completions are only shown for the specific date being viewed
        const dateKey = `${dayInfo.date}-${habitId}`;
        
        // If we have entries for this habit
        if (displayCompletions[habitId] && displayCompletions[habitId][dayInfo.date]) {
          return displayCompletions[habitId][dayInfo.date].completed || false;
        }
        
        // For backward compatibility with the old format
        return displayCompletions[dateKey] || false;
      }

      return false;
    },
    [displayCompletions, getCurrentWeekDates]
  );

  // Calculate daily completion percentages
  const getDayCompletion = useCallback(
    (day) => {
      // Find the date for this day
      const dayInfo = getCurrentWeekDates.find((d) => d.dayName === day);
      if (!dayInfo) return 0;
      
      const dateObj = new Date(dayInfo.date + 'T00:00:00');
      
      // Filter habits to only those scheduled for this day
      const scheduledHabits = displayHabits.filter((habit) =>
        habitUtils.isHabitScheduledForDate(habit, dateObj)
      );
      
      const completedHabits = scheduledHabits.filter((habit) =>
        getCompletionStatus(day, habit.id)
      ).length;
      
      return scheduledHabits.length > 0
        ? Math.round((completedHabits / scheduledHabits.length) * 100)
        : 100; // If no habits scheduled, consider it 100% complete
    },
    [displayHabits, getCompletionStatus, getCurrentWeekDates]
  );

  // Calculate habit completion percentages across the week
  const getHabitCompletion = useCallback(
    (habitId) => {
      // Find the habit to check its schedule
      const habit = displayHabits.find(h => h.id === habitId);
      if (!habit) return 0;
      
      // Filter days to only those where this habit is scheduled
      const scheduledDays = daysOfWeek.filter(day => {
        const dayInfo = getCurrentWeekDates.find((d) => d.dayName === day);
        if (!dayInfo) return false;
        const dateObj = new Date(dayInfo.date + 'T00:00:00');
        return habitUtils.isHabitScheduledForDate(habit, dateObj);
      });
      
      const completedDays = scheduledDays.filter((day) =>
        getCompletionStatus(day, habitId)
      ).length;
      
      return scheduledDays.length > 0
        ? Math.round((completedDays / scheduledDays.length) * 100)
        : 100; // If no scheduled days, consider it 100%
    },
    [displayHabits, daysOfWeek, getCompletionStatus, getCurrentWeekDates]
  );

  // Calculate overall statistics
  const weekStats = useMemo(() => {
    // Calculate total scheduled cells and completed cells
    let totalScheduledCells = 0;
    let completedCells = 0;
    
    displayHabits.forEach(habit => {
      daysOfWeek.forEach(day => {
        const dayInfo = getCurrentWeekDates.find((d) => d.dayName === day);
        if (dayInfo) {
          const dateObj = new Date(dayInfo.date + 'T00:00:00');
          if (habitUtils.isHabitScheduledForDate(habit, dateObj)) {
            totalScheduledCells++;
            if (getCompletionStatus(day, habit.id)) {
              completedCells++;
            }
          }
        }
      });
    });
    
    const averageCompletion = Math.round(
      daysOfWeek.reduce((sum, day) => sum + getDayCompletion(day), 0) /
        daysOfWeek.length
    );
    const perfectDays = daysOfWeek.filter(
      (day) => getDayCompletion(day) === 100
    ).length;

    return {
      totalCells: totalScheduledCells,
      completedCells,
      averageCompletion,
      perfectDays,
      completionRate: totalScheduledCells > 0 ? Math.round((completedCells / totalScheduledCells) * 100) : 100,
    };
  }, [displayHabits, daysOfWeek, getCompletionStatus, getDayCompletion, getCurrentWeekDates]);
  return {
    daysOfWeek,
    displayHabits,
    displayCompletions,
    getCurrentWeekDates,
    getCompletionStatus,
    getDayCompletion,
    getHabitCompletion,
    weekStats,
  };
};
