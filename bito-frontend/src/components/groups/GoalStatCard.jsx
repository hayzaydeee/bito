import { useState } from "react";
import { Plus } from "@phosphor-icons/react";

/**
 * GoalStatCard — a scoreboard cell (no own border; lives inside StatsBar).
 *
 * Shows an active team_goal challenge progress, or an empty state
 * that reveals a "Set a goal" CTA on hover.
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
        className="px-5 py-4 flex flex-col gap-2 cursor-pointer transition-colors hover:bg-[var(--surface-2)] relative group/goal"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onCreateChallenge}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onCreateChallenge?.()}
      >
        <p className="grp-kicker">Team goal</p>
        {hovered ? (
          <span className="flex items-center gap-1.5 text-[var(--signal)] grp-mono text-[13px] font-bold uppercase tracking-wide">
            <Plus size={15} weight="bold" />
            Set a goal
          </span>
        ) : (
          <p className="grp-num text-[20px] text-[var(--ink-3)]">—</p>
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
    <div className="px-5 py-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="grp-kicker truncate">{teamGoalChallenge.title || "Team goal"}</p>
        <span className="grp-num text-[24px] text-[var(--signal)] flex-shrink-0">{pct}%</span>
      </div>

      <div className="grp-meter mt-0.5">
        <i style={{ width: `${pct}%`, transition: "width .5s ease" }} />
      </div>

      {daysLeft !== null && (
        <p className="grp-mono text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider">
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
        </p>
      )}
    </div>
  );
};

export default GoalStatCard;
