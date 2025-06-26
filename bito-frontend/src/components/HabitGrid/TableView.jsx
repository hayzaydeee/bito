import React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { HabitCheckbox } from "./HabitCheckbox.jsx";
import { EmptyStateWithAddHabit } from "./EmptyStateWithAddHabit.jsx";

/**
 * Table View Component - Matches the old ProfessionalTableView styling
 */
export const TableView = ({
  habits,
  weekDates,
  completions = new Set(),
  onToggle,
  weekStats,
}) => {
  // Empty state when no habits are available
  if (!habits || habits.length === 0) {
    return <EmptyStateWithAddHabit />;
  }

  return (
    <div className="w-full space-y-3">
      {/* Compact Table Container */}
      <div className="overflow-x-auto bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/30">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[120px]">
                Day
              </th>
              {habits.map((habit) => (
                <th
                  key={habit._id || habit.id}
                  className="text-center py-3 px-3 text-xs font-medium text-[var(--color-text-secondary)] font-outfit min-w-[60px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base">{habit.icon}</span>
                    <span className="truncate max-w-[50px]">
                      {habit.name}
                    </span>
                  </div>
                </th>
              ))}
              <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[80px]">
                Score
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {weekDates.map((dateInfo, dayIndex) => {
              const { date, dayName, isToday } = dateInfo;
              // Calculate completion percentage for this day
              const completedCount = habits.filter((habit) =>
                completions.has(`${date}_${habit._id || habit.id}`)
              ).length;

              const dayCompletion =
                habits.length > 0
                  ? Math.round((completedCount / habits.length) * 100)
                  : 0;

              return (
                <tr
                  key={date}
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
                          {dayName}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                          {completedCount}/{habits.length} completed
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
                  {habits.map((habit) => {
                    const isCompleted = completions.has(
                      `${date}_${habit._id || habit.id}`
                    );
                    return (
                      <td key={habit._id || habit.id} className="py-3 px-3">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() =>
                              onToggle(habit._id || habit.id, date)
                            }
                            className={`w-7 h-7 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
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
                              <CheckIcon className="w-4 h-4 text-white font-bold" />
                            )}
                          </button>
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
                        className="text-xs text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] font-outfit font-medium transition-colors"
                        onClick={() => {
                          /* Handle view day details */
                        }}
                      >
                        View
                      </button>
                      <span className="text-[var(--color-border-primary)]">
                        •
                      </span>
                      <button
                        className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-outfit font-medium transition-colors"
                        onClick={() => {
                          /* Handle quick actions */
                        }}
                      >
                        Edit
                      </button>
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
};
