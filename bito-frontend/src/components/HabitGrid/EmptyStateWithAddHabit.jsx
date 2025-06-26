import React, { useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { useHabits } from "../../contexts/HabitContext";

/**
 * Shared Empty State Component with Add Habit functionality
 * Used by both Gallery and Table views
 */
export const EmptyStateWithAddHabit = ({ className = "" }) => {
  const { createHabit } = useHabits();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    
    const newHabit = {
      name: newHabitName.trim(),
      color: '#3B82F6', // Use a standard hex color instead of CSS variable
      icon: '⭐', // Default icon
    };
    
    try {
      const result = await createHabit(newHabit);
      if (result.success) {
        setNewHabitName("");
        setShowAddForm(false);
      } else {
        console.error('Failed to create habit:', result.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      // TODO: Show error message to user
    }
  };

  const handleCancelAdd = () => {
    setNewHabitName("");
    setShowAddForm(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddHabit();
    } else if (e.key === "Escape") {
      handleCancelAdd();
    }
  };

  if (showAddForm) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
        <div className="w-full max-w-md space-y-4">
          <div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-[var(--color-border-primary)]">
            <span className="text-2xl">📝</span>
          </div>
          
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 font-outfit">
            Add Your First Habit
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Enter habit name..."
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/50 focus:border-[var(--color-brand-400)] font-outfit"
              autoFocus
              onKeyPress={handleKeyPress}
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
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
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
        onClick={() => setShowAddForm(true)}
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
};
