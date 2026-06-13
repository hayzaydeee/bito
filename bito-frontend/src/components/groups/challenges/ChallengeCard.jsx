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
  streak:       { Icon: Fire,         label: "Streak",      color: "text-orange-500" },
  cumulative:   { Icon: TrendUp,      label: "Cumulative",  color: "text-blue-500" },
  consistency:  { Icon: CalendarBlank,label: "Consistency", color: "text-indigo-500" },
  team_goal:    { Icon: Handshake,    label: "Team Goal",   color: "text-teal-500" },
  head_to_head: { Icon: Sword,        label: "Head to Head",color: "text-rose-500" },
};

const STATUS_BADGE = {
  upcoming:  "bg-blue-500/10 text-blue-500 border-blue-500/20",
  active:    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  completed: "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]/15",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

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
    <div className="flex items-center gap-3">
      <span className="w-5 text-xs font-spartan text-[var(--color-text-tertiary)] text-center flex-shrink-0">
        {rank}
      </span>
      <div className="w-6 h-6 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white text-[10px] font-spartan font-bold flex-shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="flex-1 text-xs font-spartan text-[var(--color-text-primary)] truncate min-w-0">
        {name}
      </span>
      <div className="flex-1 max-w-[80px] h-1 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] w-10 text-right flex-shrink-0">
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
      className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
        selected
          ? "bg-[var(--color-brand-600)]/10 border border-[var(--color-brand-600)]/20"
          : "hover:bg-[var(--color-surface-hover)] border border-transparent"
      }`}
    >
      <span className="text-sm flex-shrink-0">
        {habit.icon || "🎯"}
      </span>
      <span className="flex-1 text-xs font-spartan text-[var(--color-text-primary)] truncate">
        {habit.name}
      </span>
      {matchScore !== undefined && (
        <span className="text-[10px] font-spartan text-[var(--color-brand-500)] bg-[var(--color-brand-600)]/10 px-2 py-0.5 rounded-full flex-shrink-0">
          {Math.round(matchScore)}% match
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`text-[11px] font-spartan px-2.5 py-0.5 rounded-lg transition-colors flex-shrink-0 ${
          selected
            ? "bg-[var(--color-brand-600)] text-white"
            : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

/* ── ChallengeCard ───────────────────────────────────────── */

/**
 * Props:
 *   challenge      — challenge object
 *   currentUserId  — string
 *   myHabits       — user's habits[] (for joining team_goal)
 *   onJoin         — (challengeId, linkedHabitIds) => void
 *   onLeave        — (challengeId) => void
 *   actionLoading  — string | null (challengeId being acted on)
 */
const ChallengeCard = ({ challenge: c, currentUserId, myHabits = [], onJoin, onLeave, actionLoading }) => {
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const meta = TYPE_META[c.type] || { Icon: Trophy, label: c.type, color: "text-amber-500" };
  const { Icon } = meta;

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

  /* Upcoming card */
  if (c.status === "upcoming") {
    return (
      <div className="p-5 rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)] opacity-75">
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-[var(--color-text-tertiary)] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                {c.title}
              </p>
              <span className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full border ${
                TYPE_META[c.type]?.color?.replace("text-", "border-") + "/20 bg-" + TYPE_META[c.type]?.color?.split("-")[1] + "-500/10 " + TYPE_META[c.type]?.color
              } border-[var(--color-border-primary)]/20 bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]`}>
                {meta.label}
              </span>
            </div>
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)]">
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
      <div className="p-5 rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]">
        <div className="flex items-start gap-3 mb-4">
          <Icon size={18} weight="duotone" className={`${meta.color} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                {c.title}
              </p>
              <span className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[c.status]}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5">
              {c.description || `Hit ${c.rules?.targetValue || "—"}% of days`}
              {remaining !== null && ` · ${remaining} days left`}
              {participantCount > 0 && ` · ${participantCount} joined`}
            </p>
          </div>

          {!isParticipant && (
            <button
              onClick={() => onJoin(c._id)}
              disabled={isLoading}
              className="flex-shrink-0 h-8 px-3 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-xs font-spartan font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "…" : "Join"}
            </button>
          )}
        </div>

        {/* Leaderboard */}
        {sortedParticipants.length > 0 && (
          <div className="space-y-2">
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
      <div className="p-5 rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]">
        <div className="flex items-start gap-3 mb-3">
          <Icon size={18} weight="duotone" className={`${meta.color} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                {c.title}
              </p>
              <span className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[c.status]}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5">
              {totalValue.toLocaleString()} of {Number(c.rules?.targetValue || 0).toLocaleString()} {c.rules?.targetUnit || ""}
              {remaining !== null && ` · ${remaining} days left`}
              {participantCount > 0 && ` · ${participantCount} joined`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-spartan text-[var(--color-text-tertiary)] mb-1.5">
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Join section */}
        {!isParticipant && myHabits.length > 0 && (
          <div>
            <p className="text-xs font-spartan text-[var(--color-text-secondary)] mb-2">
              Pick the habit you'll compete with
            </p>
            <div className="space-y-1 mb-3">
              {myHabits.slice(0, 3).map((h) => (
                <HabitMatchRow
                  key={h._id || h.habitId}
                  habit={h}
                  selected={selectedHabitId === (h._id || h.habitId)}
                  onSelect={() => setSelectedHabitId(h._id || h.habitId)}
                />
              ))}
            </div>
            <button
              onClick={() => onJoin(c._id, selectedHabitId ? [selectedHabitId] : [])}
              disabled={isLoading}
              className="w-full h-9 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-xs font-spartan font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "Joining…" : "Join challenge"}
            </button>
          </div>
        )}

        {isParticipant && (
          <button
            onClick={() => onLeave(c._id)}
            disabled={isLoading}
            className="text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
          >
            {isLoading ? "…" : "Leave"}
          </button>
        )}
      </div>
    );
  }

  /* Default / cumulative / head-to-head */
  return (
    <div className="p-5 rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]">
      <div className="flex items-start gap-3 mb-3">
        <Icon size={18} weight="duotone" className={`${meta.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
              {c.title}
            </p>
            <span className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[c.status]}`}>
              {meta.label}
            </span>
          </div>
          {c.description && (
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">
              {c.description}
            </p>
          )}
          <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-1">
            {remaining !== null && `${remaining} days left`}
            {participantCount > 0 && ` · ${participantCount} joined`}
          </p>
        </div>

        {!isParticipant ? (
          <button
            onClick={() => onJoin(c._id)}
            disabled={isLoading}
            className="flex-shrink-0 h-8 px-3 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-xs font-spartan font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? "…" : "Join"}
          </button>
        ) : (
          <button
            onClick={() => onLeave(c._id)}
            disabled={isLoading}
            className="flex-shrink-0 text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
          >
            Leave
          </button>
        )}
      </div>

      {isParticipant && (
        <div>
          <div className="flex items-center justify-between text-xs font-spartan text-[var(--color-text-tertiary)] mb-1">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;
