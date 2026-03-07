import React, { memo } from "react";
import { PlusIcon, LightningBoltIcon } from "@radix-ui/react-icons";

/**
 * HabitsEmptyState — shown when no habits exist or filters yield nothing.
 * Two variants: "no habits at all" vs "no search results".
 */
const HabitsEmptyState = memo(({ isFiltered, onCreateHabit, onNavigateCompass }) => {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-4xl opacity-60">🔍</span>
        <h3 className="text-lg font-garamond font-semibold text-[var(--color-text-secondary)]">
          No habits match your filters
        </h3>
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)] max-w-xs text-center">
          Try adjusting your search terms or clearing some filters
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      {/* Decorative composition */}
      <div className="relative">
        <div className="text-6xl">🌱</div>
        <div className="absolute -top-1 -right-3 text-2xl animate-bounce" style={{ animationDelay: "0.15s" }}>
          ✨
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h3 className="text-xl font-garamond font-bold text-[var(--color-text-primary)]">
          Your habit collection starts here
        </h3>
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)] leading-relaxed">
          Build a gallery of habits that shape your days. Create one manually or
          let Compass generate a personalised set for you.
        </p>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={onCreateHabit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-spartan font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98]"
          style={{ background: "var(--color-brand-500)" }}
        >
          <PlusIcon className="w-4 h-4" />
          Create a Habit
        </button>
        <button
          onClick={onNavigateCompass}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-spartan font-semibold border transition-all hover:scale-[1.03] active:scale-[0.98]"
          style={{
            borderColor: "rgba(16,185,129,0.3)",
            color: "#10b981",
            background: "rgba(16,185,129,0.06)",
          }}
        >
          <LightningBoltIcon className="w-4 h-4" />
          Generate with Compass
        </button>
      </div>
    </div>
  );
});

HabitsEmptyState.displayName = "HabitsEmptyState";
export default HabitsEmptyState;
