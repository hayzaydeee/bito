import React, { memo } from "react";
import { CalendarBlank, Fire } from "@phosphor-icons/react";
import ProgressRing from "../shared/ProgressRing";

/* ─── Stat Pills row ─── */
const StatPills = memo(({ completed, total, streak, weeklyProgress }) => {
  const dailyPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {/* Progress ring + today count */}
      <div
        className="flex items-center gap-2.5 rounded-full px-3 py-1.5 border"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderColor: "var(--color-border-primary)",
        }}
      >
        <ProgressRing value={dailyPct} size={36} stroke={3} />
        <span
          className="text-sm font-spartan font-bold tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {completed}/{total}
        </span>
        <span
          className="text-xs font-spartan"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          today
        </span>
      </div>

      {/* Weekly progress pill (only if weekly habits exist) */}
      {weeklyProgress && weeklyProgress.total > 0 && (
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-2 border"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-border-primary)",
          }}
        >
          <CalendarBlank size={16} weight="duotone" className="text-[var(--color-text-tertiary)]" />
          <span
            className="text-sm font-spartan font-bold tabular-nums"
            style={{ color: "var(--color-text-primary)" }}
          >
            {weeklyProgress.met}/{weeklyProgress.total}
          </span>
          <span
            className="text-xs font-spartan"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            weekly
          </span>
        </div>
      )}

      {/* Streak pill */}
      <div
        className="flex items-center gap-1.5 rounded-full px-3 py-2 border"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderColor: "var(--color-border-primary)",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--color-surface-elevated)" }}
        >
          <Fire size={16} weight="duotone" className="text-orange-400" />
        </div>
        <span
          className="text-sm font-spartan font-bold tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {streak}
        </span>
        <span
          className="text-xs font-spartan"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          streak
        </span>
      </div>
    </div>
  );
});

StatPills.displayName = "StatPills";
export default StatPills;
