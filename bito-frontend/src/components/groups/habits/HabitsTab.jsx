import { Target } from "@phosphor-icons/react";
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
  return (
    <div className="flex gap-6">
      {/* ── Habit list ── */}
      <div className="flex-1 min-w-0" data-group-habits-list>
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mb-4 uppercase tracking-wide">
          Group habits ({habits.length})
        </p>

        {habits.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <Target size={40} weight="duotone" className="text-[var(--color-text-tertiary)]" />
            </div>
            <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
              No group habits yet
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
              {canManage || canCreateHabits
                ? "Add the first habit to get started."
                : "Only managers can add habits for this group."}
            </p>
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
          canManage={canManage || canCreateHabits}
          onAddHabit={onAdd}
        />
      </aside>
    </div>
  );
};

export default HabitsTab;
