import { useState, useEffect } from "react";
import { Trophy, CaretDown, CaretRight, Rows, List, SquaresFour } from "@phosphor-icons/react";
import ChallengeCard from "./ChallengeCard";
import ChallengeDetailModal from "./ChallengeDetailModal";
import StandingSidebar from "./StandingSidebar";
import { groupsAPI } from "../../../services/api";
import ChallengeCreateModal from "../../ui/ChallengeCreateModal";
import ChallengeJoinModal from "../../ui/ChallengeJoinModal";
import "./challenges-cards.css";

const DRAFT_STEP_LABEL = ["Type", "Basics", "Targets", "Settings"];
const LS_DRAFT_KEY = (gId) => `bito_challenge_draft_${gId}`;
const LS_STYLE_KEY = "bito_challenge_card_style";

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
  const [localDraft, setLocalDraft] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cardStyle, setCardStyle] = useState(() => {
    try { return localStorage.getItem(LS_STYLE_KEY) || "cozy"; } catch { return "cozy"; }
  });

  const changeStyle = (style) => {
    setCardStyle(style);
    try { localStorage.setItem(LS_STYLE_KEY, style); } catch {}
  };

  // Re-read local draft whenever modal closes or groupId changes
  useEffect(() => {
    if (showCreateModal) return;
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY(groupId));
      setLocalDraft(raw ? JSON.parse(raw) : null);
    } catch { setLocalDraft(null); }
  }, [showCreateModal, groupId]);

  // ── Derived lists ────────────────────────────────────────────────
  // DB drafts: upcoming challenges created by this user who hasn't joined yet
  const dbDrafts = challenges.filter((c) => {
    if (c.status !== "upcoming") return false;
    const isCreator = (c.createdBy?._id || c.createdBy)?.toString() === currentUserId?.toString();
    if (!isCreator) return false;
    const meP = c.participants?.find(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    );
    return !meP || meP.status === "dropped";
  });
  const dbDraftIds = new Set(dbDrafts.map((c) => c._id));

  const active = challenges.filter((c) => {
    if (c.status !== "active") return false;
    const myP = c.participants?.find(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    );
    return !myP || myP.status !== "dropped";
  });
  const upcoming = challenges.filter(
    (c) => c.status === "upcoming" && !dbDraftIds.has(c._id)
  );
  const completed = challenges.filter(
    (c) => c.status === "completed" || c.status === "cancelled"
  );

  // ── Instance badge map ────────────────────────────────────────────
  // Group challenges by root ancestor; show #N badge only when siblings exist
  const instanceNumbers = (() => {
    const byRoot = {};
    challenges.forEach((c) => {
      const root = (c.parentChallengeId?._id || c.parentChallengeId)?.toString() || c._id?.toString();
      if (!byRoot[root]) byRoot[root] = [];
      byRoot[root].push(c);
    });
    const map = {};
    Object.values(byRoot).forEach((group) => {
      if (group.length > 1) {
        group.forEach((c) => { map[c._id?.toString()] = c.instanceNumber || 1; });
      }
    });
    return map;
  })();

  const canRestartChallenge = (c) => {
    const isCreator = (c.createdBy?._id || c.createdBy)?.toString() === currentUserId?.toString();
    return isCreator || canManage;
  };

  // ── Handlers ─────────────────────────────────────────────────────
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

  const handleDelete = async (challengeId) => {
    try {
      await groupsAPI.deleteChallenge(challengeId);
      setDeleteConfirm(null);
      onRefresh?.();
    } catch (err) {
      setActionError(err.message || "Failed to delete challenge");
      setDeleteConfirm(null);
    }
  };

  const handleRestart = async (challengeId, { startDate, endDate } = {}) => {
    try {
      await groupsAPI.restartChallenge(challengeId, { startDate, endDate });
      onRefresh?.();
    } catch (err) {
      setActionError(err.message || "Failed to restart challenge");
    }
  };

  const discardDraft = () => {
    try { localStorage.removeItem(LS_DRAFT_KEY(groupId)); } catch {}
    setLocalDraft(null);
  };

  const cardProps = (c, extra = {}) => ({
    challenge: c,
    currentUserId,
    myHabits,
    onJoin: setJoinTarget,
    onLeave: handleLeave,
    onViewDetail: handleViewDetail,
    actionLoading,
    cardStyle,
    ...extra,
  });

  const hasDrafts = localDraft || dbDrafts.length > 0;
  const isEmpty = !hasDrafts && active.length === 0 && upcoming.length === 0 && completed.length === 0;

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

        {/* Drafts */}
        {hasDrafts && (
          <section>
            <p className="grp-kicker mb-3">
              Drafts — {String((localDraft ? 1 : 0) + dbDrafts.length).padStart(2, "0")}
            </p>
            <div className="space-y-3">
              {localDraft && (
                <div className="grp-card p-4 border border-dashed border-[var(--signal)]/30 bg-[var(--signal)]/3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="grp-mono text-[10px] text-[var(--signal)] uppercase tracking-wider mb-0.5">
                        Paused at {DRAFT_STEP_LABEL[localDraft.step] ?? "setup"} — resume below
                      </p>
                      <p className="grp-display text-base font-bold text-[var(--ink)] truncate">
                        {localDraft.form?.name?.trim() || "Untitled challenge"}
                      </p>
                      <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase mt-0.5">
                        {localDraft.form?.type || "streak"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={discardDraft}
                        className="grp-mono text-[10px] text-[var(--ink-3)] hover:text-[var(--rose)] transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={() => openCreateWithPreset(null)}
                        className="grp-btn grp-btn--sm grp-btn--signal"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {dbDrafts.map((c) => (
                <div key={c._id}>
                  <p className="grp-mono text-[10px] text-[var(--signal)] uppercase tracking-wider mb-1.5 px-1">
                    Created — join to activate
                  </p>
                  <ChallengeCard
                    {...cardProps(c, {
                      onCancel: handleCancel,
                      canCancel: canManage || (c.createdBy?._id || c.createdBy)?.toString() === currentUserId?.toString(),
                    })}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active */}
        {active.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-5">
              <p className="grp-kicker">Active — {String(active.length).padStart(2, "0")}</p>
              <div className="bg-[var(--bg-2)] rounded-[10px] p-1 border border-[var(--line-2)] flex items-center gap-0.5 flex-shrink-0">
                {[
                  { id: "cozy", Icon: Rows, label: "Cozy" },
                  { id: "compact", Icon: List, label: "Compact" },
                  { id: "standing", Icon: SquaresFour, label: "Standing" },
                ].map(({ id, Icon: BtnIcon, label }) => {
                  const isOn = cardStyle === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => changeStyle(id)}
                      className={[
                        "flex items-center gap-1.5 h-7 px-2.5 rounded-[7px]",
                        "grp-mono text-[11px] font-bold uppercase tracking-wider",
                        "transition-colors whitespace-nowrap",
                        isOn
                          ? "bg-[var(--surface-2)] text-[var(--ink)]"
                          : "text-[var(--ink-3)] hover:text-[var(--ink-2)]",
                      ].join(" ")}
                    >
                      <BtnIcon size={12} weight={isOn ? "fill" : "regular"} className={isOn ? "text-[var(--signal)]" : ""} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {cardStyle === "compact" ? (
              <div className="cc-ledger">
                {active.map((c) => <ChallengeCard key={c._id} {...cardProps(c)} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {active.map((c) => <ChallengeCard key={c._id} {...cardProps(c)} />)}
              </div>
            )}
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <p className="grp-kicker mb-3">Upcoming — {String(upcoming.length).padStart(2, "0")}</p>
            {cardStyle === "compact" ? (
              <div className="cc-ledger">
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
            ) : (
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
            )}
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
              cardStyle === "compact" ? (
                <div className="space-y-3">
                  <div className="cc-ledger">
                    {completed.map((c) => (
                      <ChallengeCard
                        key={c._id}
                        {...cardProps(c, {
                          canRestart: canRestartChallenge(c),
                          onRestart: handleRestart,
                          instanceNumber: instanceNumbers[c._id?.toString()] || null,
                        })}
                      />
                    ))}
                  </div>
                  {canManage && completed.map((c) => (
                    <div key={c._id} className="flex justify-end px-1">
                      {deleteConfirm === c._id ? (
                        <div className="flex items-center gap-2">
                          <span className="grp-mono text-[10px] text-[var(--ink-3)]">Delete permanently?</span>
                          <button onClick={() => handleDelete(c._id)} className="grp-mono text-[10px] font-bold text-[var(--rose)] hover:underline">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} className="grp-mono text-[10px] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(c._id)} className="grp-mono text-[10px] text-[var(--ink-3)] hover:text-[var(--rose)] transition-colors">Delete</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {completed.map((c) => (
                    <div key={c._id} className="space-y-1">
                      <ChallengeCard
                        {...cardProps(c, {
                          canRestart: canRestartChallenge(c),
                          onRestart: handleRestart,
                          instanceNumber: instanceNumbers[c._id?.toString()] || null,
                        })}
                      />
                      {canManage && (
                        <div className="flex justify-end px-1">
                          {deleteConfirm === c._id ? (
                            <div className="flex items-center gap-2">
                              <span className="grp-mono text-[10px] text-[var(--ink-3)]">Delete permanently?</span>
                              <button
                                onClick={() => handleDelete(c._id)}
                                className="grp-mono text-[10px] font-bold text-[var(--rose)] hover:underline"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="grp-mono text-[10px] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(c._id)}
                              className="grp-mono text-[10px] text-[var(--ink-3)] hover:text-[var(--rose)] transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="grp-card text-center py-14 px-6 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[var(--ember)]/8 blur-3xl pointer-events-none" />
            <Trophy size={40} weight="duotone" className="mx-auto mb-4 text-[var(--ember)] relative" />
            <h3 className="grp-display text-2xl font-bold text-[var(--ink)] mb-2 relative">No challenges yet</h3>
            <p className="text-sm text-[var(--ink-2)] max-w-sm mx-auto mb-7 relative">
              Create a streak,{" "}
              <button
                onClick={() => openCreateWithPreset("team_goal")}
                className="text-[var(--signal)] hover:underline font-medium transition-colors"
              >
                team goal
              </button>
              , or consistency challenge to motivate your group.
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
          isEmpty={isEmpty}
        />
      </aside>

      {/* Detail modal */}
      {detailTarget && (
        <ChallengeDetailModal
          isOpen={!!detailTarget}
          challenge={detailTarget}
          currentUserId={currentUserId}
          canManage={canManage}
          onClose={() => setDetailTarget(null)}
          onJoin={setJoinTarget}
          onLeave={handleLeave}
          onDelete={(id) => { setDetailTarget(null); handleDelete(id); }}
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
