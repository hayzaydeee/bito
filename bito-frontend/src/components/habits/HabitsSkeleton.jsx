import React, { memo } from "react";

/**
 * HabitsSkeleton — loading placeholder matching the habits page grid layout.
 * Shows pulsing metric cards + fake habit cards in a 3-col grid.
 */
const HabitsSkeleton = memo(() => (
  <div className="min-h-screen page-container px-4 sm:px-6 py-8">
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-[var(--color-surface-hover)]" />
          <div className="h-4 w-32 rounded-md bg-[var(--color-surface-hover)]" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-[var(--color-surface-hover)]" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--color-border-primary)]/20 p-4 space-y-3"
            style={{ background: "var(--color-surface-primary)" }}
          >
            <div className="h-5 w-5 rounded bg-[var(--color-surface-hover)]" />
            <div className="h-8 w-16 rounded bg-[var(--color-surface-hover)]" />
            <div className="h-3 w-20 rounded bg-[var(--color-surface-hover)]" />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-10 rounded-xl bg-[var(--color-surface-hover)]" />
        <div className="h-10 w-44 rounded-xl bg-[var(--color-surface-hover)]" />
        <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-hover)]" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--color-border-primary)]/20 overflow-hidden"
            style={{ background: "var(--color-surface-primary)" }}
          >
            {/* Accent bar */}
            <div className="h-1 bg-[var(--color-surface-hover)]" />
            <div className="p-4 space-y-3">
              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-hover)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
                  <div className="h-3 w-16 rounded bg-[var(--color-surface-hover)]" />
                </div>
              </div>
              {/* Sparkline area */}
              <div className="h-10 rounded-lg bg-[var(--color-surface-hover)]" />
              {/* Bottom row */}
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-[var(--color-surface-hover)]" />
                <div className="h-6 w-6 rounded-full bg-[var(--color-surface-hover)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

HabitsSkeleton.displayName = "HabitsSkeleton";
export default HabitsSkeleton;
