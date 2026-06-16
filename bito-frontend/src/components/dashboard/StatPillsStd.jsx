import React, { memo } from "react";
import ProgressRing from "../shared/ProgressRing";

/* ─────────────────────────────────────────────
   StatPills — DRILL stat readout (two voices)
   · daybook  → editorial stat line, serif tabular figures
   · control  → mono telemetry gauges with meters
   Accent (signal) reserved for progress.
   ───────────────────────────────────────────── */

const Meter = ({ pct }) => (
  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--line-2)]">
    <div
      className="h-full rounded-full bg-[var(--signal)] transition-all duration-500"
      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
    />
  </div>
);

const StatPills = memo(({ completed, total, streak, weeklyProgress, variant = "daybook" }) => {
  const dailyPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasWeekly = weeklyProgress && weeklyProgress.total > 0;

  /* ── Mission Control — telemetry gauges ── */
  if (variant === "control") {
    return (
      <div className="std-card px-4 py-3.5 space-y-3">
        {/* Today gauge */}
        <div className="flex items-center gap-3">
          <span className="std-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-3)] w-16 flex-shrink-0">
            Today
          </span>
          <Meter pct={dailyPct} />
          <span className="std-mono text-[11px] tabular-nums text-[var(--ink)] flex-shrink-0 w-20 text-right">
            {completed}/{total} · {dailyPct}%
          </span>
        </div>

        {/* Weekly gauge */}
        {hasWeekly && (
          <div className="flex items-center gap-3">
            <span className="std-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-3)] w-16 flex-shrink-0">
              Weekly
            </span>
            <Meter pct={Math.round((weeklyProgress.met / weeklyProgress.total) * 100)} />
            <span className="std-mono text-[11px] tabular-nums text-[var(--ink)] flex-shrink-0 w-20 text-right">
              {weeklyProgress.met}/{weeklyProgress.total} met
            </span>
          </div>
        )}

        {/* Streak readout */}
        <div className="flex items-center gap-3 pt-0.5">
          <span className="std-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-3)] w-16 flex-shrink-0">
            Streak
          </span>
          <span className="std-mono text-[11px] tabular-nums text-[var(--ink-2)]">
            {streak} {streak === 1 ? "day" : "days"} running
          </span>
        </div>
      </div>
    );
  }

  /* ── Daybook — editorial stat line ── */
  return (
    <div className="std-card flex items-stretch divide-x divide-[var(--line)]">
      {/* Today */}
      <div className="flex-1 flex items-center justify-center gap-2.5 px-3 py-3">
        <ProgressRing value={dailyPct} size={26} stroke={2.5} />
        <div>
          <p className="std-num text-xl font-bold text-[var(--ink)] leading-none">
            {completed}/{total}
          </p>
          <p className="std-kicker mt-1">Today</p>
        </div>
      </div>

      {/* Weekly */}
      {hasWeekly && (
        <div className="flex-1 flex flex-col items-center justify-center px-3 py-3">
          <p className="std-num text-xl font-bold text-[var(--ink)] leading-none">
            {weeklyProgress.met}/{weeklyProgress.total}
          </p>
          <p className="std-kicker mt-1">Weekly</p>
        </div>
      )}

      {/* Streak */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-3">
        <p className="std-num text-xl font-bold text-[var(--ink)] leading-none tabular-nums">
          {streak}
        </p>
        <p className="std-kicker mt-1">Day streak</p>
      </div>
    </div>
  );
});

StatPills.displayName = "StatPills";
export default StatPills;
