import { useState } from "react";
import {
  Fire, TrendUp, CalendarBlank, Handshake, Sword, Clock,
  DotsThree, X, Pencil, ArrowRight,
} from "@phosphor-icons/react";
import ChallengeJoinModal from "../../ui/ChallengeJoinModal";

const TYPE_META = {
  streak:       { Icon: Fire,          label: "Streak",       color: "#ff7a3c" },
  cumulative:   { Icon: TrendUp,       label: "Cumulative",   color: "#6f9bff" },
  consistency:  { Icon: CalendarBlank, label: "Consistency",  color: "#a78bfa" },
  team_goal:    { Icon: Handshake,     label: "Team Goal",    color: "#36d6c3" },
  head_to_head: { Icon: Sword,         label: "Head to Head", color: "#ff5d73" },
};

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#cd7c2f"];

function daysLeft(d) { return d ? Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000)) : null; }
function daysUntil(d) { return d ? Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000)) : null; }

function sortKey(p, type) {
  if (type === "streak") return p.progress?.currentStreak || 0;
  if (type === "consistency") return p.progress?.completionRate || 0;
  return p.progress?.currentValue || 0;
}

function pct(p, challenge) {
  const t = challenge.rules?.targetValue || 1;
  if (challenge.type === "streak") return Math.min(100, Math.round(((p.progress?.currentStreak || 0) / t) * 100));
  if (challenge.type === "consistency") return Math.min(100, Math.round(p.progress?.completionRate || 0));
  return Math.min(100, Math.round(((p.progress?.currentValue || 0) / t) * 100));
}

function metricLabel(p, type, unit) {
  if (type === "streak") return `${p.progress?.currentStreak || 0}d`;
  if (type === "consistency") return `${Math.round(p.progress?.completionRate || 0)}%`;
  return `${(p.progress?.currentValue || 0).toLocaleString()} ${unit || ""}`.trim();
}

function UserAvatar({ user, size = "w-7 h-7", radius = "rounded-[7px]", rankColor = null, isOwn = false }) {
  const name = user?.name || user?.email || "?";
  const src = user?.avatar;
  const bg = rankColor ? `${rankColor}20` : "var(--surface-2)";
  const fg = isOwn ? "var(--signal)" : (rankColor || "var(--ink)");
  return src ? (
    <img src={src} alt={name} className={`${size} ${radius} object-cover flex-shrink-0`} />
  ) : (
    <div className={`${size} ${radius} flex items-center justify-center text-[10px] grp-display font-bold flex-shrink-0`}
         style={{ background: bg, color: fg }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const ChallengeCard = ({
  challenge: c, currentUserId, myHabits = [],
  onJoin, onLeave, onCancel, canCancel = false,
  onViewDetail, actionLoading,
}) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showRelinkModal, setShowRelinkModal] = useState(false);

  const { Icon, color } = TYPE_META[c.type] || { Icon: Fire, label: c.type, color: "var(--signal)" };
  const isParticipant = c.participants?.some((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
  const myP = c.participants?.find((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
  const isLoading = actionLoading === c._id;
  const remaining = daysLeft(c.endDate);
  const startsIn = daysUntil(c.startDate);
  const participantCount = c.participants?.length || 0;

  const handleCancelConfirm = async () => {
    if (!onCancel) return;
    setCancelError("");
    try { await onCancel(c._id); }
    catch (e) {
      setCancelError(e.message || "Failed to cancel");
      setConfirmCancel(false);
      setTimeout(() => setCancelError(""), 4000);
    }
  };

  const sp = (fn) => (e) => { e.stopPropagation(); fn(e); };

  const cardBase = `rounded-[14px] border border-[var(--line-2)] bg-[var(--surface)] overflow-hidden cursor-pointer transition-all duration-200 hover:border-[var(--line-3)] hover:-translate-y-px hover:shadow-lg`;

  // ── UPCOMING ────────────────────────────────────────────────────────
  if (c.status === "upcoming") {
    return (
      <div className={cardBase} onClick={() => onViewDetail?.(c)}>
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Clock size={16} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate">{c.title}</p>
              <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5">
                Starts in {startsIn ?? "?"} day{startsIn !== 1 ? "s" : ""} · {participantCount} joined
              </p>
              {cancelError && <p className="grp-mono text-[10px] text-[var(--rose)] mt-1">{cancelError}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {!isParticipant && c.type !== "head_to_head" && (
                <button onClick={sp(() => onJoin?.(c))} disabled={isLoading} className="grp-btn grp-btn--sm">
                  {isLoading ? "…" : "Join"}
                </button>
              )}
              {canCancel && !confirmCancel && (
                <button onClick={sp(() => setConfirmCancel(true))} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors p-1">
                  <DotsThree size={16} weight="bold" />
                </button>
              )}
              {canCancel && confirmCancel && (
                <div className="flex items-center gap-1.5">
                  <span className="grp-mono text-[10px] text-[var(--ink-2)]">Cancel?</span>
                  <button onClick={sp(handleCancelConfirm)} className="grp-mono text-[10px] font-bold text-[var(--rose)] hover:underline">Yes</button>
                  <button onClick={sp(() => setConfirmCancel(false))} className="text-[var(--ink-3)]"><X size={11} weight="bold" /></button>
                </div>
              )}
              <ArrowRight size={13} className="text-[var(--ink-3)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPLETED ───────────────────────────────────────────────────────
  if (c.status === "completed" || c.status === "cancelled") {
    const top3 = c.stats?.finalLeaderboard?.slice(0, 3) ||
      [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type)).slice(0, 3);

    return (
      <div className={`${cardBase} opacity-70 hover:opacity-100`} onClick={() => onViewDetail?.(c)}>
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}14` }}>
                <Icon size={15} weight="duotone" style={{ color: `${color}99` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate">{c.title}</p>
                {top3.length > 0 && (
                  <div className="flex items-center gap-3 mt-1">
                    {top3.map((p, i) => {
                      const name = p.displayName || p.userId?.name || p.userId?.email || "?";
                      return (
                        <span key={i} className="grp-mono text-[11px] text-[var(--ink-2)]">
                          {MEDALS[i]} {name.split(" ")[0]}
                        </span>
                      );
                    })}
                    {(c.participants?.length || 0) > 3 && (
                      <span className="grp-mono text-[10px] text-[var(--ink-3)]">+{c.participants.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <ArrowRight size={14} className="text-[var(--ink-3)] flex-shrink-0 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE — TEAM GOAL ─────────────────────────────────────────────
  if (c.type === "team_goal") {
    const totalValue = c.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0;
    const teamPct = Math.min(100, Math.round((totalValue / (c.rules?.targetValue || 1)) * 100));
    const ownHasNoHabit = isParticipant && myP?.role !== "organizer" && !myP?.linkedHabitIds?.length;

    return (
      <div className={cardBase} onClick={() => onViewDetail?.(c)}>
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                <Icon size={16} weight="duotone" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate">{c.title}</p>
                <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {remaining}d left
                  </span>
                  {" · "}{participantCount} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {!isParticipant && (
                <button onClick={sp(() => onJoin?.(c))} disabled={isLoading} className="grp-btn grp-btn--sm">
                  {isLoading ? "…" : "Join"}
                </button>
              )}
              <ArrowRight size={13} className="text-[var(--ink-3)]" />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="grp-mono text-[10px] text-[var(--ink-3)]">
                {totalValue.toLocaleString()} / {Number(c.rules?.targetValue || 0).toLocaleString()} {c.rules?.targetUnit || ""}
              </p>
              <span className="grp-mono text-[11px] font-bold" style={{ color }}>{teamPct}%</span>
            </div>
            <div className="grp-meter" style={{ height: "8px" }}>
              <i style={{ width: `${teamPct}%`, transition: "width .5s ease" }} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {c.participants?.slice(0, 5).map((p, i) => (
                <UserAvatar key={i} user={p.userId || {}} size="w-7 h-7" radius="rounded-full" style={{ border: "2px solid var(--surface)" }} />
              ))}
            </div>
            <span className="grp-mono text-[10px] text-[var(--ink-3)]">
              {participantCount} contributor{participantCount !== 1 ? "s" : ""}
            </span>
          </div>

          {ownHasNoHabit && (
            <button onClick={sp(() => setShowRelinkModal(true))} className="mt-3 w-full text-left grp-mono text-[11px] text-[var(--signal)] hover:underline">
              Link a habit to contribute →
            </button>
          )}
        </div>

        {showRelinkModal && (
          <ChallengeJoinModal
            isOpen={showRelinkModal} challenge={c} mode="relink"
            initialHabitIds={myP?.linkedHabitIds || []}
            onClose={() => setShowRelinkModal(false)}
            onSuccess={() => setShowRelinkModal(false)}
          />
        )}
      </div>
    );
  }

  // ── ACTIVE — STREAK / CONSISTENCY / CUMULATIVE ─────────────────────
  const sorted = [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type));
  const myRank = sorted.findIndex((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
  const preview = sorted.slice(0, 3);
  const hiddenCount = Math.max(0, sorted.length - 3);

  return (
    <div className={cardBase} onClick={() => onViewDetail?.(c)}>
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} weight="duotone" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate">{c.title}</p>
              <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {remaining}d left
                </span>
                {" · "}{participantCount} participants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {!isParticipant && c.type !== "head_to_head" && (
              <button onClick={sp(() => onJoin?.(c))} disabled={isLoading} className="grp-btn grp-btn--sm">
                {isLoading ? "…" : "Join"}
              </button>
            )}
            {isParticipant && myRank >= 0 && (
              <span className="grp-mono text-[11px] font-bold text-[var(--ink-3)]">
                {myRank < 3 ? MEDALS[myRank] : `#${myRank + 1}`}
              </span>
            )}
            <ArrowRight size={13} className="text-[var(--ink-3)]" />
          </div>
        </div>

        {preview.length > 0 && (
          <div className="space-y-2">
            {preview.map((p, i) => {
              const info = p.userId || {};
              const name = info.name || info.email || "Member";
              const isOwn = (info._id || info)?.toString() === currentUserId?.toString();
              const habitName = typeof p.linkedHabitIds?.[0] === "object" ? p.linkedHabitIds[0]?.name : null;
              const rowPct = pct(p, c);
              const metricVal = metricLabel(p, c.type, c.rules?.targetUnit);

              return (
                <div key={(info._id || info)?.toString() || i} className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-[13px] leading-none flex-shrink-0">
                    {MEDALS[i]}
                  </span>
                  <UserAvatar user={info} size="w-7 h-7" radius="rounded-[7px]" rankColor={MEDAL_COLORS[i]} isOwn={isOwn} />
                  <div className="w-16 flex-shrink-0 min-w-0">
                    <p className={`text-xs truncate font-medium ${isOwn ? "text-[var(--signal)]" : "text-[var(--ink)]"}`}>
                      {name.split(" ")[0]}
                    </p>
                    {habitName && (
                      <p className="grp-mono text-[8px] text-[var(--ink-3)] truncate leading-tight">&ldquo;{habitName}&rdquo;</p>
                    )}
                  </div>
                  <div className="grp-meter flex-1">
                    <i style={{ width: `${rowPct}%` }} />
                  </div>
                  <span className="grp-mono text-[10px] font-bold text-[var(--ink)] w-10 text-right flex-shrink-0">
                    {metricVal}
                  </span>
                  <div className="w-5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isOwn && (
                      <button onClick={sp(() => setShowRelinkModal(true))} className="text-[var(--ink-3)] hover:text-[var(--signal)] transition-colors" title="Change habit">
                        <Pencil size={11} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <p className="grp-mono text-[10px] text-[var(--ink-3)] pl-8">+{hiddenCount} more</p>
            )}
          </div>
        )}
      </div>

      {showRelinkModal && (
        <ChallengeJoinModal
          isOpen={showRelinkModal} challenge={c} mode="relink"
          initialHabitIds={myP?.linkedHabitIds || []}
          onClose={() => setShowRelinkModal(false)}
          onSuccess={() => setShowRelinkModal(false)}
        />
      )}
    </div>
  );
};

export default ChallengeCard;
