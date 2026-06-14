import { Target, Plus } from "@phosphor-icons/react";
import GroupHabitCard from "./GroupHabitCard";
import HabitsSidebar from "./HabitsSidebar";

/**
 * HabitsTab
 *
 * Props:
 *   groupId        — string
 *   habits         — GroupHabit[] (all group habits)
 *   adoptedHabits  — Habit[] adopted by current user
 *   totalMembers   — number
 *   canManage      — boolean
 *   canCreateHabits — boolean
 *   currentUserId  — string
 *   isAdopted      — (habit) => boolean
 *   onAdd          — () => void  (opens add modal)
 *   onEdit         — (habit) => void  (opens edit modal)
 *   onAdopt        — (habit) => void  (opens adopt modal)
 *   onRefresh      — () => void
 */
const HabitsTab = ({
  habits = [],
  adoptedHabits = [],
  totalMembers,
  canManage,
  canCreateHabits,
  currentUserId,
  isAdopted,
  onAdd,
  onEdit,
  onAdopt,
}) => {
  const canAdd = canManage || canCreateHabits;

  return (
    <div className="flex gap-8">
      {/* ── Habit list ── */}
      <div className="flex-1 min-w-0" data-group-habits-list>
        <p className="grp-kicker mb-4">
          Group habits — {String(habits.length).padStart(2, "0")}
        </p>

        {habits.length === 0 ? (
          <div className="grp-card text-center py-14 px-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--signal)]/8 blur-3xl pointer-events-none" />
            <Target size={40} weight="duotone" className="mx-auto mb-4 text-[var(--signal)] relative" />
            <h3 className="grp-display text-2xl font-bold text-[var(--ink)] mb-2 relative">
              No group habits yet
            </h3>
            <p className="text-sm text-[var(--ink-2)] mb-7 relative">
              {canAdd
                ? "Add the first habit to set the pace for the group."
                : "Only managers can add habits for this group."}
            </p>
            {canAdd && (
              <button onClick={onAdd} className="grp-btn grp-btn--signal mx-auto relative">
                <Plus size={14} weight="bold" />
                Create group habit
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((h) => {
              const adopted = isAdopted(h);
              const creatorId = (h.createdBy?._id || h.createdBy || "").toString();
              const canEdit = canManage || creatorId === currentUserId?.toString();

              return (
                <GroupHabitCard
                  key={h._id}
                  habit={h}
                  totalMembers={totalMembers}
                  adopted={adopted}
                  canEdit={canEdit}
                  onAdopt={() => onAdopt(h)}
                  onEdit={() => onEdit(h)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <HabitsSidebar
          groupHabits={habits}
          adoptedHabits={adoptedHabits}
          totalMembers={totalMembers}
          canManage={canAdd}
          onAddHabit={onAdd}
        />
      </aside>
    </div>
  );
};

export default HabitsTab;
