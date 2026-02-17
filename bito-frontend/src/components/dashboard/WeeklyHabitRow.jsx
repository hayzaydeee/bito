import React, { memo, useState, useCallback } from "react";
import { CheckIcon, Pencil1Icon } from "@radix-ui/react-icons";

/* ─── Segmented progress dots ─── */
const ProgressDots = memo(({ completed, target }) => {
  const cappedCompleted = Math.min(completed, target);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: target }, (_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: i < cappedCompleted
              ? "var(--color-brand-500)"
              : "var(--color-surface-hover)",
            boxShadow: i < cappedCompleted
              ? "0 0 4px var(--color-glow)"
              : "none",
          }}
        />
      ))}
      {completed > target && (
        <span
          className="text-[10px] font-spartan font-bold ml-0.5"
          style={{ color: "var(--color-success, #10b981)" }}
        >
          +{completed - target}
        </span>
      )}
    </div>
  );
});

/* ─── Single weekly habit row ─── */
const WeeklyHabitRow = memo(({ habit, weekProgress, isTodayCompleted, onToggle, onEdit }) => {
  const [animating, setAnimating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const { completed, target, met } = weekProgress;

  const handleToggle = useCallback(() => {
    setAnimating(true);
    if (!isTodayCompleted) setJustCompleted(true);
    onToggle(habit._id);
    setTimeout(() => {
      setAnimating(false);
      setJustCompleted(false);
    }, 400);
  }, [habit._id, onToggle, isTodayCompleted]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group"
      style={{
        backgroundColor: met
          ? "rgba(16,185,129,0.04)"
          : "var(--color-surface-primary)",
        borderColor: met
          ? "rgba(16,185,129,0.2)"
          : "var(--color-border-primary)",
      }}
    >
      {/* Checkbox (today's check) */}
      <button
        onClick={handleToggle}
        className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: isTodayCompleted
            ? "var(--color-brand-500)"
            : "var(--color-border-secondary)",
          backgroundColor: isTodayCompleted
            ? "var(--color-brand-500)"
            : "transparent",
          transform: animating ? "scale(1.2)" : "scale(1)",
        }}
        aria-label={isTodayCompleted ? `Uncheck ${habit.name}` : `Check ${habit.name}`}
      >
        {isTodayCompleted && (
          <CheckIcon
            className={`w-3.5 h-3.5 text-white ${justCompleted ? 'check-bounce' : ''}`}
          />
        )}
      </button>

      {/* Icon */}
      <span className="text-lg flex-shrink-0">{habit.icon || "🎯"}</span>

      {/* Name + progress */}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-spartan font-medium block truncate"
          style={{
            color: met
              ? "var(--color-text-tertiary)"
              : "var(--color-text-primary)",
          }}
        >
          {habit.name}
        </span>

        <div className="flex items-center gap-2 mt-0.5">
          <ProgressDots completed={completed} target={target} />
          <span
            className="text-[11px] font-spartan tabular-nums"
            style={{ color: met ? "var(--color-success, #10b981)" : "var(--color-text-tertiary)" }}
          >
            {met
              ? (completed > target
                ? `✓ ${completed}/${target} — exceeding target!`
                : "✓ done this week")
              : `${completed}/${target} this week`}
          </span>
        </div>
      </div>

      {/* Edit icon */}
      <button
        onClick={() => onEdit(habit)}
        className="opacity-100 transition-opacity p-1 rounded-md"
        style={{ color: "var(--color-text-secondary)" }}
        aria-label={`Edit ${habit.name}`}
      >
        <Pencil1Icon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

ProgressDots.displayName = "ProgressDots";
WeeklyHabitRow.displayName = "WeeklyHabitRow";
export default WeeklyHabitRow;
