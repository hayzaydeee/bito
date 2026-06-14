import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import AvatarStack from "../shared/AvatarStack";
import { getGroupTypeConfig } from "./groupTypeConfig";

/**
 * GroupCard — displayed on the /app/groups list page.
 *
 * Props:
 *   group  — group object from the API
 *   index  — position in the list (for the ledger number)
 */
const GroupCard = ({ group, index = 0 }) => {
  const navigate = useNavigate();
  const { Icon } = getGroupTypeConfig(group.type);
  const color = group.color || "#4f46e5";
  const memberCount = group.members?.length || group.stats?.totalMembers || 0;
  const activeToday = group.stats?.activeMembers || 0;
  const typeLabel = getGroupTypeConfig(group.type).label;

  return (
    <button
      onClick={() => navigate(`/app/groups/${group._id}`)}
      className="group grp-card grp-card-hover relative w-full text-left overflow-hidden p-5 flex flex-col min-h-[176px]"
    >
      {/* top accent bar in group color */}
      <span
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: color }}
      />

      {/* top row: icon tile + ledger index */}
      <div className="flex items-start justify-between">
        <span
          className="w-11 h-11 rounded-[4px] flex items-center justify-center flex-shrink-0 border"
          style={{ backgroundColor: `${color}1f`, borderColor: `${color}55` }}
        >
          <Icon size={22} weight="duotone" style={{ color }} />
        </span>
        <span className="grp-mono text-[11px] text-[var(--ink-3)] tracking-widest pt-1">
          №{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* name + stat readout */}
      <div className="mt-auto pt-5">
        <h3 className="grp-display text-[22px] font-bold text-[var(--ink)] leading-tight truncate">
          {group.name}
        </h3>
        <p className="grp-mono text-[11px] text-[var(--ink-3)] mt-1.5 tracking-wide">
          {String(memberCount).padStart(2, "0")} MEMBER{memberCount !== 1 && "S"}
          {activeToday > 0 && (
            <> · <span className="text-[var(--signal)]">{activeToday} ACTIVE</span></>
          )}
        </p>
      </div>

      <hr className="grp-rule my-4" />

      {/* bottom row: avatars + type tag + arrow */}
      <div className="flex items-center gap-2">
        {memberCount > 0 && (
          <AvatarStack members={group.members || []} max={4} size="sm" />
        )}
        <span className="grp-tag" style={{ borderColor: `${color}55`, color }}>
          {typeLabel}
        </span>
        <span className="ml-auto flex items-center justify-center w-8 h-8 rounded-[4px] border border-[var(--line-2)] text-[var(--ink-3)] group-hover:bg-[var(--signal)] group-hover:border-[var(--signal)] group-hover:text-[var(--signal-ink)] transition-colors">
          <ArrowRight size={14} weight="bold" />
        </span>
      </div>
    </button>
  );
};

export default GroupCard;
