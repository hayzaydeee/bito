import { useState } from "react";
import { Trophy, Plus, CaretDown } from "@phosphor-icons/react";

/**
 * StandingSidebar
 *
 * Props:
 *   activeChallenges   — active challenge objects the user is participating in
 *   allChallenges      — all challenges (for all-time stats)
 *   currentUserId      — string
 *   onCreateChallenge  — () => void
 */
const StandingSidebar = ({ activeChallenges = [], allChallenges = [], currentUserId, onCreateChallenge, isEmpty = false }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Only show challenges the user has joined
  const myActiveChallenges = activeChallenges.filter((c) =>
    c.participants?.some(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    )
  );

  const selectedChallenge = myActiveChallenges[selectedIdx] ?? null;

  const sortMetric = (p, type) => {
    if (type === "streak") return p.progress?.currentStreak || 0;
    if (type === "consistency") return p.progress?.completionRate || 0;
    return p.progress?.currentValue || 0;
  };

  // My standing in selected challenge
  const getMyStanding = (challenge) => {
    if (!challenge) return null;
    const sorted = [...(challenge.participants || [])].sort(
      (a, b) => sortMetric(b, challenge.type) - sortMetric(a, challenge.type)
    );
    const myIdx = sorted.findIndex(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    );
    if (myIdx === -1) return null;
    const above = sorted[myIdx - 1];
    const myVal = sortMetric(sorted[myIdx], challenge.type);
    const aboveVal = above ? sortMetric(above, challenge.type) : 0;
    const pointsBehind = aboveVal - myVal;
    const targetValue = challenge.rules?.targetValue || 1;
    const myPct = challenge.type === "consistency"
      ? Math.min(100, Math.round(myVal))
      : Math.min(100, Math.round((myVal / targetValue) * 100));
    return {
      rank: myIdx + 1,
      total: sorted.length,
      pointsBehind: myIdx > 0 ? pointsBehind : null,
      aboveRank: myIdx,
      myPct,
    };
  };

  // All-time stats
  const isMyChallenge = (c) =>
    c.participants?.some(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    );

  const myAll = allChallenges.filter(isMyChallenge);
  const totalActive = myAll.filter((c) => c.status === "active").length;
  const totalUpcoming = myAll.filter((c) => c.status === "upcoming").length;
  const totalWon = myAll.filter((c) => {
    if (c.status !== "completed") return false;
    const sorted = [...(c.participants || [])].sort(
      (a, b) => sortMetric(b, c.type) - sortMetric(a, c.type)
    );
    return (sorted[0]?.userId?._id || sorted[0]?.userId)?.toString() === currentUserId?.toString();
  }).length;

  const standing = getMyStanding(selectedChallenge);
  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="space-y-3">
      {/* Your standing */}
      <div className="grp-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="grp-kicker flex-1">Your standing</p>
          <Trophy size={15} weight="fill" className="text-[var(--ember)]" />
        </div>

        {myActiveChallenges.length === 0 ? (
          <p className="text-xs text-[var(--ink-2)]">Join a challenge to see your standing.</p>
        ) : (
          <>
            {/* Challenge selector */}
            {myActiveChallenges.length > 1 && (
              <div className="relative mb-3">
                <select
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                  className="grp-input h-8 pr-8 text-xs appearance-none cursor-pointer"
                >
                  {myActiveChallenges.map((c, i) => (
                    <option key={c._id} value={i}>{c.title}</option>
                  ))}
                </select>
                <CaretDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] pointer-events-none"
                />
              </div>
            )}

            {standing ? (
              <>
                <p className="grp-mono text-[10px] text-[var(--ink-3)] mb-1 truncate uppercase tracking-wider">
                  in {selectedChallenge?.title}
                </p>
                <p className="grp-num text-[44px] text-[var(--ink)] mb-1">#{standing.rank}</p>
                {standing.pointsBehind !== null && (
                  <p className="grp-mono text-[10px] text-[var(--ink-3)] mb-3 uppercase tracking-wider">
                    {standing.pointsBehind} pt{standing.pointsBehind !== 1 ? "s" : ""} behind {ordinal(standing.aboveRank)}
                  </p>
                )}
                <div className="grp-meter">
                  <i style={{ width: `${standing.myPct}%`, transition: "width .4s ease" }} />
                </div>
              </>
            ) : (
              <p className="text-xs text-[var(--ink-2)]">No progress recorded yet.</p>
            )}
          </>
        )}
      </div>

      {/* All time */}
      <div className="grp-card p-5">
        <p className="grp-kicker mb-3">All time</p>
        <div className="grid grid-cols-3 divide-x divide-[var(--line-2)]">
          {[
            { label: "Active",   value: totalActive },
            { label: "Upcoming", value: totalUpcoming },
            { label: "Won",      value: totalWon },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-1">
              <p className="grp-num text-[26px] text-[var(--ink)]">{value}</p>
              <p className="grp-mono text-[9px] text-[var(--ink-3)] uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {onCreateChallenge && !isEmpty && (
        <button
          onClick={onCreateChallenge}
          className="grp-btn grp-btn--sm grp-btn--ember w-full"
        >
          <Plus size={13} weight="bold" />
          Create challenge
        </button>
      )}
    </div>
  );
};

export default StandingSidebar;
