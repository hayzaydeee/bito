import React, { memo, useState, useCallback } from "react";
import { CheckIcon, Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "@phosphor-icons/react";
import WeeklyHabitRow from "./WeeklyHabitRow";
import { habitUtils } from "../../utils/habitLogic";
import { springs } from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";
import HabitIcon from "../shared/HabitIcon";

/* ─── Single habit row ─── */
const HabitRow = memo(({ habit, isCompleted, onToggle, onEdit }) => {
  const [animating, setAnimating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const { shouldAnimate } = useMotionSafe();

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
    <motion.div
      layout={shouldAnimate}
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldAnimate ? { opacity: 0, x: -20, transition: { duration: 0.2 } } : undefined}
      transition={springs.soft}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-200 group"
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
        <AnimatePresence mode="wait">
          {isCompleted && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={springs.bouncy}
            >
              <CheckIcon className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Icon */}
      <span className="flex-shrink-0"><HabitIcon icon={habit.icon || "Star"} size={20} /></span>

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
      {/* <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: habit.color || "var(--color-brand-500)" }}
      /> */}

      {/* Edit icon — always visible, brighter on hover */}
      <button
        onClick={() => onEdit(habit)}
        data-tour="habit-edit"
        className="opacity-100 transition-opacity p-1 rounded-md"
        style={{ color: "var(--color-text-secondary)" }}
        aria-label={`Edit ${habit.name}`}
      >
        <Pencil1Icon className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
});

/* ─── Today's Habits list ─── */
const TodayHabits = memo(
  ({ habits, entries, onToggle, onEdit, onAdd, weeklyHabits = [] }) => {
    const todayStr = new Date().toISOString().split("T")[0];

    if (habits.length === 0 && weeklyHabits.length === 0) {
      return (
        <div className="text-center py-10">
          <div className="flex justify-center mb-3">
            <Leaf size={40} weight="duotone" className="text-green-400" />
          </div>
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
          <button onClick={onAdd} className="btn btn-primary btn-sm" data-tour="habit-add">
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

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-garamond font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Today
          </h2>
          <button
              onClick={onAdd}
              data-tour="habit-add"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-spartan font-semibold transition-all duration-200 active:scale-95"
              style={{
                color: "white",
                backgroundColor: "var(--color-brand-500)",
                boxShadow: "0 1px 4px var(--color-glow)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-brand-600)";
                e.currentTarget.style.boxShadow = "0 2px 8px var(--color-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-brand-500)";
                e.currentTarget.style.boxShadow = "0 1px 4px var(--color-glow)";
              }}
              aria-label="Add habit"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add Habit
            </button>
        </div>

        {/* Daily habits */}
        {sortedHabits.length > 0 && (
          <div
            className={
              sortedHabits.length > 6
                ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
                : "space-y-2"
            }
          >
            <AnimatePresence mode="popLayout">
            {sortedHabits.map((habit) => {
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
            </AnimatePresence>
          </div>
        )}

        {/* Weekly habits section */}
        {weeklyHabits.length > 0 && (
          <div className="mt-4">
            <h3
              className="text-xs font-spartan font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              This Week
            </h3>
            <div className="space-y-2">
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
