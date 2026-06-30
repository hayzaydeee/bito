import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Fire, TrendUp, CalendarCheck, Handshake, Sword, Trophy, Medal, ChartBar, ArrowLeft, User, CalendarBlank, CheckCircle, XCircle } from "@phosphor-icons/react";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ChallengeJoinModal from "../components/ui/ChallengeJoinModal";
import SkeletonTransition from "../components/ui/SkeletonTransition";

/* ── type metadata ── */
const TYPE_META = {
  streak:       { icon: Fire,         label: "Streak",       unit: "days" },
  cumulative:   { icon: TrendUp,      label: "Cumulative",   unit: "completions" },
  consistency:  { icon: CalendarCheck,label: "Consistency",  unit: "%" },
  team_goal:    { icon: Handshake,    label: "Team Goal",    unit: "total" },
  head_to_head: { icon: Sword,        label: "Head to Head", unit: "" },
};

const STATUS_THEME = {
  upcoming:  { color: 'var(--signal)',         bg: 'color-mix(in srgb, var(--signal) 10%, transparent)' },
  active:    { color: 'var(--signal)',         bg: 'color-mix(in srgb, var(--signal) 10%, transparent)' },
  completed: { color: 'var(--ink-3)',          bg: 'color-mix(in srgb, var(--ink-3) 10%, transparent)' },
  cancelled: { color: 'var(--rose, #e11d48)', bg: 'color-mix(in srgb, var(--rose, #e11d48) 10%, transparent)' },
};

const MATCH_MODE_LABELS = {
  single: "Link one habit",
  any: "Any linked habit counts",
  all: "All linked habits must be done",
  minimum: "At least N linked habits",
};

/* ================================================================
   ChallengeDetailPage — full challenge view with leaderboard
   ================================================================ */
const ChallengeDetailPage = () => {
  const { groupId, challengeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await groupsAPI.getChallenge(challengeId);
      if (res.success) {
        setChallenge(res.challenge);
      } else {
        setError(res.error || "Failed to load challenge");
      }
    } catch {
      setError("Error loading challenge");
    } finally {
      setLoading(false);
    }
  };

  const isParticipant = challenge?.participants?.some(
    (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
  );

  const isCreator =
    (challenge?.createdBy?._id || challenge?.createdBy)?.toString() === currentUserId?.toString();

  const handleJoin = () => setJoinModalOpen(true);

  const handleJoinSuccess = () => {
    setJoinModalOpen(false);
    fetchChallenge();
  };

  const handleLeave = async () => {
    try {
      setActionLoading(true);
      const res = await groupsAPI.leaveChallenge(challengeId);
      if (res.success) fetchChallenge();
    } catch {
      setError("Failed to leave challenge");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this challenge? This cannot be undone.")) return;
    try {
      setActionLoading(true);
      await groupsAPI.cancelChallenge(challengeId);
      navigate(`/app/groups/${groupId}`);
    } catch {
      setError("Failed to cancel challenge");
      setActionLoading(false);
    }
  };

  /* ── format helpers ── */
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const progressValue = (p) => {
    if (!p?.progress) return 0;
    if (challenge.type === "streak") return p.progress.currentStreak || 0;
    if (challenge.type === "consistency") return p.progress.completionRate || 0;
    return p.progress.currentValue || 0;
  };

  const progressPercent = (p) => {
    const target = challenge?.rules?.targetValue || 1;
    return Math.min(100, Math.round((progressValue(p) / target) * 100));
  };

  const teamTotal = () =>
    challenge?.participants
      ?.filter((p) => p.status !== "dropped")
      .reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0;

  const teamPercent = () =>
    Math.min(100, Math.round((teamTotal() / (challenge?.rules?.targetValue || 1)) * 100));

  /* ── skeleton ── */
  const challengeSkeleton = (
    <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-24 rounded-[var(--r-btn)] bg-[var(--surface-2)]" />
        <div className="h-36 std-card bg-[var(--surface-2)]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 std-card bg-[var(--surface-2)]" />
          <div className="h-32 std-card bg-[var(--surface-2)]" />
        </div>
        <div className="h-56 std-card bg-[var(--surface-2)]" />
      </div>
    </div>
  );

  /* ── error states ── */
  if (!loading && (error || !challenge)) {
    return (
      <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(`/app/groups/${groupId}`)} className="std-btn std-btn--sm mb-8 flex items-center gap-1.5">
            <ArrowLeft size={14} weight="bold" /> Group
          </button>
          <div className="std-card p-10 text-center">
            <p className="std-display text-3xl text-[var(--ink-3)] mb-3">—</p>
            <p className="std-mono text-[11px] text-[var(--ink-3)]">{error || "Challenge not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[challenge.type] || { icon: "🏆", label: challenge.type, unit: "" };
  const theme = STATUS_THEME[challenge.status] || STATUS_THEME.upcoming;
  const leaderboard = challenge.leaderboard || [];

  return (
    <SkeletonTransition isLoading={loading} skeleton={challengeSkeleton}>
    <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── Back nav ── */}
      <button onClick={() => navigate(`/app/groups/${groupId}`)} className="std-btn std-btn--sm flex items-center gap-1.5">
        <ArrowLeft size={14} weight="bold" /> Group
      </button>

      {/* ── Header card ── */}
      <div className="std-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-[var(--r-card)] bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 text-[var(--ink-3)]">
            {meta.icon ? <meta.icon size={24} weight="duotone" /> : <Trophy size={24} weight="duotone" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="std-display text-xl text-[var(--ink)]">{challenge.title}</h1>
              <span
                className="std-mono text-[10px] px-2 py-0.5 rounded-[var(--r-pill)] flex items-center gap-1.5"
                style={{ color: theme.color, background: theme.bg, border: `1px solid ${theme.color}40` }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: theme.color }} />
                {challenge.status}
              </span>
            </div>
            {challenge.description && (
              <p className="std-mono text-[11px] text-[var(--ink-3)] mt-1 leading-relaxed">{challenge.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 std-mono text-[10px] text-[var(--ink-3)] mt-3">
              <span className="flex items-center gap-1">
                <CalendarBlank size={12} />
                {fmtDate(challenge.startDate)} — {fmtDate(challenge.endDate)}
              </span>
              {challenge.daysRemaining != null && challenge.status === "active" && (
                <span style={{ color: 'var(--signal)' }}>{challenge.daysRemaining}d left</span>
              )}
              <span className="flex items-center gap-1">
                <User size={12} />
                {challenge.stats?.participantCount || challenge.participants?.length || 0} participants
              </span>
              <span>{meta.label} — {challenge.rules?.targetValue} {challenge.rules?.targetUnit}</span>
            </div>
          </div>

          {/* action buttons */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            {(challenge.status === "active" || challenge.status === "upcoming") && (
              isParticipant ? (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="std-btn std-btn--sm border-red-500/40 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Leave
                </button>
              ) : (
                <button onClick={handleJoin} disabled={actionLoading} className="std-btn std-btn--signal std-btn--sm disabled:opacity-50">
                  Join
                </button>
              )
            )}
            {isCreator && challenge.status !== "completed" && challenge.status !== "cancelled" && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="std-mono text-[10px] text-[var(--ink-3)] hover:text-red-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Rules & matching info ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="std-card p-5">
          <p className="std-kicker text-[var(--ink-3)] mb-3">Rules</p>
          <dl className="space-y-2">
            {[
              { label: "Target",       value: `${challenge.rules?.targetValue} ${challenge.rules?.targetUnit}` },
              challenge.rules?.minimumDailyValue && { label: "Min daily", value: challenge.rules.minimumDailyValue },
              { label: "Grace period", value: `${challenge.rules?.gracePeriodHours || 4}h` },
              challenge.rules?.allowMakeupDays && { label: "Makeup days", value: "Allowed" },
              challenge.settings?.maxParticipants && { label: "Max participants", value: challenge.settings.maxParticipants },
            ].filter(Boolean).map((row) => (
              <div key={row.label} className="flex justify-between items-baseline">
                <dt className="std-mono text-[10px] text-[var(--ink-3)]">{row.label}</dt>
                <dd className="std-mono text-[11px] text-[var(--ink)]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="std-card p-5">
          <p className="std-kicker text-[var(--ink-3)] mb-3">Habit Matching</p>
          <dl className="space-y-2">
            <div className="flex justify-between items-baseline">
              <dt className="std-mono text-[10px] text-[var(--ink-3)]">Mode</dt>
              <dd className="std-mono text-[11px] text-[var(--ink)]">
                {MATCH_MODE_LABELS[challenge.habitMatchMode] || challenge.habitMatchMode || "Single"}
              </dd>
            </div>
            {challenge.habitMatchMode === "minimum" && challenge.habitMatchMinimum && (
              <div className="flex justify-between items-baseline">
                <dt className="std-mono text-[10px] text-[var(--ink-3)]">Minimum</dt>
                <dd className="std-mono text-[11px] text-[var(--ink)]">{challenge.habitMatchMinimum} habits</dd>
              </div>
            )}
            {challenge.habitSlot && (
              <div>
                <dt className="std-mono text-[10px] text-[var(--ink-3)] mb-1">Habit description</dt>
                <dd className="std-mono text-[10px] text-[var(--ink)] bg-[var(--surface-2)] rounded-[var(--r-btn)] px-3 py-2 leading-relaxed">{challenge.habitSlot}</dd>
              </div>
            )}
            {challenge.habitId && (
              <div className="flex justify-between items-baseline">
                <dt className="std-mono text-[10px] text-[var(--ink-3)]">Linked habit</dt>
                <dd className="std-mono text-[11px] text-[var(--ink)]">{challenge.habitId?.icon} {challenge.habitId?.name || "Group habit"}</dd>
              </div>
            )}
          </dl>
          {challenge.reward && (
            <div className="mt-3 pt-3 border-t border-[var(--line)]">
              <p className="std-kicker text-[10px] text-[var(--ink-3)] mb-0.5">Reward</p>
              <p className="text-sm text-[var(--ink)]">{challenge.reward}</p>
            </div>
          )}
        </div>
      </div>

      {challenge.type === "team_goal" && (
        <div className="std-card p-5">
          <p className="std-kicker text-[var(--ink-3)] mb-3">Team Progress</p>
          <div className="flex items-center justify-between std-mono text-[11px] mb-2">
            <span className="text-[var(--ink)]">{teamTotal()} / {challenge.rules?.targetValue} {challenge.rules?.targetUnit}</span>
            <span className="text-[var(--ink-3)]">{teamPercent()}%</span>
          </div>
          <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${teamPercent()}%`, background: 'var(--signal)' }} />
          </div>
        </div>
      )}

      {challenge.milestones?.length > 0 && (
        <div className="std-card p-5">
          <p className="std-kicker text-[var(--ink-3)] mb-3">Milestones</p>
          <div className="space-y-2">
            {challenge.milestones.map((m, i) => {
              const reached = m.reachedBy?.length > 0;
              return (
                <div key={i} className="flex items-center gap-3 py-1 border-b border-[var(--line)] last:border-0">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center std-mono text-[10px]"
                    style={{ background: reached ? 'color-mix(in srgb, var(--signal) 15%, transparent)' : 'var(--surface-2)', color: reached ? 'var(--signal)' : 'var(--ink-3)' }}
                  >
                    {reached ? <CheckCircle size={12} weight="duotone" /> : i + 1}
                  </span>
                  <p className={`flex-1 text-sm truncate ${reached ? 'text-[var(--ink)]' : 'text-[var(--ink-2)]'}`}>{m.label}</p>
                  <span className="std-mono text-[10px] text-[var(--ink-3)]">{m.value} {challenge.rules?.targetUnit}</span>
                  {reached && (
                    <span className="std-mono text-[10px]" style={{ color: 'var(--signal)' }}>{m.reachedBy.length} reached</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="std-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--line)]">
            <p className="std-kicker text-[var(--ink-3)]">Leaderboard</p>
          </div>
          <div>
            {leaderboard.map((entry, idx) => {
              const name = entry.userId?.name || "Member";
              const avatar = entry.userId?.avatar;
              const val = (() => {
                if (challenge.type === "streak") return entry.progress?.currentStreak || 0;
                if (challenge.type === "consistency") return entry.progress?.completionRate || 0;
                return entry.progress?.currentValue || 0;
              })();
              const pct = Math.min(100, Math.round((val / (challenge.rules?.targetValue || 1)) * 100));
              const isMe = (entry.userId?._id || entry.userId)?.toString() === currentUserId?.toString();
              const isCompleted = entry.status === "completed";

              return (
                <div
                  key={entry.userId?._id || entry.userId}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-[var(--line)] last:border-0 transition-colors ${
                    isMe ? 'bg-[color-mix(in_srgb,var(--signal)_5%,transparent)]' : 'hover:bg-[var(--surface-2)]'
                  }`}
                  style={isMe ? { outline: '1px solid var(--signal)', outlineOffset: '-1px' } : {}}
                >
                  <span className="w-5 text-center std-mono text-[11px] text-[var(--ink-3)] flex-shrink-0">
                    {entry.rank === 1 ? <Medal size={15} weight="fill" style={{ color: '#f59e0b' }} /> :
                     entry.rank === 2 ? <Medal size={15} weight="fill" style={{ color: '#94a3b8' }} /> :
                     entry.rank === 3 ? <Medal size={15} weight="fill" style={{ color: '#b45309' }} /> :
                     entry.rank}
                  </span>

                  {avatar ? (
                    <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-[var(--ink-3)]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm truncate ${isMe ? 'text-[var(--ink)] font-semibold' : 'text-[var(--ink)]'}`}>
                        {name}{isMe && " (you)"}
                      </p>
                      {isCompleted && <CheckCircle size={12} weight="duotone" className="flex-shrink-0" style={{ color: 'var(--signal)' }} />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-px bg-[var(--line)] overflow-hidden">
                        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: isCompleted ? 'var(--signal)' : 'var(--signal)' }} />
                      </div>
                      <span className="std-mono text-[10px] text-[var(--ink-3)] w-7 text-right">{pct}%</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="std-num text-sm text-[var(--ink)]">{val}</p>
                    <p className="std-mono text-[10px] text-[var(--ink-3)]">
                      {challenge.type === "streak" ? "d streak" : challenge.type === "consistency" ? "%" : (challenge.rules?.targetUnit || "")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leaderboard.length === 0 && challenge.settings?.showLeaderboard && (
        <div className="std-card p-8 text-center">
          <ChartBar size={32} weight="duotone" className="mx-auto mb-3 text-[var(--ink-3)]" />
          <p className="std-mono text-[11px] text-[var(--ink-3)]">No leaderboard data yet. Join the challenge to see rankings.</p>
        </div>
      )}

      {/* ── Stats footer ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--line)] rounded-[var(--r-card)] overflow-hidden">
        {[
          { label: "Participants", value: challenge.stats?.participantCount || 0 },
          { label: "Completed",    value: challenge.stats?.completedCount || 0 },
          { label: "Avg Progress", value: challenge.stats?.averageProgress || 0 },
          { label: "Top Streak",   value: challenge.stats?.topStreak || 0 },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] px-4 py-4 text-center">
            <p className="std-num text-xl text-[var(--ink)]">{s.value}</p>
            <p className="std-kicker text-[10px] text-[var(--ink-3)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <ChallengeJoinModal
        isOpen={joinModalOpen}
        challenge={challenge}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
    </div>
    </SkeletonTransition>
  );
};

export default ChallengeDetailPage;
