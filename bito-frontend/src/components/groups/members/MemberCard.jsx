import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Fire, Sparkle } from "@phosphor-icons/react";

/**
 * MemberCard
 *
 * Props:
 *   member        — member object (with userId populated)
 *   groupId       — string
 *   isYou         — boolean
 *   onViewDashboard — (memberId) => void
 */
const MemberCard = ({ member, groupId, isYou, onEncourage, onViewDashboard }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const info = member.userId || member.user || member;
  const name = info.name || info.email || "Unknown";
  const username = info.username ? `@${info.username}` : null;
  const streakCount = member.streak || info.currentStreak || 0;
  const role = member.role;
  const isActive = member.isActiveToday;

  const memberId = (
    member.userId?._id || member.userId || member._id || member.id || ""
  ).toString();

  const roleColor = {
    owner: "var(--signal)",
    admin: "var(--cobalt)",
    member: "var(--ink-3)",
    viewer: "var(--ink-3)",
  }[role] || "var(--ink-3)";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  return (
    <div 
      className={`relative flex items-center gap-3 p-4 grp-card grp-card-hover transition-all duration-200 ${!isYou ? 'cursor-pointer hover:z-50' : ''}`}
      onClick={() => !isYou && onViewDashboard?.(memberId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip via React state (more reliable than group-hover) */}
      {!isYou && onViewDashboard && isHovered && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-[var(--ink)] text-[var(--surface)] text-[10px] rounded-[6px] pointer-events-none whitespace-nowrap z-[100] std-mono tracking-wider font-bold uppercase shadow-md animate-in fade-in zoom-in-95 duration-100">
          Click to view member's dashboard
        </div>
      )}
      
      {/* Avatar + presence dot */}
      <div className="relative flex-shrink-0">
        {info.avatar ? (
          <img src={info.avatar} alt={name} className="w-10 h-10 rounded-[10px] object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-[10px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink)] text-sm grp-display font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--signal)] border-2 border-[var(--surface)]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-[var(--ink)] truncate">{name}</p>
          {isYou && <span className="grp-mono text-[10px] text-[var(--signal)] uppercase">(you)</span>}
        </div>
        <p className="grp-mono text-[10.5px] text-[var(--ink-3)] truncate mt-0.5 tracking-wide">
          {username && <span>{username}</span>}
          {username && streakCount > 0 && <span> · </span>}
          {streakCount > 0 && (
            <span className="text-[var(--ember)] inline-flex items-center gap-1">
              <Fire size={10} weight="fill" /> {streakCount}-DAY
            </span>
          )}
          {!username && streakCount === 0 && member.joinedAt && (
            <span>JOINED {new Date(member.joinedAt).toLocaleDateString()}</span>
          )}
        </p>
      </div>

      {/* Badges / Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Role badge */}
        {roleLabel && (
          <span className="grp-tag" style={{ color: roleColor, borderColor: "var(--line-2)" }}>
            {roleLabel}
          </span>
        )}

        {/* Always visible encourage button */}
        {!isYou && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEncourage) onEncourage();
            }}
            title="Send encouragement"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line-2)] hover:bg-[var(--signal)] hover:text-white hover:border-[var(--signal)] transition-colors group/nudge"
          >
            <Sparkle size={14} weight="duotone" className="group-hover/nudge:animate-pulse" />
            <span className="std-mono text-[10px] font-bold uppercase tracking-wider">Nudge</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MemberCard;
