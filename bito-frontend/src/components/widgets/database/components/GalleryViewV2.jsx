import React, { useMemo } from 'react';
import { useHabits } from '../../../../contexts/HabitContext';
import { EmptyStateWithAddHabit } from '../../../habitGrid/EmptyStateWithAddHabit.jsx';
import { HabitCheckbox } from '../../../habitGrid/HabitCheckbox';
import { habitUtils } from '../../../../contexts/HabitContext';
import { CheckIcon, Pencil1Icon } from '@radix-ui/react-icons';

export const GalleryViewV2 = ({
  startDate,
  endDate = null,
  breakpoint = 'lg',
  onAddHabit = null,
  onEditHabit = null,
  habits: propHabits = null,
  entries: propEntries = null, // Accept entries as prop
  isInEditMode = false,
  onHabitReorder = null,
}) => {
  // Get context data but prefer props
  const { 
    habits: contextHabits, 
    entries: contextEntries,
    toggleHabitCompletion,
    isLoading,
    error
  } = useHabits();

  // Use props if provided, otherwise fallback to context
  const habits = propHabits !== null ? propHabits : contextHabits;
  const entries = propEntries !== null ? propEntries : contextEntries;

  // Calculate week dates
  const weekDates = useMemo(() => {
    const memoizedStartDate = startDate || habitUtils.getWeekStart(new Date());
    
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
  }, [startDate, endDate]);

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
  if (isLoading && propHabits === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading habits...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && propHabits === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading habits</p>
          <p className="text-[var(--color-text-secondary)] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no habits
  if (habits.length === 0) {
    return <EmptyStateWithAddHabit className="w-full h-full" onAddHabit={onAddHabit} />;
  }

  return (
    <div className="w-full h-full overflow-auto">
      {/* Gallery view using proper card components */}
      <div className="grid gap-4 p-4" style={{
        gridTemplateColumns: breakpoint === "xs" 
          ? "1fr" 
          : breakpoint === "sm" 
          ? "repeat(auto-fit, minmax(280px, 1fr))"
          : "repeat(auto-fit, minmax(320px, 1fr))"
      }}>
        {habits.map((habit, index) => {
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
            <div
              key={safeKey}
              className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)] hover:shadow-md transition-all duration-200"
            >
              {/* Habit Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ 
                    backgroundColor: `${habit.color || '#6366f1'}20`, 
                    color: habit.color || '#6366f1' 
                  }}
                >
                  {habit.icon || '✓'}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit">
                    {habit.name}
                  </h4>
                  <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                    {weekDates.filter(({ date }) => {
                      const habitEntries = entries[habit._id];
                      const entry = habitEntries && habitEntries[date];
                      return entry && entry.completed;
                    }).length}/{weekDates.length} days this week
                  </p>
                </div>
                {onEditHabit && (
                  <button
                    onClick={() => onEditHabit(habit)}
                    className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Daily Checkboxes */}
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map(({ date, shortDay, isToday }) => {
                  const habitEntries = entries[habit._id];
                  const entry = habitEntries && habitEntries[date];
                  const isCompleted = entry && entry.completed;
                  
                  return (
                    <div key={date} className="text-center">
                      <div
                        className={`text-xs font-medium mb-1 font-outfit ${
                          isToday
                            ? "text-[var(--color-brand-400)]"
                            : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {shortDay.slice(0, 1)}
                      </div>
                      <HabitCheckbox
                        habitId={habit._id ? String(habit._id) : null}
                        date={date}
                        isCompleted={isCompleted}
                        isToday={isToday}
                        color={habit.color || '#6366f1'}
                        onToggle={() => {
                          const habitId = habit._id ? String(habit._id) : null;
                          if (habitId) {
                            handleToggleCompletion(habitId, date);
                          }
                        }}
                        disabled={false}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1 font-outfit">
                  <span>Weekly Progress</span>
                  <span>
                    {weekDates.filter(({ date }) => {
                      const habitEntries = entries[habit._id];
                      const entry = habitEntries && habitEntries[date];
                      return entry && entry.completed;
                    }).length}/{weekDates.length}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: habit.color || '#6366f1',
                      width: `${(weekDates.filter(({ date }) => {
                        const habitEntries = entries[habit._id];
                        const entry = habitEntries && habitEntries[date];
                        return entry && entry.completed;
                      }).length / weekDates.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Add New Habit Card */}
        {onAddHabit && (
          <button
            onClick={onAddHabit}
            className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)] border-dashed hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-500)]/5 transition-all duration-200 group min-h-[200px] flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-500)]/10 flex items-center justify-center group-hover:bg-[var(--color-brand-500)]/20 transition-all duration-200 mb-3">
              <CheckIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-400)] transition-all duration-200 font-outfit">
                Add New Habit
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                Track a new daily habit
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
