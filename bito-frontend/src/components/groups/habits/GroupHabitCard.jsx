import { GearIcon } from "@radix-ui/react-icons";
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
    if (freq === "weekly" && weeklyTarget) return `${weeklyTarget}x per week`;
    return freq || "Daily";
  })();

  const creatorName = habit.createdBy?.name || habit.createdBy?.email || "";

  return (
    <div
      className={`flex flex-col rounded-2xl border transition-all ${
        adopted
          ? "bg-emerald-500/5 border-emerald-500/15"
          : "bg-[var(--color-surface-elevated)]/60 border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40"
      }`}
    >
      <div className="flex items-start gap-4 p-5 pb-4">
        {/* Icon */}
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <HabitIcon icon={habit.icon} size={18} />
        </span>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
            {habit.name}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
            {scheduleLabel}
            {creatorName && <> · created by {creatorName.split(" ")[0]}</>}
          </p>
        </div>

        {/* Edit button */}
        {canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
          >
            <GearIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Adopt / Adopted badge */}
        <button
          onClick={() => !adopted && onAdopt?.()}
          disabled={adopted}
          className={`flex-shrink-0 text-xs font-spartan font-medium px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
            adopted
              ? "bg-emerald-500 text-white cursor-default"
              : "border border-[var(--color-border-primary)]/30 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          {adopted ? (
            <>
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7z" />
              </svg>
              Adopted
            </>
          ) : (
            "Adopt"
          )}
        </button>
      </div>

      {/* Progress bar + adoption count */}
      <div className="px-5 pb-4 space-y-1.5">
        <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${adopted ? "bg-emerald-500" : "bg-[var(--color-brand-500)]"}`}
            style={{ width: `${adoptionPct}%` }}
          />
        </div>
        <p className="text-[11px] text-[var(--color-text-quaternary)] font-spartan text-right">
          {adoptedCount} of {totalMembers} adopted
        </p>
      </div>
    </div>
  );
};

export default GroupHabitCard;
