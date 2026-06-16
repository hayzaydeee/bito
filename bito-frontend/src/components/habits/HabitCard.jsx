import React, { memo, useMemo } from "react";
import ProgressRing from "../shared/ProgressRing";
import CATEGORY_META from "../../data/categoryMeta";
import HabitIcon from "../shared/HabitIcon";
import { Fire } from "@phosphor-icons/react";

/**
 * HabitCard — DRILL gallery card ("The Roster").
 * Per-habit colour spine + icon as identity; serif name, mono telemetry,
 * progress ring. std-card editorial frame.
 */
const HabitCard = memo(({ habit, onClick }) => {
  const cat = CATEGORY_META[habit.category] || CATEGORY_META.custom;
  const isArchived = habit.isArchived;
  const accentColor = habit.color || cat.accent || "var(--signal)";

  const completionPct = useMemo(() => {
    const rate = habit.stats?.completionRate;
    return rate != null ? Math.round(rate) : 0;
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
      className={`std-card std-card-hover group relative w-full text-left overflow-hidden p-0 flex ${
        isArchived ? "opacity-50" : ""
      }`}
    >
      {/* Colour spine — habit identity */}
      <span
        className="w-1 self-stretch flex-shrink-0"
        style={{ background: isArchived ? "var(--line-2)" : accentColor }}
      />

      <div className="flex-1 min-w-0 p-4 flex items-center gap-3.5">
        {/* Icon tile */}
        <div
          className="w-10 h-10 rounded-[var(--r-btn)] flex items-center justify-center flex-shrink-0"
          style={{ background: `color-mix(in srgb, ${accentColor} 14%, transparent)` }}
        >
          <HabitIcon icon={habit.icon || cat.icon || "Target"} size={20} color={accentColor} />
        </div>

        {/* Name + telemetry */}
        <div className="flex-1 min-w-0">
          <p className="std-display text-[15px] font-bold text-[var(--ink)] truncate">
            {habit.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {freqLabel && (
              <span className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                {freqLabel}
              </span>
            )}
            {habit.stats?.currentStreak > 0 && (
              <span
                className="inline-flex items-center gap-0.5 std-mono text-[10px] tabular-nums"
                style={{ color: accentColor }}
              >
                <Fire size={11} weight="fill" /> {habit.stats.currentStreak}d
              </span>
            )}
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <ProgressRing value={completionPct} size={38} stroke={3} color={accentColor} />
          <span className="absolute inset-0 flex items-center justify-center std-num text-[11px] tabular-nums text-[var(--ink-2)]">
            {completionPct > 0 ? `${completionPct}` : ""}
          </span>
        </div>
      </div>
    </button>
  );
});

HabitCard.displayName = "HabitCard";
export default HabitCard;
