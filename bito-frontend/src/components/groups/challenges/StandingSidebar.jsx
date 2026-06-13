import { useState } from "react";
import { Trophy, Plus, CaretDown } from "@phosphor-icons/react";
import {
  Fire,
  TrendUp,
  CalendarBlank,
  Handshake,
  Sword,
} from "@phosphor-icons/react";

const TYPE_META = {
  streak:       { Icon: Fire,          label: "Streak" },
  cumulative:   { Icon: TrendUp,       label: "Cumulative" },
  consistency:  { Icon: CalendarBlank, label: "Consistency" },
  team_goal:    { Icon: Handshake,     label: "Team Goal" },
  head_to_head: { Icon: Sword,         label: "Head to Head" },
};

/**
 * StandingSidebar
 *
 * Props:
 *   activeChallenges   — active challenge objects the user is participating in
 *   allChallenges      — all challenges (for all-time stats)
 *   currentUserId      — string
 *   onCreateChallenge  — () => void
 */
const StandingSidebar = ({ activeChallenges = [], allChallenges = [], currentUserId, onCreateChallenge }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Only show challenges the user has joined
  const myActiveChallenges = activeChallenges.filter((c) =>
    c.participants?.some(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    )
  );

  const selectedChallenge = myActiveChallenges[selectedIdx] ?? null;

  // My standing in selected challenge
  const getMyStanding = (challenge) => {
    if (!challenge) return null;
    const sorted = [...(challenge.participants || [])].sort(
      (a, b) => (b.progress?.currentValue || 0) - (a.progress?.currentValue || 0)
    );
    const myIdx = sorted.findIndex(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    );
    if (myIdx === -1) return null;
    const above = sorted[myIdx - 1];
    const aboveVal = above?.progress?.currentValue || 0;
    const myVal = sorted[myIdx].progress?.currentValue || 0;
    const pointsBehind = aboveVal - myVal;
    const targetValue = challenge.rules?.targetValue || 1;
    const myPct = Math.min(100, Math.round((myVal / targetValue) * 100));
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
      (a, b) => (b.progress?.currentValue || 0) - (a.progress?.currentValue || 0)
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
    <div className="space-y-4">
      {/* Your standing */}
      <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] uppercase tracking-wide flex-1">
            Your standing
          </p>
          <Trophy size={16} className="text-amber-500" />
        </div>

        {myActiveChallenges.length === 0 ? (
          <p className="text-xs font-spartan text-[var(--color-text-tertiary)]">
            Join a challenge to see your standing.
          </p>
        ) : (
          <>
            {/* Challenge selector */}
            {myActiveChallenges.length > 1 && (
              <div className="relative mb-3">
                <select
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                  className="w-full h-8 pl-3 pr-8 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 text-xs font-spartan text-[var(--color-text-primary)] appearance-none focus:outline-none focus:border-[var(--color-brand-500)]/50 transition-colors cursor-pointer"
                >
                  {myActiveChallenges.map((c, i) => (
                    <option key={c._id} value={i}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
                />
              </div>
            )}

            {standing ? (
              <>
                <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mb-1 truncate">
                  in {selectedChallenge?.title}
                </p>
                <p className="text-2xl font-garamond font-bold text-[var(--color-text-primary)] mb-0.5">
                  #{standing.rank}
                </p>
                {standing.pointsBehind !== null && (
                  <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mb-3">
                    {standing.pointsBehind} point{standing.pointsBehind !== 1 ? "s" : ""} behind {ordinal(standing.aboveRank)}
                  </p>
                )}
                <div className="h-1 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${standing.myPct}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                No progress recorded yet.
              </p>
            )}
          </>
        )}
      </div>

      {/* All time */}
      <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 p-5">
        <p className="text-xs font-spartan font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
          All time
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Active",    value: totalActive },
            { label: "Upcoming",  value: totalUpcoming },
            { label: "Won",       value: totalWon },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
                {value}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)] font-spartan">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Create challenge */}
      <button
        onClick={onCreateChallenge}
        className="w-full h-10 rounded-2xl border border-dashed border-[var(--color-border-primary)]/30 flex items-center justify-center gap-2 text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-500)] hover:border-[var(--color-brand-500)]/40 transition-colors"
      >
        <Plus size={13} />
        Create challenge
      </button>
    </div>
  );
};

export default StandingSidebar;
