import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";

/**
 * MemberCard
 *
 * Props:
 *   member        — member object (with userId populated)
 *   groupId       — string
 *   isYou         — boolean
 *   canManage     — boolean
 *   onEncourage   — () => void
 */
const MemberCard = ({ member, groupId, isYou, onEncourage }) => {
  const navigate = useNavigate();
  const info = member.userId || member.user || member;
  const name = info.name || info.email || "Unknown";
  const username = info.username ? `@${info.username}` : null;
  const streakCount = member.streak || info.currentStreak || 0;
  const role = member.role;
  const isActive = member.isActiveToday;

  const memberId = (
    member.userId?._id || member.userId || member._id || member.id || ""
  ).toString();

  const roleStyles = {
    owner: "bg-[var(--color-brand-600)]/12 text-[var(--color-brand-500)] border-[var(--color-brand-600)]/20",
    admin: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    member: "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]/15",
    viewer: "bg-[var(--color-surface-hover)] text-[var(--color-text-quaternary)] border-[var(--color-border-primary)]/15",
  };
  const roleStyle = roleStyles[role] || roleStyles.member;
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-surface-elevated)]/60 border border-[var(--color-border-primary)]/15 hover:border-[var(--color-border-primary)]/35 transition-all group/card">
      {/* Avatar + presence dot */}
      <div className="relative flex-shrink-0">
        {info.avatar ? (
          <img
            src={info.avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white text-sm font-spartan font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--color-surface-elevated)]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
            {name}
          </p>
          {isYou && (
            <span className="text-xs text-[var(--color-brand-500)] font-spartan">(you)</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan truncate mt-0.5">
          {username && <span>{username}</span>}
          {username && streakCount > 0 && <span> · </span>}
          {streakCount > 0 && (
            <span className="text-orange-400">🔥 {streakCount}-day streak</span>
          )}
          {!username && streakCount === 0 && member.joinedAt && (
            <span>joined {new Date(member.joinedAt).toLocaleDateString()}</span>
          )}
        </p>
      </div>

      {/* Role badge */}
      {roleLabel && (
        <span className={`flex-shrink-0 text-[10px] font-spartan font-medium px-2.5 py-0.5 rounded-full border ${roleStyle}`}>
          {roleLabel}
        </span>
      )}

      {/* Actions (shown on hover, hidden for self) */}
      {!isYou && (
        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={onEncourage}
            className="text-[11px] font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-500)] transition-colors px-1"
          >
            Encourage
          </button>
          <button
            onClick={() => navigate(`/app/groups/${groupId}/members/${memberId}/dashboard`)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowRight size={12} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberCard;
