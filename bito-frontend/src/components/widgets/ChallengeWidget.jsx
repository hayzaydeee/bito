import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PersonIcon,
  StarIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../../services/api";
import ChallengeCreateModal from "../ui/ChallengeCreateModal";
import ChallengeJoinModal from "../ui/ChallengeJoinModal";
import { useAuth } from "../../contexts/AuthContext";

/* ── type metadata ── */
const TYPE_META = {
  streak: { icon: "🔥", label: "Streak" },
  cumulative: { icon: "📈", label: "Cumulative" },
  consistency: { icon: "📅", label: "Consistency" },
  team_goal: { icon: "🤝", label: "Team Goal" },
  head_to_head: { icon: "⚔️", label: "Head to Head" },
};

const STATUS_COLORS = {
  upcoming: "bg-blue-500/10 text-blue-600",
  active: "bg-green-500/10 text-green-600",
  completed: "bg-gray-500/10 text-gray-500",
  cancelled: "bg-red-500/10 text-red-500",
};

const ChallengeWidget = ({ workspaceId, className = "" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?._id || user?.id;
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinChallenge, setJoinChallenge] = useState(null); // challenge to join via modal
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchChallenges();
  }, [workspaceId]);

  const fetchChallenges = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const res = await groupsAPI.getChallenges(workspaceId);
      if (res.success) {
        setChallenges(res.challenges || []);
      } else {
        setError("Failed to load challenges");
      }
    } catch {
      setError("Error loading challenges");
    } finally {
      setLoading(false);
    }
  };

  const isParticipant = (c) =>
    c.participants?.some(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    );

  const getMyProgress = (c) => {
    const p = c.participants?.find(
      (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
    );
    return p?.progress || {};
  };

  const handleJoin = (challenge) => {
    setJoinChallenge(challenge);
  };

  const handleJoinSuccess = () => {
    setJoinChallenge(null);
    fetchChallenges();
  };

  const handleLeave = async (challengeId) => {
    try {
      setActionLoading(challengeId);
      const res = await groupsAPI.leaveChallenge(challengeId);
      if (res.success) fetchChallenges();
    } catch {
      setError("Failed to leave challenge");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreated = () => {
    setIsCreateModalOpen(false);
    fetchChallenges();
  };

  /* ── progress bar value ── */
  const progressPercent = (challenge) => {
    if (challenge.type === "team_goal") {
      const total = challenge.participants?.reduce(
        (s, p) => s + (p.progress?.currentValue || 0),
        0
      );
      return Math.min(100, Math.round(((total || 0) / (challenge.rules?.targetValue || 1)) * 100));
    }
    const my = getMyProgress(challenge);
    return Math.min(
      100,
      Math.round(((my.currentValue || 0) / (challenge.rules?.targetValue || 1)) * 100)
    );
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-[var(--color-surface-hover)] rounded" />
          <div className="h-16 bg-[var(--color-surface-hover)] rounded-xl" />
          <div className="h-16 bg-[var(--color-surface-hover)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
          {challenges.length} challenge{challenges.length !== 1 && "s"}
        </p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-xs font-spartan font-medium transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Challenge
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-spartan mb-3">{error}</p>
      )}

      {challenges.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏆</p>
          <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            No challenges yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto">
            Create a streak, cumulative, or team challenge to motivate your group.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {challenges.map((c) => {
            const meta = TYPE_META[c.type] || { icon: "🏆", label: c.type };
            const joined = isParticipant(c);
            const pct = progressPercent(c);

            return (
              <li
                key={c._id}
                onClick={() => navigate(`/app/groups/${workspaceId}/challenges/${c._id}`)}
                className="p-4 rounded-2xl border bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                        {c.title || c.name}
                      </p>
                      <span className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-md ${STATUS_COLORS[c.status] || ""}`}>
                        {c.status}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5 line-clamp-1">
                        {c.description}
                      </p>
                    )}

                    {/* progress bar */}
                    {(c.status === "active" || c.status === "completed") && joined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] font-spartan text-[var(--color-text-tertiary)] mb-1">
                          <span>{pct}%</span>
                          <span>
                            {c.rules?.targetValue} {c.rules?.targetUnit}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-brand-600)] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* meta row */}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-tertiary)] font-spartan">
                      <span className="flex items-center gap-1">
                        <PersonIcon className="w-3 h-3" />
                        {c.stats?.participantCount || c.participants?.length || 0}
                      </span>
                      {c.daysRemaining != null && c.status === "active" && (
                        <span>{c.daysRemaining}d left</span>
                      )}
                    </div>
                  </div>

                  {/* action */}
                  <div className="flex-shrink-0">
                    {c.status === "active" || c.status === "upcoming" ? (
                      joined ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeave(c._id); }}
                          disabled={actionLoading === c._id}
                          className="text-xs font-spartan font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleJoin(c); }}
                          disabled={actionLoading === c._id}
                          className="text-xs font-spartan font-medium px-3 py-1.5 rounded-lg bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)] hover:bg-[var(--color-brand-600)]/20 transition-colors disabled:opacity-50"
                        >
                          Join
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ChallengeCreateModal
        isOpen={isCreateModalOpen}
        workspaceId={workspaceId}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreated}
      />

      <ChallengeJoinModal
        isOpen={!!joinChallenge}
        challenge={joinChallenge}
        onClose={() => setJoinChallenge(null)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};

export default ChallengeWidget;
