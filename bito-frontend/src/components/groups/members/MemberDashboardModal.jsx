import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Warning, Fire, Sparkle } from "@phosphor-icons/react";
import { groupsAPI } from "../../../services/api";
import { habitUtils } from "../../../utils/habitLogic";
import SkeletonTransition from "../../ui/SkeletonTransition";
import StatPillsStd from "../../dashboard/StatPillsStd";
import WeekStripStd from "../../dashboard/WeekStripStd";
import { backdropVariants, modalVariants } from "../../../utils/motion";

const MemberDashboardModal = ({ groupId, memberId, isOpen, onClose, onEncourage }) => {
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

  const weeklyProgress = useMemo(() => {
    let met = 0;
    weeklyHabits.forEach(h => {
      const wp = habitUtils.getWeeklyProgress(h, entries);
      if (wp.met) met++;
    });
    return { met, total: weeklyHabits.length };
  }, [weeklyHabits, entries]);

  const skeletonContent = (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[var(--surface-2)]" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 rounded bg-[var(--surface-2)]" />
          <div className="h-4 w-20 rounded bg-[var(--surface-2)]" />
        </div>
      </div>
      <div className="h-24 rounded-xl bg-[var(--surface-2)]" />
      <div className="h-64 rounded-xl bg-[var(--surface-2)]" />
    </div>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                variants={backdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl rounded-2xl z-50 flex flex-col overflow-hidden max-h-[90vh]"
                variants={modalVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--line)] bg-[var(--surface-2)] z-10">
                  <span className="std-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">
                    Member Dashboard
                  </span>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--ink-3)] hover:bg-[var(--line-2)] transition-colors"
                  >
                    <Cross2Icon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide relative p-6">
                  <SkeletonTransition isLoading={loading} skeleton={skeletonContent}>
                    {error ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Warning size={40} weight="duotone" className="mb-4 text-[var(--ember)]" />
                        <p className="std-display text-lg text-[var(--ink)] mb-2">Could not load dashboard</p>
                        <p className="std-mono text-xs text-[var(--ink-3)] mb-6">{error}</p>
                        <button onClick={fetchData} className="std-btn std-btn--signal">Retry</button>
                      </div>
                    ) : member ? (
                      <div className="space-y-6">
                        {/* Header: Avatar, Name, Nudge */}
                        <div className="flex items-start justify-between">
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
                              <div className="std-mono text-xs text-[var(--ink-3)] uppercase">
                                Active Member
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onEncourage?.(member)}
                            title="Send encouragement"
                            className="grp-btn grp-btn--signal grp-btn--sm group/nudge"
                          >
                            <Sparkle size={14} weight="fill" className="group-hover/nudge:animate-pulse" />
                            <span>Nudge</span>
                          </button>
                        </div>

                        {/* Statstrip */}
                        <StatPillsStd 
                          completed={todayTotal} 
                          total={dailyHabits.length} 
                          streak={streakCount} 
                          weeklyProgress={weeklyProgress} 
                          variant="daybook" 
                        />

                        {/* Daystrip (WeekStripStd in readOnly mode) */}
                        <WeekStripStd 
                          habits={habits}
                          entries={entries}
                          readOnly={true}
                          defaultExpandedDate={todayStr}
                          variant="daybook"
                        />
                      </div>
                    ) : null}
                  </SkeletonTransition>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default MemberDashboardModal;
