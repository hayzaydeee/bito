import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Warning, ClipboardText, Fire, Sparkle } from "@phosphor-icons/react";
import { CheckIcon } from "@radix-ui/react-icons";
import { groupsAPI } from "../../../services/api";
import { habitUtils } from "../../../utils/habitLogic";
import SkeletonTransition from "../../ui/SkeletonTransition";
import HabitIcon from "../../shared/HabitIcon";

const ProgressDots = ({ completed, target }) => {
  const cappedCompleted = Math.min(completed, target);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: target }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            backgroundColor: i < cappedCompleted ? "var(--signal)" : "var(--line-2)",
          }}
        />
      ))}
      {completed > target && (
        <span className="std-mono text-[10px] font-bold ml-0.5 text-[var(--signal)]">
          +{completed - target}
        </span>
      )}
    </div>
  );
};

const MemberDashboardDrawer = ({ groupId, memberId, isOpen, onClose }) => {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && memberId) {
      fetchData();
    }
  }, [isOpen, groupId, memberId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await groupsAPI.getMemberDashboard(groupId, memberId);

      if (!res.success) {
        setError(res.error || "Failed to load member dashboard");
        return;
      }
      if (!res.member) {
        setError("Unable to load member information");
        return;
      }

      const entries = {};
      if (res.entries && typeof res.entries === "object") {
        Object.keys(res.entries).forEach((habitId) => {
          if (!habitId || habitId === "undefined") return;
          const raw = res.entries[habitId];
          if (Array.isArray(raw)) {
            entries[habitId] = {};
            raw.forEach((e) => {
              if (e?.date) {
                const d =
                  typeof e.date === "string"
                    ? e.date.split("T")[0]
                    : new Date(e.date).toISOString().split("T")[0];
                entries[habitId][d] = e;
              }
            });
          } else if (typeof raw === "object") {
            entries[habitId] = raw;
          }
        });
      }

      const habits = (res.habits || [])
        .filter((h) => h?._id)
        .map((h) => ({
          ...h,
          _id: h._id || h.id,
          name: h.name || "Unnamed habit",
          source: h.source || (h.groupId ? "group" : "personal"),
          isGroupHabit: h.source === "group" || !!h.groupId,
        }));

      setMemberData({ member: res.member, habits, entries });
    } catch (err) {
      console.error("Error fetching member dashboard:", err);
      setError(err.message || "Failed to load member dashboard");
    } finally {
      setLoading(false);
    }
  };

  const todayStr = useMemo(() => {
    return habitUtils.normalizeDate(new Date());
  }, []);

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }, []);

  const habits = memberData?.habits || [];
  const entries = memberData?.entries || {};
  const member = memberData?.member || null;
  const memberName = member?.name || "Member";
  const streakCount = member?.streak || member?.currentStreak || 0;

  const { dailyHabits, weeklyHabits } = useMemo(() => {
    const daily = habits.filter(h => !habitUtils.isWeeklyHabit(h));
    const weekly = habits.filter(h => habitUtils.isWeeklyHabit(h));
    return { dailyHabits: daily, weeklyHabits: weekly };
  }, [habits]);

  const todayTotal = useMemo(() => {
    return dailyHabits.filter(h => {
      const entry = entries[h._id]?.[todayStr];
      return entry && entry.completed;
    }).length;
  }, [dailyHabits, entries, todayStr]);

  const handleEncourage = () => {
    alert(`Sent encouragement to ${memberName}!`);
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants = {
    hidden: { x: "100%" },
    visible: { 
      x: 0,
      transition: { type: "spring", damping: 25, stiffness: 200 }
    },
  };

  const skeletonContent = (
    <div className="p-6 space-y-8 animate-pulse mt-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[var(--surface-2)]" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 rounded bg-[var(--surface-2)]" />
          <div className="h-4 w-20 rounded bg-[var(--surface-2)]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-20 rounded-xl bg-[var(--surface-2)]" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--surface)] border-l border-[var(--line)] shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--line)] bg-[var(--surface)] z-10">
              <span className="std-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">
                Member Dossier
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--ink-3)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
              <SkeletonTransition isLoading={loading} skeleton={skeletonContent}>
                {error ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Warning size={40} weight="duotone" className="mb-4 text-[var(--ember)]" />
                    <p className="std-display text-lg text-[var(--ink)] mb-2">Could not load dossier</p>
                    <p className="std-mono text-xs text-[var(--ink-3)] mb-6">{error}</p>
                    <button onClick={fetchData} className="std-btn std-btn--signal">Retry</button>
                  </div>
                ) : member ? (
                  <div className="p-6">
                    {/* Hero Section */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        {member.avatar ? (
                          <img src={member.avatar} alt={memberName} className="w-16 h-16 rounded-[14px] object-cover border-2 border-[var(--surface)] shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 rounded-[14px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink)] text-2xl std-display font-bold">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h2 className="std-display text-3xl text-[var(--ink)] leading-none mb-2">{memberName}</h2>
                          {streakCount > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--ember)]/10 text-[var(--ember)] rounded-md std-mono text-xs font-bold uppercase">
                              <Fire size={14} weight="fill" /> {streakCount} Day Streak
                            </div>
                          ) : (
                            <div className="std-mono text-xs text-[var(--ink-3)] uppercase">
                              Active Member
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleEncourage}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-[var(--ink-3)] hover:text-[var(--signal)] hover:bg-[var(--signal)]/10 transition-colors"
                      >
                        <Sparkle size={24} weight="duotone" />
                        <span className="std-mono text-[9px] uppercase font-bold tracking-widest">Nudge</span>
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      <div className="p-4 rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)]">
                        <p className="std-mono text-[10px] text-[var(--ink-3)] uppercase mb-1">Today's Progress</p>
                        <p className="std-display text-2xl text-[var(--ink)]">{todayTotal} <span className="text-lg text-[var(--ink-3)]">/ {dailyHabits.length}</span></p>
                      </div>
                      <div className="p-4 rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)] flex flex-col justify-center">
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="std-mono text-[10px] text-[var(--ink-3)] uppercase mb-1">Group Habits</p>
                               <p className="std-display text-2xl text-[var(--ink)]">{habits.filter((h) => h.isGroupHabit).length}</p>
                            </div>
                            <div>
                               <p className="std-mono text-[10px] text-[var(--ink-3)] uppercase mb-1">Personal</p>
                               <p className="std-display text-2xl text-[var(--ink)]">{habits.filter((h) => !h.isGroupHabit).length}</p>
                            </div>
                         </div>
                      </div>
                    </div>

                    {habits.length === 0 ? (
                      <div className="p-10 border border-dashed border-[var(--line-2)] rounded-2xl text-center">
                        <ClipboardText size={32} weight="duotone" className="mx-auto mb-3 text-[var(--ink-3)]" />
                        <p className="std-display text-sm text-[var(--ink)] mb-1">No tracked habits</p>
                        <p className="std-mono text-[10px] text-[var(--ink-3)]">It's quiet here.</p>
                      </div>
                    ) : (
                      <>
                        {/* Today's Daily Habits */}
                        {dailyHabits.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                               <h2 className="std-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">Habit Ledger (7D)</h2>
                            </div>
                            <div className="space-y-1">
                              {dailyHabits.map((h) => (
                                <div
                                  key={h._id}
                                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors group/row"
                                >
                                  <div className="w-6 flex justify-center text-[var(--ink-3)]">
                                     <HabitIcon icon={h.icon || "Star"} size={16} />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                     <p className="text-sm font-medium text-[var(--ink)] truncate">{h.name}</p>
                                  </div>

                                  {/* Punchcard visualization */}
                                  <div className="flex items-center gap-1">
                                    {last7.map((day) => {
                                      const done = !!(entries[h._id] || {})[day]?.completed;
                                      return (
                                        <div
                                          key={day}
                                          className="w-4 h-6 rounded-[3px] transition-colors border"
                                          style={{ 
                                              backgroundColor: done ? 'var(--signal)' : 'var(--surface)',
                                              borderColor: done ? 'var(--signal)' : 'var(--line)',
                                              opacity: done ? 1 : 0.5
                                          }}
                                          title={`${day}: ${done ? "Complete" : "Missed"}`}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* This Week (Weekly Habits) */}
                        {weeklyHabits.length > 0 && (
                          <div className="mb-6">
                            <h3 className="std-kicker mb-2">This Week</h3>
                            <div className="std-card overflow-hidden p-0">
                              {weeklyHabits.map((h) => {
                                const weekProgress = habitUtils.getWeeklyProgress(h, entries);
                                const { completed, target, met } = weekProgress;
                                const isTodayCompleted = !!(entries[h._id]?.[todayStr]?.completed);
                                return (
                                  <div
                                    key={h._id}
                                    className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)] last:border-b-0 transition-all duration-200 hover:bg-[var(--surface-2)]"
                                  >
                                    <div
                                      className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                      style={{
                                        borderColor: isTodayCompleted ? "var(--signal)" : "var(--line-2)",
                                        backgroundColor: isTodayCompleted ? "var(--signal)" : "transparent",
                                      }}
                                    >
                                      {isTodayCompleted && (
                                        <CheckIcon className="w-3.5 h-3.5 text-[var(--signal-ink)]" />
                                      )}
                                    </div>

                                    <span className="flex-shrink-0"><HabitIcon icon={h.icon || "Target"} size={20} /></span>

                                    <div className="flex-1 min-w-0">
                                      <span
                                        className="std-display text-[15px] font-semibold block truncate"
                                        style={{ color: met ? "var(--ink-3)" : "var(--ink)" }}
                                      >
                                        {h.name}
                                      </span>

                                      <div className="flex items-center gap-2 mt-1">
                                        <ProgressDots completed={completed} target={target} />
                                        <span
                                          className="std-mono text-[10px] tabular-nums uppercase tracking-wide"
                                          style={{ color: met ? "var(--signal)" : "var(--ink-3)" }}
                                        >
                                          {met
                                            ? (completed > target ? `${completed}/${target} · over target` : "done this week")
                                            : `${completed}/${target} this week`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </SkeletonTransition>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberDashboardDrawer;
