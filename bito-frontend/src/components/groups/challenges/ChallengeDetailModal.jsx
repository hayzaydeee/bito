import { X, Fire, TrendUp, CalendarBlank, Handshake, Trophy } from "@phosphor-icons/react";
import AnimatedModal from "../../ui/AnimatedModal";

const TYPE_META = {
  streak:      { Icon: Fire,          label: "Streak",      color: "#ff7a3c" },
  cumulative:  { Icon: TrendUp,       label: "Cumulative",  color: "#6f9bff" },
  consistency: { Icon: CalendarBlank, label: "Consistency", color: "#a78bfa" },
  team_goal:   { Icon: Handshake,     label: "Team Goal",   color: "#36d6c3" },
};

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#cd7c2f"];

function sortKey(p, type) {
  if (type === "streak") return p.progress?.currentStreak || 0;
  if (type === "consistency") return p.progress?.completionRate || 0;
  return p.progress?.currentValue || 0;
}

function pct(p, challenge) {
  const target = challenge.rules?.targetValue || 1;
  if (challenge.type === "streak") return Math.min(100, Math.round(((p.progress?.currentStreak || 0) / target) * 100));
  if (challenge.type === "consistency") return Math.min(100, Math.round(p.progress?.completionRate || 0));
  return Math.min(100, Math.round(((p.progress?.currentValue || 0) / target) * 100));
}

function metric(p, challenge, isFrozen) {
  if (isFrozen) {
    if (challenge.type === "consistency") return `${p.finalValue || 0}%`;
    return (p.finalValue || 0).toLocaleString();
  }
  if (challenge.type === "streak") return `${p.progress?.currentStreak || 0}d`;
  if (challenge.type === "consistency") return `${Math.round(p.progress?.completionRate || 0)}%`;
  return (p.progress?.currentValue || 0).toLocaleString();
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
  onClose, onJoin, onLeave, actionLoading,
}) => {
  if (!isOpen || !c) return null;

  const { Icon, color } = TYPE_META[c.type] || { Icon: Trophy, label: c.type, color: "var(--signal)" };
  const myP = c.participants?.find((p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString());
  const isParticipant = !!myP;
  const isLoading = actionLoading === c._id;

  const usesFrozen = c.status === "completed" && c.stats?.finalLeaderboard?.length > 0;
  const sorted = usesFrozen
    ? c.stats.finalLeaderboard
    : [...(c.participants || [])].sort((a, b) => sortKey(b, c.type) - sortKey(a, c.type));

  const remaining = daysLeft(c.endDate);
  const teamTotal = c.type === "team_goal"
    ? (c.participants?.reduce((s, p) => s + (p.progress?.currentValue || 0), 0) || 0) : null;
  const teamPct = teamTotal !== null
    ? Math.min(100, Math.round((teamTotal / (c.rules?.targetValue || 1)) * 100)) : null;

  const myRank = !usesFrozen && sorted.findIndex((p) =>
    (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
  );

  const trackedHabitName = (p) => {
    const h = p?.linkedHabitIds?.[0];
    return typeof h === "object" ? h?.name : null;
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="grp relative w-full bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[var(--line-2)] flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon size={20} weight="duotone" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="grp-mono text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                    {TYPE_META[c.type]?.label || c.type}
                  </p>
                  {c.status === "active" && (
                    <span className="flex items-center gap-1 grp-mono text-[10px] text-[var(--ink-3)]">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Live
                    </span>
                  )}
                  {c.status === "completed" && (
                    <span className="grp-mono text-[10px] text-[var(--ink-3)]">Completed</span>
                  )}
                </div>
                <h2 className="grp-display text-xl font-bold text-[var(--ink)] leading-tight">{c.title}</h2>
                {c.description && (
                  <p className="text-xs text-[var(--ink-2)] mt-1 line-clamp-2">{c.description}</p>
                )}
                <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-1.5">
                  {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                  {c.status === "active" && remaining !== null && ` · ${remaining}d left`}
                  {" · "}
                  {c.participants?.length || 0} participants
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors flex-shrink-0 mt-0.5"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Your stats */}
          {isParticipant && myP.role !== "organizer" && (
            <div className="rounded-[12px] border border-[var(--line-2)] bg-[var(--bg-2)] p-4">
              <p className="grp-kicker mb-3">Your stats</p>
              <div className="flex flex-wrap gap-5">
                {c.type === "streak" && (
                  <>
                    <div>
                      <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-0.5">Current streak</p>
                      <p className="grp-display text-3xl font-bold text-[var(--ink)]">
                        {myP.progress?.currentStreak || 0}
                        <span className="text-base text-[var(--ink-3)] ml-0.5">d</span>
                      </p>
                    </div>
                    <div>
                      <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-0.5">Best streak</p>
                      <p className="grp-display text-3xl font-bold text-[var(--ink)]">
                        {myP.progress?.longestStreak || 0}
                        <span className="text-base text-[var(--ink-3)] ml-0.5">d</span>
                      </p>
                    </div>
                  </>
                )}
                {c.type === "consistency" && (
                  <div>
                    <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-0.5">Completion rate</p>
                    <p className="grp-display text-3xl font-bold text-[var(--ink)]">
                      {Math.round(myP.progress?.completionRate || 0)}
                      <span className="text-base text-[var(--ink-3)] ml-0.5">%</span>
                    </p>
                  </div>
                )}
                {(c.type === "cumulative" || c.type === "team_goal") && (
                  <div>
                    <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-0.5">Your total</p>
                    <p className="grp-display text-3xl font-bold text-[var(--ink)]">
                      {(myP.progress?.currentValue || 0).toLocaleString()}
                      <span className="text-base text-[var(--ink-3)] ml-1">{c.rules?.targetUnit || ""}</span>
                    </p>
                  </div>
                )}
                {myRank >= 0 && c.type !== "team_goal" && (
                  <div>
                    <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-0.5">Rank</p>
                    <p className="grp-display text-3xl font-bold text-[var(--ink)]">
                      {myRank < 3 ? MEDALS[myRank] : `#${myRank + 1}`}
                    </p>
                  </div>
                )}
                {trackedHabitName(myP) && (
                  <div>
                    <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-0.5">Tracking</p>
                    <p className="text-sm text-[var(--ink)] font-medium mt-0.5">&ldquo;{trackedHabitName(myP)}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team goal progress */}
          {c.type === "team_goal" && teamTotal !== null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="grp-kicker">Team progress</p>
                <span className="grp-mono text-sm font-bold" style={{ color }}>{teamPct}%</span>
              </div>
              <div className="grp-meter" style={{ height: "10px" }}>
                <i style={{ width: `${teamPct}%`, transition: "width .5s ease" }} />
              </div>
              <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-1.5">
                {teamTotal.toLocaleString()} / {Number(c.rules?.targetValue || 0).toLocaleString()} {c.rules?.targetUnit || ""}
              </p>
            </div>
          )}

          {/* Leaderboard */}
          {sorted.length > 0 && c.settings?.showLeaderboard !== false && (
            <div>
              <p className="grp-kicker mb-2">
                {c.status === "completed" ? "Final standings" : "Leaderboard"}
              </p>
              <div className="space-y-1">
                {sorted.map((p, i) => {
                  const uid = usesFrozen ? p.userId : (p.userId?._id || p.userId);
                  const name = usesFrozen ? p.displayName : (p.userId?.name || p.userId?.email || "Member");
                  const isOwn = uid?.toString() === currentUserId?.toString();
                  const isOrg = p.role === "organizer";
                  const habitName = !usesFrozen ? trackedHabitName(p) : null;
                  const rankPct = usesFrozen ? null : pct(p, c);
                  const metricVal = metric(p, c, usesFrozen);
                  const rankColor = i < 3 ? MEDAL_COLORS[i] : null;

                  return (
                    <div
                      key={uid?.toString() || name || i}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] ${
                        isOwn ? "bg-[var(--signal)]/5 border border-[var(--signal)]/15" : ""
                      }`}
                    >
                      {/* Medal / rank */}
                      <div className="w-7 text-center flex-shrink-0">
                        {i < 3 ? (
                          <span className="text-base leading-none">{MEDALS[i]}</span>
                        ) : (
                          <span className="grp-mono text-[11px] font-bold text-[var(--ink-3)]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      {(!usesFrozen && p.userId?.avatar) ? (
                        <img
                          src={p.userId.avatar}
                          alt={name}
                          className="w-8 h-8 rounded-[8px] object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm grp-display font-bold flex-shrink-0"
                          style={{
                            background: rankColor ? `${rankColor}20` : "var(--surface-2)",
                            color: rankColor || (isOwn ? "var(--signal)" : "var(--ink)"),
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name + habit */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isOwn ? "text-[var(--signal)]" : "text-[var(--ink)]"}`}>
                          {name.split(" ")[0]}{isOwn && " (you)"}
                        </p>
                        {habitName && !isOrg && (
                          <p className="grp-mono text-[9px] text-[var(--ink-3)] truncate">&ldquo;{habitName}&rdquo;</p>
                        )}
                        {isOrg && (
                          <p className="grp-mono text-[9px] text-[var(--ink-3)] uppercase tracking-wider">organizer</p>
                        )}
                      </div>

                      {/* Progress bar */}
                      {rankPct !== null && c.type !== "team_goal" && !isOrg && (
                        <div className="w-20 grp-meter flex-shrink-0">
                          <i style={{ width: `${rankPct}%` }} />
                        </div>
                      )}

                      {/* Metric */}
                      {!isOrg && (
                        <span className="grp-mono text-[11px] font-bold text-[var(--ink)] w-14 text-right flex-shrink-0">
                          {metricVal}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--line-2)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            {isParticipant && c.status === "active" && (
              <button
                onClick={() => onLeave?.(c._id)}
                disabled={isLoading}
                className="grp-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--rose)] transition-colors"
              >
                {isLoading ? "…" : "Leave"}
              </button>
            )}
            {!isParticipant && c.status !== "completed" && c.type !== "head_to_head" && (
              <button
                onClick={() => { onClose(); onJoin?.(c); }}
                className="grp-btn grp-btn--signal gap-2"
              >
                Join Challenge
              </button>
            )}
            <div className="flex-1" />
            <button onClick={onClose} className="grp-btn">Close</button>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default ChallengeDetailModal;
