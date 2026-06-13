import { useState } from "react";
import {
  CheckCircle,
  PlusCircle,
  Fire,
  HandWaving,
  Target,
  Trash,
  Trophy,
  Handshake,
  Star,
  Heart,
  MapPin,
} from "@phosphor-icons/react";
import ReactionPicker from "./ReactionPicker";
import { groupsAPI } from "../../../services/api";

/* ── helpers ───────────────────────────────────────────────── */

const KUDOS_FALLBACKS = [
  "Keep it up! 🔥",
  "You're crushing it!",
  "Absolutely inspiring.",
  "Love the consistency!",
  "This is the way. 💪",
];

function randomFallback() {
  return KUDOS_FALLBACKS[Math.floor(Math.random() * KUDOS_FALLBACKS.length)];
}

export function timeAgo(dateStr) {
  if (!dateStr) return "just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function activityLabel(type) {
  const map = {
    habit_completed:     "completed",
    habit_adopted:       "adopted",
    streak_milestone:    "milestone",
    member_joined:       "new member",
    habit_created:       "created habit",
    habit_deleted:       "removed habit",
    challenge_started:   "challenge",
    challenge_joined:    "joined challenge",
    challenge_milestone: "milestone",
    kudos:               "kudos",
  };
  return map[type] || null;
}

function badgeStyle(type) {
  const map = {
    habit_completed:     "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
    streak_milestone:    "bg-orange-500/12 text-orange-400 border-orange-500/20",
    member_joined:       "bg-sky-500/12 text-sky-400 border-sky-500/20",
    kudos:               "bg-rose-500/12 text-rose-400 border-rose-500/20",
    challenge_joined:    "bg-teal-500/12 text-teal-400 border-teal-500/20",
    challenge_started:   "bg-amber-500/12 text-amber-400 border-amber-500/20",
    challenge_milestone: "bg-amber-500/12 text-amber-400 border-amber-500/20",
    habit_adopted:       "bg-blue-500/12 text-blue-400 border-blue-500/20",
  };
  return map[type] || "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]/20";
}

/** Left accent colour per activity type (used in compact mode border) */
function accentColor(type) {
  const map = {
    habit_completed:     "#10b981",
    streak_milestone:    "#f97316",
    member_joined:       "#f59e0b",
    kudos:               "#f43f5e",
    challenge_joined:    "#14b8a6",
    challenge_started:   "#f59e0b",
    challenge_milestone: "#f59e0b",
    habit_adopted:       "#3b82f6",
    habit_created:       "#6366f1",
    habit_deleted:       "#f87171",
  };
  return map[type] || "#6b7280";
}

/** Avatar background colour per type (for timeline nodes) */
function avatarBg(type) {
  const map = {
    habit_completed:     "linear-gradient(135deg,#059669,#10b981)",
    streak_milestone:    "linear-gradient(135deg,#ea580c,#f97316)",
    member_joined:       "linear-gradient(135deg,#d97706,#f59e0b)",
    kudos:               "linear-gradient(135deg,#e11d48,#f43f5e)",
    challenge_joined:    "linear-gradient(135deg,#0d9488,#14b8a6)",
    challenge_started:   "linear-gradient(135deg,#b45309,#f59e0b)",
    challenge_milestone: "linear-gradient(135deg,#b45309,#f59e0b)",
    habit_adopted:       "linear-gradient(135deg,#2563eb,#3b82f6)",
    habit_created:       "linear-gradient(135deg,#4f46e5,#6366f1)",
    habit_deleted:       "linear-gradient(135deg,#dc2626,#f87171)",
  };
  return map[type] || "linear-gradient(135deg,#4b5563,#6b7280)";
}

function activityIcon(type, size = 12) {
  const props = { size, weight: "fill" };
  const map = {
    habit_completed:     <CheckCircle {...props} className="text-emerald-400" />,
    habit_adopted:       <PlusCircle  {...props} className="text-blue-400" />,
    streak_milestone:    <Fire        {...props} className="text-orange-400" />,
    member_joined:       <HandWaving  {...props} className="text-yellow-400" />,
    habit_created:       <Target      {...props} className="text-indigo-400" />,
    habit_deleted:       <Trash       {...props} className="text-red-400" />,
    challenge_started:   <Trophy      {...props} className="text-amber-400" />,
    challenge_joined:    <Handshake   {...props} className="text-teal-400" />,
    challenge_milestone: <Star        {...props} className="text-yellow-400" />,
    kudos:               <Heart       {...props} className="text-rose-400" />,
  };
  return map[type] || <MapPin {...props} className="text-[var(--color-text-tertiary)]" />;
}

function activityDescription(a) {
  const name = a.userId?.name || a.user?.name || a.userId?.email || "A member";
  switch (a.type) {
    case "habit_completed":
      return `${name} completed ${a.data?.habitName || "a habit"}${
        a.data?.streakCount > 1 ? ` · ${a.data.streakCount}-day streak` : ""
      }`;
    case "habit_adopted":
      return `${name} adopted ${a.data?.habitName || "a new habit"}`;
    case "streak_milestone":
      return `${name} hit a milestone on ${a.data?.habitName || "a habit"}`;
    case "member_joined":
      return `${name} joined the group`;
    case "habit_created":
      return `${name} created ${a.data?.habitName || "a group habit"}`;
    case "habit_deleted":
      return `${name} removed ${a.data?.habitName || "a group habit"}`;
    case "challenge_started":
      return `${name} started "${a.data?.challengeName || "a challenge"}"`;
    case "challenge_joined":
      return `${name} joined "${a.data?.challengeName || "a challenge"}"`;
    case "challenge_milestone":
      return `${name} hit a milestone in "${a.data?.challengeName || "a challenge"}"`;
    case "kudos":
      return `${name} sent kudos to ${a.data?.targetUserName || "a teammate"}`;
    default:
      return a.data?.message || a.description || `${name} did something`;
  }
}

/** Short title for timeline card heading (bold, prominent) */
function activityTitle(a) {
  switch (a.type) {
    case "habit_completed":
      return a.data?.habitName || "Habit completed";
    case "habit_adopted":
      return a.data?.habitName || "New habit adopted";
    case "streak_milestone":
      return `${a.data?.streakCount ? `${a.data.streakCount} day` : ""} streak on ${a.data?.habitName || "a habit"}`;
    case "member_joined":
      return "Joined the group";
    case "habit_created":
      return a.data?.habitName || "New group habit";
    case "kudos":
      return a.data?.message ? `"${a.data.message}"` : "Kudos sent";
    case "challenge_started":
    case "challenge_joined":
    case "challenge_milestone":
      return a.data?.challengeName || "Challenge";
    default:
      return a.data?.habitName || a.data?.challengeName || "Activity";
  }
}

/* ── Avatar ─────────────────────────────────────────────────── */

function MemberAvatar({ user, size = "md", type }) {
  const name = user?.name || user?.email || "?";
  const initial = name.charAt(0).toUpperCase();

  const sizeClass = {
    sm:  "w-7 h-7 text-[10px]",
    md:  "w-8 h-8 text-xs",
    lg:  "w-10 h-10 text-sm",
    xl:  "w-10 h-10 text-sm",
  }[size] || "w-8 h-8 text-xs";

  const bg = type ? avatarBg(type) : "linear-gradient(135deg,#4f46e5,#6366f1)";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-spartan font-bold flex-shrink-0`}
      style={{ background: bg }}
    >
      {initial}
    </div>
  );
}

/* ── KudosInput ─────────────────────────────────────────────── */

function KudosInput({ onSend, onCancel, sending }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        autoFocus
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend(msg)}
        placeholder="Add a message (optional)"
        className="flex-1 h-8 px-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:border-[var(--color-brand-500)]/50 transition-colors"
      />
      <button
        onClick={() => onSend(msg)}
        disabled={sending}
        className="h-8 px-4 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-xs font-spartan font-medium transition-colors disabled:opacity-50"
      >
        {sending ? "…" : "Send"}
      </button>
      <button
        onClick={onCancel}
        className="h-8 px-3 rounded-xl text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

/* ── FeedCard ───────────────────────────────────────────────── */

/**
 * FeedCard
 *
 * Props:
 *   activity      — activity object
 *   density       — 'cozy' | 'compact' | 'timeline'
 *   reactions     — { [type]: count }
 *   myReaction    — current user's reaction type or null
 *   onReact       — (type) => void
 *   groupId       — string
 *   currentUserId — string
 *   onKudosSent   — (newActivity) => void
 *   alreadySentKudos — boolean
 *   isLast        — boolean (for timeline connector)
 */
const FeedCard = ({
  activity: a,
  density = "cozy",
  reactions = {},
  myReaction = null,
  onReact,
  groupId,
  currentUserId,
  onKudosSent,
  alreadySentKudos = false,
  isLast = false,
}) => {
  const [kudosOpen, setKudosOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const userInfo = a.userId || a.user || {};
  const label = activityLabel(a.type);
  const isMilestone = a.type === "streak_milestone";
  const isKudos = a.type === "kudos";
  const streakCount = a.data?.streakCount;
  const userName = userInfo?.name || userInfo?.email || "A member";

  const showKudosCTA =
    isMilestone &&
    !alreadySentKudos &&
    (a.userId?._id || a.userId)?.toString() !== currentUserId?.toString();

  const handleSendKudos = async (msg) => {
    if (sending) return;
    const targetUserId = (a.userId?._id || a.userId)?.toString();
    if (!targetUserId) return;
    setSending(true);
    try {
      const text = msg.trim() || randomFallback();
      const res = await groupsAPI.sendKudos(groupId, targetUserId, text);
      if (res.success) {
        setKudosOpen(false);
        onKudosSent?.(res.activity || {
          _id: `kudos-${Date.now()}`,
          type: "kudos",
          userId: { _id: currentUserId, name: "You" },
          data: { targetUserName: userInfo?.name, message: text },
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      /* keep open on error */
    } finally {
      setSending(false);
    }
  };

  /* ── Compact layout ─────────────────────────────────────────── */

  if (density === "compact") {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-surface-elevated)]/40 transition-colors border-l-2"
        style={{ borderLeftColor: accentColor(a.type) }}
      >
        {/* Avatar — no icon badge */}
        <MemberAvatar user={userInfo} size="sm" type={a.type} />

        {/* Content — two lines */}
        <div className="flex-1 min-w-0">
          {isKudos ? (
            <>
              {/* Line 1: Josh → Sarah  6h ago */}
              <p className="text-[13px] font-spartan font-semibold text-[var(--color-text-primary)] leading-snug">
                {userName}
                {a.data?.targetUserName && (
                  <span className="font-normal text-[var(--color-text-secondary)]"> → {a.data.targetUserName}</span>
                )}
                <span className="ml-2 text-[11px] font-normal text-[var(--color-text-quaternary)]">{timeAgo(a.createdAt)}</span>
              </p>
              {/* Line 2: italic quote */}
              {a.data?.message && (
                <p className="text-[12px] font-spartan italic text-[var(--color-text-tertiary)] leading-snug mt-0.5 truncate">
                  "{a.data.message}"
                </p>
              )}
            </>
          ) : (
            <>
              {/* Line 1: bold description + optional inline streak pill */}
              <p className="text-[13px] font-spartan font-semibold text-[var(--color-text-primary)] leading-snug flex items-center gap-2 flex-wrap">
                {activityDescription(a)}
                {isMilestone && streakCount && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                    🔥 {streakCount}-day streak
                  </span>
                )}
              </p>
              {/* Line 2: timestamp */}
              <p className="text-[11px] font-spartan text-[var(--color-text-quaternary)] mt-0.5">
                {timeAgo(a.createdAt)}
              </p>
            </>
          )}
        </div>

        {/* Right: reactions + optional Kudos label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />
          {showKudosCTA && !kudosOpen && (
            <button
              onClick={() => setKudosOpen(true)}
              className="text-xs font-spartan font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              Kudos
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Timeline layout ─────────────────────────────────────────── */

  if (density === "timeline") {
    return (
      <div className="flex gap-4 relative">
        {/* Timeline column */}
        <div className="flex flex-col items-center flex-shrink-0 w-10">
          {/* Avatar node */}
          <div
            className="relative z-10 rounded-full ring-2 ring-[var(--color-bg-primary)] flex-shrink-0"
            style={{ background: avatarBg(a.type) }}
          >
            <MemberAvatar user={userInfo} size="lg" type={a.type} />
          </div>
          {/* Connector line */}
          {!isLast && (
            <div
              className="w-px flex-1 mt-1 min-h-8"
              style={{ background: `linear-gradient(to bottom, ${accentColor(a.type)}40, transparent)` }}
            />
          )}
        </div>

        {/* Card */}
        <div className="flex-1 min-w-0 pb-6">
          {/* Header: name · time · badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">
              {userName}
            </span>
            {isKudos && a.data?.targetUserName && (
              <span className="text-sm font-spartan text-[var(--color-text-tertiary)]">
                to {a.data.targetUserName}
              </span>
            )}
            <span className="text-xs font-spartan text-[var(--color-text-quaternary)]">
              · {timeAgo(a.createdAt)}
            </span>
            {label && (
              <span
                className={`ml-auto text-[10px] font-spartan font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badgeStyle(a.type)}`}
              >
                {activityIcon(a.type, 10)}
                {label}
              </span>
            )}
          </div>

          {/* Main card body */}
          <div className="rounded-2xl border border-[var(--color-border-primary)]/12 bg-[var(--color-surface-elevated)]/50 px-4 py-3 hover:border-[var(--color-border-primary)]/25 transition-colors">
            {/* Title */}
            {!isKudos && (
              <p className="text-[15px] font-spartan font-bold text-[var(--color-text-primary)] mb-2 leading-snug">
                {activityTitle(a)}
              </p>
            )}

            {/* Streak pill */}
            {isMilestone && streakCount && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-spartan font-semibold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                  🔥 {streakCount}-day streak
                </span>
              </div>
            )}

            {/* Kudos message */}
            {isKudos && a.data?.message && (
              <p className="text-sm font-spartan italic text-[var(--color-text-secondary)] mb-2 leading-relaxed">
                "{a.data.message}"
              </p>
            )}

            {/* Reactions row + kudos CTA */}
            <div className="flex items-center gap-3 flex-wrap">
              <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />

              {showKudosCTA && !kudosOpen && (
                <button
                  onClick={() => setKudosOpen(true)}
                  className="ml-auto text-xs font-spartan font-semibold text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] transition-colors flex items-center gap-1"
                >
                  <Heart size={12} weight="fill" />
                  Kudos sent ✓
                </button>
              )}

              {isKudos && (
                <span className="ml-auto text-xs font-spartan font-semibold text-teal-400 flex items-center gap-1">
                  Kudos sent ✓
                </span>
              )}
            </div>

            {kudosOpen && (
              <KudosInput
                onSend={handleSendKudos}
                onCancel={() => setKudosOpen(false)}
                sending={sending}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Cozy layout ─────────────────────────────────────────────── */

  // Kudos: inverted — quote body first, attribution at bottom
  if (isKudos) {
    return (
      <div className="rounded-2xl border border-[var(--color-border-primary)]/10 bg-[var(--color-surface-elevated)]/60 hover:border-[var(--color-border-primary)]/20 transition-colors px-4 py-4">
        {/* Quote */}
        {a.data?.message && (
          <p className="text-sm font-spartan italic text-[var(--color-text-secondary)] leading-relaxed mb-3">
            "{a.data.message}"
          </p>
        )}
        {/* Attribution row */}
        <div className="flex items-center gap-2">
          <MemberAvatar user={userInfo} size="sm" type={a.type} />
          <span className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">{userName}</span>
          {a.data?.targetUserName && (
            <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">to {a.data.targetUserName}</span>
          )}
          <span className="text-xs font-spartan text-[var(--color-text-quaternary)]">· {timeAgo(a.createdAt)}</span>
          {label && (
            <span className={`ml-auto text-[10px] font-spartan font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badgeStyle(a.type)}`}>
              {activityIcon(a.type, 10)}
              {label}
            </span>
          )}
        </div>
        {/* Reactions */}
        <div className="mt-3">
          <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />
        </div>
      </div>
    );
  }

  // Standard cozy card
  return (
    <div className="rounded-2xl border border-[var(--color-border-primary)]/10 bg-[var(--color-surface-elevated)]/60 hover:border-[var(--color-border-primary)]/20 transition-colors px-4 py-4">
      {/* Header: avatar + name · time + badge */}
      <div className="flex items-center gap-2 mb-3">
        <MemberAvatar user={userInfo} size="sm" type={a.type} />
        <span className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">{userName}</span>
        <span className="text-xs font-spartan text-[var(--color-text-quaternary)]">· {timeAgo(a.createdAt)}</span>
        {label && (
          <span className={`ml-auto text-[10px] font-spartan font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badgeStyle(a.type)}`}>
            {activityIcon(a.type, 10)}
            {label}
          </span>
        )}
      </div>

      {/* Large bold title */}
      <p className="text-[22px] font-spartan font-bold text-[var(--color-text-primary)] leading-tight mb-3">
        {activityTitle(a)}
      </p>

      {/* Reactions + kudos CTA */}
      <div className="flex items-center gap-3 flex-wrap">
        <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />
        {showKudosCTA && !kudosOpen && (
          <button
            onClick={() => setKudosOpen(true)}
            className="ml-auto text-xs font-spartan font-semibold px-3 py-1.5 rounded-full border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-colors"
          >
            Kudos sent ✓
          </button>
        )}
      </div>

      {kudosOpen && (
        <KudosInput
          onSend={handleSendKudos}
          onCancel={() => setKudosOpen(false)}
          sending={sending}
        />
      )}
    </div>
  );
};

export default FeedCard;
