import { useMemo, useCallback } from "react";

/**
 * Custom hook for managing habit data and calculations
 */
export const useHabitData = ({ habits, completions }) => {
  // Generate days of the week
  const daysOfWeek = useMemo(
    () => [
      "Monday",
      "Tuesday", 
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    []
  );

  // Default habits if none provided
  const defaultHabits = useMemo(
    () => [
      { id: 1, name: "Exercise", color: "#ef4444", icon: "💪" },
      { id: 2, name: "Read", color: "#3b82f6", icon: "📚" },
      { id: 3, name: "Meditate", color: "#8b5cf6", icon: "🧘" },
      { id: 4, name: "Water", color: "#06b6d4", icon: "💧" },
      { id: 5, name: "Sleep 8h", color: "#6366f1", icon: "😴" },
    ],
    []
  );

  const displayHabits = habits.length > 0 ? habits : defaultHabits;

  // Default completions if none provided
  const defaultCompletions = useMemo(() => {
    const comps = {};
    daysOfWeek.forEach((day) => {
      displayHabits.forEach((habit) => {
        // Simulate some random completions for demo
        const key = `${day}-${habit.id}`;
        comps[key] = Math.random() > 0.4; // 60% completion rate
      });
    });
    return comps;
  }, [daysOfWeek, displayHabits]);

  const displayCompletions =
    Object.keys(completions).length > 0 ? completions : defaultCompletions;

  // Get completion status for a specific day and habit
  const getCompletionStatus = useCallback(
    (day, habitId) => {
      const key = `${day}-${habitId}`;
      return displayCompletions[key] || false;
    },
    [displayCompletions]
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
    getCompletionStatus,
    getDayCompletion,
    getHabitCompletion,
    weekStats,
  };
};
