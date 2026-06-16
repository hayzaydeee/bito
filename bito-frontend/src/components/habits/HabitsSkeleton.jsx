import React, { memo } from "react";

/**
 * HabitsSkeleton — DRILL loading placeholder ("The Roster").
 */
const HabitsSkeleton = memo(() => (
  <div className="std min-h-screen page-container px-4 sm:px-6 py-8">
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      {/* Masthead */}
      <div>
        <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
        <div className="flex items-end justify-between gap-4 mt-2">
          <div className="h-9 w-40 rounded-lg bg-[var(--surface-2)]" />
          <div className="h-10 w-48 rounded-lg bg-[var(--surface-2)]" />
        </div>
        <hr className="std-rule mt-3" />
      </div>

      {/* Control bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] h-10 rounded-[var(--r-btn)] bg-[var(--surface-2)]" />
        <div className="h-10 w-40 rounded-[var(--r-btn)] bg-[var(--surface-2)]" />
        <div className="h-10 w-28 rounded-[var(--r-btn)] bg-[var(--surface-2)]" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="std-card overflow-hidden p-0 flex">
            <div className="w-1 self-stretch bg-[var(--surface-2)]" />
            <div className="flex-1 p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[var(--r-btn)] bg-[var(--surface-2)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 rounded bg-[var(--surface-2)]" />
                <div className="h-3 w-14 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="w-[38px] h-[38px] rounded-full bg-[var(--surface-2)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

HabitsSkeleton.displayName = "HabitsSkeleton";
export default HabitsSkeleton;
