import GoalStatCard from "./GoalStatCard";

/**
 * StatsBar
 *
 * Three stat cards: Active today, Completions, Team goal progress.
 *
 * Props:
 *   overview             — overview object from groupsAPI.getGroupOverview()
 *   members              — members array (for total count)
 *   teamGoalChallenge    — active team_goal challenge or null
 *   onCreateChallenge    — fn to open ChallengeCreateModal
 */
const StatsBar = ({ overview, members, teamGoalChallenge, onCreateChallenge }) => {
  const activeMembers = overview?.teamStats?.activeMembers ?? 0;
  const totalMembers = members?.length || 0;
  const completions = overview?.teamStats?.totalCompletions ?? 0;

  return (
    <div className="flex gap-3 mb-6">
      {/* Active today */}
      <div className="flex-1 min-w-0 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-4 py-3.5 flex flex-col gap-1">
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
          Active today
        </p>
        <p className="text-xl leading-none font-garamond font-bold text-[var(--color-text-primary)]">
          {activeMembers}
          <span className="text-sm font-spartan font-normal text-[var(--color-text-tertiary)] ml-1">
            of {totalMembers}
          </span>
        </p>
      </div>

      {/* Completions */}
      <div className="flex-1 min-w-0 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-4 py-3.5 flex flex-col gap-1">
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
          Completions
        </p>
        <p className="text-xl leading-none font-garamond font-bold text-[var(--color-text-primary)]">
          {completions}
        </p>
      </div>

      {/* Goal */}
      <GoalStatCard
        teamGoalChallenge={teamGoalChallenge}
        onCreateChallenge={onCreateChallenge}
      />
    </div>
  );
};

export default StatsBar;
