import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import AvatarStack from "../shared/AvatarStack";
import { getGroupTypeConfig } from "./groupTypeConfig";

/**
 * GroupCard — displayed on the /app/groups list page.
 *
 * Props:
 *   group  — group object from the API
 */
const GroupCard = ({ group }) => {
  const navigate = useNavigate();
  const { Icon } = getGroupTypeConfig(group.type);
  const color = group.color || "#4f46e5";
  const memberCount = group.members?.length || group.stats?.totalMembers || 0;
  const activeToday = group.stats?.activeMembers || 0;
  const typeLabel = getGroupTypeConfig(group.type).label;

  return (
    <button
      onClick={() => navigate(`/app/groups/${group._id}`)}
      className="group relative w-full text-left rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 hover:border-[var(--color-border-primary)]/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 transition-all duration-200 overflow-hidden p-5 flex flex-col min-h-[160px]"
    >
      {/* icon — top left */}
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mb-auto"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={22} weight="duotone" style={{ color }} />
      </span>

      {/* name + subtitle — bottom left */}
      <div className="mt-4">
        <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] leading-tight">
          {group.name}
        </h3>
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
          {memberCount} member{memberCount !== 1 && "s"}
          {activeToday > 0 && (
            <> · <span className="text-emerald-500">{activeToday} active today</span></>
          )}
        </p>
      </div>

      {/* bottom row: avatars + type pill + arrow */}
      <div className="flex items-center gap-2 mt-3">
        {memberCount > 0 && (
          <AvatarStack members={group.members || []} max={4} size="sm" />
        )}

        <span
          className="text-[11px] font-spartan font-medium px-2.5 py-0.5 rounded-full border"
          style={{
            color,
            borderColor: `${color}40`,
            backgroundColor: `${color}15`,
          }}
        >
          {typeLabel}
        </span>

        <span className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowRight size={13} weight="bold" />
        </span>
      </div>
    </button>
  );
};

export default GroupCard;
