import React, { memo, useMemo } from "react";
import CATEGORY_META from "../../data/categoryMeta";
import { Fire } from "@phosphor-icons/react";

/**
 * HabitLedgerRow — a single row in the Habits "Ledger" index view.
 * Mono № + serif name + freq/streak telemetry + completion meter + status.
 * Hairline ledger rows; per-habit colour drives the meter/streak.
 */
const HabitLedgerRow = memo(({ habit, number, onSelect }) => {
  const cat = CATEGORY_META[habit.category] || CATEGORY_META.custom;
  const isArchived = habit.isArchived;
  const accentColor = habit.color || cat.accent || "var(--signal)";

  const pct = useMemo(() => {
    const rate = habit.stats?.completionRate;
    return rate != null ? Math.round(rate) : 0;
  }, [habit.stats?.completionRate]);

  const freqLabel = useMemo(() => {
    if (habit.frequency === "daily") return "Daily";
    if (habit.frequency === "weekly") return `${habit.weeklyTarget || 3}×/wk`;
    if (habit.frequency === "monthly") return "Monthly";
    return "—";
  }, [habit.frequency, habit.weeklyTarget]);

  const streak = habit.stats?.currentStreak || 0;

  return (
    <button
      onClick={() => onSelect(habit)}
      className={`group w-full text-left flex items-center gap-3 px-3 py-3 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors ${
        isArchived ? "opacity-50" : ""
      }`}
    >
      {/* № */}
      <span className="std-mono text-[11px] tabular-nums text-[var(--ink-3)] w-9 flex-shrink-0">
        №{number != null ? String(number).padStart(2, "0") : "—"}
      </span>

      {/* Name */}
      <span className="std-display text-[15px] font-semibold text-[var(--ink)] truncate flex-1 min-w-0">
        {habit.name}
      </span>

      {/* Freq */}
      <span className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)] w-16 text-right hidden sm:block flex-shrink-0">
        {freqLabel}
      </span>

      {/* Streak */}
      <span
        className="std-mono text-[11px] tabular-nums w-14 text-right hidden sm:flex items-center justify-end gap-1 flex-shrink-0"
        style={{ color: streak > 0 ? accentColor : "var(--ink-3)" }}
      >
        {streak > 0 ? (<><Fire size={11} weight="fill" /> {streak}d</>) : "—"}
      </span>

      {/* Completion meter */}
      <div className="w-24 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--line-2)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: isArchived ? "var(--line-2)" : accentColor }}
          />
        </div>
        <span className="std-num text-[13px] tabular-nums text-[var(--ink)] w-7 text-right">{pct}</span>
      </div>

      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: isArchived ? "var(--line-2)" : "var(--signal)" }}
        title={isArchived ? "Archived" : "Active"}
      />
    </button>
  );
});

HabitLedgerRow.displayName = "HabitLedgerRow";
export default HabitLedgerRow;
