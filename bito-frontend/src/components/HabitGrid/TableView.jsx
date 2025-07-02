import React from "react";
import { CheckIcon, DragHandleDots2Icon } from "@radix-ui/react-icons";
import { HabitCheckbox } from "./HabitCheckbox.jsx";
import { EmptyStateWithAddHabit } from "./EmptyStateWithAddHabit.jsx";
import { habitUtils } from "../../utils/habitLogic.js";
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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Sortable Column Header Component
 */
const SortableColumnHeader = ({ habit, isInEditMode, children }) => {
  const habitId = habit._id || habit.id;
  const safeId = habitId ? String(habitId) : `habit-${Math.random()}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: safeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`text-center py-3 px-3 text-xs font-medium text-[var(--color-text-secondary)] font-outfit min-w-[60px] ${
        isInEditMode ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex flex-col items-center gap-1">
        {children}
      </div>
    </th>
  );
};

export const TableView = ({
  habits = [],
  weekDates = [],
  completions = new Set(),
  onToggle,
  isInEditMode = false,
  onHabitReorder,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id && onHabitReorder) {
      const oldIndex = habits.findIndex((habit) => {
        const habitId = habit._id || habit.id;
        return habitId ? String(habitId) === String(active.id) : false;
      });
      const newIndex = habits.findIndex((habit) => {
        const habitId = habit._id || habit.id;
        return habitId ? String(habitId) === String(over.id) : false;
      });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedHabits = arrayMove(habits, oldIndex, newIndex);
        // Extract IDs from the reordered habits array and ensure they're strings
        const newOrder = reorderedHabits.map(habit => {
          const habitId = habit._id || habit.id;
          return habitId ? String(habitId) : null;
        }).filter(Boolean);
        onHabitReorder(newOrder);
      }
    }
  };

  // Empty state when no habits are available
  if (!habits || habits.length === 0) {
    return <EmptyStateWithAddHabit />;
  }

  const tableContent = (
    <div className="w-full space-y-3">
      {/* Compact Table Container */}
      <div className="overflow-x-auto bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/30">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[120px]">
                Day
              </th>
              {isInEditMode ? (
                <SortableContext items={habits.map(h => {
                  const habitId = h._id || h.id;
                  return habitId ? String(habitId) : `habit-${Math.random()}`;
                })} strategy={horizontalListSortingStrategy}>
                  {habits.map((habit, index) => {
                    const habitId = habit._id || habit.id;
                    const safeKey = habitId ? String(habitId) : `habit-${index}`;
                    return (
                      <SortableColumnHeader
                        key={safeKey}
                        habit={habit}
                        isInEditMode={isInEditMode}
                      >
                        <span className="text-base">{habit.icon}</span>
                        <span className="truncate max-w-[50px]">
                          {habit.name}
                        </span>
                      </SortableColumnHeader>
                    );
                  })}
                </SortableContext>
              ) : (
                habits.map((habit, index) => {
                  const habitId = habit._id || habit.id;
                  const safeKey = habitId ? String(habitId) : `habit-${index}`;
                  return (
                    <th
                      key={safeKey}
                      className="text-center py-3 px-3 text-xs font-medium text-[var(--color-text-secondary)] font-outfit min-w-[60px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-base">{habit.icon}</span>
                        <span className="truncate max-w-[50px]">
                          {habit.name}
                        </span>
                      </div>
                    </th>
                  );
                })
              )}
              <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[80px]">
                Progress
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {weekDates.map((dateInfo, dayIndex) => {
              const { date, dayName, isToday, dateObj } = dateInfo;
              
              // Get habits scheduled for this specific date
              const scheduledHabits = habitUtils.getHabitsForDate(habits, dateObj);
              
              // Calculate completion percentage for this day based on scheduled habits
              const completedCount = scheduledHabits.filter((habit) => {
                const habitId = habit._id || habit.id;
                return habitId && completions.has(`${date}_${String(habitId)}`);
              }).length;

              const dayCompletion = scheduledHabits.length > 0
                ? Math.round((completedCount / scheduledHabits.length) * 100)
                : null; // null when no habits are scheduled

              return (
                <tr
                  key={date}
                  className={`border-b border-[var(--color-border-primary)]/30 transition-all duration-150 hover:bg-[var(--color-surface-hover)]/30 ${
                    dayIndex % 2 === 0
                      ? "bg-[var(--color-surface-primary)]/10"
                      : "bg-transparent"
                  } ${isToday ? "ring-2 ring-[var(--color-brand-400)]/30" : ""}`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium font-outfit ${
                            isToday
                              ? "text-[var(--color-brand-400)]"
                              : "text-[var(--color-text-primary)]"
                          }`}
                        >
                          {dayName}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                          {completedCount}/{scheduledHabits.length} scheduled
                        </span>
                      </div>
                      {isToday && (
                        <span className="px-2 py-1 bg-[var(--color-brand-500)] text-white text-xs font-bold rounded-full font-outfit">
                          TODAY
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Habit Checkboxes */}
                  {habits.map((habit, habitIndex) => {
                    const habitId = habit._id || habit.id;
                    const safeHabitId = habitId ? String(habitId) : null;
                    const isCompleted = safeHabitId && completions.has(`${date}_${safeHabitId}`);
                    const isScheduled = habitUtils.isHabitScheduledForDate(habit, dateObj);
                    
                    return (
                      <td key={safeHabitId || `habit-${habitIndex}`} className="py-3 px-3">
                        <div className="flex items-center justify-center">
                          {isScheduled ? (
                            <button
                              onClick={() => safeHabitId && onToggle(safeHabitId, date)}
                              className={`w-7 h-7 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
                                isCompleted
                                  ? "shadow-md transform scale-105"
                                  : "hover:shadow-sm"
                              }`}
                              style={{
                                backgroundColor: isCompleted ? habit.color : "transparent",
                                borderWidth: "2px",
                                borderStyle: "solid",
                                borderColor: habit.color || "#6366f1",
                              }}
                            >
                              {isCompleted && (
                                <CheckIcon className="w-4 h-4 text-white" />
                              )}
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center">
                              <div 
                                className="w-2 h-2 rounded-full opacity-30"
                                style={{
                                  backgroundColor: habit.color || "#6366f1",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {/* Progress Column */}
                  <td className="py-3 px-4 text-center">
                    {dayCompletion !== null ? (
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[var(--color-border-secondary)] rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${dayCompletion}%`,
                                backgroundColor: dayCompletion > 0 ? "var(--color-brand-400)" : "transparent",
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit">
                            {dayCompletion}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--color-text-quaternary)] font-outfit">
                        No habits
                      </span>
                    )}
                  </td>
                  {/* Actions Column */}
                  <td className="py-3 px-4 text-center">
                    <div className="text-xs text-[var(--color-text-quaternary)] font-outfit">
                      {/* Placeholder for future actions */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return isInEditMode ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {tableContent}
    </DndContext>
  ) : (
    tableContent
  );
};
