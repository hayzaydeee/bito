import GoalStatCard from "./GoalStatCard";

/**
 * StatsBar — a scoreboard strip: Active today · Completions · Team goal.
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
    <div className="grp-card mb-8 grid grid-cols-3 divide-x divide-[var(--line-2)] overflow-hidden">
      {/* Active today */}
      <div className="px-5 py-4 flex flex-col gap-2">
        <p className="grp-kicker">Active today</p>
        <p className="grp-num text-[34px] text-[var(--ink)]">
          {activeMembers}
          <span className="grp-mono text-[12px] font-normal text-[var(--ink-3)] ml-1.5 align-middle">
            / {totalMembers}
          </span>
        </p>
      </div>

      {/* Completions */}
      <div className="px-5 py-4 flex flex-col gap-2">
        <p className="grp-kicker">Completions</p>
        <p className="grp-num text-[34px] text-[var(--ink)]">{completions}</p>
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
