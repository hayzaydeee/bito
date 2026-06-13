import { useState } from "react";
import { Trophy, Plus } from "@phosphor-icons/react";

/**
 * GoalStatCard
 *
 * Shows an active team_goal challenge progress, or an empty state
 * that reveals a "Create goal" CTA on hover.
 *
 * Props:
 *   teamGoalChallenge  — challenge object (type === 'team_goal') or null
 *   onCreateChallenge  — () => void — opens ChallengeCreateModal
 */
const GoalStatCard = ({ teamGoalChallenge, onCreateChallenge }) => {
  const [hovered, setHovered] = useState(false);

  if (!teamGoalChallenge) {
    return (
      <div
        className="flex-1 min-w-0 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)]/60 px-4 py-3.5 flex flex-col gap-1 cursor-pointer transition-colors hover:border-[var(--color-border-primary)]/60 relative overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onCreateChallenge}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onCreateChallenge?.()}
      >
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan uppercase tracking-wide">
          Team goal
        </p>
        <div
          className={`flex items-center gap-2 transition-all duration-150 ${
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          <Plus size={14} className="text-[var(--color-brand-500)]" />
          <span className="text-sm font-spartan text-[var(--color-brand-500)]">
            Set a goal
          </span>
        </div>
        {!hovered && (
          <p className="text-sm text-[var(--color-text-quaternary)] font-spartan">
            No active goal
          </p>
        )}
      </div>
    );
  }

  // Compute progress
  const targetValue = teamGoalChallenge.rules?.targetValue || 1;
  const totalValue = teamGoalChallenge.participants?.reduce(
    (s, p) => s + (p.progress?.currentValue || 0),
    0
  ) || 0;
  const pct = Math.min(100, Math.round((totalValue / targetValue) * 100));

  const endDate = teamGoalChallenge.endDate
    ? new Date(teamGoalChallenge.endDate)
    : null;
  const daysLeft = endDate
    ? Math.max(0, Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="flex-1 min-w-0 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)]/60 px-4 py-3.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan truncate pr-2">
          {teamGoalChallenge.title || "Team goal"}
        </p>
        <span className="text-xl leading-none font-garamond font-bold text-[var(--color-text-primary)] flex-shrink-0">
          {pct}%
        </span>
      </div>

      {/* progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {daysLeft !== null && (
        <p className="text-[11px] text-[var(--color-text-tertiary)] font-spartan">
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
        </p>
      )}
    </div>
  );
};

export default GoalStatCard;
