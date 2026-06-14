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

/** Left accent colour per activity type */
function accentColor(type) {
  const map = {
    habit_completed:     "#a78bfa",
    streak_milestone:    "#ff7a3c",
    member_joined:       "#6f9bff",
    kudos:               "#ff5d73",
    challenge_joined:    "#36d6c3",
    challenge_started:   "#ffc24b",
    challenge_milestone: "#ffc24b",
    habit_adopted:       "#6f9bff",
    habit_created:       "#a78bfa",
    habit_deleted:       "#ff7a7a",
  };
  return map[type] || "#79766e";
}

/** Avatar background colour per type (for timeline nodes) */
function avatarBg(type) {
  const map = {
    habit_completed:     "linear-gradient(135deg,#7c5cf0,#a78bfa)",
    streak_milestone:    "linear-gradient(135deg,#ea580c,#ff7a3c)",
    member_joined:       "linear-gradient(135deg,#3b6fd6,#6f9bff)",
    kudos:               "linear-gradient(135deg,#e11d48,#ff5d73)",
    challenge_joined:    "linear-gradient(135deg,#0d9488,#36d6c3)",
    challenge_started:   "linear-gradient(135deg,#b45309,#ffc24b)",
    challenge_milestone: "linear-gradient(135deg,#b45309,#ffc24b)",
    habit_adopted:       "linear-gradient(135deg,#3b6fd6,#6f9bff)",
    habit_created:       "linear-gradient(135deg,#7c3aed,#a78bfa)",
    habit_deleted:       "linear-gradient(135deg,#dc2626,#ff7a7a)",
  };
  return map[type] || "linear-gradient(135deg,#4b5563,#79766e)";
}

function activityIcon(type, size = 12) {
  const props = { size, weight: "fill", style: { color: accentColor(type) } };
  const map = {
    habit_completed:     <CheckCircle {...props} />,
    habit_adopted:       <PlusCircle  {...props} />,
    streak_milestone:    <Fire        {...props} />,
    member_joined:       <HandWaving  {...props} />,
    habit_created:       <Target      {...props} />,
    habit_deleted:       <Trash       {...props} />,
    challenge_started:   <Trophy      {...props} />,
    challenge_joined:    <Handshake   {...props} />,
    challenge_milestone: <Star        {...props} />,
    kudos:               <Heart       {...props} />,
  };
  return map[type] || <MapPin {...props} />;
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

/** Short title for cozy/timeline card heading (bold, prominent) */
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

/* ── Badge (mono tag, type-coloured) ───────────────────────── */

function TypeBadge({ type, label }) {
  const c = accentColor(type);
  return (
    <span className="grp-tag" style={{ color: c, borderColor: `${c}55` }}>
      {activityIcon(type, 10)}
      {label}
    </span>
  );
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

  const bg = type ? avatarBg(type) : "linear-gradient(135deg,#7c5cf0,#a78bfa)";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        className={`${sizeClass} rounded-[10px] object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-[10px] flex items-center justify-center text-[#0a0a0c] grp-display font-bold flex-shrink-0`}
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
    <div className="flex items-center gap-2 mt-3">
      <input
        autoFocus
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend(msg)}
        placeholder="Add a message (optional)"
        className="grp-input flex-1 h-9 text-sm"
      />
      <button
        onClick={() => onSend(msg)}
        disabled={sending}
        className="grp-btn grp-btn--signal grp-btn--sm disabled:opacity-50"
      >
        {sending ? "…" : "Send"}
      </button>
      <button onClick={onCancel} className="grp-btn grp-btn--sm">
        Cancel
      </button>
    </div>
  );
}

/* ── FeedCard ───────────────────────────────────────────────── */

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

  const streakPill = (
    <span className="grp-tag" style={{ color: "var(--ember)", borderColor: "rgba(255,122,60,0.4)" }}>
      <Fire size={11} weight="fill" /> {streakCount}-day streak
    </span>
  );

  /* ── Compact layout ─────────────────────────────────────────── */

  if (density === "compact") {
    return (
      <div
        className={`relative flex items-center gap-3 pl-5 pr-3 py-3 hover:bg-[var(--surface)] transition-colors ${
          !isLast ? "border-b border-[var(--line)]" : ""
        }`}
      >
        {/* Rounded accent bar */}
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-7 rounded-full"
          style={{ backgroundColor: accentColor(a.type) }}
        />

        <MemberAvatar user={userInfo} size="sm" type={a.type} />

        {/* Content — two lines */}
        <div className="flex-1 min-w-0">
          {isKudos ? (
            <>
              <p className="text-[13px] font-semibold text-[var(--ink)] leading-snug">
                {userName}
                {a.data?.targetUserName && (
                  <span className="font-normal text-[var(--ink-2)]"> → {a.data.targetUserName}</span>
                )}
                <span className="grp-mono ml-2 text-[10px] font-normal text-[var(--ink-3)] uppercase tracking-wider">{timeAgo(a.createdAt)}</span>
              </p>
              {a.data?.message && (
                <p className="grp-display text-[13px] italic text-[var(--ink-2)] leading-snug mt-0.5 truncate">
                  "{a.data.message}"
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-[var(--ink)] leading-snug flex items-center gap-2 flex-wrap">
                {activityDescription(a)}
                {isMilestone && streakCount && streakPill}
              </p>
              <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5 uppercase tracking-wider">
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
              className="grp-mono text-[11px] font-bold uppercase tracking-wider text-[var(--signal)] hover:text-[var(--signal-2)] transition-colors"
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
          <div
            className="relative z-10 rounded-[10px] ring-2 ring-[var(--bg)] flex-shrink-0"
            style={{ background: avatarBg(a.type) }}
          >
            <MemberAvatar user={userInfo} size="lg" type={a.type} />
          </div>
          {!isLast && (
            <div
              className="w-px flex-1 mt-1 min-h-8"
              style={{ background: `linear-gradient(to bottom, ${accentColor(a.type)}55, transparent)` }}
            />
          )}
        </div>

        {/* Card */}
        <div className="flex-1 min-w-0 pb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--ink)]">{userName}</span>
            {isKudos && a.data?.targetUserName && (
              <span className="text-sm text-[var(--ink-3)]">to {a.data.targetUserName}</span>
            )}
            <span className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider">
              {timeAgo(a.createdAt)}
            </span>
            {label && <span className="ml-auto"><TypeBadge type={a.type} label={label} /></span>}
          </div>

          <div className="grp-card grp-card-hover px-4 py-3">
            {!isKudos && (
              <p className="grp-display text-[16px] font-bold text-[var(--ink)] mb-2 leading-snug">
                {activityTitle(a)}
              </p>
            )}

            {isMilestone && streakCount && <div className="mb-2">{streakPill}</div>}

            {isKudos && a.data?.message && (
              <p className="grp-display text-sm italic text-[var(--ink-2)] mb-2 leading-relaxed">
                "{a.data.message}"
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />

              {showKudosCTA && !kudosOpen && (
                <button
                  onClick={() => setKudosOpen(true)}
                  className="ml-auto grp-mono text-[11px] font-bold uppercase tracking-wider text-[var(--signal)] hover:text-[var(--signal-2)] transition-colors flex items-center gap-1"
                >
                  <Heart size={12} weight="fill" />
                  Give kudos
                </button>
              )}

              {isKudos && (
                <span className="ml-auto grp-mono text-[11px] font-bold uppercase tracking-wider text-[var(--rose)]">
                  Kudos sent
                </span>
              )}
            </div>

            {kudosOpen && (
              <KudosInput onSend={handleSendKudos} onCancel={() => setKudosOpen(false)} sending={sending} />
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
      <div className="grp-card grp-card-hover overflow-hidden">
        <div className="px-5 pt-4 pb-4">
          {a.data?.message && (
            <p className="grp-display text-base italic text-[var(--ink-2)] leading-relaxed mb-3">
              "{a.data.message}"
            </p>
          )}
          <div className="flex items-center gap-2">
            <MemberAvatar user={userInfo} size="sm" type={a.type} />
            <span className="text-sm font-semibold text-[var(--ink)]">{userName}</span>
            {a.data?.targetUserName && (
              <span className="text-xs text-[var(--ink-3)]">to {a.data.targetUserName}</span>
            )}
            <span className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider">{timeAgo(a.createdAt)}</span>
            {label && <span className="ml-auto"><TypeBadge type={a.type} label={label} /></span>}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-[var(--line-2)] bg-[var(--bg-2)]/40">
          <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />
        </div>
      </div>
    );
  }

  // Standard cozy card
  return (
    <div className="grp-card grp-card-hover overflow-hidden">
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center gap-2">
          <MemberAvatar user={userInfo} size="sm" type={a.type} />
          <span className="text-sm font-semibold text-[var(--ink)]">{userName}</span>
          <span className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider">{timeAgo(a.createdAt)}</span>
          {label && <span className="ml-auto"><TypeBadge type={a.type} label={label} /></span>}
        </div>

        <p className="grp-display text-[21px] sm:text-[26px] font-bold text-[var(--ink)] leading-tight mt-3">
          {activityTitle(a)}
        </p>
      </div>

      <div className="px-5 py-3 border-t border-[var(--line-2)] bg-[var(--bg-2)]/40">
        <div className="flex items-center gap-3 flex-wrap">
          <ReactionPicker reactions={reactions} myReaction={myReaction} onReact={onReact} />
          {showKudosCTA && !kudosOpen && (
            <button
              onClick={() => setKudosOpen(true)}
              className="ml-auto grp-btn grp-btn--sm"
            >
              <Heart size={12} weight="regular" />
              Give kudos
            </button>
          )}
        </div>

        {kudosOpen && (
          <KudosInput onSend={handleSendKudos} onCancel={() => setKudosOpen(false)} sending={sending} />
        )}
      </div>
    </div>
  );
};

export default FeedCard;
