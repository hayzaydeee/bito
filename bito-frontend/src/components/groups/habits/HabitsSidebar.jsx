import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import HabitIcon from "../../shared/HabitIcon";
import { habitsAPI } from "../../../services/api";

/**
 * HabitsSidebar
 *
 * Shows user's adopted group habits with Log today controls,
 * group adoption stats, and + Create group habit CTA.
 *
 * Props:
 *   groupId        — string
 *   groupHabits    — all group habits[]
 *   adoptedHabits  — the current user's adopted habit objects[]
 *   totalMembers   — number
 *   canManage      — boolean (admin/owner)
 *   onAddHabit     — () => void  (opens GroupHabitModal)
 *   onRefresh      — () => void  (re-fetches all group data)
 *   isAdopted      — (habit) => boolean
 */
const HabitsSidebar = ({
  groupHabits = [],
  adoptedHabits = [],
  totalMembers,
  canManage,
  onAddHabit,
}) => {
  // Adoption count per group habit
  const totalSlots = groupHabits.length * totalMembers;
  const totalAdopted = groupHabits.reduce(
    (s, h) => s + (h.adoptionStats?.totalAdopted || h.adoptedBy?.length || 0),
    0
  );
  const groupAdoptionPct = totalSlots > 0
    ? Math.round((totalAdopted / totalSlots) * 100)
    : 0;

  // Today's date ISO string
  const todayStr = new Date().toISOString().split("T")[0];

  // Logging state: { [habitId]: 'idle' | 'logging' | 'done' | 'error' }
  const [logStates, setLogStates] = useState({});

  const handleLog = async (habitId) => {
    setLogStates((s) => ({ ...s, [habitId]: "logging" }));
    try {
      await habitsAPI.checkHabit(habitId, { date: todayStr, completed: true });
      setLogStates((s) => ({ ...s, [habitId]: "done" }));
    } catch {
      setLogStates((s) => ({ ...s, [habitId]: "error" }));
      setTimeout(() => setLogStates((s) => ({ ...s, [habitId]: "idle" })), 2000);
    }
  };

  const hasAdopted = adoptedHabits.length > 0;
  const multi = adoptedHabits.length > 1;

  return (
    <div className="space-y-4">
      {/* Your habit(s) card */}
      <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)] p-5">
        <p className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-3">
          Your habit here
        </p>

        {hasAdopted ? (
          <>
            {multi ? (
              /* Multiple: checkbox list */
              <ul className="space-y-2">
                {adoptedHabits.map((h) => {
                  const ls = logStates[h._id] || "idle";
                  const done = ls === "done";
                  return (
                    <li key={h._id} className="flex items-center gap-2.5">
                      <button
                        onClick={() => !done && handleLog(h._id)}
                        disabled={ls === "logging"}
                        className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors ${
                          done
                            ? "bg-emerald-500 border-emerald-500"
                            : ls === "logging"
                            ? "border-[var(--color-border-primary)]/30 opacity-50"
                            : "border-[var(--color-border-primary)]/30 hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-500)]/10"
                        }`}
                      >
                        {done && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7z" />
                          </svg>
                        )}
                      </button>
                      <span className="flex items-center gap-1.5 flex-1 min-w-0">
                        <HabitIcon icon={h.icon} size={13} />
                        <span className="text-xs font-spartan text-[var(--color-text-primary)] truncate">
                          {h.name}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              /* Single: name + streak + Log today button */
              (() => {
                const h = adoptedHabits[0];
                const ls = logStates[h._id] || "idle";
                const done = ls === "done";
                const streakCount = h.currentStreak || h.streak || 0;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <HabitIcon icon={h.icon} size={16} />
                      <span className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate flex-1">
                        {h.name}
                      </span>
                      {streakCount > 0 && (
                        <span className="text-[11px] font-spartan text-orange-400 flex-shrink-0">
                          🔥 {streakCount}-day streak
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => !done && handleLog(h._id)}
                      disabled={ls === "logging" || done}
                      className={`w-full h-9 rounded-xl text-xs font-spartan font-medium transition-colors ${
                        done
                          ? "bg-emerald-500/12 text-emerald-600 cursor-default"
                          : ls === "logging"
                          ? "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] opacity-50"
                          : "bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white"
                      }`}
                    >
                      {done ? "✓ Logged!" : ls === "logging" ? "Logging…" : "Log today"}
                    </button>
                  </div>
                );
              })()
            )}
          </>
        ) : (
          /* Empty state */
          <div className="text-center py-4">
            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
              No habit adopted yet.
            </p>
            <button
              onClick={() => {
                // Scroll to the habit list (user should adopt from there)
                document.querySelector("[data-group-habits-list]")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-2 text-xs font-spartan text-[var(--color-brand-500)] hover:text-[var(--color-brand-400)] transition-colors"
            >
              Adopt a habit from the list →
            </button>
          </div>
        )}
      </div>

      {/* Group adoption */}
      <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)] p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-spartan font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            Group adoption
          </p>
          <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)]">
            {groupAdoptionPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full bg-[var(--color-brand-500)] transition-all duration-500"
            style={{ width: `${groupAdoptionPct}%` }}
          />
        </div>
        <p className="text-[11px] text-[var(--color-text-tertiary)] font-spartan">
          {totalAdopted} of {totalSlots} habit slots filled across {totalMembers} member{totalMembers !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Create group habit */}
      {canManage && (
        <button
          onClick={onAddHabit}
          className="w-full h-10 rounded-2xl border border-dashed border-[var(--color-border-primary)]/30 flex items-center justify-center gap-2 text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-500)] hover:border-[var(--color-brand-500)]/40 transition-colors"
        >
          <Plus size={13} />
          Create group habit
        </button>
      )}
    </div>
  );
};

export default HabitsSidebar;
