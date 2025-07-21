import React, { useMemo, useEffect, useState } from "react";
import { useHabits, habitUtils } from "../../contexts/HabitContext.jsx";
import { useWeekDates } from "../../hooks/useWeekUtils.js";
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
  onAddHabit = null,
  habits: propHabits = null, // Habits passed from parent (for reordering)
  entries: propEntries = null, // Entries passed from parent (to avoid context usage)
  isInEditMode = false,
  onHabitReorder = null,
}) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use the week utils hook for reactive week calculations
  const { weekDates: hookWeekDates, weekUtils } = useWeekDates(startDate, endDate);

  // Get data from habit context
  const {
    habits: contextHabits,
    entries: contextEntries,
    isLoading,
    error,
    toggleHabitCompletion,
    fetchHabitEntries,
  } = useHabits();

  // Use propHabits if provided (for reordering), otherwise use context habits
  const habits = propHabits || contextHabits;
  
  // Use propEntries if provided (to avoid API calls in member dashboard), otherwise use context entries
  const entries = propEntries || contextEntries;

  // Use week dates from hook (automatically respects user's week start preference)
  const weekDates = hookWeekDates;
  
  // Fetch entries for visible habits and date range
  // Only fetch if we're using context entries (not if entries are passed as props)
  useEffect(() => {
    // Skip fetching if entries are provided as props (e.g., in member dashboard)
    if (propEntries !== null) {
      return;
    }
    
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
  }, [habits, weekDates, fetchHabitEntries, propEntries]); // Added propEntries to dependencies

  // Note: Debug logging removed to prevent circular reference errors
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
    try {
      const result = await toggleHabitCompletion(habitId, date);
      return result;
    } catch (error) {
      console.warn('Error toggling habit completion:', error.message);
      return { success: false, error: error.message };
    }
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
    return <EmptyStateWithAddHabit className={className} onAddHabit={onAddHabit} />;
  }
  // If table style is requested, use the TableView component
  if (tableStyle) {
    return (
      <div className={`habit-grid ${className} ${isMobile ? 'habit-grid-mobile' : ''}`}>
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
          onAddHabit={onAddHabit}
          isMobile={isMobile}
        />
        {showStats && <WeekStats stats={weekStats} />}
      </div>
    );
  }

  // Default card-style layout
  return (
    <div className={`habit-grid ${className} ${isMobile ? 'habit-grid-mobile' : ''}`}>
      {showHeader && <WeekHeader dates={weekDates} isMobile={isMobile} />}

      <div className={`habit-rows space-y-2 ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
        {habits.map((habit, index) => {
          // Safe key generation to prevent React key errors
          const safeKey = (() => {
            try {
              const id = habit._id || habit.id;
              if (id && (typeof id === 'string' || typeof id === 'number')) {
                return `habit-${String(id)}`;
              }
              return `habit-index-${index}`;
            } catch (error) {
              return `habit-fallback-${index}-${Date.now()}`;
            }
          })();
          
          return (
            <HabitRow
              key={safeKey}
              habit={habit}
              weekDates={weekDates}
              entries={entries[habit._id] || {}}
              onToggle={handleToggleCompletion}
              onEditHabit={onEditHabit}
              isMobile={isMobile}
            />
          );
        })}
      </div>

      {showStats && <WeekStats stats={weekStats} />}
    </div>
  );
};
