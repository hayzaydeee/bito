import React from "react";
import {
  CheckIcon,
  DotsHorizontalIcon,
  Pencil1Icon,
  PlusIcon,
} from "@radix-ui/react-icons";

/**
 * Gallery View Component - Card-based view of habits
 */
export const GalleryView = ({
  displayHabits,
  daysOfWeek,
  getCompletionStatus,
  getHabitCompletion,
  handleToggleCompletion,
  displayCompletions,
  breakpoint,
  showAddForm,
  setShowAddForm,
  newHabitName,
  setNewHabitName,
  handleAddHabit,
  handleCancelAdd,
}) => (
  <div
    className="grid gap-4"
    style={{
      gridTemplateColumns:
        breakpoint === "xs"
          ? "1fr"
          : breakpoint === "sm"
          ? "repeat(2, 1fr)"
          : "repeat(auto-fit, minmax(300px, 1fr))",
    }}
  >
    {displayHabits.map((habit) => {
      const habitCompletion = getHabitCompletion(habit.id);
      const completedDays = daysOfWeek.filter((day) =>
        getCompletionStatus(day, habit.id)
      );

      return (
        <div
          key={habit.id}
          className="glass-card rounded-xl p-5 hover:shadow-lg transition-all duration-200 border border-[var(--color-border-primary)]"
        >
          {/* Habit Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: `${habit.color}15`,
                  border: `2px solid ${habit.color}30`,
                }}
              >
                <span className="text-xl">{habit.icon}</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {habit.name}
                </h4>
                <div className="text-sm text-[var(--color-text-tertiary)] font-outfit">
                  {completedDays.length}/7 completed
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
                <Pencil1Icon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              </button>
              <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
                <DotsHorizontalIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              </button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-text-secondary)] font-outfit">
                Weekly Progress
              </span>
              <span
                className="text-sm font-bold font-outfit"
                style={{ color: habit.color }}
              >
                {habitCompletion}%
              </span>
            </div>
            <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${habitCompletion}%`,
                  backgroundColor: habit.color,
                  boxShadow:
                    habitCompletion > 0
                      ? `0 0 8px ${habit.color}40`
                      : "none",
                }}
              />
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => {
              const isCompleted = getCompletionStatus(day, habit.id);
              const isToday =
                new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                }) === day;

              return (
                <div key={day} className="text-center">
                  <div
                    className={`text-xs mb-2 font-outfit ${
                      isToday
                        ? "text-[var(--color-brand-400)] font-bold"
                        : "text-[var(--color-text-tertiary)]"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </div>
                  <button
                    onClick={() => handleToggleCompletion(day, habit.id, displayCompletions)}
                    className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center relative ${
                      isCompleted ? "shadow-md" : "hover:shadow-sm"
                    } ${
                      isToday
                        ? "ring-2 ring-[var(--color-brand-400)]/50"
                        : ""
                    }`}
                    style={{
                      backgroundColor: isCompleted
                        ? habit.color
                        : "var(--color-surface-elevated)",
                      border: `2px solid ${
                        isCompleted
                          ? habit.color
                          : "var(--color-border-primary)"
                      }`,
                      boxShadow: isCompleted
                        ? `0 2px 8px ${habit.color}30`
                        : "none",
                    }}
                  >
                    {isCompleted && (
                      <CheckIcon className="w-4 h-4 text-white" />
                    )}
                    {isToday && !isCompleted && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] animate-pulse" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}

    {/* Add New Habit Card */}
    {showAddForm ? (
      <div className="glass-card rounded-xl p-5 border-2 border-dashed border-[var(--color-brand-400)] bg-[var(--color-brand-500)]/5">
        <input
          type="text"
          placeholder="Enter habit name..."
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
          className="w-full bg-transparent border-none outline-none text-base font-outfit text-[var(--color-text-primary)] mb-4 placeholder:text-[var(--color-text-tertiary)]"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleAddHabit}
            className="flex-1 py-2.5 bg-[var(--color-brand-500)] text-white rounded-lg text-sm font-outfit font-semibold hover:bg-[var(--color-brand-600)] transition-colors"
          >
            Add Habit
          </button>
          <button
            onClick={handleCancelAdd}
            className="px-4 py-2.5 bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] rounded-lg text-sm font-outfit hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => setShowAddForm(true)}
        className="glass-card rounded-xl p-5 border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-brand-400)] transition-all duration-200 flex flex-col items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] min-h-[240px] group"
      >
        <div className="w-14 h-14 bg-[var(--color-surface-elevated)] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[var(--color-brand-500)]/10 transition-all duration-200">
          <PlusIcon className="w-7 h-7" />
        </div>
        <span className="text-base font-outfit font-semibold">
          Add New Habit
        </span>
        <span className="text-sm font-outfit opacity-70 mt-1">
          Track your progress
        </span>
      </button>
    )}
  </div>
);
