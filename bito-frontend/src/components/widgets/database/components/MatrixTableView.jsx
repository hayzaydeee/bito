import React from "react";
import {
  CheckIcon,
  CalendarIcon,
  TargetIcon,
} from "@radix-ui/react-icons";

/**
 * Modern Matrix-style Table View Component
 */
export const MatrixTableView = ({
  daysOfWeek,
  displayHabits,
  weekStats,
  getCompletionStatus,
  getDayCompletion,
  getHabitCompletion,
  handleToggleCompletion,
  displayCompletions,
  tableRef,
  getColumnWidth,
  handleResizeStart,
  resetColumnWidths,
}) => (
  <div className="w-full space-y-4">
    {/* Header with Summary Stats */}
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/70 rounded-xl border border-[var(--color-border-primary)]">
      <div className="flex items-center gap-4">
        <CalendarIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
        <div>
          <h4 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
            Weekly Habit Matrix
          </h4>
          <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
            {displayHabits.length} habits × 7 days = {weekStats.totalCells}{" "}
            checkpoints
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--color-brand-400)] font-dmSerif">
            {weekStats.completionRate}%
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
            Overall
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--color-success)] font-dmSerif">
            {weekStats.perfectDays}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
            Perfect Days
          </div>
        </div>
      </div>
    </div>

    {/* Scrollable Matrix Container */}
    <div
      className="overflow-x-auto border border-[var(--color-border-primary)] rounded-xl bg-[var(--color-surface-elevated)]"
      ref={tableRef}
    >
      <div className="min-w-max">
        {/* Matrix Header */}
        <div className="sticky top-0 bg-[var(--color-surface-elevated)] z-10 border-b border-[var(--color-border-primary)]">
          <div className="flex">
            {/* Corner Cell */}
            <div className="w-32 p-3 border-r border-[var(--color-border-primary)] flex items-center justify-between">
              <div className="flex items-center">
                <TargetIcon className="w-4 h-4 text-[var(--color-text-tertiary)] mr-2" />
                <span className="text-sm font-semibold text-[var(--color-text-secondary)] font-outfit">
                  Day / Habit
                </span>
              </div>
              <button
                onClick={resetColumnWidths}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] transition-colors font-outfit"
                title="Reset column widths"
              >
                Reset
              </button>
            </div>

            {/* Habit Headers - Resizable */}
            {displayHabits.map((habit, index) => {
              const completion = getHabitCompletion(habit.id);
              const width = getColumnWidth(habit.id);
              return (
                <div
                  key={habit.id}
                  className={`p-3 text-center border-r border-[var(--color-border-primary)] relative ${
                    index === displayHabits.length - 1 ? "border-r-0" : ""
                  }`}
                  style={{ width: `${width}px` }}
                >
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer shadow-sm"
                    style={{
                      backgroundColor: `${habit.color}15`,
                      border: `2px solid ${habit.color}30`,
                      boxShadow: `0 2px 8px ${habit.color}20`,
                    }}
                  >
                    <span className="text-lg">{habit.icon}</span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)] font-outfit mb-1 truncate">
                    {habit.name}
                  </div>
                  <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-1.5 mb-1">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${completion}%`,
                        backgroundColor: habit.color,
                        boxShadow:
                          completion > 0
                            ? `0 0 4px ${habit.color}50`
                            : "none",
                      }}
                    />
                  </div>
                  <div
                    className="text-xs font-bold font-outfit"
                    style={{ color: habit.color }}
                  >
                    {completion}%
                  </div>

                  {/* Resize Handle */}
                  {index < displayHabits.length - 1 && (
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--color-brand-400)] transition-colors bg-transparent group"
                      onMouseDown={(e) => handleResizeStart(e, habit.id)}
                      title="Drag to resize column"
                    >
                      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-3 h-6 bg-[var(--color-surface-elevated)] rounded-sm border border-[var(--color-border-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-2 h-2 text-[var(--color-text-tertiary)]">⋮⋮</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary Column Header */}
            <div className="w-20 p-3 text-center bg-[var(--color-surface-secondary)]/30">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] font-outfit mb-2">
                Daily Score
              </div>
              <div className="w-8 h-8 mx-auto bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center">
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="divide-y divide-[var(--color-border-primary)]">
          {daysOfWeek.map((day) => {
            const dayCompletion = getDayCompletion(day);
            const isToday =
              new Date().toLocaleDateString("en-US", {
                weekday: "long",
              }) === day;
            const completedCount = displayHabits.filter((h) =>
              getCompletionStatus(day, h.id)
            ).length;

            return (
              <div
                key={day}
                className={`flex transition-all duration-200 hover:bg-[var(--color-surface-hover)]/30 ${
                  isToday
                    ? "bg-[var(--color-brand-500)]/8 ring-1 ring-inset ring-[var(--color-brand-400)]/30"
                    : ""
                }`}
              >
                {/* Day Label Cell */}
                <div className="w-32 p-3 border-r border-[var(--color-border-primary)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold font-dmSerif ${
                        isToday
                          ? "text-[var(--color-brand-400)]"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <div className="w-2 h-2 bg-[var(--color-brand-400)] rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                    {completedCount}/{displayHabits.length}
                  </div>
                </div>

                {/* Habit Checkbox Cells */}
                {displayHabits.map((habit, habitIndex) => {
                  const isCompleted = getCompletionStatus(day, habit.id);
                  const width = getColumnWidth(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className={`p-3 flex items-center justify-center border-r border-[var(--color-border-primary)] ${
                        habitIndex === displayHabits.length - 1
                          ? "border-r-0"
                          : ""
                      }`}
                      style={{ width: `${width}px` }}
                    >
                      <button
                        onClick={() =>
                          handleToggleCompletion(day, habit.id, displayCompletions)
                        }
                        className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center relative group hover:scale-110 active:scale-95 ${
                          isCompleted
                            ? "shadow-lg transform scale-105"
                            : "hover:shadow-md"
                        }`}
                        style={{
                          backgroundColor: isCompleted
                            ? habit.color
                            : "transparent",
                          border: `2px solid ${habit.color}`,
                          boxShadow: isCompleted
                            ? `0 4px 12px ${habit.color}30`
                            : `0 2px 8px ${habit.color}20`,
                        }}
                      >
                        {/* Completion checkmark */}
                        {isCompleted && (
                          <CheckIcon className="w-5 h-5 text-white font-bold z-10" />
                        )}

                        {/* Hover effect overlay */}
                        <div
                          className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
                            isCompleted
                              ? "opacity-0"
                              : "opacity-0 group-hover:opacity-20"
                          }`}
                          style={{ backgroundColor: habit.color }}
                        />
                      </button>
                    </div>
                  );
                })}

                {/* Daily Score Cell */}
                <div className="w-20 p-3 flex items-center justify-center bg-[var(--color-surface-secondary)]/30">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-outfit transition-all duration-200 shadow-sm"
                    style={{
                      backgroundColor:
                        dayCompletion === 100
                          ? "#10b981"
                          : dayCompletion >= 80
                          ? "#3b82f6"
                          : dayCompletion >= 60
                          ? "#f59e0b"
                          : dayCompletion >= 40
                          ? "#f97316"
                          : dayCompletion > 0
                          ? "#ef4444"
                          : "var(--color-surface-elevated)",
                      color:
                        dayCompletion >= 40
                          ? "white"
                          : "var(--color-text-secondary)",
                      border:
                        dayCompletion === 0
                          ? "2px solid var(--color-border-primary)"
                          : "none",
                      boxShadow:
                        dayCompletion > 0
                          ? `0 2px 8px ${
                              dayCompletion === 100
                                ? "#10b98120"
                                : dayCompletion >= 80
                                ? "#3b82f620"
                                : dayCompletion >= 60
                                ? "#f59e0b20"
                                : dayCompletion >= 40
                                ? "#f9731620"
                                : "#ef444420"
                            }`
                          : "none",
                    }}
                  >
                    {dayCompletion}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Footer Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-brand-500)]/20 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
          </div>
          <div>
            <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Week Average
            </div>
            <div className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
              {weekStats.averageCompletion}%
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-success)]/20 rounded-lg flex items-center justify-center">
            <CheckIcon className="w-5 h-5 text-[var(--color-success)]" />
          </div>
          <div>
            <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Total Progress
            </div>
            <div className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
              {weekStats.completedCells}/{weekStats.totalCells}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-warning)]/20 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-[var(--color-warning)]" />
          </div>
          <div>
            <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Streak Days
            </div>
            <div className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
              {weekStats.perfectDays}/7
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
