import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PersonIcon,
  CalendarIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ChallengeJoinModal from "../components/ui/ChallengeJoinModal";

/* ── type metadata ── */
const TYPE_META = {
  streak: { icon: "🔥", label: "Streak", unit: "days" },
  cumulative: { icon: "📈", label: "Cumulative", unit: "completions" },
  consistency: { icon: "📅", label: "Consistency", unit: "%" },
  team_goal: { icon: "🤝", label: "Team Goal", unit: "total" },
  head_to_head: { icon: "⚔️", label: "Head to Head", unit: "" },
};

const STATUS_THEME = {
  upcoming: { bg: "bg-blue-500/10", text: "text-blue-600", dot: "bg-blue-500" },
  active: { bg: "bg-green-500/10", text: "text-green-600", dot: "bg-green-500" },
  completed: { bg: "bg-gray-500/10", text: "text-gray-500", dot: "bg-gray-400" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
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

  /* ── loading / error states ── */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-[var(--color-surface-hover)] rounded" />
          <div className="h-32 bg-[var(--color-surface-hover)] rounded-2xl" />
          <div className="h-64 bg-[var(--color-surface-hover)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => navigate(`/app/groups/${groupId}`)}
          className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to group
        </button>
        <div className="text-center py-16">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan">{error || "Challenge not found"}</p>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[challenge.type] || { icon: "🏆", label: challenge.type, unit: "" };
  const theme = STATUS_THEME[challenge.status] || STATUS_THEME.upcoming;
  const leaderboard = challenge.leaderboard || [];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* ── Back nav ── */}
      <button
        onClick={() => navigate(`/app/groups/${groupId}`)}
        className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to group
      </button>

      {/* ── Header card ── */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-garamond font-bold text-[var(--color-text-primary)]">
                {challenge.title}
              </h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-spartan font-medium px-2.5 py-1 rounded-lg ${theme.bg} ${theme.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                {challenge.status}
              </span>
            </div>
            {challenge.description && (
              <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-1">
                {challenge.description}
              </p>
            )}

            {/* info row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-tertiary)] font-spartan mt-3">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {fmtDate(challenge.startDate)} — {fmtDate(challenge.endDate)}
              </span>
              {challenge.daysRemaining != null && challenge.status === "active" && (
                <span className="font-medium text-[var(--color-text-secondary)]">{challenge.daysRemaining}d left</span>
              )}
              <span className="flex items-center gap-1">
                <PersonIcon className="w-3 h-3" />
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
                  className="text-xs font-spartan font-medium px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="text-xs font-spartan font-medium px-4 py-2 rounded-lg bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-50"
                >
                  Join Challenge
                </button>
              )
            )}
            {isCreator && challenge.status !== "completed" && challenge.status !== "cancelled" && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="text-[10px] font-spartan text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors disabled:opacity-50"
              >
                Cancel challenge
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Rules & matching info ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rules card */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            Rules
          </h3>
          <dl className="space-y-2 text-sm font-spartan">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">Target</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">{challenge.rules?.targetValue} {challenge.rules?.targetUnit}</dd>
            </div>
            {challenge.rules?.minimumDailyValue && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-tertiary)]">Min daily</dt>
                <dd className="font-medium text-[var(--color-text-primary)]">{challenge.rules.minimumDailyValue}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">Grace period</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">{challenge.rules?.gracePeriodHours || 4}h</dd>
            </div>
            {challenge.rules?.allowMakeupDays && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-tertiary)]">Makeup days</dt>
                <dd className="font-medium text-green-600">Allowed</dd>
              </div>
            )}
            {challenge.settings?.maxParticipants && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-tertiary)]">Max participants</dt>
                <dd className="font-medium text-[var(--color-text-primary)]">{challenge.settings.maxParticipants}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Habit matching card */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            Habit Matching
          </h3>
          <dl className="space-y-2 text-sm font-spartan">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">Mode</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">
                {MATCH_MODE_LABELS[challenge.habitMatchMode] || challenge.habitMatchMode || "Single"}
              </dd>
            </div>
            {challenge.habitMatchMode === "minimum" && challenge.habitMatchMinimum && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-tertiary)]">Minimum</dt>
                <dd className="font-medium text-[var(--color-text-primary)]">{challenge.habitMatchMinimum} habits</dd>
              </div>
            )}
            {challenge.habitSlot && (
              <div>
                <dt className="text-[var(--color-text-tertiary)] mb-1">Habit description</dt>
                <dd className="text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] rounded-lg px-3 py-2 text-xs">
                  {challenge.habitSlot}
                </dd>
              </div>
            )}
            {challenge.habitId && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-tertiary)]">Linked habit</dt>
                <dd className="font-medium text-[var(--color-text-primary)]">
                  {challenge.habitId?.icon} {challenge.habitId?.name || "Workspace habit"}
                </dd>
              </div>
            )}
          </dl>
          {challenge.reward && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]/10">
              <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">Reward</p>
              <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)] mt-0.5">{challenge.reward}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Team progress (team_goal only) ── */}
      {challenge.type === "team_goal" && (
        <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            Team Progress
          </h3>
          <div className="flex items-center justify-between text-sm font-spartan mb-2">
            <span className="text-[var(--color-text-primary)] font-medium">{teamTotal()} / {challenge.rules?.targetValue} {challenge.rules?.targetUnit}</span>
            <span className="text-[var(--color-text-tertiary)]">{teamPercent()}%</span>
          </div>
          <div className="h-3 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-brand-600)] rounded-full transition-all duration-500"
              style={{ width: `${teamPercent()}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Milestones ── */}
      {challenge.milestones?.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            Milestones
          </h3>
          <div className="space-y-2">
            {challenge.milestones.map((m, i) => {
              const reached = m.reachedBy?.length > 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${reached ? "bg-green-500/20 text-green-600" : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"}`}>
                    {reached ? <CheckCircledIcon className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-spartan ${reached ? "text-[var(--color-text-primary)] font-medium" : "text-[var(--color-text-secondary)]"}`}>
                      {m.label}
                    </p>
                  </div>
                  <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                    {m.value} {challenge.rules?.targetUnit}
                  </span>
                  {reached && (
                    <span className="text-[10px] font-spartan text-green-600">
                      {m.reachedBy.length} reached
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Leaderboard ── */}
      {leaderboard.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
            Leaderboard
          </h3>
          <div className="space-y-2">
            {leaderboard.map((entry) => {
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
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isMe ? "bg-[var(--color-brand-600)]/5 border border-[var(--color-brand-600)]/20" : "hover:bg-[var(--color-surface-hover)]"}`}
                >
                  {/* rank */}
                  <span className="w-6 text-center text-sm font-spartan font-bold text-[var(--color-text-tertiary)]">
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                  </span>

                  {/* avatar */}
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center flex-shrink-0">
                      <PersonIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    </div>
                  )}

                  {/* name + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-spartan truncate ${isMe ? "font-bold text-[var(--color-text-primary)]" : "font-medium text-[var(--color-text-primary)]"}`}>
                        {name}{isMe && " (you)"}
                      </p>
                      {isCompleted && (
                        <CheckCircledIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-[var(--color-brand-600)]"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] w-8 text-right">{pct}%</span>
                    </div>
                  </div>

                  {/* value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-spartan font-bold text-[var(--color-text-primary)]">
                      {val}
                    </p>
                    <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                      {challenge.type === "streak" && "day streak"}
                      {challenge.type === "consistency" && "%"}
                      {challenge.type !== "streak" && challenge.type !== "consistency" && (challenge.rules?.targetUnit || "")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state when no leaderboard ── */}
      {leaderboard.length === 0 && challenge.settings?.showLeaderboard && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
            No leaderboard data yet. Join the challenge to see rankings!
          </p>
        </div>
      )}

      {/* ── Stats footer ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Participants", value: challenge.stats?.participantCount || 0 },
          { label: "Completed", value: challenge.stats?.completedCount || 0 },
          { label: "Avg Progress", value: challenge.stats?.averageProgress || 0 },
          { label: "Top Streak", value: challenge.stats?.topStreak || 0 },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-center">
            <p className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">{s.value}</p>
            <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Join Modal ── */}
      <ChallengeJoinModal
        isOpen={joinModalOpen}
        challenge={challenge}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};

export default ChallengeDetailPage;
