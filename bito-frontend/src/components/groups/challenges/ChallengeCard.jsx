import { useState } from "react";
import {
  Fire, TrendUp, CalendarBlank, Handshake, Sword,
  DotsThree, X,
} from "@phosphor-icons/react";
import ChallengeJoinModal from "../../ui/ChallengeJoinModal";
import "./challenges-cards.css";

const TYPE_META = {
  streak:       { Icon: Fire,          label: "Streak",       color: "#ff7a3c" },
  cumulative:   { Icon: TrendUp,       label: "Cumulative",   color: "#6f9bff" },
  consistency:  { Icon: CalendarBlank, label: "Consistency",  color: "#a78bfa" },
  team_goal:    { Icon: Handshake,     label: "Team Goal",    color: "#36d6c3" },
  head_to_head: { Icon: Sword,         label: "Head to Head", color: "#ff5d73" },
};

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

function heroStat(c, myP) {
  if (!myP) return { num: "—", caption: "you" };
  if (c.type === "streak") return { num: `${myP.progress?.currentStreak || 0}`, caption: "day streak" };
  if (c.type === "consistency") return { num: `${Math.round(myP.progress?.completionRate || 0)}%`, caption: "consistency" };
  if (c.type === "team_goal") {
    const total = c.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0;
    const pctVal = Math.min(100, Math.round((total / (c.rules?.targetValue || 1)) * 100));
    return { num: `${pctVal}%`, caption: "team progress" };
  }
  return { num: `${(myP.progress?.currentValue || 0).toLocaleString()}`, caption: c.rules?.targetUnit || "total" };
}

function myRankDisplay(sorted, currentUserId) {
  const idx = sorted.findIndex((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
  if (idx < 0) return { num: "—", caption: "not joined" };
  return { num: `#${idx + 1}`, caption: idx === 0 ? "leading" : `of ${sorted.length}` };
}

const ChallengeCard = ({
  challenge: c, currentUserId, myHabits = [],
  onJoin, onLeave, onCancel, canCancel = false,
  onViewDetail, actionLoading,
  cardStyle = "cozy",
}) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showRelinkModal, setShowRelinkModal] = useState(false);

  const myParticipant = c.participants?.find((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
  const isParticipant = !!myParticipant && myParticipant.status !== "dropped";
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

  const renderCompact = () => {
    const { Icon, color } = TYPE_META[c.type] || { Icon: Fire, color: "var(--signal)" };
    const myP = c.participants?.find((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
    const pctVal = pct(myP || {}, c);
    const subLine = c.status === "upcoming"
      ? `starts in ${startsIn ?? "?"}d · ${participantCount} joined`
      : c.status === "completed"
      ? `completed · ${participantCount} members`
      : `${remaining ?? "?"}d left · ${participantCount} members`;
    const chipLabel = c.status === "active"
      ? (myP ? metricLabel(myP, c.type, c.rules?.targetUnit) : "not joined")
      : c.status === "upcoming" ? "upcoming" : "done";
    const isSignalChip = c.status === "active" && !!myP;

    return (
      <div className="cc-row" onClick={() => onViewDetail?.(c)}>
        <div className="cc-icon" style={{ background: `${color}18` }}>
          <Icon size={15} weight="duotone" style={{ color }} />
        </div>
        <div className="cc-text">
          <p className="cc-title">{c.title}</p>
          <p className="cc-sub">{subLine}</p>
        </div>
        <div className="cc-right">
          {c.type === "head_to_head" ? (
            <span className="cc-score">
              {myP ? `${myP.progress?.currentValue || 0}` : "—"}
            </span>
          ) : (
            <>
              <div className="cc-bar-wrap">
                <div className="cc-bar-fill" style={{ width: `${pctVal}%` }} />
              </div>
              <span className={`cc-chip${isSignalChip ? " signal" : ""}`}>{chipLabel}</span>
            </>
          )}
          <svg className="cc-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    );
  };

  const renderStanding = () => {
    const { Icon, color } = TYPE_META[c.type] || { Icon: Fire, color: "var(--signal)" };
    const myP = c.participants?.find((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
    const sorted = [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type));
    const isMe = (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString();

    let num, caption, isSignal;
    if (c.status === "upcoming") {
      num = `${startsIn ?? "?"}`;
      caption = "days to start";
      isSignal = false;
    } else if (c.status === "completed" || c.status === "cancelled") {
      const winner = sorted[0];
      const winnerName = (winner?.userId?.name || winner?.userId?.email || "?").split(" ")[0];
      num = "✓";
      caption = `won by ${winnerName}`;
      isSignal = false;
    } else if (myP) {
      const { num: h, caption: cap } = heroStat(c, myP);
      num = h; caption = cap; isSignal = true;
    } else {
      const rankInfo = myRankDisplay(sorted, currentUserId);
      num = rankInfo.num; caption = rankInfo.caption; isSignal = false;
    }

    const subLine = c.status === "active"
      ? `${remaining ?? "?"}d left`
      : c.status === "upcoming"
      ? `${participantCount} joined`
      : `${participantCount} members`;

    const preview = sorted.slice(0, 5);

    return (
      <div className="st-card" onClick={() => onViewDetail?.(c)}>
        <div className="st-lead">
          <span className={`st-num${isSignal ? " signal" : ""}`}>{num}</span>
          <span className="st-caption">{caption}</span>
        </div>
        <div className="st-body">
          <div className="st-top">
            <div className="st-icon" style={{ background: `${color}18` }}>
              <Icon size={13} weight="duotone" style={{ color }} />
            </div>
            <span className="st-title">{c.title}</span>
            <span className="st-badge" style={{ background: `${color}18`, color }}>
              {TYPE_META[c.type]?.label || c.type}
            </span>
          </div>
          <span className="st-sub">{subLine}</span>
          {preview.length > 0 && (
            <div className="st-avatars">
              {preview.map((p, i) => {
                const info = p.userId || {};
                const name = info.name || info.email || "?";
                const isOwn = isMe(p);
                return info.avatar ? (
                  <img key={i} src={info.avatar} alt={name}
                    className="st-av" style={{ objectFit: "cover" }} />
                ) : (
                  <div key={i} className="st-av"
                    style={{ background: isOwn ? `${color}28` : "var(--surface-2)", color: isOwn ? color : "var(--ink-2)" }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCozy = () => {
    const { Icon, color } = TYPE_META[c.type] || { Icon: Fire, color: "var(--signal)" };
    const myP = c.participants?.find((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
    const isParticipantLocal = !!myP && myP.status !== "dropped";
    const isLoading = actionLoading === c._id;

    const badgeStyle = {
      background: c.status === "active" ? `${color}18` : "var(--surface-2)",
      color: c.status === "active" ? color : "var(--ink-3)",
    };
    const badgeLabel = c.status === "active" ? "Active" : c.status === "upcoming" ? "Upcoming" : "Done";

    const footerMeta = c.status === "upcoming"
      ? `Starts in ${startsIn ?? "?"}d · ${participantCount} joined`
      : `${remaining ?? "?"}d left · ${participantCount} ${c.type === "team_goal" ? "contributors" : "participants"}`;

    let body = null;
    if (c.status === "active" || c.status === "completed") {
      const sorted = [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type));
      const preview = sorted.slice(0, 3);

      if (c.type === "team_goal") {
        const totalValue = c.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0;
        const teamPct = Math.min(100, Math.round((totalValue / (c.rules?.targetValue || 1)) * 100));
        const myContrib = myP?.progress?.currentValue || 0;
        const r = 28, circ = 2 * Math.PI * r;
        const dash = circ * (teamPct / 100);
        body = (
          <div className="cz-body cz-coop">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
              <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform="rotate(-90 36 36)" style={{ transition: "stroke-dasharray .5s ease" }} />
              <text x="36" y="33" textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: "14px", fontWeight: 500, fill: "var(--ink)" }}>
                {teamPct}%
              </text>
              <text x="36" y="46" textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: "var(--f-mono)", fontSize: "8px", fill: "var(--ink-3)" }}>
                TEAM
              </text>
            </svg>
            <div className="cz-coop-r">
              <p className="cz-coop-total">{totalValue.toLocaleString()} / {Number(c.rules?.targetValue || 0).toLocaleString()} {c.rules?.targetUnit}</p>
              {myP && <p className="cz-coop-you">Your share: {myContrib.toLocaleString()}</p>}
            </div>
          </div>
        );
      } else if (c.type === "head_to_head" && sorted.length >= 2) {
        const [p1, p2] = sorted;
        const s1 = p1.progress?.currentValue || 0;
        const s2 = p2.progress?.currentValue || 0;
        const n1 = (p1.userId?.name || p1.userId?.email || "?").split(" ")[0];
        const n2 = (p2.userId?.name || p2.userId?.email || "?").split(" ")[0];
        const p1Lead = s1 >= s2;
        body = (
          <div className="cz-body cz-duel">
            <div className={`cz-duel-side${p1Lead ? " lead" : ""}`}>
              <div className="cz-duel-av" style={{ background: `${color}28`, color }}>
                {p1.userId?.avatar ? <img src={p1.userId.avatar} alt={n1} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : n1.charAt(0)}
              </div>
              <div className="cz-duel-score">{s1}</div>
              <div className="cz-duel-name">{n1}</div>
            </div>
            <span className="cz-duel-vs">vs</span>
            <div className={`cz-duel-side${!p1Lead ? " lead" : ""}`}>
              <div className="cz-duel-av" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
                {p2.userId?.avatar ? <img src={p2.userId.avatar} alt={n2} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : n2.charAt(0)}
              </div>
              <div className="cz-duel-score">{s2}</div>
              <div className="cz-duel-name">{n2}</div>
            </div>
          </div>
        );
      } else {
        body = (
          <div className="cz-body">
            {preview.map((p, i) => {
              const info = p.userId || {};
              const name = info.name || info.email || "Member";
              const isOwn = (info._id || info)?.toString() === currentUserId?.toString();
              const rowPct = pct(p, c);
              const metricVal = metricLabel(p, c.type, c.rules?.targetUnit);
              return (
                <div key={i} className={`cz-row${isOwn ? " you" : ""}`}>
                  <span className={`cz-rank${isOwn ? " you" : ""}`}>{i + 1}</span>
                  {info.avatar ? (
                    <img src={info.avatar} alt={name} className="cz-av" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="cz-av" style={{ background: isOwn ? `${color}28` : "var(--surface-2)", color: isOwn ? color : "var(--ink-2)" }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="cz-name">{name.split(" ")[0]}</span>
                  <div className="cz-bar-wrap">
                    <div className="cz-bar-fill" style={{ width: `${rowPct}%` }} />
                  </div>
                  <span className="cz-val">{metricVal}</span>
                </div>
              );
            })}
            {(c.participants?.length || 0) > 3 && (
              <p style={{ fontFamily: "var(--f-mono)", fontSize: "10px", color: "var(--ink-3)", paddingTop: "4px" }}>
                +{c.participants.length - 3} more
              </p>
            )}
          </div>
        );
      }
    }

    return (
      <div className="cz-card" onClick={() => onViewDetail?.(c)}>
        <div className="cz-head">
          <div className="cz-icon" style={{ background: `${color}18` }}>
            <Icon size={15} weight="duotone" style={{ color }} />
          </div>
          <span className="cz-title">{c.title}</span>
          <span className="cz-badge" style={badgeStyle}>{badgeLabel}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            {!isParticipantLocal && c.status === "upcoming" && c.type !== "head_to_head" && (
              <button onClick={sp(() => onJoin?.(c))} disabled={isLoading} className="grp-btn grp-btn--sm">
                {isLoading ? "…" : "Join"}
              </button>
            )}
            {canCancel && !confirmCancel && (
              <button onClick={sp(() => setConfirmCancel(true))} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors p-1">
                <DotsThree size={15} weight="bold" />
              </button>
            )}
            {canCancel && confirmCancel && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: "10px", color: "var(--ink-2)" }}>Cancel?</span>
                <button onClick={sp(handleCancelConfirm)} style={{ fontFamily: "var(--f-mono)", fontSize: "10px", fontWeight: 700, color: "var(--rose)" }}>Yes</button>
                <button onClick={sp(() => setConfirmCancel(false))} style={{ color: "var(--ink-3)" }}><X size={11} weight="bold" /></button>
              </div>
            )}
          </div>
        </div>
        {body}
        <div className="cz-foot">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" style={{ display: c.status === "active" ? undefined : "none" }} />
          {footerMeta}
          {cancelError && <span style={{ color: "var(--rose)", marginLeft: "auto" }}>{cancelError}</span>}
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

  if (cardStyle === "compact") return renderCompact();
  if (cardStyle === "standing") return renderStanding();
  return renderCozy();
};

export default ChallengeCard;
