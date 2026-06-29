import { useState } from "react";
import { Trophy, CaretDown, CaretRight } from "@phosphor-icons/react";
import ChallengeCard from "./ChallengeCard";
import ChallengeDetailModal from "./ChallengeDetailModal";
import StandingSidebar from "./StandingSidebar";
import { groupsAPI } from "../../../services/api";
import ChallengeCreateModal from "../../ui/ChallengeCreateModal";
import ChallengeJoinModal from "../../ui/ChallengeJoinModal";

const ChallengesTab = ({
  groupId,
  challenges = [],
  currentUserId,
  myHabits = [],
  onRefresh,
  canManage = false,
}) => {
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPreset, setCreatePreset] = useState(null);
  const [joinTarget, setJoinTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  const active = challenges.filter((c) => c.status === "active");
  const upcoming = challenges.filter((c) => c.status === "upcoming");
  const completed = challenges.filter((c) => c.status === "completed" || c.status === "cancelled");

  const handleLeave = async (challengeId) => {
    setActionLoading(challengeId);
    setActionError(null);
    try {
      await groupsAPI.leaveChallenge(challengeId);
      setDetailTarget(null);
      onRefresh?.();
    } catch (err) {
      setActionError(err.message || "Failed to leave challenge");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (challengeId) => {
    await groupsAPI.cancelChallenge(challengeId);
    onRefresh?.();
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

  const handleViewDetail = (challenge) => {
    setDetailTarget(challenge);
  };

  const cardProps = (c, extra = {}) => ({
    challenge: c,
    currentUserId,
    myHabits,
    onJoin: setJoinTarget,
    onLeave: handleLeave,
    onViewDetail: handleViewDetail,
    actionLoading,
    ...extra,
  });

  return (
    <div className="flex gap-8">
      {/* ── Main list ── */}
      <div className="flex-1 min-w-0 space-y-7">
        {actionError && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--ember)]/10 border border-[var(--ember)]/20">
            <p className="grp-mono text-xs text-[var(--ember)]">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="grp-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active */}
        {active.length > 0 && (
          <section>
            <p className="grp-kicker mb-3">Active — {String(active.length).padStart(2, "0")}</p>
            <div className="space-y-3">
              {active.map((c) => <ChallengeCard key={c._id} {...cardProps(c)} />)}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <p className="grp-kicker mb-3">Upcoming — {String(upcoming.length).padStart(2, "0")}</p>
            <div className="space-y-3">
              {upcoming.map((c) => (
                <ChallengeCard
                  key={c._id}
                  {...cardProps(c, {
                    onCancel: handleCancel,
                    canCancel: canManage || (c.createdBy?._id || c.createdBy)?.toString() === currentUserId?.toString(),
                  })}
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
              {completedOpen ? <CaretDown size={11} weight="bold" /> : <CaretRight size={11} weight="bold" />}
              Completed — {String(completed.length).padStart(2, "0")}
            </button>
            {completedOpen && (
              <div className="space-y-3">
                {completed.map((c) => <ChallengeCard key={c._id} {...cardProps(c)} />)}
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {challenges.length === 0 && (
          <div className="grp-card text-center py-14 px-6 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[var(--ember)]/8 blur-3xl pointer-events-none" />
            <Trophy size={40} weight="duotone" className="mx-auto mb-4 text-[var(--ember)] relative" />
            <h3 className="grp-display text-2xl font-bold text-[var(--ink)] mb-2 relative">No challenges yet</h3>
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

      {/* Detail modal */}
      {detailTarget && (
        <ChallengeDetailModal
          isOpen={!!detailTarget}
          challenge={detailTarget}
          currentUserId={currentUserId}
          onClose={() => setDetailTarget(null)}
          onJoin={setJoinTarget}
          onLeave={handleLeave}
          actionLoading={actionLoading}
        />
      )}

      {/* Join modal */}
      {joinTarget && (
        <ChallengeJoinModal
          isOpen={!!joinTarget}
          challenge={joinTarget}
          onClose={() => setJoinTarget(null)}
          onSuccess={() => { setJoinTarget(null); onRefresh?.(); }}
        />
      )}

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
