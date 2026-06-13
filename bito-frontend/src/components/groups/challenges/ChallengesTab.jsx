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
    <div className="flex gap-6">
      {/* ── Main list ── */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Active */}
        {active.length > 0 && (
          <section>
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
              Active ({active.length})
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
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
              Upcoming ({upcoming.length})
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
              className="flex items-center gap-2 text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors uppercase tracking-wide mb-3"
            >
              {completedOpen ? (
                <CaretDown size={11} />
              ) : (
                <CaretRight size={11} />
              )}
              Completed ({completed.length})
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
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <Trophy size={40} weight="duotone" className="text-[var(--color-text-tertiary)]" />
            </div>
            <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
              No challenges yet
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto">
              Create a streak, team goal, or consistency challenge to motivate your group.
            </p>
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
