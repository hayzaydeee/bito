import React, { memo, useState, useCallback } from "react";
import { CheckIcon, Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "@phosphor-icons/react";
import WeeklyHabitRow from "./WeeklyHabitRow";
import { habitUtils } from "../../utils/habitLogic";
import { springs } from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";
import HabitIcon from "../shared/HabitIcon";

/* ─────────────────────────────────────────────
   TodayHabits — DRILL today ledger (two voices)
   · daybook  → serif checklist, hairline rows
   · control  → mono № index rows
   ───────────────────────────────────────────── */

/* ─── Single habit row ─── */
const HabitRow = memo(({ habit, isCompleted, onToggle, onEdit, variant, number }) => {
  const [animating, setAnimating] = useState(false);
  const { shouldAnimate } = useMotionSafe();
  const isControl = variant === "control";

  const handleToggle = useCallback(() => {
    setAnimating(true);
    onToggle(habit._id);
    setTimeout(() => setAnimating(false), 400);
  }, [habit._id, onToggle]);

  return (
    <motion.div
      layout={shouldAnimate}
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldAnimate ? { opacity: 0, x: -20, transition: { duration: 0.2 } } : undefined}
      transition={springs.soft}
      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)] last:border-b-0 transition-colors duration-200 group hover:bg-[var(--surface-2)]"
    >
      {/* Control № index */}
      {isControl && (
        <span className="std-mono text-[11px] tabular-nums text-[var(--ink-3)] w-6 flex-shrink-0">
          {String(number).padStart(2, "0")}
        </span>
      )}

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: isCompleted ? "var(--signal)" : "var(--line-2)",
          backgroundColor: isCompleted ? "var(--signal)" : "transparent",
          transform: animating ? "scale(1.2)" : "scale(1)",
        }}
        aria-label={isCompleted ? `Uncheck ${habit.name}` : `Check ${habit.name}`}
      >
        <AnimatePresence mode="wait">
          {isCompleted && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={springs.bouncy}
            >
              <CheckIcon className="w-3.5 h-3.5 text-[var(--signal-ink)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Icon */}
      <span className="flex-shrink-0"><HabitIcon icon={habit.icon || "Star"} size={20} /></span>

      {/* Name + target */}
      <div className="flex-1 min-w-0">
        <span
          className={`${isControl ? "text-sm font-medium" : "std-display text-[15px] font-semibold"} block truncate transition-colors duration-200`}
          style={{
            color: isCompleted ? "var(--ink-3)" : "var(--ink)",
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {habit.name}
        </span>
        {habit.target && habit.target.value > 1 && (
          <span className="std-mono text-[10px] text-[var(--ink-3)]">
            {habit.target.value} {habit.target.unit}
          </span>
        )}
      </div>

      {/* Edit icon */}
      <button
        onClick={() => onEdit(habit)}
        data-tour="habit-edit"
        className="opacity-40 group-hover:opacity-100 transition-opacity p-1 rounded-md text-[var(--ink-2)]"
        aria-label={`Edit ${habit.name}`}
      >
        <Pencil1Icon className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
});

/* ─── Today's Habits list ─── */
const TodayHabits = memo(
  ({ habits, entries, onToggle, onEdit, onAdd, weeklyHabits = [], variant = "daybook" }) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isControl = variant === "control";

    if (habits.length === 0 && weeklyHabits.length === 0) {
      return (
        <div className="std-card text-center py-10 px-6">
          <div className="flex justify-center mb-3">
            <Leaf size={36} weight="duotone" className="text-[var(--ink-3)]" />
          </div>
          <h3 className="std-display text-base font-bold mb-1 text-[var(--ink)]">
            No habits scheduled today
          </h3>
          <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)] mb-4">
            Add your first habit to begin
          </p>
          <button onClick={onAdd} className="std-btn std-btn--signal std-btn--sm" data-tour="habit-add">
            Add a habit
          </button>
        </div>
      );
    }

    // Separate completed & pending daily habits, pending first
    const pending = habits.filter((h) => {
      const entry = entries[h._id]?.[todayStr];
      return !(entry && entry.completed);
    });
    const done = habits.filter((h) => {
      const entry = entries[h._id]?.[todayStr];
      return entry && entry.completed;
    });
    const sortedHabits = [...pending, ...done];
    const completedCount = done.length;

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          {isControl ? (
            <h2 className="std-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-2)]">
              Today · <span className="text-[var(--signal)] tabular-nums">{completedCount}/{habits.length}</span>
            </h2>
          ) : (
            <h2 className="std-display text-lg font-bold text-[var(--ink)]">Today</h2>
          )}
          <button
            onClick={onAdd}
            data-tour="habit-add"
            className="std-btn std-btn--signal std-btn--sm flex items-center gap-1.5"
            aria-label="Add habit"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add Habit
          </button>
        </div>

        {/* Daily habits */}
        {sortedHabits.length > 0 && (
          <div className="std-card overflow-hidden p-0">
            <AnimatePresence mode="popLayout">
              {sortedHabits.map((habit, idx) => {
                const entry = entries[habit._id]?.[todayStr];
                const isCompleted = !!(entry && entry.completed);
                return (
                  <HabitRow
                    key={habit._id}
                    habit={habit}
                    isCompleted={isCompleted}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    variant={variant}
                    number={idx + 1}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Weekly habits section */}
        {weeklyHabits.length > 0 && (
          <div className="mt-5">
            <h3 className="std-kicker mb-2">This Week</h3>
            <div className="std-card overflow-hidden p-0">
              {weeklyHabits.map((habit) => {
                const weekProgress = habitUtils.getWeeklyProgress(habit, entries);
                const entry = entries[habit._id]?.[todayStr];
                const isTodayCompleted = !!(entry && entry.completed);
                return (
                  <WeeklyHabitRow
                    key={habit._id}
                    habit={habit}
                    weekProgress={weekProgress}
                    isTodayCompleted={isTodayCompleted}
                    onToggle={onToggle}
                    onEdit={onEdit}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

HabitRow.displayName = "HabitRow";
TodayHabits.displayName = "TodayHabits";
export default TodayHabits;
