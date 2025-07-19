import React from "react";
import { useHabits } from "../../../../contexts/HabitContext";
import { EmptyStateWithAddHabit } from "../../../HabitGrid/EmptyStateWithAddHabit.jsx";

/**
 * GalleryView (V1) - Original working version
 * 
 * This is the original gallery view that was working correctly.
 * It uses HabitContext directly and has simpler logic.
 */
export const GalleryView = ({ 
  startDate, 
  endDate, 
  onAddHabit = null, 
  onEditHabit = null,
  readOnly = false 
}) => {
  const { habits, entries, isLoading } = useHabits();

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-[var(--color-text-secondary)]">Loading habits...</p>
        </div>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return <EmptyStateWithAddHabit className="w-full h-full" onAddHabit={readOnly ? null : onAddHabit} />;
  }

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => (
          <div
            key={habit._id || habit.id}
            className="p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border-primary)] hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: habit.color }}
              >
                {habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                  {habit.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] truncate">
                  {habit.description || habit.category || 'No description'}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="text-xs text-[var(--color-text-tertiary)] mb-3">
              <div className="flex justify-between">
                <span>Streak: {habit.currentStreak || 0} days</span>
                <span>Total: {habit.totalCompletions || 0}</span>
              </div>
            </div>

            {/* Actions */}
            {!readOnly && (
              <div className="flex gap-2">
                <button
                  onClick={() => onEditHabit && onEditHabit(habit)}
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border-primary)] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    // Quick completion for today
                    const today = new Date().toISOString().split('T')[0];
                    // This would need to be connected to the toggle completion handler
                    console.log('Toggle completion for:', habit._id || habit.id, today);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded transition-colors"
                >
                  Mark Done
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
