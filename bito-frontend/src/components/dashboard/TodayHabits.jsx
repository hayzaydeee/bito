import React, { memo, useState, useCallback } from "react";
import { CheckIcon, Pencil1Icon } from "@radix-ui/react-icons";

/* ─── Single habit row ─── */
const HabitRow = memo(({ habit, isCompleted, onToggle, onEdit }) => {
  const [animating, setAnimating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const handleToggle = useCallback(() => {
    const wasCompleted = isCompleted;
    setAnimating(true);
    if (!wasCompleted) setJustCompleted(true);
    onToggle(habit._id);
    setTimeout(() => {
      setAnimating(false);
      setJustCompleted(false);
    }, 400);
  }, [habit._id, onToggle, isCompleted]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group"
      style={{
        backgroundColor: isCompleted
          ? "rgba(99,102,241,0.04)"
          : "var(--color-surface-primary)",
        borderColor: isCompleted
          ? "rgba(99,102,241,0.2)"
          : "var(--color-border-primary)",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: isCompleted
            ? "var(--color-brand-500)"
            : "var(--color-border-secondary)",
          backgroundColor: isCompleted
            ? "var(--color-brand-500)"
            : "transparent",
          transform: animating ? "scale(1.2)" : "scale(1)",
        }}
        aria-label={isCompleted ? `Uncheck ${habit.name}` : `Check ${habit.name}`}
      >
        {isCompleted && (
          <CheckIcon
            className={`w-3.5 h-3.5 text-white ${justCompleted ? 'check-bounce' : ''}`}
          />
        )}
      </button>

      {/* Icon */}
      <span className="text-lg flex-shrink-0">{habit.icon || "⭐"}</span>

      {/* Name + target */}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-spartan font-medium block truncate transition-colors duration-200"
          style={{
            color: isCompleted
              ? "var(--color-text-tertiary)"
              : "var(--color-text-primary)",
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {habit.name}
        </span>
        {habit.target && habit.target.value > 1 && (
          <span
            className="text-[11px] font-spartan"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {habit.target.value} {habit.target.unit}
          </span>
        )}
      </div>

      {/* Color dot */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: habit.color || "var(--color-brand-500)" }}
      />

      {/* Edit icon — only visible on hover */}
      <button
        onClick={() => onEdit(habit)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md"
        style={{ color: "var(--color-text-tertiary)" }}
        aria-label={`Edit ${habit.name}`}
      >
        <Pencil1Icon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

/* ─── Today's Habits list ─── */
const TodayHabits = memo(
  ({ habits, entries, onToggle, onEdit, onAdd }) => {
    if (habits.length === 0) {
      return (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🌱</div>
          <h3
            className="text-base font-garamond font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            No habits scheduled today
          </h3>
          <p
            className="text-sm font-spartan mb-4"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Add your first habit to get started.
          </p>
          <button onClick={onAdd} className="btn btn-primary btn-sm">
            Add a habit
          </button>
        </div>
      );
    }

    // Separate completed & pending, pending first
    const pending = habits.filter((h) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const entry = entries[h._id]?.[todayStr];
      return !(entry && entry.completed);
    });
    const done = habits.filter((h) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const entry = entries[h._id]?.[todayStr];
      return entry && entry.completed;
    });
    const sortedHabits = [...pending, ...done];

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-garamond font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Today
          </h2>
          <span
            className="text-xs font-spartan tabular-nums"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {done.length} of {habits.length} done
          </span>
        </div>

        <div className="space-y-2">
          {sortedHabits.map((habit) => {
            const todayStr = new Date().toISOString().split("T")[0];
            const entry = entries[habit._id]?.[todayStr];
            const isCompleted = !!(entry && entry.completed);
            return (
              <HabitRow
                key={habit._id}
                habit={habit}
                isCompleted={isCompleted}
                onToggle={onToggle}
                onEdit={onEdit}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

HabitRow.displayName = "HabitRow";
TodayHabits.displayName = "TodayHabits";
export default TodayHabits;
