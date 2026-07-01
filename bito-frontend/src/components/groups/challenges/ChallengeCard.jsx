import { useState } from "react";
import {
  Fire, TrendUp, CalendarBlank, Handshake, Sword,
  DotsThree, X, ArrowCounterClockwise,
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
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

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
  canRestart = false, onRestart, instanceNumber = null,
}) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showRelinkModal, setShowRelinkModal] = useState(false);
  const [restartStage, setRestartStage] = useState(null); // null | 'confirm' | 'dates'
  const [restartStart, setRestartStart] = useState("");
  const [restartEnd, setRestartEnd] = useState("");
  const [restartLoading, setRestartLoading] = useState(false);

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

  const handleRestartNow = async () => {
    if (!onRestart) return;
    setRestartLoading(true);
    try { await onRestart(c._id, {}); setRestartStage(null); }
    catch { /* leave stage open */ }
    finally { setRestartLoading(false); }
  };

  const handleRestartSubmit = async () => {
    if (!onRestart || !restartStart || !restartEnd) return;
    setRestartLoading(true);
    try { await onRestart(c._id, { startDate: restartStart, endDate: restartEnd }); setRestartStage(null); }
    catch { /* leave stage open */ }
    finally { setRestartLoading(false); }
  };

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
    const isActive = c.status === "active";
    const isUpcoming = c.status === "upcoming";
    const isCompleted = c.status === "completed" || c.status === "cancelled";
    const isJoined = !!myParticipant && myParticipant.status !== "dropped";

    const sorted = [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type));
    const typeLabel = TYPE_META[c.type]?.label?.toUpperCase() || c.type?.toUpperCase() || "CHALLENGE";

    // Hero value (head-right)
    const getHero = () => {
      if (isCompleted) return { val: "✓", label: "COMPLETED", signal: false };
      if (isJoined && isActive) {
        const h = heroStat(c, myParticipant);
        return { val: h.num, label: h.caption.toUpperCase(), signal: true };
      }
      if (isActive) return { val: `${daysLeft(c.endDate) ?? "?"}`, label: "DAYS LEFT", signal: false };
      if (isUpcoming) return { val: `${daysUntil(c.startDate) ?? "?"}`, label: "TO START", signal: false };
      return { val: "—", label: "", signal: false };
    };
    const hero = getHero();

    // Rows: up to 5 participants
    const rows = sorted.slice(0, 5);

    // Footer content by state
    const renderFooter = () => {
      if (isCompleted) {
        return (
          <div className="st-foot completed">
            <span>{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</span>
          </div>
        );
      }
      const overflow = sorted.length > 5 ? sorted.length - 5 : 0;
      let leftText = "";
      if (isActive) leftText = `${participantCount} MEMBER${participantCount !== 1 ? "S" : ""}`;
      if (isUpcoming) leftText = `STARTS IN ${daysUntil(c.startDate) ?? "?"}D`;
      if (!leftText && overflow === 0) return null;
      return (
        <div className="st-foot">
          <span className="flex items-center gap-1.5">
            {isActive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />}
            {leftText}
          </span>
          {overflow > 0 && <span>+{overflow} MORE</span>}
        </div>
      );
    };

    return (
      <div className="st-card" onClick={() => onViewDetail?.(c)}>
        {/* Head */}
        <div className="st-head">
          <div className="st-head-left">
            <div className="st-type">
              <Icon size={11} weight="duotone" />
              {typeLabel}
            </div>
            <div className="st-title">{c.title}</div>
          </div>
          <div className="st-head-right">
            <div className={`st-hero-val${hero.signal ? " signal" : ""}`}>{hero.val}</div>
            <div className="st-hero-label">{hero.label}</div>
          </div>
        </div>

        {/* Rows */}
        {rows.map((p, idx) => {
          const uid = (p.userId?._id || p.userId)?.toString();
          const isYou = uid === currentUserId?.toString();
          const name = p.userId?.name || p.userId?.username || "—";
          const avatar = p.userId?.avatar;
          const pctVal = pct(p, c);
          const val = metricLabel(p, c.type, c.rules?.targetUnit);
          return (
            <div key={uid || idx} className={`st-row${isYou ? " you" : ""}`}>
              <span className={`st-pos${isYou ? " you" : ""}`}>{idx + 1}</span>
              <span className={`st-dot${isYou ? " you" : ""}`} />
              <div className={`st-name${isYou ? " you" : ""}`}>
                {avatar && <img src={avatar} alt={name} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", marginRight: 5, verticalAlign: "middle" }} />}
                {isYou ? "You" : name}
              </div>
              <div className="st-track">
                <i className={isYou ? "you" : ""} style={{ width: `${pctVal}%` }} />
              </div>
              <span className={`st-metric${isYou ? " you" : ""}`}>{val}</span>
            </div>
          );
        })}

        {/* Footer */}
        {renderFooter()}
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
      if (isCompleted) {
        // Stage 3: date picker
        if (restartStage === 'dates') {
          return (
            <div className="cz-restart-form" onClick={sp(() => {})}>
              <div className="cz-restart-date-row">
                <input type="date" className="cz-date-input" value={restartStart} onChange={(e) => setRestartStart(e.target.value)} />
                <span className="cz-date-sep">→</span>
                <input type="date" className="cz-date-input" value={restartEnd} onChange={(e) => setRestartEnd(e.target.value)} />
              </div>
              <div className="cz-restart-actions">
                <button type="button" className="grp-btn grp-btn--sm" onClick={sp(() => setRestartStage('confirm'))}>Back</button>
                <button type="button" className="grp-btn grp-btn--sm grp-btn--signal" disabled={!restartStart || !restartEnd || restartLoading} onClick={sp(handleRestartSubmit)}>
                  {restartLoading ? "Starting…" : "Confirm"}
                </button>
              </div>
            </div>
          );
        }
        // Stage 2: confirm
        if (restartStage === 'confirm') {
          return (
            <div className="cz-restart-confirm" onClick={sp(() => {})}>
              <span className="cz-restart-q">Restart this challenge?</span>
              <div className="cz-restart-actions">
                <button type="button" className="grp-btn grp-btn--sm" onClick={sp(() => setRestartStage(null))}>Cancel</button>
                <button type="button" className="grp-btn grp-btn--sm" onClick={sp(() => { setRestartStart(toDateInput(c.startDate)); setRestartEnd(toDateInput(c.endDate)); setRestartStage('dates'); })}>Change dates</button>
                <button type="button" className="grp-btn grp-btn--sm grp-btn--signal" disabled={restartLoading} onClick={sp(handleRestartNow)}>
                  {restartLoading ? "Starting…" : "Restart now"}
                </button>
              </div>
            </div>
          );
        }
        // Stage 1: date range footer + restart trigger
        return (
          <div className="cz-foot completed">
            <span className="cz-date-range">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</span>
            {canRestart && (
              <button type="button" className="cz-restart-trigger" onClick={sp(() => setRestartStage('confirm'))}>
                <ArrowCounterClockwise size={11} weight="bold" />
                Restart
              </button>
            )}
          </div>
        );
      }
      const timeText = isActive
        ? `${daysLeft(c.endDate) ?? "?"}D LEFT`
        : isUpcoming
        ? `STARTS IN ${daysUntil(c.startDate) ?? "?"}D`
        : null;
      if (!timeText && !cancelError) return null;
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
            const avatar = p.userId?.avatar;
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
      const avatarOf = (p) => p.userId?.avatar;
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
            <div className="cz-title">{c.title}</div>
            <div className="cz-sub">{subLine}</div>
          </div>
          {instanceNumber > 1 && <span className="cz-instance">#{instanceNumber}</span>}
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
