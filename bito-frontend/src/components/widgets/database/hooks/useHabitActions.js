import { useState, useCallback } from "react";

/**
 * Custom hook for managing habit CRUD operations
 */
export const useHabitActions = ({ onToggleCompletion, onAddHabit, onDeleteHabit, onEditHabit }) => {
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Handle completion toggle
  const handleToggleCompletion = useCallback(
    (day, habitId, displayCompletions) => {
      const key = `${day}-${habitId}`;
      if (onToggleCompletion) {
        onToggleCompletion(key, !displayCompletions[key]);
      }
    },
    [onToggleCompletion]
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
