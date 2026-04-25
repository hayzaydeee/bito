import React, { memo } from "react";
import {
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";
import HabitIcon from "../shared/HabitIcon";

/**
 * HabitFilterBar — source pills, search, status toggle, category chips.
 * Extracted from the old monolithic HabitsPage.
 */
const HabitFilterBar = memo(
  ({
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    sourceFilter,
    onSourceChange,
    categoryFilter,
    onCategoryChange,
    showFilters,
    onToggleFilters,
    categories,
    stats,
  }) => (
    <div className="space-y-3" data-tour="habits-filters">
      {/* Source pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: `All (${stats.total})` },
          { key: "personal", label: `Personal (${stats.personal})` },
          ...(stats.compass > 0
            ? [{ key: "compass", label: `Compass (${stats.compass})` }]
            : []),
          ...(stats.group > 0
            ? [{ key: "group", label: `Group (${stats.group})` }]
            : []),
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSourceChange(opt.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-spartan font-medium transition-all border ${
              sourceFilter === opt.key
                ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/30"
                : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)] hover:border-[var(--color-border-primary)]/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search + status toggle + filters button */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search habits..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/30 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-brand-500)]/50 transition-colors"
          />
        </div>

        {/* Status toggle */}
        <div className="flex rounded-xl border border-[var(--color-border-primary)]/30 overflow-hidden flex-shrink-0">
          {[
            { key: "active", label: "Active" },
            { key: "archived", label: "Archived" },
            { key: "all", label: "All" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => onStatusChange(opt.key)}
              className={`px-3 py-2 text-xs font-spartan font-medium transition-colors ${
                statusFilter === opt.key
                  ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)]"
                  : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category filter toggle */}
        {categories.length > 1 && (
          <button
            onClick={onToggleFilters}
            className={`h-10 w-10 rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 ${
              showFilters
                ? "border-[var(--color-brand-500)]/30 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]"
                : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <MixerHorizontalIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      {showFilters && categories.length > 1 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => onCategoryChange("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-spartan transition-all border ${
              categoryFilter === "all"
                ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/30"
                : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)]"
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META.custom;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-spartan transition-all border ${
                  categoryFilter === cat
                    ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/30"
                    : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)]"
                }`}
              >
                <HabitIcon icon={meta.icon} size={12} className="inline-flex" />{meta.label || cat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  )
);

HabitFilterBar.displayName = "HabitFilterBar";
export default HabitFilterBar;
