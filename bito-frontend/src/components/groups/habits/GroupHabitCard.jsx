import { GearIcon } from "@radix-ui/react-icons";
import { Check } from "@phosphor-icons/react";
import HabitIcon from "../../shared/HabitIcon";

/**
 * GroupHabitCard
 *
 * Props:
 *   habit        — GroupHabit object
 *   totalMembers — number (for adoption ratio denominator)
 *   adopted      — boolean
 *   canEdit      — boolean
 *   onAdopt      — () => void
 *   onEdit       — () => void
 */
const GroupHabitCard = ({ habit, totalMembers, adopted, canEdit, onAdopt, onEdit }) => {
  const adoptedCount = habit.adoptionStats?.totalAdopted ?? habit.adoptedBy?.length ?? 0;
  const adoptionPct = totalMembers > 0 ? Math.round((adoptedCount / totalMembers) * 100) : 0;
  const color = habit.color || "#4f46e5";

  const freq = habit.defaultSettings?.frequency || habit.frequency;
  const weeklyTarget = habit.defaultSettings?.weeklyTarget;
  const scheduleLabel = (() => {
    if (freq === "daily") return "Daily";
    if (freq === "weekly" && weeklyTarget) return `${weeklyTarget}× / week`;
    return freq || "Daily";
  })();

  const creatorName = habit.createdBy?.name || habit.createdBy?.email || "";

  return (
    <div className={`grp-card overflow-hidden transition-colors ${adopted ? "border-[var(--signal)]/35" : "grp-card-hover"}`}>
      {/* left accent in habit colour */}
      <div className="flex items-stretch">
        <span className="w-1 flex-shrink-0" style={{ background: adopted ? "var(--signal)" : color }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4 p-5 pb-4">
            {/* Icon */}
            <span
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 border"
              style={{ backgroundColor: `${color}1f`, borderColor: `${color}55` }}
            >
              <HabitIcon icon={habit.icon} size={18} />
            </span>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <p className="grp-display text-[17px] font-bold text-[var(--ink)] truncate leading-tight">
                {habit.name}
              </p>
              <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-1 uppercase tracking-wider">
                {scheduleLabel}
                {creatorName && <> · by {creatorName.split(" ")[0]}</>}
              </p>
            </div>

            {/* Edit button */}
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="w-7 h-7 flex items-center justify-center rounded-[7px] border border-[var(--line-2)] text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors flex-shrink-0"
              >
                <GearIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Adopt / Adopted badge */}
            <button
              onClick={() => !adopted && onAdopt?.()}
              disabled={adopted}
              className={`grp-btn grp-btn--sm flex-shrink-0 ${
                adopted ? "border-[var(--signal)] text-[var(--signal)] cursor-default" : ""
              }`}
            >
              {adopted ? (
                <>
                  <Check size={13} weight="bold" />
                  Adopted
                </>
              ) : (
                "Adopt"
              )}
            </button>
          </div>

          {/* Progress meter + adoption count */}
          <div className="px-5 pb-4 space-y-1.5">
            <div className="grp-meter">
              <i style={{ width: `${adoptionPct}%`, background: adopted ? "var(--signal)" : color, transition: "width .5s ease" }} />
            </div>
            <p className="grp-mono text-[10px] text-[var(--ink-3)] text-right uppercase tracking-wider">
              {adoptedCount} / {totalMembers} adopted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupHabitCard;
