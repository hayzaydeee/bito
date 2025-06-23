import React, { useMemo, useState } from "react";
import { PlusIcon, CheckIcon } from "@radix-ui/react-icons";
import useHabitStore from "../../../../store/habitStore.js";
import { habitUtils } from "../../../../utils/habitLogic.js";

/**
 * Empty State Component for Gallery View
 */
const EmptyGalleryState = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-[var(--color-border-primary)]">
      <span className="text-2xl">📝</span>
    </div>
    
    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 font-outfit">
      Ready to build great habits?
    </h3>
    
    <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs font-outfit">
      Start tracking your daily habits and build consistency. Add your first habit to get started!
    </p>
    
    <button
      onClick={onGetStarted}
      className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-all duration-200 font-outfit text-sm"
    >
      <PlusIcon className="w-4 h-4" />
      Add Your First Habit
    </button>
    
    <div className="mt-8 text-xs text-[var(--color-text-tertiary)] space-y-1 font-outfit">
      <p>💡 Try habits like "Drink 8 glasses of water" or "Read for 30 minutes"</p>
    </div>
  </div>
);

/**
 * Gallery View Component - Card-based layout for habits (V2 with Zustand)
 */
export const GalleryViewV2 = ({ 
  startDate,
  endDate = null,
  breakpoint,
  className = "",
  showStats = true,
  showHeader = true
}) => {
  // Use individual selectors to avoid infinite loops
  const habitsMap = useHabitStore(state => state.habits);
  const completions = useHabitStore(state => state.completions);
  const toggleCompletion = useHabitStore(state => state.toggleCompletion);
  const addHabit = useHabitStore(state => state.addHabit);
  
  // Memoize the habits array conversion
  const habits = useMemo(() => Array.from(habitsMap.values()), [habitsMap]);
    const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");

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
    };  }, [memoizedStartDate, endDate]); // Same dependencies as HabitGrid

  // DEBUG: Log data to compare views
  // console.log('GalleryView - Habits count:', habits.length);
  // console.log('GalleryView - Habits:', habits.map(h => ({ id: h.id, name: h.name })));
  // console.log('GalleryView - Completions size:', completions.size);
  // console.log('GalleryView - Sample completions:', Array.from(completions.keys()).slice(0, 5));
  // console.log('GalleryView - Week dates:', weekDates.map(d => d.date));

  // Helper functions
  const getCompletionStatus = (day, habitId) => {
    const dayInfo = weekDates.find(d => d.dayName === day);
    if (!dayInfo) return false;
    return completions.has(`${dayInfo.date}_${habitId}`);
  };

  const getDayCompletion = (day) => {
    if (habits.length === 0) return 0;
    const completedCount = habits.filter(habit => getCompletionStatus(day, habit.id)).length;
    return Math.round((completedCount / habits.length) * 100);
  };

  const handleToggleCompletion = (day, habitId) => {
    const dayInfo = weekDates.find(d => d.dayName === day);
    if (!dayInfo) return;
    toggleCompletion(habitId, dayInfo.date);
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    
    const newHabit = {
      name: newHabitName.trim(),
      color: '#3B82F6', // Default blue color
      icon: '⭐', // Default icon
    };
    
    addHabit(newHabit);
    setNewHabitName("");
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setNewHabitName("");
    setShowAddForm(false);
  };

  // Show empty state if no habits exist
  if (!habits || habits.length === 0) {
    return (
      <EmptyGalleryState onGetStarted={() => setShowAddForm(true)} />
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
          {weekDates.map((dayInfo) => {
            const dayCompletion = getDayCompletion(dayInfo.dayName);
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
                    dayCompletion === 100
                      ? "text-[var(--color-success)]"
                      : dayCompletion > 0
                      ? "text-[var(--color-warning)]"
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
        {habits.map((habit) => (
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
                </h4>                <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                  {weekDates.filter(day => getCompletionStatus(day.dayName, habit.id)).length}/{weekDates.length} days this week
                </p>
              </div>
            </div>            {/* Daily Checkboxes */}
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((dayInfo) => {
                const isCompleted = getCompletionStatus(dayInfo.dayName, habit.id);
                const isToday = dayInfo.isToday;

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
                    <button
                      onClick={() => handleToggleCompletion(dayInfo.dayName, habit.id)}
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
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1 font-outfit">
                <span>Weekly Progress</span>
                <span>
                  {weekDates.filter(day => getCompletionStatus(day.dayName, habit.id)).length}/{weekDates.length}
                </span>
              </div>
              <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: habit.color,
                    width: `${(weekDates.filter(day => getCompletionStatus(day.dayName, habit.id)).length / weekDates.length) * 100}%`,
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
            onClick={() => setShowAddForm(true)}
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
