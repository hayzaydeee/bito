import React, { memo, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";
import HabitCard from "./HabitCard";

/**
 * HabitCategoryGroup — section for a category with header, count & accent bar.
 * Contains a grid of HabitCards. Collapsible.
 */
const HabitCategoryGroup = memo(({ categoryKey, habits, onHabitClick }) => {
  const [collapsed, setCollapsed] = useState(false);
  const meta = CATEGORY_META[categoryKey] || CATEGORY_META.custom;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full group"
      >
        {/* Accent dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: meta.accent || "var(--color-brand-500)" }}
        />

        <span className="text-sm font-garamond font-semibold text-[var(--color-text-primary)]">
          {meta.icon} {meta.label || categoryKey}
        </span>

        <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
          ({habits.length})
        </span>

        {/* Accent line fills remaining space */}
        <div
          className="flex-1 h-px opacity-20"
          style={{ background: meta.accent || "var(--color-border-primary)" }}
        />

        {collapsed ? (
          <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors" />
        ) : (
          <ChevronUpIcon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors" />
        )}
      </button>

      {/* Cards grid */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {habits.map((habit) => (
            <HabitCard
              key={habit._id}
              habit={habit}
              onClick={onHabitClick}
            />
          ))}
        </div>
      )}
    </div>
  );
});

HabitCategoryGroup.displayName = "HabitCategoryGroup";
export default HabitCategoryGroup;
