import React from "react";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";

/**
 * Habits Table View - Displays habits in a table format with edit and delete options
 */
export const HabitsTableView = ({
  displayHabits = [],
  handleEditHabit,
  handleDeleteHabit,
  readOnly = false,
}) => {
  // Empty state when no habits are available
  if (!displayHabits || displayHabits.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          {/* Empty state icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>

          {/* Empty state message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-outfit">
              No Habits Yet
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit leading-relaxed">
              Start tracking your daily habits by importing your data or adding
              your first habit below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Habits Table Container */}
      <div className="overflow-x-auto bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)]">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/30">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit">
                Habit
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit">
                Color
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit">
                Icon
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {displayHabits.map((habit, index) => (
              <tr
                key={habit.id}
                className={`border-b border-[var(--color-border-primary)]/30 transition-all duration-150 hover:bg-[var(--color-surface-hover)]/30 ${
                  index % 2 === 0
                    ? "bg-[var(--color-surface-primary)]/10"
                    : "bg-transparent"
                }`}
              >
                {/* Habit Name */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-outfit text-[var(--color-text-primary)]">
                      {habit.name}
                    </span>
                  </div>
                </td>

                {/* Color */}
                <td className="py-3 px-4">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: habit.color }} 
                  />
                </td>

                {/* Icon */}
                <td className="py-3 px-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ 
                      backgroundColor: `${habit.color}20`, 
                      color: habit.color 
                    }}
                  >
                    {habit.icon}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className={`p-2 rounded-full transition-colors ${
                        readOnly
                          ? "text-[var(--color-text-tertiary)] cursor-not-allowed"
                          : "text-[var(--color-brand-400)] hover:text-[var(--color-brand-500)] hover:bg-[var(--color-surface-secondary)]"
                      }`}
                      disabled={readOnly}
                      title="Edit habit"
                      onClick={() => !readOnly && handleEditHabit && handleEditHabit(habit)}
                    >
                      <Pencil1Icon className="w-4 h-4" />
                    </button>
                    
                    <button
                      className={`p-2 rounded-full transition-colors ${
                        readOnly
                          ? "text-[var(--color-text-tertiary)] cursor-not-allowed"
                          : "text-[var(--color-error)] hover:text-[var(--color-error-dark)] hover:bg-[var(--color-error)]/10"
                      }`}
                      disabled={readOnly}
                      title="Delete habit"
                      onClick={() => !readOnly && handleDeleteHabit && handleDeleteHabit(habit.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
