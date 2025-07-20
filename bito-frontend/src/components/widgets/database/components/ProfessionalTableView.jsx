import React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { habitUtils } from "../../../../utils/habitLogic.js";
import { EmptyStateWithAddHabit } from "../../../HabitGrid/EmptyStateWithAddHabit.jsx";

/**
 * Professional Table View Component - Compact and styled like the reference
 */
export const ProfessionalTableView = ({
  daysOfWeek,
  displayHabits,
  weekStats,
  getCurrentWeekDates,
  getCompletionStatus,
  getDayCompletion,
  handleToggleCompletion,
  displayCompletions,
  readOnly = false, // Add readOnly prop
  handleEditHabit, // Add edit habit handler
  onAddHabit, // Add onAddHabit prop for habit creation
  breakpoint,
}) => {

  // Empty state when no habits are available
  if (!displayHabits || displayHabits.length === 0) {
    return <EmptyStateWithAddHabit className="w-full h-full" onAddHabit={readOnly ? null : onAddHabit} />;
  }

  return (
    <div className="w-full space-y-3">
      {/* Compact Table Container */}
      <div className="overflow-x-auto bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)]">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/30">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[120px]">
                Day
              </th>
              {displayHabits.map((habit) => (
                <th
                  key={habit.id}
                  className="text-center py-3 px-3 text-xs font-medium text-[var(--color-text-secondary)] font-outfit min-w-[60px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base">{habit.icon}</span>
                    <span className="truncate max-w-[50px]">{habit.name}</span>
                  </div>
                </th>
              ))}
              <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[80px]">
                Score
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[100px]">
                Actions
              </th>{" "}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {daysOfWeek.map((day, dayIndex) => {
              // Find the actual date for this day and compare with today's date
              const dayInfo = getCurrentWeekDates?.find((d) => d.dayName === day);
              // Get today's date in local timezone (YYYY-MM-DD format)
              const today = new Date();
              const todayString = `${today.getFullYear()}-${String(
                today.getMonth() + 1
              ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              const isToday = dayInfo?.date === todayString;
              
              // Calculate completion based only on scheduled habits for this day
              const dateObj = dayInfo ? new Date(dayInfo.date + 'T00:00:00') : null;
              const scheduledHabits = dateObj ? displayHabits.filter(habit => 
                habitUtils.isHabitScheduledForDate(habit, dateObj)
              ) : [];
              const completedCount = scheduledHabits.filter((h) =>
                getCompletionStatus(day, h.id)
              ).length;
              
              // Calculate day completion percentage
              const dayCompletion = scheduledHabits.length > 0
                ? Math.round((completedCount / scheduledHabits.length) * 100)
                : 100; // If no habits scheduled for this day, consider it 100%

              return (
                <tr
                  key={day}
                  className={`border-b border-[var(--color-border-primary)]/30 transition-all duration-150 hover:bg-[var(--color-surface-hover)]/30 ${
                    dayIndex % 2 === 0
                      ? "bg-[var(--color-surface-primary)]/10"
                      : "bg-transparent"
                  } ${
                    isToday
                      ? "bg-[var(--color-brand-500)]/8 border-[var(--color-brand-400)]/30"
                      : ""
                  }`}
                >
                  {/* Day Label */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium font-outfit ${
                            isToday
                              ? "text-[var(--color-brand-400)]"
                              : "text-[var(--color-text-primary)]"
                          }`}
                        >
                          {day}
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
                  {displayHabits.map((habit) => {
                    const isCompleted = getCompletionStatus(day, habit.id);
                    
                    // Check if habit is scheduled for this day
                    const dayInfo = getCurrentWeekDates?.find((d) => d.day === day);
                    const dateObj = dayInfo ? new Date(dayInfo.date + 'T00:00:00') : null;
                    const isScheduled = dateObj ? habitUtils.isHabitScheduledForDate(habit, dateObj) : false;
                    
                    return (
                      <td key={habit.id} className="py-3 px-3">
                        <div className="flex items-center justify-center">
                          {isScheduled ? (
                            <button
                              onClick={() =>
                                !readOnly && handleToggleCompletion(
                                  day,
                                  habit.id,
                                  displayCompletions
                                )
                              }
                              disabled={readOnly}
                              className={`w-7 h-7 rounded-lg transition-all duration-200 flex items-center justify-center ${
                                readOnly 
                                  ? "cursor-not-allowed opacity-60" 
                                  : "hover:scale-110 active:scale-95"
                              } ${
                                isCompleted
                                  ? "shadow-md transform scale-105"
                                  : readOnly ? "" : "hover:shadow-sm"
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
                                <CheckIcon className="w-4 h-4 text-white font-bold" />
                              )}
                            </button>
                          ) : (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center opacity-30">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: habit.color }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Score - Status Badge Style */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-outfit border ${
                        dayCompletion === 100
                          ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30"
                          : dayCompletion >= 75
                          ? "bg-[var(--color-brand-400)]/10 text-[var(--color-brand-400)] border-[var(--color-brand-400)]/30"
                          : dayCompletion >= 50
                          ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30"
                          : dayCompletion > 0
                          ? "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/30"
                          : "bg-[var(--color-text-tertiary)]/10 text-[var(--color-text-tertiary)] border-[var(--color-text-tertiary)]/30"
                      }`}
                    >
                      {dayCompletion === 100 && (
                        <CheckIcon className="w-3 h-3 mr-1" />
                      )}
                      {dayCompletion}%
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className={`text-xs font-outfit font-medium transition-colors ${
                          readOnly 
                            ? "text-[var(--color-text-tertiary)] cursor-not-allowed" 
                            : "text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)]"
                        }`}
                        disabled={readOnly}
                        onClick={() => {
                          if (!readOnly) {
                            /* Handle view day details */
                          }
                        }}
                      >
                        View
                      </button>
                      <span className="text-[var(--color-border-primary)]">
                        •
                      </span>
                      <button
                        className={`text-xs font-outfit font-medium transition-colors ${
                          readOnly 
                            ? "text-[var(--color-text-tertiary)] cursor-not-allowed" 
                            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                        }`}
                        disabled={readOnly}
                        onClick={() => {
                          if (!readOnly) {
                            // Manage habits button in the main view is better
                            // For now just redirect to the habit management view
                            alert("Use the 'Manage Habits' button to edit habits");
                          }
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats - Compact Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-brand-400)] font-dmSerif">
              {weekStats.completionRate}%
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Overall
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-success)] font-dmSerif">
              {weekStats.perfectDays}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Perfect Days
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
              {weekStats.completedCells}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Completed
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-warning)] font-dmSerif">
              {weekStats.averageCompletion}%
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
              Average
            </div>{" "}
          </div>
        </div>
      </div>
    </div>
  );
};
