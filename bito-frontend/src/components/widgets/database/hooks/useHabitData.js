import { useMemo, useCallback } from "react";

/**
 * Custom hook for managing habit data and calculations
 */
export const useHabitData = ({ habits, completions, dateRange = null, mode = "week" }) => {
  // Get the actual dates to display based on dateRange or current week
  const weekDates = useMemo(() => {
    if (dateRange && dateRange.start && dateRange.end) {
      // Use the provided date range
      const dates = [];
      const current = new Date(dateRange.start);
        while (current <= dateRange.end) {
        dates.push({
          day: current.toLocaleDateString('en-US', { weekday: 'long' }),
          date: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`, // Local YYYY-MM-DD format
        });
        current.setDate(current.getDate() + 1);
      }
      
      return dates;
    } else {
      // Fallback to current week
      const today = new Date();
      const currentDay = today.getDay();
      const startOfWeek = new Date(today);

      // Calculate start of week (Monday)
      const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
      startOfWeek.setDate(today.getDate() - daysToSubtract);      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push({
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, // Local YYYY-MM-DD format
        });
      }
      
      return dates;
    }
  }, [dateRange]);

  // Extract day names from the actual dates
  const daysOfWeek = useMemo(() => {
    return weekDates.map(d => d.day);
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
      const dayInfo = getCurrentWeekDates.find((d) => d.day === day);
      if (dayInfo) {
        const dateKey = `${dayInfo.date}-${habitId}`;
        const dayKey = `${day}-${habitId}`;
        // Check both date-based and day-based keys for backward compatibility
        return (
          displayCompletions[dateKey] || displayCompletions[dayKey] || false
        );
      }

      // Fallback to day-based key
      const key = `${day}-${habitId}`;
      return displayCompletions[key] || false;
    },
    [displayCompletions, getCurrentWeekDates]
  );

  // Calculate daily completion percentages
  const getDayCompletion = useCallback(
    (day) => {
      const totalHabits = displayHabits.length;
      const completedHabits = displayHabits.filter((habit) =>
        getCompletionStatus(day, habit.id)
      ).length;
      return totalHabits > 0
        ? Math.round((completedHabits / totalHabits) * 100)
        : 0;
    },
    [displayHabits, getCompletionStatus]
  );

  // Calculate habit completion percentages across the week
  const getHabitCompletion = useCallback(
    (habitId) => {
      const completedDays = daysOfWeek.filter((day) =>
        getCompletionStatus(day, habitId)
      ).length;
      return Math.round((completedDays / daysOfWeek.length) * 100);
    },
    [daysOfWeek, getCompletionStatus]
  );

  // Calculate overall statistics
  const weekStats = useMemo(() => {
    const totalCells = displayHabits.length * daysOfWeek.length;
    const completedCells = displayHabits.reduce(
      (sum, habit) =>
        sum +
        daysOfWeek.filter((day) => getCompletionStatus(day, habit.id)).length,
      0
    );
    const averageCompletion = Math.round(
      daysOfWeek.reduce((sum, day) => sum + getDayCompletion(day), 0) /
        daysOfWeek.length
    );
    const perfectDays = daysOfWeek.filter(
      (day) => getDayCompletion(day) === 100
    ).length;

    return {
      totalCells,
      completedCells,
      averageCompletion,
      perfectDays,
      completionRate: Math.round((completedCells / totalCells) * 100),
    };
  }, [displayHabits, daysOfWeek, getCompletionStatus, getDayCompletion]);
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
