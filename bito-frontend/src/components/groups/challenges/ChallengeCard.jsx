import { useState } from "react";
import {
  Fire, TrendUp, CalendarBlank, Handshake, Sword, Clock,
  DotsThree, X, Pencil, ArrowRight, Trophy,
} from "@phosphor-icons/react";
import ChallengeJoinModal from "../../ui/ChallengeJoinModal";

const TYPE_META = {
  streak:       { Icon: Fire,          label: "Streak",       color: "#ff7a3c" },
  cumulative:   { Icon: TrendUp,       label: "Cumulative",   color: "#6f9bff" },
  consistency:  { Icon: CalendarBlank, label: "Consistency",  color: "#a78bfa" },
  team_goal:    { Icon: Handshake,     label: "Team Goal",    color: "#36d6c3" },
  head_to_head: { Icon: Sword,         label: "Head to Head", color: "#ff5d73" },
};

const MEDALS    = ["🥇", "🥈", "🥉"];
const MEDAL_BG  = ["#f59e0b", "#94a3b8", "#cd7c2f"];

function daysLeft(d)  { return d ? Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000)) : null; }
function daysUntil(d) { return d ? Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000)) : null; }

function sortKey(p, type) {
  if (type === "streak")      return p.progress?.currentStreak  || 0;
  if (type === "consistency") return p.progress?.completionRate || 0;
  return p.progress?.currentValue || 0;
}

function rowPct(p, c) {
  const t = c.rules?.targetValue || 1;
  if (c.type === "streak")      return Math.min(100, Math.round(((p.progress?.currentStreak  || 0) / t) * 100));
  if (c.type === "consistency") return Math.min(100, Math.round( p.progress?.completionRate  || 0));
  return Math.min(100, Math.round(((p.progress?.currentValue || 0) / t) * 100));
}

function statLabel(p, type, unit) {
  if (type === "streak")      return `${p.progress?.currentStreak || 0}d`;
  if (type === "consistency") return `${Math.round(p.progress?.completionRate || 0)}%`;
  const v = p.progress?.currentValue || 0;
  return unit ? `${v.toLocaleString()} ${unit}` : v.toLocaleString();
}

function Avatar({ user, size = "w-6 h-6", radius = "rounded-[6px]", bg = null, fg = null }) {
  const name = (user?.name || user?.email || "?");
  return user?.avatar ? (
    <img src={user.avatar} alt={name} className={`${size} ${radius} object-cover flex-shrink-0`} />
  ) : (
    <div className={`${size} ${radius} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}
         style={{ background: bg ?? "var(--surface-2)", color: fg ?? "var(--ink)" }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────────────── */

const ChallengeCard = ({
  challenge: c, currentUserId, myHabits = [],
  onJoin, onLeave, onCancel, canCancel = false,
  onViewDetail, actionLoading,
}) => {
  const [hovered,       setHovered]       = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError,   setCancelError]   = useState("");
  const [showRelink,    setShowRelink]    = useState(false);

  const { Icon, color } = TYPE_META[c.type] || { Icon: Trophy, color: "var(--signal)" };
  const myP           = c.participants?.find((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
  const isParticipant = !!myP;
  const isLoading     = actionLoading === c._id;
  const remaining     = daysLeft(c.endDate);
  const startsIn      = daysUntil(c.startDate);
  const count         = c.participants?.length || 0;

  const sp = (fn) => (e) => { e.stopPropagation(); fn(e); };

  const handleCancelConfirm = async () => {
    setCancelError("");
    try { await onCancel?.(c._id); }
    catch (e) {
      setCancelError(e.message || "Failed to cancel");
      setConfirmCancel(false);
      setTimeout(() => setCancelError(""), 4000);
    }
  };

  /* Hover glow uses the type color — Tailwind can't do dynamic shadow colors */
  const hoverStyle = {
    transition: "box-shadow .2s ease, transform .2s ease",
    boxShadow: hovered
      ? `0 6px 28px ${color}28, 0 1px 6px rgba(0,0,0,0.06)`
      : "0 1px 3px rgba(0,0,0,0.05)",
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
  };

  const cardCls = `rounded-[14px] bg-[var(--surface)] overflow-hidden cursor-pointer border ${
    hovered ? "border-[var(--line-3)]" : "border-[var(--line-2)]"
  }`;

  const hover = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  /* ── helper: leaderboard rows ─────────────────────────────── */
  const sorted   = ["active"].includes(c.status) ? [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type)) : [];
  const preview  = sorted.slice(0, 3);
  const hidden   = Math.max(0, sorted.length - 3);
  const myRankIdx = sorted.findIndex((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());

  const leaderboardRows = () => preview.map((p, i) => {
    const info  = p.userId || {};
    const name  = info.name || info.email || "Member";
    const isOwn = (info._id || info)?.toString() === currentUserId?.toString();
    const habit = typeof p.linkedHabitIds?.[0] === "object" ? p.linkedHabitIds[0]?.name : null;
    const pct   = rowPct(p, c);
    const stat  = statLabel(p, c.type, c.rules?.targetUnit);

    return (
      <div
        key={(info._id || info)?.toString() || i}
        className={`flex items-center gap-2 px-3 py-[7px] ${isOwn ? "rounded-[8px]" : ""}`}
        style={isOwn ? { background: `${color}0d` } : {}}
      >
        <span className="text-[12px] leading-none w-4 flex-shrink-0">{MEDALS[i]}</span>
        <Avatar user={info} size="w-5 h-5" radius="rounded-[5px]"
                bg={`${MEDAL_BG[i]}20`} fg={isOwn ? color : MEDAL_BG[i]} />
        <div className="w-14 flex-shrink-0 min-w-0">
          <p className="text-[11px] font-semibold truncate leading-none"
             style={{ color: isOwn ? color : "var(--ink)" }}>
            {name.split(" ")[0]}
          </p>
          {habit && (
            <p className="grp-mono text-[8px] text-[var(--ink-3)] truncate mt-0.5 leading-none">&ldquo;{habit}&rdquo;</p>
          )}
        </div>
        <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--line-2)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isOwn ? color : `${color}70` }} />
        </div>
        <span className="grp-mono text-[10px] font-bold w-8 text-right flex-shrink-0"
              style={{ color: isOwn ? color : "var(--ink-2)" }}>
          {stat}
        </span>
        <div className="w-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {isOwn && (
            <button onClick={sp(() => setShowRelink(true))} title="Change habit"
                    className="text-[var(--ink-3)] hover:opacity-60 transition-opacity">
              <Pencil size={10} weight="bold" />
            </button>
          )}
        </div>
      </div>
    );
  });

  /* ── UPCOMING ─────────────────────────────────────────────── */
  if (c.status === "upcoming") {
    return (
      <div className={cardCls} style={hoverStyle} {...hover} onClick={() => onViewDetail?.(c)}>
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
            <Clock size={15} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate leading-snug">{c.title}</p>
            {cancelError && <p className="grp-mono text-[10px] text-[var(--rose)] mt-0.5">{cancelError}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {!isParticipant && c.type !== "head_to_head" && (
              <button onClick={sp(() => onJoin?.(c))} disabled={isLoading} className="grp-btn grp-btn--sm">
                {isLoading ? "…" : "Join"}
              </button>
            )}
            {canCancel && !confirmCancel && (
              <button onClick={sp(() => setConfirmCancel(true))} className="text-[var(--ink-3)] hover:text-[var(--ink)] p-1 transition-colors">
                <DotsThree size={15} weight="bold" />
              </button>
            )}
            {canCancel && confirmCancel && (
              <div className="flex items-center gap-1.5">
                <span className="grp-mono text-[10px] text-[var(--ink-2)]">Cancel?</span>
                <button onClick={sp(handleCancelConfirm)} className="grp-mono text-[10px] font-bold text-[var(--rose)] hover:underline">Yes</button>
                <button onClick={sp(() => setConfirmCancel(false))} className="text-[var(--ink-3)]"><X size={10} weight="bold" /></button>
              </div>
            )}
          </div>
        </div>
        <div className="mx-5 mb-4 px-3 py-2.5 rounded-[10px] flex items-center justify-between" style={{ background: `${color}0d` }}>
          <span className="grp-mono text-[11px] text-[var(--ink-2)]">
            Starts in{" "}
            <span className="font-bold" style={{ color }}>{startsIn ?? "?"} day{startsIn !== 1 ? "s" : ""}</span>
          </span>
          <span className="grp-mono text-[10px] text-[var(--ink-3)]">{count} joined</span>
          <ArrowRight size={12} style={{ color }} />
        </div>
      </div>
    );
  }

  /* ── COMPLETED ────────────────────────────────────────────── */
  if (c.status === "completed" || c.status === "cancelled") {
    const top3 = c.stats?.finalLeaderboard?.slice(0, 3)
      ?? [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type)).slice(0, 3);
    const winner = top3[0];
    const winnerName = (winner?.displayName || winner?.userId?.name || winner?.userId?.email || "—").split(" ")[0];

    return (
      <div className={`${cardCls} opacity-75 hover:opacity-100`}
           style={{ ...hoverStyle, transition: hoverStyle.transition + ", opacity .2s ease" }}
           {...hover} onClick={() => onViewDetail?.(c)}>
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
            <Icon size={14} weight="duotone" style={{ color: `${color}80` }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="grp-display text-[16px] font-bold text-[var(--ink)] truncate leading-snug">{c.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {winner && <span className="grp-mono text-[11px] text-[var(--ink-2)]">🥇 {winnerName}</span>}
              {top3.slice(1).map((p, i) => {
                const n = (p.displayName || p.userId?.name || "?").split(" ")[0];
                return <span key={i} className="grp-mono text-[11px] text-[var(--ink-3)]">{MEDALS[i + 1]} {n}</span>;
              })}
              {count > 3 && <span className="grp-mono text-[10px] text-[var(--ink-3)]">+{count - 3}</span>}
            </div>
          </div>
          <ArrowRight size={13} className="text-[var(--ink-3)] flex-shrink-0" />
        </div>
      </div>
    );
  }

  /* ── ACTIVE — TEAM GOAL ───────────────────────────────────── */
  if (c.type === "team_goal") {
    const total   = c.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0;
    const teamPct = Math.min(100, Math.round((total / (c.rules?.targetValue || 1)) * 100));
    const noHabit = isParticipant && myP?.role !== "organizer" && !myP?.linkedHabitIds?.length;

    return (
      <div className={cardCls} style={hoverStyle} {...hover} onClick={() => onViewDetail?.(c)}>
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
            <Icon size={15} weight="duotone" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate leading-snug">{c.title}</p>
            <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {remaining}d left · {count} members
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {!isParticipant && (
              <button onClick={sp(() => onJoin?.(c))} disabled={isLoading} className="grp-btn grp-btn--sm">
                {isLoading ? "…" : "Join"}
              </button>
            )}
            <ArrowRight size={12} className="text-[var(--ink-3)]" />
          </div>
        </div>
        <div className="mx-5 mb-3">
          <div className="flex items-end justify-between mb-1.5">
            <p className="grp-mono text-[10px] text-[var(--ink-3)]">
              {total.toLocaleString()} / {Number(c.rules?.targetValue || 0).toLocaleString()} {c.rules?.targetUnit || ""}
            </p>
            <span className="grp-display text-xl font-black" style={{ color, lineHeight: 1 }}>{teamPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${color}18` }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${teamPct}%`, background: color }} />
          </div>
        </div>
        <div className="px-5 pb-4 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {c.participants?.slice(0, 6).map((p, i) => (
              <Avatar key={i} user={p.userId || {}} size="w-6 h-6" radius="rounded-full"
                      bg={`${color}25`} fg={color} />
            ))}
          </div>
          <span className="grp-mono text-[10px] text-[var(--ink-3)] ml-1">{count} contributors</span>
          {noHabit && (
            <button onClick={sp(() => setShowRelink(true))} className="ml-auto grp-mono text-[10px] font-bold hover:underline" style={{ color }}>
              Link habit →
            </button>
          )}
        </div>
        {showRelink && (
          <ChallengeJoinModal isOpen challenge={c} mode="relink"
            initialHabitIds={myP?.linkedHabitIds || []}
            onClose={() => setShowRelink(false)} onSuccess={() => setShowRelink(false)} />
        )}
      </div>
    );
  }

  /* ── ACTIVE — JOINED: two-panel layout ───────────────────── */
  if (isParticipant && myRankIdx >= 0) {
    const rankDisplay  = myRankIdx < 3 ? MEDALS[myRankIdx] : `#${myRankIdx + 1}`;
    const rankIsEmoji  = myRankIdx < 3;
    const myMetric     = myP ? statLabel(myP, c.type, c.rules?.targetUnit) : "—";

    return (
      <div className={cardCls} style={hoverStyle} {...hover} onClick={() => onViewDetail?.(c)}>
        {/* header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
            <Icon size={13} weight="duotone" style={{ color }} />
          </div>
          <p className="grp-display text-[16px] font-bold text-[var(--ink)] truncate flex-1 leading-snug">{c.title}</p>
          <span className="grp-mono text-[10px] text-[var(--ink-3)] flex items-center gap-1 flex-shrink-0">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {remaining}d
          </span>
          <ArrowRight size={12} className="text-[var(--ink-3)] flex-shrink-0" />
        </div>

        {/* two-panel body */}
        <div className="flex border-t border-[var(--line-2)]">
          {/* rank hero */}
          <div className="w-[108px] flex-shrink-0 flex flex-col items-center justify-center py-5 gap-1"
               style={{ background: `radial-gradient(ellipse at 50% 40%, ${color}16, transparent 70%)` }}>
            <div style={{
              fontSize: rankIsEmoji ? "2.2rem" : "2.4rem",
              lineHeight: 1,
              fontWeight: 900,
              color: rankIsEmoji ? undefined : color,
            }}>
              {rankDisplay}
            </div>
            <p className="grp-mono text-[9px] uppercase tracking-widest text-[var(--ink-3)]">your rank</p>
            <p className="grp-mono text-[11px] font-bold mt-0.5" style={{ color }}>{myMetric}</p>
          </div>

          {/* leaderboard */}
          <div className="flex-1 border-l border-[var(--line-2)] py-2 min-w-0">
            {preview.length > 0
              ? leaderboardRows()
              : <p className="grp-mono text-[10px] text-[var(--ink-3)] px-3 py-4">No data yet</p>}
            {hidden > 0 && (
              <p className="grp-mono text-[9px] text-[var(--ink-3)] px-3 pt-0.5">+{hidden} more</p>
            )}
          </div>
        </div>

        {showRelink && (
          <ChallengeJoinModal isOpen challenge={c} mode="relink"
            initialHabitIds={myP?.linkedHabitIds || []}
            onClose={() => setShowRelink(false)} onSuccess={() => setShowRelink(false)} />
        )}
      </div>
    );
  }

  /* ── ACTIVE — NOT JOINED: teaser ─────────────────────────── */
  return (
    <div className={cardCls} style={hoverStyle} {...hover} onClick={() => onViewDetail?.(c)}>
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <Icon size={15} weight="duotone" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate leading-snug">{c.title}</p>
          <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {remaining}d left · {count} competing
          </p>
        </div>
        <ArrowRight size={12} className="text-[var(--ink-3)] flex-shrink-0" />
      </div>

      {preview.length > 0 && (
        <div className="border-t border-[var(--line-2)] py-2">
          {leaderboardRows()}
          {hidden > 0 && (
            <p className="grp-mono text-[9px] text-[var(--ink-3)] px-3 pt-0.5">+{hidden} more</p>
          )}
        </div>
      )}

      <div className="px-5 py-3 border-t border-[var(--line-2)] flex items-center justify-between"
           onClick={(e) => e.stopPropagation()}>
        <span className="grp-mono text-[10px] text-[var(--ink-3)]">Join to track your progress</span>
        {c.type !== "head_to_head" && (
          <button onClick={sp(() => onJoin?.(c))} disabled={isLoading} className="grp-btn grp-btn--sm"
                  style={{ background: color, color: "#fff", borderColor: "transparent" }}>
            {isLoading ? "…" : "Join →"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChallengeCard;
