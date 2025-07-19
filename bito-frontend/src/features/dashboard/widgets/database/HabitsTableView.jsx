import React from "react";
import { TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";

const HabitsTableView = ({ 
  displayHabits = [], 
  handleEditHabit, 
  handleDeleteHabit, 
  readOnly = false 
}) => {
  if (!displayHabits || displayHabits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)] font-outfit">
          No habits to manage yet.
        </p>
      </div>
    );
  }

  const handleEdit = (habit) => {
    if (handleEditHabit && !readOnly) {
      handleEditHabit(habit);
    }
  };

  const handleDelete = (habit) => {
    if (handleDeleteHabit && !readOnly) {
      if (window.confirm(`Are you sure you want to delete "${habit.name}"?`)) {
        handleDeleteHabit(habit._id || habit.id);
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border-secondary)]">
      <table className="w-full">
        <thead className="bg-[var(--color-surface-secondary)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-outfit font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Habit Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-outfit font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-outfit font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Color
            </th>
            {!readOnly && (
              <th className="px-4 py-3 text-right text-xs font-outfit font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-[var(--color-surface-primary)] divide-y divide-[var(--color-border-secondary)]">
          {displayHabits.map((habit) => (
            <tr 
              key={habit._id || habit.id} 
              className="hover:bg-[var(--color-surface-hover)] transition-colors duration-150"
            >
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-outfit font-medium text-[var(--color-text-primary)]">
                  {habit.name}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm font-outfit text-[var(--color-text-secondary)] max-w-xs truncate">
                  {habit.description || "No description"}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-[var(--color-border-secondary)]"
                    style={{ backgroundColor: habit.color || '#6366f1' }}
                  />
                  <span className="text-xs font-outfit text-[var(--color-text-secondary)]">
                    {habit.color || '#6366f1'}
                  </span>
                </div>
              </td>
              {!readOnly && (
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(habit)}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-brand-500)] hover:bg-[var(--color-surface-secondary)] rounded-lg transition-all duration-200"
                      title="Edit habit"
                    >
                      <Pencil1Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(habit)}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete habit"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { HabitsTableView };
