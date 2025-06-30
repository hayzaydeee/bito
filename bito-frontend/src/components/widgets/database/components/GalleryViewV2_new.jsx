import React, { useMemo } from "react";
import { PlusIcon, CheckIcon } from "@radix-ui/react-icons";
import { useHabits } from "../../../../contexts/HabitContext";
import { habitUtils } from "../../../../contexts/HabitContext.jsx";
import { habitUtils as scheduleUtils } from "../../../../utils/habitLogic";
import { EmptyStateWithAddHabit } from "../../../HabitGrid/EmptyStateWithAddHabit.jsx";

/**
 * Gallery View Component - Card-based layout for habits (V2 with scheduling support)
 */
export const GalleryViewV2 = ({ 
  startDate,
  endDate = null,
  breakpoint,
  className = "",
  showStats = true,
  showHeader = true,
  onAddHabit = null, // Callback to open the creation modal
  onEditHabit = null // Callback to open the edit modal
}) => {
  // Use HabitContext instead of Zustand
  const { 
    habits, 
    entries, 
    loading, 
    error, 
    toggleHabitCompletion 
  } = useHabits();

  // Memoize the start date to prevent infinite re-renders (same logic as HabitGrid)
  const memoizedStartDate = useMemo(() => {
    return startDate || habitUtils.getWeekStart(new Date());
  }, [startDate]);

  // Get current week dates - use same logic as table view
  const { weekDates, todayString } = useMemo(() => {
    let dates;
    if (endDate) {
      // Custom date range
      dates = [];
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
    } else {
      // Default: current week
      dates = habitUtils.getWeekDates(memoizedStartDate);
    }
    
    // Calculate today string once
    const today = new Date();
    const todayStr = habitUtils.normalizeDate(today);

    return {
      weekDates: dates,
      todayString: todayStr
    };
  }, [memoizedStartDate, endDate]); // Same dependencies as HabitGrid

  // Helper functions
  const getCompletionStatus = (date, habitId) => {
    const habitEntries = entries[habitId];
    const entry = habitEntries && habitEntries[date];
    // Only return true if entry exists AND is completed
    return !!(entry && entry.completed);
  };

  const getDayCompletion = (dayInfo) => {
    if (habits.length === 0) return null;
    
    // Get habits scheduled for this specific day
    const scheduledHabits = scheduleUtils.getHabitsForDate(habits, dayInfo.dateObj);
    if (scheduledHabits.length === 0) return null; // No habits scheduled
    
    const completedCount = scheduledHabits.filter(habit => 
      getCompletionStatus(dayInfo.date, habit._id)
    ).length;
    
    return Math.round((completedCount / scheduledHabits.length) * 100);
  };

  const handleToggleCompletion = (date, habitId) => {
    toggleHabitCompletion(habitId, date);
  };

  const handleAddClick = () => {
    if (onAddHabit) {
      onAddHabit();
    }
  };

  const handleEditClick = (habit) => {
    if (onEditHabit) {
      onEditHabit(habit);
    }
  };

  // Show empty state if no habits exist
  if (!habits || habits.length === 0) {
    return <EmptyStateWithAddHabit onAddHabit={handleAddClick} />;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Week Progress Overview */}
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 font-outfit">
          Week Overview
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((dayInfo) => {
            const dayCompletion = getDayCompletion(dayInfo);
            const isToday = dayInfo.isToday;
            
            return (
              <div
                key={dayInfo.dayName}
                className={`text-center p-2 rounded-lg transition-all duration-200 ${
                  isToday
                    ? "bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-400)]/30"
                    : "bg-[var(--color-surface-secondary)]/30"
                }`}
              >
                <div
                  className={`text-xs font-medium mb-1 font-outfit ${
                    isToday
                      ? "text-[var(--color-brand-400)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {dayInfo.shortDay}
                </div>
                <div
                  className={`text-xs font-bold font-dmSerif ${
                    dayCompletion === null
                      ? "text-[var(--color-text-tertiary)]"
                      : dayCompletion === 100
                      ? "text-[var(--color-success)]"
                      : dayCompletion > 0
                      ? "text-[var(--color-warning)]"
                      : "text-[var(--color-text-tertiary)]"
                  }`}
                >
                  {dayCompletion === null ? "—" : `${dayCompletion}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habits Grid */}
      <div className="grid gap-4" style={{
        gridTemplateColumns: breakpoint === "xs" 
          ? "1fr" 
          : breakpoint === "sm" 
          ? "repeat(auto-fit, minmax(280px, 1fr))"
          : "repeat(auto-fit, minmax(320px, 1fr))"
      }}>
        {habits.map((habit) => (
          <div
            key={habit._id}
            className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)] hover:shadow-md transition-all duration-200"
          >
            {/* Habit Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
              >
                {habit.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit">
                  {habit.name}
                </h4>
                <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                  {(() => {
                    // Get scheduled days for this week for this habit
                    const scheduledDays = weekDates.filter(day => 
                      scheduleUtils.isHabitScheduledForDate(habit, day.dateObj)
                    );
                    const completedScheduledDays = scheduledDays.filter(day => 
                      getCompletionStatus(day.date, habit._id)
                    );
                    return `${completedScheduledDays.length}/${scheduledDays.length} scheduled days`;
                  })()}
                </p>
              </div>
              {/* Edit Button */}
              {onEditHabit && (
                <button
                  onClick={() => handleEditClick(habit)}
                  className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="Edit habit"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77154 3.50251 8.88479L2.5 12L5.61521 11.4975C5.72846 11.4474 5.83168 11.3754 5.92164 11.2855L13.3536 3.85355C13.5488 3.65829 13.5488 3.34171 13.3536 3.14645L11.8536 1.14645ZM4.58579 9.58579L10.7929 3.37868L11.6213 4.20711L5.41421 10.4142L4.58579 9.58579ZM4.04289 10.0529L4.94711 10.9571L3.5 12.5L4.04289 10.0529Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Daily Checkboxes */}
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((dayInfo) => {
                const isCompleted = getCompletionStatus(dayInfo.date, habit._id);
                const isToday = dayInfo.isToday;
                const isScheduled = scheduleUtils.isHabitScheduledForDate(habit, dayInfo.dateObj);

                return (
                  <div key={dayInfo.dayName} className="text-center">
                    <div
                      className={`text-xs font-medium mb-1 font-outfit ${
                        isToday
                          ? "text-[var(--color-brand-400)]"
                          : "text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {dayInfo.dayName.slice(0, 1)}
                    </div>
                    {isScheduled ? (
                      <button
                        onClick={() => handleToggleCompletion(dayInfo.date, habit._id)}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
                          isCompleted
                            ? "shadow-sm transform scale-105"
                            : "hover:shadow-sm"
                        }`}
                        style={{
                          backgroundColor: isCompleted ? habit.color : "transparent",
                          border: `2px solid ${habit.color}`,
                          boxShadow: isCompleted ? `0 2px 4px ${habit.color}30` : "none",
                        }}
                      >
                        {isCompleted && (
                          <CheckIcon className="w-4 h-4 text-white font-bold" />
                        )}
                      </button>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <div 
                          className="w-2 h-2 rounded-full opacity-30"
                          style={{ backgroundColor: habit.color }}
                          title="Not scheduled for this day"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1 font-outfit">
                <span>Weekly Progress</span>
                <span>
                  {(() => {
                    // Calculate progress based on scheduled days only
                    const scheduledDays = weekDates.filter(day => 
                      scheduleUtils.isHabitScheduledForDate(habit, day.dateObj)
                    );
                    const completedScheduledDays = scheduledDays.filter(day => 
                      getCompletionStatus(day.date, habit._id)
                    );
                    return `${completedScheduledDays.length}/${scheduledDays.length}`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: habit.color,
                    width: `${(() => {
                      const scheduledDays = weekDates.filter(day => 
                        scheduleUtils.isHabitScheduledForDate(habit, day.dateObj)
                      );
                      if (scheduledDays.length === 0) return 0;
                      const completedScheduledDays = scheduledDays.filter(day => 
                        getCompletionStatus(day.date, habit._id)
                      );
                      return (completedScheduledDays.length / scheduledDays.length) * 100;
                    })()}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add New Habit Card */}
        {onAddHabit && (
          <button
            onClick={handleAddClick}
            className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)] border-dashed hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-500)]/5 transition-all duration-200 group"
          >
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-500)]/10 flex items-center justify-center group-hover:bg-[var(--color-brand-500)]/20 transition-all duration-200">
                <PlusIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-400)] transition-all duration-200 font-outfit">
                  Add New Habit
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                  Track a new daily habit
                </p>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
