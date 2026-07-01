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
    const isActive = c.status === "active";
    const isUpcoming = c.status === "upcoming";
    const isCompleted = c.status === "completed" || c.status === "cancelled";
    const isJoined = !!myParticipant && myParticipant.status !== "dropped";

    const sorted = [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type));
    const typeLabel = TYPE_META[c.type]?.label?.toUpperCase() || c.type?.toUpperCase() || "CHALLENGE";
    const subLine = `${typeLabel} · ${participantCount} MEMBER${participantCount !== 1 ? "S" : ""}`;

    // Badge
    const badgeColor = isActive ? "var(--signal)" : "var(--ink-3)";
    const badgeBg = isActive
      ? "color-mix(in srgb, var(--signal) 12%, transparent)"
      : "color-mix(in srgb, var(--ink-3) 10%, transparent)";
    const badgeLabel = isActive ? "Active" : isUpcoming ? "Upcoming" : "Done";

    // Footer
    const renderFooter = () => {
      if (isCompleted) return null;
      const timeText = isActive
        ? `${daysLeft(c.endDate)}D LEFT`
        : isUpcoming
        ? `STARTS IN ${daysUntil(c.startDate)}D`
        : null;
      return (
        <div className="cz-foot">
          {isActive && <span className="cz-live-dot" />}
          {timeText && <span>{timeText}</span>}
          {cancelError && <span style={{ color: "var(--rose)", marginLeft: "auto" }}>{cancelError}</span>}
        </div>
      );
    };

    // Body: ranked scoreboard (streak / consistency / cumulative)
    const renderRankedBody = () => {
      const rows = isCompleted ? sorted.slice(0, 3) : sorted.slice(0, 5);
      return (
        <div className="cz-board">
          {rows.map((p, idx) => {
            const uid = (p.userId?._id || p.userId)?.toString();
            const isYou = uid === currentUserId?.toString();
            const name = p.userId?.name || p.userId?.username || "—";
            const avatar = p.userId?.profilePicture;
            const val = metricLabel(p, c.type, c.rules?.targetUnit);
            const unit = c.type === "streak" ? "STREAK" : c.type === "consistency" ? "RATE" : (c.rules?.targetUnit || "").toUpperCase();
            return (
              <div key={uid || idx} className={`cz-tr${isYou ? " you" : ""}${isCompleted ? " opacity-40" : ""}`}>
                <span className={`cz-rank${isYou ? " you" : ""}`}>{String(idx + 1).padStart(2, "0")}</span>
                <div className="cz-player">
                  <div className={`cz-av${isYou ? " you" : ""}`}>
                    {avatar ? <img src={avatar} alt={name} /> : name[0]?.toUpperCase()}
                  </div>
                  <span className={`cz-pname${isYou ? " you" : ""}`}>{isYou ? "You" : name}</span>
                </div>
                <div className="cz-score">
                  <div className={`cz-score-val${isYou ? " you" : ""}`}>{val}</div>
                  {unit && <div className="cz-score-unit">{unit}</div>}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    // Body: team goal (donut)
    const renderCoopBody = () => {
      const total = c.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0;
      const target = c.rules?.targetValue || 1;
      const pctVal = Math.min(100, Math.round((total / target) * 100));
      const myVal = myParticipant?.progress?.currentValue || 0;
      const radius = 22, circ = 2 * Math.PI * radius;
      return (
        <div className="cz-coop">
          <svg width={56} height={56} viewBox="0 0 56 56">
            <circle cx={28} cy={28} r={radius} fill="none" stroke="var(--line-2)" strokeWidth={5} />
            <circle
              cx={28} cy={28} r={radius} fill="none"
              stroke="var(--signal)" strokeWidth={5}
              strokeDasharray={circ}
              strokeDashoffset={circ - (circ * pctVal) / 100}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
            />
            <text x={28} y={32} textAnchor="middle" style={{ fontFamily: "var(--f-mono)", fontSize: 11, fill: "var(--ink)", fontWeight: 700 }}>
              {pctVal}%
            </text>
          </svg>
          <div className="cz-coop-r">
            <div className="cz-coop-total">{total.toLocaleString()} / {target.toLocaleString()} {c.rules?.targetUnit || ""}</div>
            {isJoined && <div className="cz-coop-you">You: {myVal.toLocaleString()}</div>}
          </div>
        </div>
      );
    };

    // Body: head_to_head duel
    const renderDuelBody = () => {
      if (sorted.length < 2) return null;
      const a = sorted[0], b = sorted[1];
      const nameOf = (p) => p.userId?.name || p.userId?.username || "—";
      const avatarOf = (p) => p.userId?.profilePicture;
      const valOf = (p) => metricLabel(p, c.type, c.rules?.targetUnit);
      const isLeadA = sortKey(a, c.type) >= sortKey(b, c.type);
      return (
        <div className="cz-duel">
          <div className={`cz-duel-side${isLeadA ? " lead" : ""}`}>
            <div className="cz-duel-av">{avatarOf(a) ? <img src={avatarOf(a)} alt={nameOf(a)} /> : nameOf(a)[0]?.toUpperCase()}</div>
            <div className="cz-duel-score">{valOf(a)}</div>
            <div className="cz-duel-name">{nameOf(a)}</div>
          </div>
          <div className="cz-duel-vs">vs</div>
          <div className={`cz-duel-side${!isLeadA ? " lead" : ""}`}>
            <div className="cz-duel-av">{avatarOf(b) ? <img src={avatarOf(b)} alt={nameOf(b)} /> : nameOf(b)[0]?.toUpperCase()}</div>
            <div className="cz-duel-score">{valOf(b)}</div>
            <div className="cz-duel-name">{nameOf(b)}</div>
          </div>
        </div>
      );
    };

    const renderBody = () => {
      if (isUpcoming) return null;
      if (c.type === "team_goal") return renderCoopBody();
      if (c.type === "head_to_head") return renderDuelBody();
      return renderRankedBody();
    };

    return (
      <div className="cz-card" onClick={() => onViewDetail?.(c)}>
        {/* Head */}
        <div className="cz-head">
          <div className="cz-icon" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
            <Icon size={16} weight="duotone" style={{ color }} />
          </div>
          <div className="cz-meta">
            <div className="cz-title">{c.name}</div>
            <div className="cz-sub">{subLine}</div>
          </div>
          <span className="cz-badge" style={{ color: badgeColor, background: badgeBg }}>{badgeLabel}</span>
        </div>

        {/* Body */}
        {renderBody()}

        {/* Footer */}
        {renderFooter()}
      </div>
    );
  };

  if (cardStyle === "compact") return renderCompact();
  if (cardStyle === "standing") return renderStanding();
  return renderCozy();
};

export default ChallengeCard;
