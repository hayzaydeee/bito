import { useState } from "react";
import { Plus, Check, Fire } from "@phosphor-icons/react";
import HabitIcon from "../../shared/HabitIcon";
import { habitsAPI } from "../../../services/api";

/**
 * HabitsSidebar
 *
 * Shows user's adopted group habits with Log today controls,
 * group adoption stats, and + Create group habit CTA.
 *
 * Props:
 *   groupHabits    — all group habits[]
 *   adoptedHabits  — the current user's adopted habit objects[]
 *   totalMembers   — number
 *   canManage      — boolean (admin/owner)
 *   onAddHabit     — () => void  (opens GroupHabitModal)
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

  const noGroupHabits = groupHabits.length === 0;

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
    <div className="space-y-3">
      {/* Your habit(s) card */}
      <div className="grp-card p-5">
        <p className="grp-kicker mb-3">Your habit</p>

        {hasAdopted ? (
          <>
            {multi ? (
              /* Multiple: checkbox list */
              <ul className="space-y-2.5">
                {adoptedHabits.map((h) => {
                  const ls = logStates[h._id] || "idle";
                  const done = ls === "done";
                  return (
                    <li key={h._id} className="flex items-center gap-2.5">
                      <button
                        onClick={() => !done && handleLog(h._id)}
                        disabled={ls === "logging"}
                        className={`w-5 h-5 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-colors ${
                          done
                            ? "bg-[var(--signal)] border-[var(--signal)] text-[var(--signal-ink)]"
                            : ls === "logging"
                            ? "border-[var(--line-2)] opacity-50"
                            : "border-[var(--line-2)] hover:border-[var(--signal)] hover:bg-[var(--signal)]/10"
                        }`}
                      >
                        {done && <Check size={12} weight="bold" />}
                      </button>
                      <span className="flex items-center gap-1.5 flex-1 min-w-0">
                        <HabitIcon icon={h.icon} size={13} />
                        <span className="text-xs text-[var(--ink)] truncate">{h.name}</span>
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
                      <span className="text-sm font-semibold text-[var(--ink)] truncate flex-1">
                        {h.name}
                      </span>
                      {streakCount > 0 && (
                        <span className="grp-mono text-[10px] text-[var(--ember)] flex-shrink-0 inline-flex items-center gap-1">
                          <Fire size={10} weight="fill" /> {streakCount}D
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => !done && handleLog(h._id)}
                      disabled={ls === "logging" || done}
                      className={`grp-btn grp-btn--sm w-full ${
                        done ? "border-[var(--signal)] text-[var(--signal)]" : "grp-btn--signal"
                      } ${ls === "logging" ? "opacity-50" : ""}`}
                    >
                      {done ? "✓ Logged" : ls === "logging" ? "Logging…" : "Log today"}
                    </button>
                  </div>
                );
              })()
            )}
          </>
        ) : (
          /* Empty state */
          <div className="text-center py-3">
            <p className="text-xs text-[var(--ink-2)] mb-2">
              {noGroupHabits ? "No group habits to adopt yet." : "No habit adopted yet."}
            </p>
            {!noGroupHabits && (
              <button
                onClick={() => {
                  document.querySelector("[data-group-habits-list]")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="grp-mono text-[11px] font-bold uppercase tracking-wider text-[var(--signal)] hover:text-[var(--signal-2)] transition-colors"
              >
                Adopt from the list →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Group adoption */}
      <div className="grp-card p-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="grp-kicker">Group adoption</p>
          <span className="grp-mono text-[11px] font-bold text-[var(--signal)]">{groupAdoptionPct}%</span>
        </div>
        <div className="grp-meter mb-2">
          <i style={{ width: `${groupAdoptionPct}%`, transition: "width .5s ease" }} />
        </div>
        <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider leading-relaxed">
          {totalAdopted} / {totalSlots} slots filled across {totalMembers} member{totalMembers !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Create group habit */}
      {canManage && (
        <button
          onClick={onAddHabit}
          className="w-full h-10 rounded-[4px] border border-dashed border-[var(--line-2)] flex items-center justify-center gap-2 grp-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--signal)] hover:border-[var(--signal)]/50 transition-colors"
        >
          <Plus size={13} weight="bold" />
          Create group habit
        </button>
      )}
    </div>
  );
};

export default HabitsSidebar;
