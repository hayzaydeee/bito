import React, { useMemo, useEffect } from "react";
import { useHabits, habitUtils } from "../../contexts/HabitContext.jsx";
import { HabitRow } from "./HabitRow.jsx";
import { WeekHeader } from "./WeekHeader.jsx";
import { EmptyStateWithAddHabit } from "./EmptyStateWithAddHabit.jsx";
import { WeekStats } from "./WeekStats.jsx";
import { TableView } from "./TableView.jsx";

export const HabitGrid = ({
  startDate,
  endDate = null,
  className = "",
  showStats = true,
  showHeader = true,
  tableStyle = false,
  onEditHabit = null,
  habits: propHabits = null, // Habits passed from parent (for reordering)
  isInEditMode = false,
  onHabitReorder = null,
}) => {
  // Memoize the start date to prevent infinite re-renders
  const memoizedStartDate = useMemo(() => {
    return startDate || habitUtils.getWeekStart(new Date());
  }, [startDate]);

  // Get data from habit context
  const {
    habits: contextHabits,
    entries,
    isLoading,
    error,
    toggleHabitCompletion,
    fetchHabitEntries,
  } = useHabits();

  // Use propHabits if provided (for reordering), otherwise use context habits
  const habits = propHabits || contextHabits;

  // Calculate week dates
  const weekDates = useMemo(() => {
    let dates;
    if (endDate) {
      // Custom date range
      dates = [];
      const current = new Date(memoizedStartDate);
      while (current <= endDate) {
        dates.push({
          date: habitUtils.normalizeDate(current),
          dayName: current.toLocaleDateString("en-US", { weekday: "long" }),
          shortDay: current.toLocaleDateString("en-US", { weekday: "short" }),
          isToday: habitUtils.isToday(current),
          dateObj: new Date(current),
        });
        current.setDate(current.getDate() + 1);
      }
    } else {
      // Standard week view
      dates = habitUtils.getWeekDates(memoizedStartDate);
    }
    
    return dates;
  }, [memoizedStartDate, endDate]);
  // Fetch entries for visible habits and date range
  useEffect(() => {
    if (habits.length > 0 && weekDates.length > 0) {
      const startDateObj = weekDates[0].dateObj;
      const endDateObj = weekDates[weekDates.length - 1].dateObj;

      // Only fetch entries if we don't already have them for this date range
      habits.forEach((habit) => {
        const habitEntries = entries[habit._id];

        // Check if we have entries for all dates in the range
        const missingDates = weekDates.filter(({ date }) => {
          return !habitEntries || !habitEntries.hasOwnProperty(date);
        });

        // Only fetch if we have missing dates (not just incomplete data)
        if (missingDates.length > 0) {
          fetchHabitEntries(habit._id, startDateObj, endDateObj);
        }
      });
    }
  }, [habits, weekDates, fetchHabitEntries]); // Removed entries to prevent refetch loops

  // DEBUG: Log data to compare views
  // Calculate week statistics
  const weekStats = useMemo(() => {
    let totalCells = habits.length * weekDates.length;
    let completedCells = 0;
    let perfectDays = 0;

    const dailyCompletions = weekDates.map(({ date }) => {
      const dayCompletions = habits.filter((habit) => {
        const habitEntries = entries[habit._id];
        const entry = habitEntries && habitEntries[date];
        // Only count as completed if entry exists AND is completed
        return entry && entry.completed;
      }).length;

      completedCells += dayCompletions;

      const dayPercentage =
        habits.length > 0
          ? Math.round((dayCompletions / habits.length) * 100)
          : 0;

      if (dayPercentage === 100) perfectDays++;

      return {
        date,
        completions: dayCompletions,
        percentage: dayPercentage,
      };
    });

    return {
      totalCells,
      completedCells,
      completionRate:
        totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0,
      perfectDays,
      averageCompletion: Math.round(
        dailyCompletions.reduce((sum, day) => sum + day.percentage, 0) /
          weekDates.length
      ),
      dailyCompletions,
    };
  }, [habits, entries, weekDates]);

  // Create completions Set for TableView
  const completions = useMemo(() => {
    const completionsSet = new Set();

    // Convert entries object to Set of "date_habitId" keys
    habits.forEach((habit) => {
      const habitEntries = entries[habit._id];
      if (habitEntries) {
        Object.keys(habitEntries).forEach((date) => {
          const entry = habitEntries[date];
          // Only add to completions if entry exists AND is completed
          if (entry && entry.completed) {
            completionsSet.add(`${date}_${habit._id}`);
          }
        });
      }
    });

    return completionsSet;
  }, [habits, entries]);

  // Handle habit completion toggle
  const handleToggleCompletion = async (habitId, date) => {
    // Find the habit name for logging
    const habit = habits.find(h => h._id === habitId);
    const habitName = habit?.name || 'Unknown';
    
    // Get the day name for the date
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check current completion status
    const habitEntries = entries[habitId];
    const currentEntry = habitEntries?.[date];
    const wasCompleted = currentEntry?.completed || false;
    
    const result = await toggleHabitCompletion(habitId, date);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`habit-grid ${className} flex items-center justify-center p-8`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">
            Loading habits...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        className={`habit-grid ${className} flex items-center justify-center p-8`}
      >
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading habits</p>
          <p className="text-[var(--color-text-secondary)] text-sm">{error}</p>
        </div>
      </div>
    );
  }
  // Show empty state if no habits
  if (habits.length === 0) {
    return <EmptyStateWithAddHabit className={className} />;
  }
  // If table style is requested, use the TableView component
  if (tableStyle) {
    return (
      <div className={`habit-grid ${className}`}>
        {" "}
        <TableView
          habits={habits}
          weekDates={weekDates}
          completions={completions}
          onToggle={handleToggleCompletion}
          weekStats={weekStats}
          onEditHabit={onEditHabit}
          isInEditMode={isInEditMode}
          onHabitReorder={onHabitReorder}
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
        {habits.map((habit) => (
          <HabitRow
            key={habit._id}
            habit={habit}
            weekDates={weekDates}
            entries={entries[habit._id] || {}}
            onToggle={handleToggleCompletion}
            onEditHabit={onEditHabit}
          />
        ))}
      </div>

      {showStats && <WeekStats stats={weekStats} />}
    </div>
  );
};
