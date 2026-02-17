import React, { memo } from "react";

/* ─── SVG progress ring ─── */
const ProgressRing = ({ value = 0, size = 52, stroke = 4 }) => {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke="var(--color-surface-hover)"
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke="var(--color-brand-500)"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

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
          className="text-[10px] font-spartan"
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
          <span className="text-sm">📅</span>
          <span
            className="text-sm font-spartan font-bold tabular-nums"
            style={{ color: "var(--color-text-primary)" }}
          >
            {weeklyProgress.met}/{weeklyProgress.total}
          </span>
          <span
            className="text-[10px] font-spartan"
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
        <span className="text-sm">🔥</span>
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
