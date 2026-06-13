import { useState, useEffect, useCallback } from "react";
import { Envelope } from "@phosphor-icons/react";
import FeedCard from "./FeedCard";
import FeedFilters, { filterToTypes } from "./FeedFilters";
import FeedDensityToggle, { useFeedDensity } from "./FeedDensityToggle";
import { groupsAPI } from "../../../services/api";

/**
 * FeedTab
 *
 * Props:
 *   groupId       — string
 *   initialActivities — activity[] from parent (avoids double-fetch)
 *   currentUserId — string
 *   overview      — overview object (for sidebar summary)
 *   members       — members array (for sidebar summary)
 *   teamGoalChallenge — challenge or null (for sidebar)
 *   activeChallenge   — most prominent active non-team-goal challenge
 */
const FeedTab = ({
  groupId,
  initialActivities = [],
  currentUserId,
  overview,
  members = [],
  teamGoalChallenge,
  activeChallenge,
}) => {
  const [density, setDensity] = useFeedDensity();
  const [filter, setFilter] = useState("all");
  const [activities, setActivities] = useState(initialActivities);
  const [reactions, setReactions] = useState({}); // { activityId: { [type]: count } }
  const [myReactions, setMyReactions] = useState({}); // { activityId: type }
  const [loading, setLoading] = useState(false);

  /* Seed reactions from activity data (backend may include reaction counts) */
  useEffect(() => {
    const seed = {};
    initialActivities.forEach((a) => {
      if (a.reactions && Object.keys(a.reactions).length) {
        seed[a._id] = a.reactions;
      }
    });
    setReactions(seed);
  }, [initialActivities]);

  /* Re-fetch when filter changes */
  const fetchFiltered = useCallback(async (filterId) => {
    setLoading(true);
    try {
      const types = filterToTypes(filterId);
      const params = { limit: 30, ...(types ? { types } : {}) };
      const res = await groupsAPI.getGroupActivity(groupId, params);
      setActivities(res.activities || []);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const handleFilterChange = (id) => {
    setFilter(id);
    fetchFiltered(id);
  };

  /* Reaction toggle */
  const handleReact = async (activityId, type) => {
    const prev = myReactions[activityId];
    const isToggleOff = prev === type;

    // Optimistic
    setMyReactions((m) => ({ ...m, [activityId]: isToggleOff ? null : type }));
    setReactions((r) => {
      const cur = { ...(r[activityId] || {}) };
      if (!isToggleOff) cur[type] = (cur[type] || 0) + 1;
      if (prev && prev !== type) cur[prev] = Math.max(0, (cur[prev] || 1) - 1);
      return { ...r, [activityId]: cur };
    });

    try {
      if (isToggleOff) {
        await groupsAPI.removeReaction(activityId);
      } else {
        await groupsAPI.addReaction(activityId, type);
      }
    } catch {
      /* revert would be complex — leave optimistic */
    }
  };

  /* Kudos sent — prepend activity card */
  const handleKudosSent = (newActivity) => {
    setActivities((prev) => [newActivity, ...prev]);
  };

  /* Detect if user already sent kudos to a specific member */
  const sentKudosTo = new Set(
    activities
      .filter((a) => a.type === "kudos" && (a.userId?._id || a.userId)?.toString() === currentUserId?.toString())
      .map((a) => a.data?.targetUserId?.toString())
  );

  /* ── Sidebar data ── */
  const activeToday = overview?.teamStats?.activeMembers ?? 0;
  const totalMembers = members.length;

  const challengeSidebarTitle = activeChallenge?.title || teamGoalChallenge?.title;
  const challengeLeader = activeChallenge?.participants?.sort(
    (a, b) => (b.progress?.currentValue || 0) - (a.progress?.currentValue || 0)
  )[0];
  const challengeLeaderName = challengeLeader
    ? (challengeLeader.userId?.name || "Someone")
    : null;

  const goalPct = teamGoalChallenge
    ? Math.min(100, Math.round(
        ((teamGoalChallenge.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0) /
          (teamGoalChallenge.rules?.targetValue || 1)) * 100
      ))
    : null;

  return (
    <div className="flex gap-6">
      {/* ── Main feed ── */}
      <div className="flex-1 min-w-0">
        {/* toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <FeedFilters active={filter} onChange={handleFilterChange} />
          <FeedDensityToggle density={density} onChange={setDensity} />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-[var(--color-surface-elevated)] animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4 text-[var(--color-text-quaternary)]">
              <Envelope size={48} weight="thin" />
            </div>
            <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
              No activity yet
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
              Start tracking habits to see team activity here.
            </p>
          </div>
        ) : (
          <div className={density === "compact" ? "space-y-0.5" : "space-y-2"}>
            {activities.map((a) => (
              <FeedCard
                key={a._id}
                activity={a}
                density={density}
                reactions={reactions[a._id] || {}}
                myReaction={myReactions[a._id] || null}
                onReact={(type) => handleReact(a._id, type)}
                groupId={groupId}
                currentUserId={currentUserId}
                onKudosSent={handleKudosSent}
                alreadySentKudos={sentKudosTo.has(
                  (a.userId?._id || a.userId)?.toString()
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 space-y-4 hidden lg:block">
        {/* Members summary */}
        <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
              Members
            </p>
            <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">{totalMembers}</span>
          </div>
          <div className="flex -space-x-1.5 mb-2">
            {members.slice(0, 7).map((m, i) => {
              const info = m.userId || m.user || m;
              const name = info.name || info.email || "?";
              return info.avatar ? (
                <img
                  key={i}
                  src={info.avatar}
                  alt={name}
                  className="w-7 h-7 rounded-full border-2 border-[var(--color-bg-primary)] object-cover"
                />
              ) : (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-[var(--color-bg-primary)] bg-[var(--color-brand-600)] flex items-center justify-center text-white text-[10px] font-spartan font-bold"
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              );
            })}
            {totalMembers > 7 && (
              <div className="w-7 h-7 rounded-full border-2 border-[var(--color-bg-primary)] bg-[var(--color-surface-hover)] flex items-center justify-center text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                +{totalMembers - 7}
              </div>
            )}
          </div>
          <p className="text-xs font-spartan text-[var(--color-text-tertiary)]">
            {activeToday} active today
          </p>
        </div>

        {/* Active challenge */}
        {(activeChallenge || teamGoalChallenge) && (
          <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] uppercase tracking-wide flex-1">
                Active challenge
              </p>
              <span className="text-base">🏆</span>
            </div>
            <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] mb-1">
              {challengeSidebarTitle}
            </p>
            {challengeLeaderName && (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white text-[10px] font-spartan font-bold flex-shrink-0">
                    {challengeLeaderName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-spartan text-[var(--color-text-secondary)]">
                    {challengeLeaderName} leads
                  </span>
                  <span className="ml-auto text-xs font-spartan font-semibold text-emerald-500">
                    {Math.round(
                      ((challengeLeader.progress?.currentValue || 0) /
                        (activeChallenge?.rules?.targetValue ||
                          teamGoalChallenge?.rules?.targetValue || 1)) * 100
                    )}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(100, Math.round(
                        ((challengeLeader.progress?.currentValue || 0) /
                          (activeChallenge?.rules?.targetValue ||
                            teamGoalChallenge?.rules?.targetValue || 1)) * 100
                      ))}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Goal progress */}
        {teamGoalChallenge && goalPct !== null && (
          <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] uppercase tracking-wide truncate pr-2">
                {teamGoalChallenge.title}
              </p>
              <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] flex-shrink-0">
                {goalPct}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-[var(--color-surface-hover)] overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full bg-[var(--color-brand-500)]"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)] font-spartan">
              {teamGoalChallenge.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0).toLocaleString()}
              {" of "}
              {Number(teamGoalChallenge.rules?.targetValue || 0).toLocaleString()} {teamGoalChallenge.rules?.targetUnit || ""}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default FeedTab;
