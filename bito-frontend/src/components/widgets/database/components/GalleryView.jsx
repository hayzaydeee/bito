import React from "react";
import { PlusIcon, CheckIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { habitUtils } from "../../../../utils/habitLogic.js";
import { EmptyStateWithAddHabit } from "../../../HabitGrid/EmptyStateWithAddHabit";

/**
 * Gallery View Component - Card-based layout for habits
 */
export const GalleryView = ({
  daysOfWeek = [],
  displayHabits = [],
  displayCompletions = {},
  getCurrentWeekDates,
  getCompletionStatus,
  getDayCompletion,
  handleToggleCompletion,
  weekStats,
  breakpoint,
  handleEditHabit, // Add edit handler
  readOnly = false, // Add readOnly prop
  onAddHabit, // Add onAddHabit prop for modal-based habit creation
}) => {
  // Show empty state if no habits exist
  if (!displayHabits || displayHabits.length === 0) {
    return (
      <EmptyStateWithAddHabit
        className="w-full h-full"
        onAddHabit={readOnly ? null : onAddHabit}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Week Progress Overview */}
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 font-outfit">
          Week Overview
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => {
            const dayCompletion = getDayCompletion(day);

            // Find the actual date for this day and compare with today's date
            const dayInfo = getCurrentWeekDates?.find((d) => d.dayName === day);
            // Get today's date in local timezone (YYYY-MM-DD format)
            const today = new Date();
            const todayString = `${today.getFullYear()}-${String(
              today.getMonth() + 1
            ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            const isToday = dayInfo?.date === todayString;

            return (
              <div
                key={day}
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
                  {day.slice(0, 3)}
                </div>
                <div
                  className={`text-xs font-bold font-dmSerif ${
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Habits Grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns:
            breakpoint === "xs"
              ? "1fr"
              : breakpoint === "sm"
              ? "repeat(auto-fit, minmax(280px, 1fr))"
              : "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        {displayHabits.map((habit) => (
          <div
            key={habit.id}
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
                    const scheduledDays = daysOfWeek.filter((day) => {
                      const dayInfo = getCurrentWeekDates?.find(
                        (d) => d.dayName === day
                      );
                      if (!dayInfo) return false;
                      const dateObj = new Date(dayInfo.date + "T00:00:00");
                      return habitUtils.isHabitScheduledForDate(habit, dateObj);
                    });
                    const completedScheduledDays = scheduledDays.filter((day) =>
                      getCompletionStatus(day, habit.id)
                    );
                    return `${completedScheduledDays.length}/${scheduledDays.length} scheduled days completed`;
                  })()}
                </p>
              </div>
              {!readOnly && handleEditHabit && (
                <button
                  onClick={() => handleEditHabit(habit)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] hover:bg-[var(--color-surface-secondary)] transition-all duration-200"
                  title="Edit habit"
                >
                  <Pencil1Icon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Daily Checkboxes */}
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => {
                const isCompleted = getCompletionStatus(day, habit.id);

                // Find the actual date for this day and compare with today's date
                const dayInfo = getCurrentWeekDates?.find((d) => d.dayName === day);
                // Get today's date in local timezone (YYYY-MM-DD format)
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(
                  today.getMonth() + 1
                ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                const isToday = dayInfo?.date === todayString;

                // Check if habit is scheduled for this day
                const dateObj = dayInfo ? new Date(dayInfo.date + "T00:00:00") : null;
                const isScheduled = dateObj
                  ? habitUtils.isHabitScheduledForDate(habit, dateObj)
                  : false;

                return (
                  <div key={day} className="text-center">
                    <div
                      className={`text-xs font-medium mb-1 font-outfit ${
                        isToday
                          ? "text-[var(--color-brand-400)]"
                          : "text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {day.slice(0, 1)}
                    </div>
                    {isScheduled ? (
                      <button
                        onClick={() =>
                          !readOnly && handleToggleCompletion(day, habit.id, displayCompletions)
                        }
                        disabled={readOnly}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center ${
                          readOnly
                            ? "cursor-not-allowed opacity-60"
                            : "hover:scale-110 active:scale-95"
                        } ${
                          isCompleted
                            ? "shadow-sm transform scale-105"
                            : readOnly ? "" : "hover:shadow-sm"
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
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-30">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: habit.color }}
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
                    const scheduledDays = daysOfWeek.filter((day) => {
                      const dayInfo = getCurrentWeekDates?.find(
                        (d) => d.dayName === day
                      );
                      if (!dayInfo) return false;
                      const dateObj = new Date(dayInfo.date + "T00:00:00");
                      return habitUtils.isHabitScheduledForDate(habit, dateObj);
                    });
                    const completedScheduledDays = scheduledDays.filter((day) =>
                      getCompletionStatus(day, habit.id)
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
                      const scheduledDays = daysOfWeek.filter((day) => {
                        const dayInfo = getCurrentWeekDates?.find(
                          (d) => d.dayName === day
                        );
                        if (!dayInfo) return false;
                        const dateObj = new Date(dayInfo.date + "T00:00:00");
                        return habitUtils.isHabitScheduledForDate(habit, dateObj);
                      });
                      if (scheduledDays.length === 0) return 100; // If no scheduled days, show full progress
                      const completedScheduledDays = scheduledDays.filter((day) =>
                        getCompletionStatus(day, habit.id)
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
            onClick={onAddHabit}
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
