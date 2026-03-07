import React, { memo } from "react";
import { PlusIcon } from "@radix-ui/react-icons";

/**
 * HabitsHeader — page title, subtitle stats, and "Add Habit" CTA.
 */
const HabitsHeader = memo(({ stats, onCreateHabit }) => (
  <div className="flex items-center justify-between" data-tour="habits-header">
    <div>
      <h1 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)]">
        Habit Collection
      </h1>
      <p className="text-sm font-spartan text-[var(--color-text-secondary)] mt-1">
        {stats.active} active
        {stats.compass > 0 && ` · ${stats.compass} from compass`}
        {stats.archived > 0 && ` · ${stats.archived} archived`}
      </p>
    </div>

    <button
      onClick={onCreateHabit}
      data-tour="habits-add"
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-spartan font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98] shadow-sm"
      style={{
        background: "var(--color-brand-500)",
        boxShadow: "0 2px 8px var(--color-glow)",
      }}
    >
      <PlusIcon className="w-4 h-4" />
      <span className="hidden sm:inline">Add Habit</span>
    </button>
  </div>
));

HabitsHeader.displayName = "HabitsHeader";
export default HabitsHeader;
