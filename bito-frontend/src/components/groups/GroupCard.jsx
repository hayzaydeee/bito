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
      className="group relative w-full text-left rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-primary)]/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 transition-all duration-200 overflow-hidden"
    >
      {/* top colour accent */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(to right, ${color}90, ${color}20)` }}
      />

      <div className="p-5 flex flex-col gap-4">
        {/* icon + name row */}
        <div className="flex items-start gap-4">
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon
              size={24}
              weight="duotone"
              style={{ color }}
            />
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-garamond font-bold text-[var(--color-text-primary)] truncate leading-snug">
              {group.name}
            </h3>
            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
              {memberCount} member{memberCount !== 1 && "s"}
              {activeToday > 0 && (
                <> · <span className="text-emerald-500">{activeToday} active today</span></>
              )}
            </p>
          </div>
        </div>

        {/* bottom row: avatar stack + type pill + arrow */}
        <div className="flex items-center gap-3">
          {memberCount > 0 && (
            <AvatarStack members={group.members || []} max={4} size="sm" />
          )}

          <span
            className="text-[11px] font-spartan font-medium px-2.5 py-0.5 rounded-full border"
            style={{
              color,
              borderColor: `${color}40`,
              backgroundColor: `${color}12`,
            }}
          >
            {typeLabel}
          </span>

          <span className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] group-hover:bg-[var(--color-brand-600)]/10 transition-colors">
            <ArrowRight size={14} weight="bold" />
          </span>
        </div>
      </div>
    </button>
  );
};

export default GroupCard;
