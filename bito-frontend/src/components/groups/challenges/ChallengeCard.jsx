import { useState } from "react";
import {
  Fire,
  TrendUp,
  CalendarBlank,
  Handshake,
  Sword,
  Trophy,
  Clock,
} from "@phosphor-icons/react";

/* ── type metadata ──────────────────────────────────── */

const TYPE_META = {
  streak:       { Icon: Fire,          label: "Streak",       color: "#ff7a3c" },
  cumulative:   { Icon: TrendUp,       label: "Cumulative",   color: "#6f9bff" },
  consistency:  { Icon: CalendarBlank, label: "Consistency",  color: "#a78bfa" },
  team_goal:    { Icon: Handshake,     label: "Team goal",    color: "#36d6c3" },
  head_to_head: { Icon: Sword,         label: "Head to Head", color: "#ff5d73" },
};

function TypeTag({ type }) {
  const meta = TYPE_META[type] || { label: type, color: "var(--ink-3)" };
  return (
    <span className="grp-tag flex-shrink-0" style={{ color: meta.color, borderColor: `${meta.color}55` }}>
      {meta.label}
    </span>
  );
}

/* ── helpers ─────────────────────────────────────────── */

function daysLeft(endDate) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((new Date(endDate) - Date.now()) / 86400000));
}

function daysUntil(startDate) {
  if (!startDate) return null;
  return Math.max(0, Math.ceil((new Date(startDate) - Date.now()) / 86400000));
}

function progressPercent(challenge, myProgress) {
  const target = challenge.rules?.targetValue || 1;
  if (challenge.type === "team_goal") {
    const total = challenge.participants?.reduce(
      (s, p) => s + (p.progress?.currentValue || 0),
      0
    ) || 0;
    return Math.min(100, Math.round((total / target) * 100));
  }
  return Math.min(100, Math.round(((myProgress?.currentValue || 0) / target) * 100));
}

/* ── Leaderboard row (Consistency / Streak) ────────────── */

function LeaderboardRow({ rank, participant, targetValue }) {
  const info = participant.userId || participant;
  const name = info.name || info.email || "Member";
  const pct = Math.min(100, Math.round(
    ((participant.progress?.currentValue || 0) / (targetValue || 1)) * 100
  ));

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="grp-mono w-5 text-[11px] font-bold text-[var(--ink-3)] text-right flex-shrink-0">
        {String(rank).padStart(2, "0")}
      </span>
      <div className="w-7 h-7 rounded-[7px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink)] text-[11px] grp-display font-bold flex-shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="w-20 text-sm text-[var(--ink)] truncate flex-shrink-0">
        {name.split(" ")[0]}
      </span>
      <div className="grp-meter flex-1">
        <i style={{ width: `${pct}%` }} />
      </div>
      <span className="grp-mono text-[11px] font-bold text-[var(--ink)] w-10 text-right flex-shrink-0">
        {pct}%
      </span>
    </div>
  );
}

/* ── Habit match row (for joining team_goal) ─────────────── */

function HabitMatchRow({ habit, selected, onSelect }) {
  const matchScore = habit.matchScore || habit.score;
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer transition-colors border ${
        selected
          ? "bg-[var(--signal)]/10 border-[var(--signal)]/40"
          : "hover:bg-[var(--surface-2)] border-transparent"
      }`}
    >
      <span className="text-sm flex-shrink-0">{habit.icon || "🎯"}</span>
      <span className="flex-1 text-xs text-[var(--ink)] truncate">{habit.name}</span>
      {matchScore !== undefined && (
        <span className="grp-mono text-[10px] text-[var(--signal)] flex-shrink-0">
          {Math.round(matchScore)}% match
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`grp-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[7px] transition-colors flex-shrink-0 ${
          selected
            ? "bg-[var(--signal)] text-[var(--signal-ink)]"
            : "bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

/* ── ChallengeCard ───────────────────────────────────────── */

const ChallengeCard = ({ challenge: c, currentUserId, myHabits = [], onJoin, onLeave, actionLoading }) => {
  const [selectedHabitId, setSelectedHabitId] = useState(null);

  const isParticipant = c.participants?.some(
    (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
  );
  const myParticipant = c.participants?.find(
    (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
  );
  const myProgress = myParticipant?.progress;
  const pct = progressPercent(c, myProgress);
  const remaining = daysLeft(c.endDate);
  const startsIn = daysUntil(c.startDate);
  const participantCount = c.participants?.length || 0;
  const isLoading = actionLoading === c._id;

  const sortedParticipants = [...(c.participants || [])].sort(
    (a, b) => (b.progress?.currentValue || 0) - (a.progress?.currentValue || 0)
  );

  const metaLine = "grp-mono text-[10px] text-[var(--ink-3)] mt-1 uppercase tracking-wider";

  /* Upcoming card */
  if (c.status === "upcoming") {
    return (
      <div className="grp-card p-5">
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-[var(--ink-3)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--ink)] truncate flex-1">{c.title}</p>
              <TypeTag type={c.type} />
            </div>
            <p className={metaLine}>
              Starts in {startsIn ?? "?"} day{startsIn !== 1 ? "s" : ""} · {participantCount} joined
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* Consistency / Streak: leaderboard layout */
  if (c.type === "consistency" || c.type === "streak") {
    return (
      <div className="grp-card grp-card-hover p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate">{c.title}</p>
            <p className={metaLine}>
              {c.description || `Hit ${c.rules?.targetValue || "—"}% of days`}
              {remaining !== null && ` · ${remaining}d left`}
              {participantCount > 0 && ` · ${participantCount} joined`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isParticipant && (
              <button onClick={() => onJoin(c._id)} disabled={isLoading} className="grp-btn grp-btn--sm">
                {isLoading ? "…" : "Join"}
              </button>
            )}
            <TypeTag type={c.type} />
          </div>
        </div>

        {/* Leaderboard */}
        {sortedParticipants.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {sortedParticipants.slice(0, 5).map((p, i) => (
              <LeaderboardRow
                key={(p.userId?._id || p.userId)?.toString() || i}
                rank={i + 1}
                participant={p}
                targetValue={c.rules?.targetValue || 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* Team Goal: progress + join with habit selection */
  if (c.type === "team_goal") {
    const totalValue = c.participants?.reduce(
      (s, p) => s + (p.progress?.currentValue || 0),
      0
    ) || 0;

    return (
      <div className="grp-card grp-card-hover p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate">{c.title}</p>
            <p className={metaLine}>
              {totalValue.toLocaleString()} / {Number(c.rules?.targetValue || 0).toLocaleString()} {c.rules?.targetUnit || ""}
              {remaining !== null && ` · ${remaining}d left`}
              {participantCount > 0 && ` · ${participantCount} joined`}
            </p>
          </div>
          <TypeTag type={c.type} />
        </div>

        {/* Progress meter */}
        <div className="mt-3 mb-4">
          <div className="grp-meter" style={{ height: "8px" }}>
            <i style={{ width: `${pct}%`, transition: "width .5s ease" }} />
          </div>
          <p className="grp-mono text-right text-[11px] font-bold text-[var(--signal)] mt-1.5">{pct}%</p>
        </div>

        {/* Join section */}
        {!isParticipant && myHabits.length > 0 && (
          <div>
            <button
              onClick={() => onJoin(c._id, selectedHabitId ? [selectedHabitId] : [])}
              disabled={isLoading}
              className="grp-btn grp-btn--signal grp-btn--sm mb-4"
            >
              {isLoading ? "Joining…" : "Join challenge"}
            </button>
            <p className="grp-kicker mb-2">Pick your habit</p>
            <div className="space-y-1">
              {myHabits.slice(0, 3).map((h) => (
                <HabitMatchRow
                  key={h._id || h.habitId}
                  habit={h}
                  selected={selectedHabitId === (h._id || h.habitId)}
                  onSelect={() => setSelectedHabitId(h._id || h.habitId)}
                />
              ))}
            </div>
          </div>
        )}

        {isParticipant && (
          <button
            onClick={() => onLeave(c._id)}
            disabled={isLoading}
            className="grp-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--rose)] transition-colors"
          >
            {isLoading ? "…" : "Leave"}
          </button>
        )}
      </div>
    );
  }

  /* Default / cumulative / head-to-head */
  return (
    <div className="grp-card grp-card-hover p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate">{c.title}</p>
          {c.description && (
            <p className="text-xs text-[var(--ink-2)] mt-1 line-clamp-1">{c.description}</p>
          )}
          <p className={metaLine}>
            {remaining !== null && `${remaining}d left`}
            {participantCount > 0 && ` · ${participantCount} joined`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isParticipant ? (
            <button onClick={() => onJoin(c._id)} disabled={isLoading} className="grp-btn grp-btn--sm">
              {isLoading ? "…" : "Join"}
            </button>
          ) : (
            <button
              onClick={() => onLeave(c._id)}
              disabled={isLoading}
              className="grp-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--rose)] transition-colors"
            >
              Leave
            </button>
          )}
          <TypeTag type={c.type} />
        </div>
      </div>

      {isParticipant && (
        <div>
          <div className="flex items-center justify-between grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">
            <span>Progress</span>
            <span className="text-[var(--signal)]">{pct}%</span>
          </div>
          <div className="grp-meter">
            <i style={{ width: `${pct}%`, transition: "width .5s ease" }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;
