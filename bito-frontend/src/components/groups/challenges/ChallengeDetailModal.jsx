import { useState } from "react";
import { X, Fire, TrendUp, CalendarBlank, Handshake, Trophy, Pencil, Sword, Users } from "@phosphor-icons/react";
import AnimatedModal from "../../ui/AnimatedModal";
import ChallengeJoinModal from "../../ui/ChallengeJoinModal";
import "./challenge-detail-modal.css";

const TYPE_META = {
  streak:       { Icon: Fire,          label: "Streak",       color: "#ff7a3c" },
  cumulative:   { Icon: TrendUp,       label: "Cumulative",   color: "#6f9bff" },
  consistency:  { Icon: CalendarBlank, label: "Consistency",  color: "#a78bfa" },
  team_goal:    { Icon: Handshake,     label: "Team Goal",    color: "#36d6c3" },
  head_to_head: { Icon: Sword,         label: "Head to Head", color: "#ff5d73" },
};

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#cd7c2f"];

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

function metric(p, challenge, isFrozen) {
  if (isFrozen) {
    if (challenge.type === "consistency") return `${p.finalValue || 0}%`;
    return (p.finalValue || 0).toLocaleString();
  }
  if (challenge.type === "streak") return (p.progress?.currentStreak || 0).toString();
  if (challenge.type === "consistency") return `${Math.round(p.progress?.completionRate || 0)}`;
  return (p.progress?.currentValue || 0).toLocaleString();
}

function metricUnit(challenge, isFrozen) {
  if (isFrozen && challenge.type === "consistency") return null;
  if (challenge.type === "streak") return "days";
  if (challenge.type === "consistency") return "%";
  return challenge.rules?.targetUnit || null;
}

function daysLeft(endDate) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((new Date(endDate) - Date.now()) / 86400000));
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ChallengeDetailModal = ({
  isOpen, challenge: c, currentUserId,
  onClose, onJoin, onLeave, onDelete, canManage = false,
  actionLoading,
}) => {
  const [showRelink, setShowRelink] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !c) return null;

  const { Icon, color } = TYPE_META[c.type] || { Icon: Trophy, label: c.type, color: "var(--signal)" };
  const myP = c.participants?.find(
    (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
  );
  const isParticipant = !!myP;
  const isLoading = actionLoading === c._id;
  const isActive = c.status === "active";
  const isCompleted = c.status === "completed";
  const isCreator = (c.createdBy?._id || c.createdBy)?.toString() === currentUserId?.toString();
  const canDelete = canManage || isCreator;

  const usesFrozen = isCompleted && c.stats?.finalLeaderboard?.length > 0;
  const sorted = usesFrozen
    ? c.stats.finalLeaderboard
    : [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type));

  const remaining = daysLeft(c.endDate);

  const teamTotal = c.type === "team_goal"
    ? (c.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0) : null;
  const teamPct = teamTotal !== null
    ? Math.min(100, Math.round((teamTotal / (c.rules?.targetValue || 1)) * 100)) : null;

  const competitors = sorted.filter((p) => p.role !== "organizer");
  const myCompetitorRank = usesFrozen
    ? c.stats.finalLeaderboard.findIndex(
        (p) => p.userId?.toString() === currentUserId?.toString()
      )
    : competitors.findIndex(
        (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
      );

  const trackedHabitName = (p) => {
    const h = p?.linkedHabitIds?.[0];
    return typeof h === "object" ? h?.name : null;
  };

  // Hero shows rank — performance metrics live exclusively in the standing card
  const hero = (() => {
    if (!myP || myP.role === "organizer") {
      return isActive && remaining !== null
        ? { val: `${remaining}`, sub: "days left" }
        : { val: "—", sub: "" };
    }
    if (c.type === "team_goal") {
      return { val: `${teamPct ?? 0}%`, sub: "team progress" };
    }
    if (myCompetitorRank >= 0) {
      return {
        val: `#${myCompetitorRank + 1}`,
        sub: myCompetitorRank === 0 ? "leading" : `of ${competitors.length}`,
      };
    }
    return { val: "—", sub: "" };
  })();

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="cdm-root grp">

        {/* ── Identity stripe ─────────────────────────── */}
        <div className="cdm-stripe" style={{ "--type-color": color }}>
          <button onClick={onClose} className="cdm-close" aria-label="Close">
            <X size={13} weight="bold" />
          </button>

          <div className="cdm-stripe-inner">
            {/* Left: type + title + meta */}
            <div className="cdm-stripe-left">
              <div className="cdm-type-row">
                <div className="cdm-type-icon">
                  <Icon size={11} weight="duotone" />
                </div>
                <span className="cdm-type-label">{TYPE_META[c.type]?.label || c.type}</span>
                {isCompleted && <span className="cdm-done-pill">Completed</span>}
              </div>

              <div className="cdm-title-row">
                <h2 className="cdm-title">{c.title}</h2>
                <span className="cdm-title-date" style={{ color }}>
                  {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                </span>
              </div>

              {c.description && (
                <p className="cdm-desc">{c.description}</p>
              )}

              <div className="cdm-meta-row">
                <Users size={9} weight="bold" style={{ display: "inline", verticalAlign: "middle" }} />
                <span>{c.participants?.length || 0} members</span>
                {isActive && remaining !== null && (
                  <>
                    <span className="cdm-meta-sep">·</span>
                    <span className="cdm-days-left" style={{ color }}>{remaining}d left</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: hero number */}
            <div className="cdm-hero">
              <div className="cdm-hero-val">{hero.val}</div>
              {hero.sub && <div className="cdm-hero-sub">{hero.sub}</div>}
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div className="cdm-body">

          {/* Your standing (participant, non-organizer only) */}
          {isParticipant && myP.role !== "organizer" && (
            <div className="cdm-section">
              <div className="cdm-section-head">
                <span className="grp-kicker">Your standing</span>
                {isActive && (
                  <button onClick={() => setShowRelink(true)} className="grp-btn grp-btn--sm cdm-relink-btn">
                    <Pencil size={10} weight="bold" />
                    {myP.linkedHabitIds?.length ? "Change habit" : "Link habit"}
                  </button>
                )}
              </div>

              <div className="cdm-standing-card">
                <div className="cdm-stats-row">
                  {c.type === "streak" && (
                    <>
                      <div className="cdm-stat">
                        <div className="cdm-stat-num">
                          <span className="cdm-stat-val">{myP.progress?.currentStreak || 0}</span>
                          <span className="cdm-stat-unit">days</span>
                        </div>
                        <p className="cdm-stat-label">Current</p>
                      </div>
                      <div className="cdm-stat">
                        <div className="cdm-stat-num">
                          <span className="cdm-stat-val">{myP.progress?.longestStreak || 0}</span>
                          <span className="cdm-stat-unit">days</span>
                        </div>
                        <p className="cdm-stat-label">Best</p>
                      </div>
                    </>
                  )}

                  {c.type === "consistency" && (
                    <div className="cdm-stat">
                      <div className="cdm-stat-num">
                        <span className="cdm-stat-val">{Math.round(myP.progress?.completionRate || 0)}</span>
                        <span className="cdm-stat-unit">%</span>
                      </div>
                      <p className="cdm-stat-label">Rate</p>
                    </div>
                  )}

                  {(c.type === "cumulative" || c.type === "team_goal") && (
                    <div className="cdm-stat">
                      <div className="cdm-stat-num">
                        <span className="cdm-stat-val">{(myP.progress?.currentValue || 0).toLocaleString()}</span>
                        {c.rules?.targetUnit && <span className="cdm-stat-unit">{c.rules.targetUnit}</span>}
                      </div>
                      <p className="cdm-stat-label">Your total</p>
                    </div>
                  )}

                  {trackedHabitName(myP) && (
                    <div className="cdm-stat">
                      <p className="cdm-habit-name">&ldquo;{trackedHabitName(myP)}&rdquo;</p>
                      <p className="cdm-stat-label">Tracking</p>
                    </div>
                  )}
                </div>

                {/* Progress toward target */}
                {c.rules?.targetValue && c.type !== "team_goal" && (
                  <div className="cdm-my-progress">
                    <div className="cdm-prog-track">
                      <div
                        className="cdm-prog-fill"
                        style={{ width: `${pct(myP, c)}%`, background: color }}
                      />
                    </div>
                    <span className="cdm-prog-pct" style={{ color }}>{pct(myP, c)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team goal — donut progress */}
          {c.type === "team_goal" && teamTotal !== null && (
            <div className="cdm-section">
              <div className="cdm-section-head">
                <span className="grp-kicker">Team progress</span>
                <span className="cdm-prog-pct" style={{ color }}>{teamPct}%</span>
              </div>
              <div className="cdm-coop">
                {(() => {
                  const radius = 28, circ = 2 * Math.PI * radius;
                  return (
                    <svg width={72} height={72} viewBox="0 0 72 72">
                      <circle cx={36} cy={36} r={radius} fill="none" stroke="var(--line-2)" strokeWidth={6} />
                      <circle
                        cx={36} cy={36} r={radius} fill="none"
                        stroke={color} strokeWidth={6}
                        strokeDasharray={circ}
                        strokeDashoffset={circ - (circ * (teamPct || 0)) / 100}
                        strokeLinecap="round"
                        transform="rotate(-90 36 36)"
                        style={{ transition: "stroke-dashoffset .6s ease" }}
                      />
                      <text
                        x={36} y={40} textAnchor="middle"
                        style={{ fontFamily: "var(--f-mono)", fontSize: 12, fill: "var(--ink)", fontWeight: 700 }}
                      >
                        {teamPct}%
                      </text>
                    </svg>
                  );
                })()}
                <div className="cdm-coop-r">
                  <p className="cdm-coop-total">
                    {teamTotal.toLocaleString()}
                    <span className="cdm-coop-target"> / {Number(c.rules?.targetValue || 0).toLocaleString()} {c.rules?.targetUnit || ""}</span>
                  </p>
                  <p className="cdm-coop-sub">{c.participants?.length || 0} members contributing</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {sorted.length > 0 && c.settings?.showLeaderboard !== false && (
            <div className="cdm-section">
              <div className="cdm-section-head">
                <span className="grp-kicker">
                  {isCompleted ? "Final standings" : "Leaderboard"}
                </span>
              </div>

              <div className="cdm-board">
                {/* Competitors first, organizers last */}
                {[
                  ...sorted.filter((p) => p.role !== "organizer"),
                  ...sorted.filter((p) => p.role === "organizer"),
                ].map((p, i, arr) => {
                  const isOrg = p.role === "organizer";
                  const competitorIdx = isOrg ? -1 : competitors.indexOf(p);
                  const uid = usesFrozen ? p.userId : (p.userId?._id || p.userId);
                  const name = usesFrozen ? p.displayName : (p.userId?.name || p.userId?.email || "Member");
                  const avatar = !usesFrozen ? p.userId?.avatar : null;
                  const isOwn = uid?.toString() === currentUserId?.toString();
                  const habitName = !usesFrozen && !isOrg ? trackedHabitName(p) : null;
                  const rankPct = !usesFrozen && !isOrg ? pct(p, c) : null;
                  const val = !isOrg ? metric(p, c, usesFrozen) : null;
                  const unit = !isOrg ? metricUnit(c, usesFrozen) : null;
                  const rankColor = !isOrg && competitorIdx < 3 ? MEDAL_COLORS[competitorIdx] : null;

                  return (
                    <div
                      key={uid?.toString() || name || i}
                      className={`cdm-row${isOwn ? " you" : ""}${isOrg ? " org" : ""}`}
                    >
                      {/* Position */}
                      <div className="cdm-row-pos">
                        {isOrg ? (
                          <span className="cdm-row-pos-num">–</span>
                        ) : competitorIdx < 3 ? (
                          <span style={{ fontSize: 14, lineHeight: 1 }}>{MEDALS[competitorIdx]}</span>
                        ) : (
                          <span className={`cdm-row-pos-num${isOwn ? " you" : ""}`}>
                            {String(competitorIdx + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      {avatar ? (
                        <img src={avatar} alt={name} className="cdm-row-av" />
                      ) : (
                        <div
                          className="cdm-row-av initial"
                          style={{
                            background: rankColor
                              ? `${rankColor}20`
                              : isOwn
                              ? "color-mix(in srgb, var(--signal) 16%, transparent)"
                              : "var(--surface-2)",
                            color: rankColor || (isOwn ? "var(--signal)" : "var(--ink-3)"),
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name + sub */}
                      <div className="cdm-row-info">
                        <p className={`cdm-row-name${isOwn ? " you" : ""}`}>
                          {name.split(" ")[0]}{isOwn && " (you)"}
                        </p>
                        {isOrg ? (
                          <p className="cdm-row-sub">organizer</p>
                        ) : habitName ? (
                          <p className="cdm-row-sub">"{habitName}"</p>
                        ) : null}
                      </div>

                      {/* Progress track */}
                      {rankPct !== null && c.type !== "team_goal" && (
                        <div className="cdm-row-track">
                          <i style={{ width: `${rankPct}%` }} />
                        </div>
                      )}

                      {/* Score */}
                      {val !== null && (
                        <div className="cdm-row-score">
                          <span className={`cdm-row-val${isOwn ? " you" : ""}`}>{val}</span>
                          {unit && <span className="cdm-row-unit">{unit}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div className="cdm-footer">
          {isParticipant && isActive && (
            <button
              onClick={() => onLeave?.(c._id)}
              disabled={isLoading}
              className="grp-btn grp-btn--sm grp-btn--signal"
            >
              {isLoading ? "…" : "Leave"}
            </button>
          )}
          {canDelete && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="grp-btn grp-btn--sm grp-btn--danger"
            >
              Delete
            </button>
          )}
          {canDelete && showDeleteConfirm && (
            <div className="cdm-delete-confirm">
              <span className="cdm-delete-confirm-text">Delete permanently?</span>
              <button
                onClick={() => onDelete?.(c._id)}
                className="grp-mono text-[10px] font-bold text-[var(--rose)] hover:underline"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="grp-mono text-[10px] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
              >
                No
              </button>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {!isParticipant && c.status !== "completed" && c.type !== "head_to_head" && (
            <button
              onClick={() => { onClose(); onJoin?.(c); }}
              className="grp-btn grp-btn--signal"
            >
              Join Challenge
            </button>
          )}
          <button onClick={onClose} className="grp-btn grp-btn--sm">Close</button>
        </div>
      </div>

      {showRelink && (
        <ChallengeJoinModal
          isOpen
          challenge={c}
          mode="relink"
          initialHabitIds={myP?.linkedHabitIds?.map((h) => (typeof h === "object" ? h._id : h)) || []}
          onClose={() => setShowRelink(false)}
          onSuccess={() => setShowRelink(false)}
        />
      )}
    </AnimatedModal>
  );
};

export default ChallengeDetailModal;
