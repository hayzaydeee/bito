import { useState, useCallback } from "react";

/**
 * Custom hook for managing habit CRUD operations
 */
export const useHabitActions = ({ 
  onToggleCompletion, 
  onAddHabit, 
  onDeleteHabit, 
  onEditHabit,
  dateRange = null 
}) => {
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Helper to convert day name to date within the current date range
  const getDayDate = useCallback((dayName) => {
    if (!dateRange || !dateRange.start) {
      // Fallback to current week logic
      const today = new Date();
      const currentDay = today.getDay();
      const startOfWeek = new Date(today);
      const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
      startOfWeek.setDate(today.getDate() - daysToSubtract);
      
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayIndex = daysOfWeek.indexOf(dayName);
      
      if (dayIndex >= 0) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + dayIndex);
        return date.toISOString().split('T')[0];
      }
      return null;
    }

    // Use the provided date range
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayIndex = daysOfWeek.indexOf(dayName);
    
    if (dayIndex >= 0) {
      const current = new Date(dateRange.start);
      while (current <= dateRange.end) {
        const currentDayName = current.toLocaleDateString('en-US', { weekday: 'long' });
        if (currentDayName === dayName) {
          return current.toISOString().split('T')[0];
        }
        current.setDate(current.getDate() + 1);
      }
    }
    
    return null;
  }, [dateRange]);

  // Handle completion toggle
  const handleToggleCompletion = useCallback(
    (day, habitId, displayCompletions) => {
      // Convert day name to date if we have a date range
      const dateStr = getDayDate(day);
      
      // Create the appropriate key - prefer date-based keys when available
      const key = dateStr ? `${dateStr}-${habitId}` : `${day}-${habitId}`;
      
      if (onToggleCompletion) {
        onToggleCompletion(key, !displayCompletions[key]);
      }
    },
    [onToggleCompletion, getDayDate]
  );

  // Handle adding new habit
  const handleAddHabit = useCallback(() => {
    if (newHabitName.trim()) {
      const newHabit = {
        id: Date.now(),
        name: newHabitName.trim(),
        color: "#6366f1",
        icon: "✨",
      };
      if (onAddHabit) {
        onAddHabit(newHabit);
      }
      setNewHabitName("");
      setShowAddForm(false);
    }
  }, [newHabitName, onAddHabit]);

  // Handle canceling add form
  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
    setNewHabitName("");
  }, []);

  // Handle editing habit
  const handleEditHabit = useCallback((habit) => {
    setEditingHabit(habit);
  }, []);

  // Handle deleting habit
  const handleDeleteHabit = useCallback(
    (habitId) => {
      if (onDeleteHabit) {
        onDeleteHabit(habitId);
      }
    },
    [onDeleteHabit]
  );

  return {
    editingHabit,
    setEditingHabit,
    newHabitName,
    setNewHabitName,
    showAddForm,
    setShowAddForm,
    handleToggleCompletion,
    handleAddHabit,
    handleCancelAdd,
    handleEditHabit,
    handleDeleteHabit,
  };
};
