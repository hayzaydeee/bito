import React, { memo } from "react";
import { PlusIcon } from "@radix-ui/react-icons";

/**
 * HabitsEmptyState — minimal empty state.
 */
const HabitsEmptyState = memo(({ isFiltered, onCreateHabit }) => {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          No habits match your search
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <span className="text-4xl">🌱</span>
      <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
        No habits yet
      </p>
      <button
        onClick={onCreateHabit}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-spartan font-medium text-white transition-all hover:scale-[1.03] active:scale-[0.98]"
        style={{ background: "var(--color-brand-500)" }}
      >
        <PlusIcon className="w-3.5 h-3.5" />
        Create one
      </button>
    </div>
  );
});

HabitsEmptyState.displayName = "HabitsEmptyState";
export default HabitsEmptyState;
