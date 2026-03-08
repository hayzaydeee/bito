import React, { memo } from "react";

/**
 * HabitsSkeleton — minimal loading placeholder.
 */
const HabitsSkeleton = memo(() => (
  <div className="min-h-screen page-container px-4 sm:px-6 py-8">
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 rounded-lg bg-[var(--color-surface-hover)]" />
          <div className="h-4 w-20 rounded-md bg-[var(--color-surface-hover)]" />
        </div>
        <div className="h-9 w-9 rounded-full bg-[var(--color-surface-hover)]" />
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-10 rounded-xl bg-[var(--color-surface-hover)]" />
        <div className="h-10 w-36 rounded-xl bg-[var(--color-surface-hover)]" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--color-border-primary)]/10 overflow-hidden"
            style={{ background: "var(--color-surface-primary)" }}
          >
            <div className="h-[3px] bg-[var(--color-surface-hover)]" />
            <div className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-hover)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
                <div className="h-3 w-14 rounded bg-[var(--color-surface-hover)]" />
              </div>
              <div className="w-[38px] h-[38px] rounded-full bg-[var(--color-surface-hover)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

HabitsSkeleton.displayName = "HabitsSkeleton";
export default HabitsSkeleton;
