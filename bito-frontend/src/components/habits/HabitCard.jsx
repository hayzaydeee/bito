import React, { memo, useMemo } from "react";
import ProgressRing from "../shared/ProgressRing";
import CATEGORY_META from "../../data/categoryMeta";

/**
 * HabitCard — minimal, premium card for the habits grid.
 * Icon, name, frequency, progress ring, streak. Nothing more.
 */
const HabitCard = memo(({ habit, onClick }) => {
  const cat = CATEGORY_META[habit.category] || CATEGORY_META.custom;
  const isArchived = habit.isArchived;
  const accentColor = habit.color || cat.accent || "var(--color-brand-500)";

  const completionPct = useMemo(() => {
    const rate = habit.stats?.completionRate;
    return rate != null ? Math.round(rate * 100) : 0;
  }, [habit.stats?.completionRate]);

  const freqLabel = useMemo(() => {
    if (habit.frequency === "daily") return "Daily";
    if (habit.frequency === "weekly") return `${habit.weeklyTarget || 3}×/wk`;
    if (habit.frequency === "monthly") return "Monthly";
    return "";
  }, [habit.frequency, habit.weeklyTarget]);

  return (
    <button
      onClick={() => onClick(habit)}
      className={`habit-card group relative rounded-2xl overflow-hidden text-left w-full transition-all ${
        isArchived ? "opacity-50" : ""
      }`}
    >
      {/* Accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: isArchived ? "var(--color-surface-hover)" : accentColor }}
      />

      <div className="p-4 flex items-center gap-3.5">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${accentColor}12` }}
        >
          {habit.icon || cat.icon || "🎯"}
        </div>

        {/* Name + frequency */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
            {habit.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {freqLabel && (
              <span className="text-[11px] font-spartan text-[var(--color-text-tertiary)]">
                {freqLabel}
              </span>
            )}
            {habit.stats?.currentStreak > 0 && (
              <span
                className="text-[11px] font-spartan font-semibold tabular-nums"
                style={{ color: accentColor }}
              >
                🔥 {habit.stats.currentStreak}d
              </span>
            )}
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <ProgressRing
            value={completionPct}
            size={38}
            stroke={3}
            color={accentColor}
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-[10px] font-spartan font-bold tabular-nums text-[var(--color-text-tertiary)]"
          >
            {completionPct > 0 ? `${completionPct}` : ""}
          </span>
        </div>
      </div>
    </button>
  );
});

HabitCard.displayName = "HabitCard";
export default HabitCard;
