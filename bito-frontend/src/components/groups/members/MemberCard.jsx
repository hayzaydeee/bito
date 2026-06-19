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
      className={`flex items-center gap-3 p-4 grp-card grp-card-hover group/card ${!isYou ? 'cursor-pointer' : ''}`}
      onClick={() => !isYou && onViewDashboard?.(memberId)}
    >
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Role badge */}
        {roleLabel && (
          <span className="grp-tag" style={{ color: roleColor, borderColor: "var(--line-2)" }}>
            {roleLabel}
          </span>
        )}

        {/* Always visible encourage button */}
        {!isYou && (
          <button
            onClick={onEncourage}
            title={`Send encouragement`}
            className="w-6 h-6 flex items-center justify-center rounded-[6px] border border-[var(--line-2)] text-[var(--ink-3)] hover:border-[var(--signal)] hover:text-[var(--signal)] transition-colors bg-[var(--surface)] hover:bg-[var(--surface-2)]"
          >
            <Sparkle size={12} weight="bold" />
          </button>
        )}
      </div>

      {/* Actions (shown on hover, hidden for self) */}
      {!isYou && onViewDashboard && (
        <div className="flex items-center opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDashboard(memberId);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] border border-[var(--line-2)] text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowRight size={12} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberCard;
