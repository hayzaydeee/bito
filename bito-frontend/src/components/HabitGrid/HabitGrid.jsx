import React, { useMemo, useEffect } from "react";
import { useHabits, habitUtils } from "../../contexts/HabitContext";
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
}) => {
  // Memoize the start date to prevent infinite re-renders
  const memoizedStartDate = useMemo(() => {
    return startDate || habitUtils.getWeekStart(new Date());
  }, [startDate]);

  // Get data from habit context
  const {
    habits,
    entries,
    isLoading,
    error,
    toggleHabitCompletion,
    fetchHabitEntries,
  } = useHabits();

  // Calculate week dates
  const weekDates = useMemo(() => {
    if (endDate) {
      // Custom date range
      const dates = [];
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
      return dates;
    } else {
      // Default: current week
      return habitUtils.getWeekDates(memoizedStartDate);
    }
  }, [memoizedStartDate, endDate]);
  // Fetch entries for visible habits and date range
  useEffect(() => {
    if (habits.length > 0 && weekDates.length > 0) {
      const startDateObj = weekDates[0].dateObj;
      const endDateObj = weekDates[weekDates.length - 1].dateObj;

      // Fetch entries for each habit
      habits.forEach((habit) => {
        fetchHabitEntries(habit._id, startDateObj, endDateObj);
      });
    }
  }, [habits, weekDates, fetchHabitEntries]); // fetchHabitEntries is now memoized with useCallback

  // DEBUG: Log data to compare views
  // console.log('HabitGrid - Habits count:', habits.length);
  // console.log('HabitGrid - Habits:', habits.map(h => ({ id: h.id, name: h.name })));
  // console.log('HabitGrid - Completions size:', completions.size);
  // console.log('HabitGrid - Sample completions:', Array.from(completions.keys()).slice(0, 5));
  // console.log('HabitGrid - Week dates:', weekDates.map(d => d.date));
  // Calculate week statistics
  const weekStats = useMemo(() => {
    let totalCells = habits.length * weekDates.length;
    let completedCells = 0;
    let perfectDays = 0;

    const dailyCompletions = weekDates.map(({ date }) => {
      const dayCompletions = habits.filter((habit) => {
        const habitEntries = entries[habit._id];
        return habitEntries && habitEntries[date];
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
          if (habitEntries[date]) {
            completionsSet.add(`${date}_${habit._id}`);
          }
        });
      }
    });

    return completionsSet;
  }, [habits, entries]);

  // Handle habit completion toggle
  const handleToggleCompletion = async (habitId, date) => {
    await toggleHabitCompletion(habitId, date);
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
          />
        ))}
      </div>

      {showStats && <WeekStats stats={weekStats} />}
    </div>
  );
};
