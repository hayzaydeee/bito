import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gear } from "@phosphor-icons/react";
import AvatarStack from "../shared/AvatarStack";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import { getGroupTypeConfig } from "./groupTypeConfig";

/**
 * GroupDetailHeader
 *
 * Props:
 *   group    — group object
 *   groupId  — string
 *   members  — array of member objects
 */
const GroupDetailHeader = ({ group, groupId, members }) => {
  const navigate = useNavigate();
  const color = group?.color || "#4f46e5";
  const { Icon } = getGroupTypeConfig(group?.type);
  const typeLabel = getGroupTypeConfig(group?.type).label;
  const intensity = group?.settings?.intensity;
  const intensityLabel =
    intensity === "supportive"
      ? "Supportive mode"
      : intensity === "sharp"
      ? "Sharp mode"
      : intensity === "accountable"
      ? "Accountable mode"
      : null;

  const subtitle = [typeLabel, `${members.length} member${members.length !== 1 ? "s" : ""}`, intensityLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      {/* left: back + icon + name */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => navigate("/app/groups")}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
          aria-label="Back to groups"
        >
          <ArrowLeft size={16} weight="bold" />
        </button>

        <span
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}25` }}
        >
          <Icon size={28} weight="duotone" style={{ color }} />
        </span>

        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-garamond font-bold text-[var(--color-text-primary)] truncate leading-tight">
            {group?.name}
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* right: avatar stack + settings + theme */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {members.length > 0 && (
          <AvatarStack members={members} max={5} size="sm" />
        )}
        <button
          onClick={() => navigate(`/app/groups/${groupId}/settings`)}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Group settings"
        >
          <Gear size={16} weight="bold" />
        </button>
        <ThemeSwitcher compact />
      </div>
    </div>
  );
};

export default GroupDetailHeader;
