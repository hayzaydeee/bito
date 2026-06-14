import { useState } from "react";
import { Trophy, CaretDown, CaretRight } from "@phosphor-icons/react";
import ChallengeCard from "./ChallengeCard";
import StandingSidebar from "./StandingSidebar";
import { groupsAPI } from "../../../services/api";
import ChallengeCreateModal from "../../ui/ChallengeCreateModal";

/**
 * ChallengesTab
 *
 * Props:
 *   groupId       — string
 *   challenges    — Challenge[] (all challenges for this group)
 *   currentUserId — string
 *   myHabits      — user's personal Habit[] (for joining team_goal)
 *   onRefresh     — () => void
 *   canManage     — boolean
 */
const ChallengesTab = ({
  groupId,
  challenges = [],
  currentUserId,
  myHabits = [],
  onRefresh,
}) => {
  const [actionLoading, setActionLoading] = useState(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPreset, setCreatePreset] = useState(null);

  const active = challenges.filter((c) => c.status === "active");
  const upcoming = challenges.filter((c) => c.status === "upcoming");
  const completed = challenges.filter((c) => c.status === "completed" || c.status === "cancelled");

  const handleJoin = async (challengeId, linkedHabitIds = []) => {
    setActionLoading(challengeId);
    try {
      await groupsAPI.joinChallenge(challengeId, linkedHabitIds.length ? linkedHabitIds : null);
      onRefresh?.();
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (challengeId) => {
    setActionLoading(challengeId);
    try {
      await groupsAPI.leaveChallenge(challengeId);
      onRefresh?.();
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  const openCreateWithPreset = (preset = null) => {
    setCreatePreset(preset);
    setShowCreateModal(true);
  };

  const handleCreated = () => {
    setShowCreateModal(false);
    setCreatePreset(null);
    onRefresh?.();
  };

  return (
    <div className="flex gap-8">
      {/* ── Main list ── */}
      <div className="flex-1 min-w-0 space-y-7">
        {/* Active */}
        {active.length > 0 && (
          <section>
            <p className="grp-kicker mb-3">
              Active — {String(active.length).padStart(2, "0")}
            </p>
            <div className="space-y-3">
              {active.map((c) => (
                <ChallengeCard
                  key={c._id}
                  challenge={c}
                  currentUserId={currentUserId}
                  myHabits={myHabits}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <p className="grp-kicker mb-3">
              Upcoming — {String(upcoming.length).padStart(2, "0")}
            </p>
            <div className="space-y-3">
              {upcoming.map((c) => (
                <ChallengeCard
                  key={c._id}
                  challenge={c}
                  currentUserId={currentUserId}
                  myHabits={myHabits}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed — collapsible */}
        {completed.length > 0 && (
          <section>
            <button
              onClick={() => setCompletedOpen((v) => !v)}
              className="grp-kicker flex items-center gap-2 hover:text-[var(--ink-2)] transition-colors mb-3"
            >
              {completedOpen ? (
                <CaretDown size={11} weight="bold" />
              ) : (
                <CaretRight size={11} weight="bold" />
              )}
              Completed — {String(completed.length).padStart(2, "0")}
            </button>

            {completedOpen && (
              <div className="space-y-3">
                {completed.map((c) => (
                  <ChallengeCard
                    key={c._id}
                    challenge={c}
                    currentUserId={currentUserId}
                    myHabits={myHabits}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {challenges.length === 0 && (
          <div className="grp-card text-center py-14 px-6 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[var(--ember)]/8 blur-3xl pointer-events-none" />
            <Trophy size={40} weight="duotone" className="mx-auto mb-4 text-[var(--ember)] relative" />
            <h3 className="grp-display text-2xl font-bold text-[var(--ink)] mb-2 relative">
              No challenges yet
            </h3>
            <p className="text-sm text-[var(--ink-2)] max-w-sm mx-auto mb-7 relative">
              Create a streak, team goal, or consistency challenge to motivate your group.
            </p>
            <button onClick={() => openCreateWithPreset(null)} className="grp-btn grp-btn--ember mx-auto relative">
              <Trophy size={14} weight="fill" />
              Create challenge
            </button>
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <StandingSidebar
          activeChallenges={active}
          allChallenges={challenges}
          currentUserId={currentUserId}
          onCreateChallenge={() => openCreateWithPreset(null)}
        />
      </aside>

      {/* Create modal */}
      {showCreateModal && (
        <ChallengeCreateModal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setCreatePreset(null); }}
          groupId={groupId}
          onCreated={handleCreated}
          defaultType={createPreset}
        />
      )}
    </div>
  );
};

export default ChallengesTab;
