import React, { memo } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { Leaf } from "@phosphor-icons/react";

/**
 * HabitsEmptyState — DRILL editorial empty state.
 */
const HabitsEmptyState = memo(({ isFiltered, onCreateHabit }) => {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
        <p className="std-display text-base font-bold text-[var(--ink)]">
          No habits match your search
        </p>
        <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
          Try a different term or filter
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <Leaf size={36} weight="duotone" className="text-[var(--ink-3)]" />
      <div>
        <p className="std-display text-lg font-bold text-[var(--ink)]">The roster is empty</p>
        <p className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)] mt-1">
          Enlist your first discipline
        </p>
      </div>
      <button onClick={onCreateHabit} className="std-btn std-btn--signal std-btn--sm flex items-center gap-1.5">
        <PlusIcon className="w-3.5 h-3.5" />
        Create one
      </button>
    </div>
  );
});

HabitsEmptyState.displayName = "HabitsEmptyState";
export default HabitsEmptyState;
