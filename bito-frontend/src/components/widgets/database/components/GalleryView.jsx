import React from "react";
import { PlusIcon, CheckIcon, Pencil1Icon } from "@radix-ui/react-icons";

/**
 * Empty State Component for Gallery View
 */
const EmptyGalleryState = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-[var(--color-border-primary)]">
      <span className="text-2xl">📝</span>
    </div>
    
    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 font-outfit">
      {onGetStarted ? "Ready to build great habits?" : "No Habits Yet"}
    </h3>
    
    <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs font-outfit">
      {onGetStarted 
        ? "Start tracking your daily habits and build consistency. Add your first habit to get started!"
        : "This member hasn't added any habits yet."
      }
    </p>
    
    {onGetStarted && (
      <button
        onClick={onGetStarted}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-all duration-200 font-outfit text-sm"
      >
        <PlusIcon className="w-4 h-4" />
        Add Your First Habit
      </button>
    )}
    
    <div className="mt-8 text-xs text-[var(--color-text-tertiary)] space-y-1 font-outfit">
      {onGetStarted && <p>💡 Try habits like "Drink 8 glasses of water" or "Read for 30 minutes"</p>}
    </div>
  </div>
);

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
  showAddForm,
  setShowAddForm,
  newHabitName,
  setNewHabitName,
  handleAddHabit,
  handleCancelAdd,
  handleEditHabit, // Add edit handler
  readOnly = false, // Add readOnly prop
}) => {
  // Show empty state if no habits exist
  if (!displayHabits || displayHabits.length === 0) {
    return (
      <EmptyGalleryState onGetStarted={readOnly ? null : () => setShowAddForm(true)} />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Week Progress Overview */}
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 font-outfit">
          Week Overview
        </h3>        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => {
            const dayCompletion = getDayCompletion(day);
            
            // Find the actual date for this day and compare with today's date
            const dayInfo = getCurrentWeekDates?.find((d) => d.day === day);
            // Get today's date in local timezone (YYYY-MM-DD format)
            const today = new Date();
            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
      <div className="grid gap-4" style={{
        gridTemplateColumns: breakpoint === "xs" 
          ? "1fr" 
          : breakpoint === "sm" 
          ? "repeat(auto-fit, minmax(280px, 1fr))"
          : "repeat(auto-fit, minmax(320px, 1fr))"
      }}>
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
                  {daysOfWeek.filter(day => getCompletionStatus(day, habit.id)).length}/{daysOfWeek.length} days this week
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

            {/* Daily Checkboxes */}            <div className="grid grid-cols-7 gap-2">              {daysOfWeek.map((day) => {
                const isCompleted = getCompletionStatus(day, habit.id);
                
                // Find the actual date for this day and compare with today's date
                const dayInfo = getCurrentWeekDates?.find((d) => d.day === day);
                // Get today's date in local timezone (YYYY-MM-DD format)
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isToday = dayInfo?.date === todayString;

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
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1 font-outfit">
                <span>Weekly Progress</span>
                <span>
                  {daysOfWeek.filter(day => getCompletionStatus(day, habit.id)).length}/{daysOfWeek.length}
                </span>
              </div>
              <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: habit.color,
                    width: `${(daysOfWeek.filter(day => getCompletionStatus(day, habit.id)).length / daysOfWeek.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add New Habit Card */}
        {showAddForm ? (
          <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)] border-dashed">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit">
                Add New Habit
              </h4>
              <input
                type="text"
                id="new-habit-name"
                name="newHabitName"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Enter habit name..."
                className="w-full px-3 py-2 text-sm border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/50 focus:border-[var(--color-brand-400)] font-outfit"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddHabit();
                  } else if (e.key === "Escape") {
                    handleCancelAdd();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddHabit}
                  disabled={!newHabitName.trim()}
                  className="flex-1 px-3 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:bg-[var(--color-text-tertiary)] disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200 font-outfit"
                >
                  Add Habit
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="px-3 py-2 border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium transition-all duration-200 font-outfit"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => !readOnly && setShowAddForm(true)}
            disabled={readOnly}
            className={`bg-[var(--color-surface-elevated)] rounded-lg p-4 border border-[var(--color-border-primary)] transition-all duration-200 group ${
              readOnly
                ? "border-dashed cursor-not-allowed opacity-60"
                : "border-dashed hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-500)]/5"
            }`}
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
