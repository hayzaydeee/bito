import React, { memo, useState, useCallback } from "react";
import { CheckIcon, Pencil1Icon } from "@radix-ui/react-icons";
import HabitIcon from "../shared/HabitIcon";

/* ─── Segmented progress dots (DRILL — signal fill) ─── */
const ProgressDots = memo(({ completed, target }) => {
  const cappedCompleted = Math.min(completed, target);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: target }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            backgroundColor: i < cappedCompleted ? "var(--signal)" : "var(--line-2)",
          }}
        />
      ))}
      {completed > target && (
        <span className="std-mono text-[10px] font-bold ml-0.5 text-[var(--signal)]">
          +{completed - target}
        </span>
      )}
    </div>
  );
});

/* ─── Single weekly habit row (DRILL hairline row) ─── */
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
      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)] last:border-b-0 transition-all duration-200 group hover:bg-[var(--surface-2)]"
    >
      {/* Checkbox (today's check) */}
      <button
        onClick={handleToggle}
        className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: isTodayCompleted ? "var(--signal)" : "var(--line-2)",
          backgroundColor: isTodayCompleted ? "var(--signal)" : "transparent",
          transform: animating ? "scale(1.2)" : "scale(1)",
        }}
        aria-label={isTodayCompleted ? `Uncheck ${habit.name}` : `Check ${habit.name}`}
      >
        {isTodayCompleted && (
          <CheckIcon className={`w-3.5 h-3.5 text-[var(--signal-ink)] ${justCompleted ? "check-bounce" : ""}`} />
        )}
      </button>

      {/* Icon */}
      <span className="flex-shrink-0"><HabitIcon icon={habit.icon || "Target"} size={20} /></span>

      {/* Name + progress */}
      <div className="flex-1 min-w-0">
        <span
          className="std-display text-[15px] font-semibold block truncate"
          style={{ color: met ? "var(--ink-3)" : "var(--ink)" }}
        >
          {habit.name}
        </span>

        <div className="flex items-center gap-2 mt-1">
          <ProgressDots completed={completed} target={target} />
          <span
            className="std-mono text-[10px] tabular-nums uppercase tracking-wide"
            style={{ color: met ? "var(--signal)" : "var(--ink-3)" }}
          >
            {met
              ? (completed > target ? `${completed}/${target} · over target` : "done this week")
              : `${completed}/${target} this week`}
          </span>
        </div>
      </div>

      {/* Edit icon */}
      <button
        onClick={() => onEdit(habit)}
        className="opacity-40 group-hover:opacity-100 transition-opacity p-1 rounded-md text-[var(--ink-2)]"
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
