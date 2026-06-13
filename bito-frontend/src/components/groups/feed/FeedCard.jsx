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
    habit_completed:     "bg-emerald-500/12 text-emerald-500 border-emerald-500/20",
    streak_milestone:    "bg-orange-500/12 text-orange-500 border-orange-500/20",
    member_joined:       "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]/20",
    kudos:               "bg-rose-500/12 text-rose-500 border-rose-500/20",
    challenge_joined:    "bg-teal-500/12 text-teal-500 border-teal-500/20",
    challenge_started:   "bg-amber-500/12 text-amber-500 border-amber-500/20",
    challenge_milestone: "bg-amber-500/12 text-amber-500 border-amber-500/20",
    habit_adopted:       "bg-blue-500/12 text-blue-500 border-blue-500/20",
  };
  return map[type] || "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]/20";
}

function activityIcon(type) {
  const props = { size: 12, weight: "fill" };
  const map = {
    habit_completed:     <CheckCircle {...props} className="text-emerald-500" />,
    habit_adopted:       <PlusCircle  {...props} className="text-blue-500" />,
    streak_milestone:    <Fire        {...props} className="text-orange-500" />,
    member_joined:       <HandWaving  {...props} className="text-yellow-500" />,
    habit_created:       <Target      {...props} className="text-indigo-500" />,
    habit_deleted:       <Trash       {...props} className="text-red-400" />,
    challenge_started:   <Trophy      {...props} className="text-amber-500" />,
    challenge_joined:    <Handshake   {...props} className="text-teal-500" />,
    challenge_milestone: <Star        {...props} className="text-yellow-500" />,
    kudos:               <Heart       {...props} className="text-rose-500" />,
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
      return `${name} → ${a.data?.targetUserName || "a teammate"}`;
    default:
      return a.data?.message || a.description || `${name} did something`;
  }
}

/* ── Avatar ─────────────────────────────────────────────────── */

function MemberAvatar({ user, size = "md" }) {
  const name = user?.name || user?.email || "?";
  const initial = name.charAt(0).toUpperCase();
  const sz = size === "lg" ? "w-10 h-10 text-sm" : "w-7 h-7 text-xs";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sz} rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white font-spartan font-bold flex-shrink-0`}
    >
      {initial}
    </div>
  );
}

/* ── FeedCard ───────────────────────────────────────────────── */

/**
 * FeedCard
 *
 * Props:
 *   activity      — activity object
 *   density       — 'cozy' | 'compact'
 *   reactions     — { [type]: count }
 *   myReaction    — current user's reaction type or null
 *   onReact       — (type) => void
 *   groupId       — string
 *   currentUserId — string
 *   onKudosSent   — (newActivity) => void  — inserts kudos card into feed
 *   alreadySentKudos — boolean — hides kudos CTA
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
}) => {
  const [kudosOpen, setKudosOpen] = useState(false);
  const [kudosMsg, setKudosMsg] = useState("");
  const [sending, setSending] = useState(false);

  
  const userInfo = a.userId || a.user || {};
  const label = activityLabel(a.type);
  const isMilestone = a.type === "streak_milestone";
  const isKudos = a.type === "kudos";
  const streakCount = a.data?.streakCount;

  const showKudosCTA =
    isMilestone &&
    !alreadySentKudos &&
    (a.userId?._id || a.userId)?.toString() !== currentUserId?.toString();

  const handleSendKudos = async () => {
    if (sending) return;
    const targetUserId = (a.userId?._id || a.userId)?.toString();
    if (!targetUserId) return;
    setSending(true);
    try {
      const msg = kudosMsg.trim() || randomFallback();
      const res = await groupsAPI.sendKudos(groupId, targetUserId, msg);
      if (res.success) {
        setKudosOpen(false);
        setKudosMsg("");
        onKudosSent?.(res.activity || {
          _id: `kudos-${Date.now()}`,
          type: "kudos",
          userId: { _id: currentUserId, name: "You" },
          data: { targetUserName: userInfo?.name, message: msg },
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
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors group/item">
        {/* Avatar with icon badge */}
        <div className="relative flex-shrink-0">
          <MemberAvatar user={userInfo} size="sm" />
          <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
            {activityIcon(a.type)}
          </span>
        </div>

        {/* Content */}
        <p className="flex-1 min-w-0 text-[13px] font-spartan text-[var(--color-text-primary)] truncate">
          {activityDescription(a)}
          {isKudos && a.data?.message && (
            <span className="text-[var(--color-text-tertiary)]"> · "{a.data.message}"</span>
          )}
          {isMilestone && streakCount && (
            <span className="ml-2 text-[11px] text-orange-500 font-medium">
              🔥 {streakCount} days
            </span>
          )}
        </p>

        {/* Badge + time */}
        {label && (
          <span className={`flex-shrink-0 text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full border ${badgeStyle(a.type)}`}>
            {label}
          </span>
        )}
        <span className="flex-shrink-0 text-[11px] text-[var(--color-text-quaternary)] font-spartan">
          {timeAgo(a.createdAt)}
        </span>

        {/* Reactions compact */}
        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
          <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />
        </div>
      </div>
    );
  }

  /* ── Cozy layout ─────────────────────────────────────────────── */

  return (
    <div className="flex items-start gap-3.5 px-4 py-4 rounded-2xl border border-[var(--color-border-primary)]/10 bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-primary)]/20 transition-colors">
      {/* Avatar */}
      <MemberAvatar user={userInfo} size="lg" />

      <div className="flex-1 min-w-0">
        {/* Full description + inline type badge */}
        <div className="flex items-start gap-2 mb-1">
          <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] leading-snug flex-1">
            {activityDescription(a)}
          </p>
          {label && (
            <span className={`flex-shrink-0 mt-0.5 text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full border ${badgeStyle(a.type)}`}>
              {label}
            </span>
          )}
        </div>

        {/* Streak badge for milestones — inline pill below description */}
        {isMilestone && streakCount && (
          <div className="mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-spartan font-medium px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
              🔥 {streakCount}-day streak
            </span>
          </div>
        )}

        {/* Kudos quoted message */}
        {isKudos && a.data?.message && (
          <p className="text-sm font-spartan italic text-[var(--color-text-secondary)] mb-1">
            "{a.data.message}"
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mb-2">
          {timeAgo(a.createdAt)}
        </p>

        {/* Reactions row */}
        <div className="flex items-center gap-3">
          <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />

          {showKudosCTA && !kudosOpen && (
            <button
              onClick={() => setKudosOpen(true)}
              className="ml-auto text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] transition-colors"
            >
              Give kudos
            </button>
          )}
        </div>

        {/* Inline kudos input */}
        {kudosOpen && (
          <div className="flex items-center gap-2 mt-2">
            <input
              autoFocus
              value={kudosMsg}
              onChange={(e) => setKudosMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendKudos()}
              placeholder="Add a message (optional)"
              className="flex-1 h-8 px-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:border-[var(--color-brand-500)]/50 transition-colors"
            />
            <button
              onClick={handleSendKudos}
              disabled={sending}
              className="h-8 px-4 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-xs font-spartan font-medium transition-colors disabled:opacity-50"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedCard;
