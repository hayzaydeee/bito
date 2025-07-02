import React, { useMemo } from "react";
import { PlusIcon, CheckIcon, DragHandleDots2Icon } from "@radix-ui/react-icons";
import { useHabits } from "../../../../contexts/HabitContext";
import { habitUtils } from "../../../../utils/habitLogic";
import { EmptyStateWithAddHabit } from "../../../habitGrid/EmptyStateWithAddHabit.jsx";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Sortable Habit Card Component
 */
const SortableHabitCard = ({ habit, isInEditMode, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit._id || habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isInEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      {...(isInEditMode ? { ...attributes, ...listeners } : {})}
    >
      {isInEditMode && (
        <div className="absolute top-2 right-2 z-10 bg-white rounded p-1 shadow-sm border">
          <DragHandleDots2Icon className="w-3 h-3 text-gray-400" />
        </div>
      )}
      {children}
    </div>
  );
};

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
  onEditHabit = null, // Callback to open the edit modal
  habits: propHabits = null, // Habits from parent (for ordering)
  isInEditMode = false,
  onHabitReorder = null
}) => {
  // Use HabitContext instead of Zustand
  const { 
    habits: contextHabits, 
    entries, 
    loading, 
    error, 
    toggleHabitCompletion 
  } = useHabits();

  // Use passed habits (ordered) or fall back to context habits
  const displayHabits = propHabits || contextHabits;

  // Create completions Set (same logic as HabitGrid)
  const completions = useMemo(() => {
    const completionsSet = new Set();

    // Convert entries object to Set of "date_habitId" keys
    displayHabits.forEach((habit) => {
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
  }, [displayHabits, entries]);

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
      // Standard 7-day week from start date
      dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(memoizedStartDate);
        date.setDate(date.getDate() + i);
        return {
          date: habitUtils.normalizeDate(date),
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          shortDay: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isToday: habitUtils.isToday(date),
          dateObj: new Date(date)
        };
      });
    }

    const today = new Date();
    const todayString = habitUtils.normalizeDate(today);

    return { weekDates: dates, todayString };
  }, [memoizedStartDate, endDate]);

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id && onHabitReorder) {
      const oldIndex = displayHabits.findIndex((habit) => (habit._id || habit.id) === active.id);
      const newIndex = displayHabits.findIndex((habit) => (habit._id || habit.id) === over.id);
      
      const reorderedHabits = arrayMove(displayHabits, oldIndex, newIndex);
      // Extract IDs for the reorder callback
      const reorderedIds = reorderedHabits.map(h => h._id || h.id);
      onHabitReorder(reorderedIds);
    }
  };

  // Calculate completion percentage for a specific day
  const getDayCompletion = (dayInfo) => {
    // Get habits scheduled for this specific date
    const scheduledHabits = habitUtils.getHabitsForDate(displayHabits, dayInfo.dateObj);
    
    // Calculate completion percentage for this day based on scheduled habits
    const completedCount = scheduledHabits.filter((habit) =>
      completions.has(`${dayInfo.date}_${habit._id || habit.id}`)
    ).length;

    return scheduledHabits.length > 0
      ? Math.round((completedCount / scheduledHabits.length) * 100)
      : null; // null when no habits are scheduled
  };

  // Handle adding a new habit
  const handleAddClick = () => {
    if (onAddHabit) {
      onAddHabit();
    }
  };

  // Handle editing a habit
  const handleEditClick = (habit) => {
    if (onEditHabit) {
      onEditHabit(habit);
    }
  };

  // Show empty state if no habits exist
  if (!displayHabits || displayHabits.length === 0) {
    return <EmptyStateWithAddHabit onAddHabit={handleAddClick} />;
  }

  const galleryContent = (
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
                key={dayInfo.date}
                className={`text-center p-2 rounded-lg transition-all duration-200 ${
                  isToday
                    ? "bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-400)]/30"
                    : "bg-[var(--color-surface-secondary)]/30"
                }`}
              >
                <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 font-outfit">
                  {dayInfo.shortDay}
                </div>
                {dayCompletion === null ? (
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    No habits
                  </div>
                ) : (
                  <div
                    className={`text-xs font-bold font-outfit ${
                      dayCompletion === 100
                        ? "text-[var(--color-success)]"
                        : dayCompletion >= 75
                        ? "text-[var(--color-brand-400)]"
                        : dayCompletion >= 50
                        ? "text-[var(--color-warning)]"
                        : dayCompletion > 0
                        ? "text-[var(--color-error)]"
                        : "text-[var(--color-text-tertiary)]"
                    }`}
                  >
                    {dayCompletion}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Cards Grid */}
      <SortableContext 
        items={displayHabits.map(h => h._id || h.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayHabits.map((habit) => {
            // Calculate overall completion for this habit across the week
            const weekCompletion = weekDates.reduce((total, dayInfo) => {
              const isScheduled = habitUtils.isHabitScheduledForDate(habit, dayInfo.dateObj);
              if (!isScheduled) return total;
              
              const isCompleted = completions.has(`${dayInfo.date}_${habit._id || habit.id}`);
              return total + (isCompleted ? 1 : 0);
            }, 0);

            const scheduledDaysCount = weekDates.filter(dayInfo => 
              habitUtils.isHabitScheduledForDate(habit, dayInfo.dateObj)
            ).length;

            const habitCompletion = scheduledDaysCount > 0 
              ? Math.round((weekCompletion / scheduledDaysCount) * 100)
              : 0;

            return (
              <SortableHabitCard
                key={habit._id || habit.id}
                habit={habit}
                isInEditMode={isInEditMode}
              >
                <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)] hover:shadow-lg transition-all duration-200">
                  {/* Habit Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                          {habit.name}
                        </h3>
                        <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                          {habit.category || "General"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditClick(habit)}
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-[var(--color-text-secondary)] font-outfit">
                        Progress
                      </span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)] font-outfit">
                        {habitCompletion}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${habitCompletion}%`,
                          backgroundColor: habit.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Week Days Checkboxes */}
                  <div className="grid grid-cols-7 gap-1">
                    {weekDates.map((dayInfo) => {
                      const isScheduled = habitUtils.isHabitScheduledForDate(habit, dayInfo.dateObj);
                      const isCompleted = completions.has(`${dayInfo.date}_${habit._id || habit.id}`);

                      return (
                        <div key={dayInfo.date} className="text-center">
                          <div className="text-xs text-[var(--color-text-tertiary)] mb-1 font-outfit">
                            {dayInfo.shortDay}
                          </div>
                          {isScheduled ? (
                            <button
                              onClick={() => toggleHabitCompletion(habit._id || habit.id, dayInfo.date)}
                              className={`w-6 h-6 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
                                isCompleted
                                  ? "shadow-md transform scale-105"
                                  : "hover:shadow-sm"
                              }`}
                              style={{
                                backgroundColor: isCompleted
                                  ? habit.color
                                  : "transparent",
                                border: `2px solid ${habit.color}`,
                                boxShadow: isCompleted
                                  ? `0 2px 6px ${habit.color}30`
                                  : "none",
                              }}
                            >
                              {isCompleted && (
                                <CheckIcon className="w-3 h-3 text-white font-bold" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center">
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
                </div>
              </SortableHabitCard>
            );
          })}
          
          {/* Add Habit Card - Always show at the end */}
          {onAddHabit && (
            <div className="bg-[var(--color-surface-elevated)]/50 rounded-lg p-4 border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-surface-elevated)] transition-all duration-200 cursor-pointer group"
                 onClick={onAddHabit}>
              <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-500)]/10 group-hover:bg-[var(--color-brand-500)]/20 flex items-center justify-center mb-3 transition-colors duration-200">
                  <PlusIcon className="w-6 h-6 text-[var(--color-brand-500)] group-hover:text-[var(--color-brand-600)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 font-dmSerif">
                  New Habit
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Create a new habit to track
                </p>
              </div>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );

  // Conditionally wrap with DndContext only if in edit mode
  if (isInEditMode && onHabitReorder) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {galleryContent}
      </DndContext>
    );
  }

  return galleryContent;
};

/**
 * Individual Habit Card Component
 */
const HabitCard = ({ habit, weekDates, completions, onToggle, onEdit }) => {
  // Calculate streak and completion stats for this habit
  const habitStats = useMemo(() => {
    const scheduledDates = weekDates.filter(dayInfo => 
      habitUtils.isHabitScheduledForDate(habit, dayInfo.dateObj)
    );
    
    const completedDates = scheduledDates.filter(dayInfo =>
      completions.has(`${dayInfo.date}_${habit._id || habit.id}`)
    );

    const completionRate = scheduledDates.length > 0 
      ? Math.round((completedDates.length / scheduledDates.length) * 100)
      : 0;

    return {
      scheduledCount: scheduledDates.length,
      completedCount: completedDates.length,
      completionRate,
    };
  }, [habit, weekDates, completions]);

  return (
    <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 border border-[var(--color-border-primary)] hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
          >
            {habit.icon}
          </div>
          <div>
            <h4 className="font-medium text-[var(--color-text-primary)] font-outfit">
              {habit.name}
            </h4>
            <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
              {habitStats.completedCount}/{habitStats.scheduledCount} completed
            </p>
          </div>
        </div>
        <button
          onClick={() => onEdit(habit)}
          className="text-xs text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] font-outfit font-medium transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit">
            Week Progress
          </span>
          <span className="text-xs font-semibold text-[var(--color-text-primary)] font-outfit">
            {habitStats.completionRate}%
          </span>
        </div>
        <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${habitStats.completionRate}%`,
              backgroundColor: habit.color,
            }}
          />
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((dayInfo) => {
          const isCompleted = completions.has(`${dayInfo.date}_${habit._id || habit.id}`);
          const isScheduled = habitUtils.isHabitScheduledForDate(habit, dayInfo.dateObj);
          const isToday = dayInfo.isToday;

          return (
            <div key={dayInfo.date} className="flex flex-col items-center">
              <div className={`text-xs mb-1 font-outfit ${isToday ? 'font-semibold text-[var(--color-brand-400)]' : 'text-[var(--color-text-tertiary)]'}`}>
                {dayInfo.shortDay}
              </div>
              {isScheduled ? (
                <button
                  onClick={() => onToggle(habit._id || habit.id, dayInfo.date)}
                  className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
                    isCompleted ? "shadow-md transform scale-105" : "hover:shadow-sm"
                  }`}
                  style={{
                    backgroundColor: isCompleted ? habit.color : "transparent",
                    border: `2px solid ${habit.color}`,
                    boxShadow: isCompleted ? `0 2px 6px ${habit.color}30` : "none",
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
    </div>
  );
};
