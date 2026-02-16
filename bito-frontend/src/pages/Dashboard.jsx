import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useHabits } from "../contexts/HabitContext";
import { habitUtils as habitLogic } from "../utils/habitLogic";
import CustomHabitEditModal from "../components/ui/CustomHabitEditModal";

/* ── Redesigned dashboard components (Phase 6) ── */
import GreetingBar from "../components/dashboard/GreetingBar";
import StatPills from "../components/dashboard/StatPills";
import TodayHabits from "../components/dashboard/TodayHabits";
import WeekStrip from "../components/dashboard/WeekStrip";
import InsightsNudge from "../components/dashboard/InsightsNudge";
import StreakCelebration from "../components/dashboard/StreakCelebration";
import DashboardTour from "../components/dashboard/DashboardTour";

/* ─────────────────────────────────────────────
   Phase 6 — Dashboard Redesign
   Compact greeting → stat pills → today list
   → 7-day heatmap → insights nudge
   ───────────────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (user && user.onboardingComplete === false) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  const {
    habits,
    entries,
    isLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    toggleHabitCompletion,
    fetchHabitEntries,
  } = useHabits();

  /* ── Modal state ── */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentHabit, setCurrentHabit] = useState(null);

  /* ── Fetch entries for this week's habits ── */
  useEffect(() => {
    if (!habits || habits.length === 0) return;
    const today = new Date();
    const weekStart = habitLogic.getWeekStart(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    habits.forEach((h) => fetchHabitEntries(h._id, weekStart, weekEnd));
  }, [habits, fetchHabitEntries]);

  /* ── Today's habits (respects scheduling) ── */
  const todaysHabits = useMemo(
    () => habitLogic.getTodaysHabits(habits),
    [habits]
  );

  /* ── Stats computation ── */
  const stats = useMemo(() => {
    if (isLoading || !habits.length) {
      return { completed: 0, total: 0, streak: 0, weeklyPct: 0 };
    }

    const todayStr = habitLogic.normalizeDate(new Date());
    const baseDate = new Date();

    let completed = 0;
    todaysHabits.forEach((h) => {
      const entry = entries[h._id]?.[todayStr];
      if (entry && entry.completed) completed++;
    });

    // Best current streak across all habits
    const calcStreak = (habitId) => {
      const habit = habits.find((h) => h._id === habitId);
      if (!habit) return 0;
      const he = entries[habitId];
      if (!he) return 0;
      return habitLogic.calculateStreak(
        habitId,
        habit,
        new Map(
          Object.entries(he).map(([d, e]) => [`${d}_${habitId}`, e])
        ),
        baseDate
      );
    };
    const streak = Math.max(0, ...habits.map((h) => calcStreak(h._id)));

    // Weekly progress
    const weekStart = habitLogic.getWeekStart(baseDate);
    const weeklyPct = habitLogic.calculateWeeklyProgress(
      habits,
      entries,
      weekStart
    );

    return { completed, total: todaysHabits.length, streak, weeklyPct };
  }, [habits, entries, isLoading, todaysHabits]);

  /* ── Habit handlers ── */
  const handleAddHabit = useCallback(() => {
    setCurrentHabit(null);
    setEditModalOpen(true);
  }, []);

  const handleEditHabit = useCallback((habit) => {
    setCurrentHabit(habit);
    setEditModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditModalOpen(false);
    setCurrentHabit(null);
  }, []);

  const handleSaveHabit = useCallback(
    async (habitData) => {
      const result = currentHabit
        ? await updateHabit(currentHabit._id, habitData)
        : await createHabit(habitData);
      if (result.success) {
        setEditModalOpen(false);
        setCurrentHabit(null);
      }
    },
    [currentHabit, createHabit, updateHabit]
  );

  const handleDeleteHabit = useCallback(
    async (habitId) => {
      await deleteHabit(habitId);
    },
    [deleteHabit]
  );

  const handleArchiveHabit = useCallback(
    async (habit) => {
      await archiveHabit(habit._id, !habit.isActive);
    },
    [archiveHabit]
  );

  const handleToggle = useCallback(
    (habitId) => {
      const todayStr = habitLogic.normalizeDate(new Date());
      toggleHabitCompletion(habitId, todayStr);
    },
    [toggleHabitCompletion]
  );

  /* Toggle for any date (used by WeekStrip) */
  const handleToggleDate = useCallback(
    (habitId, dateStr) => {
      toggleHabitCompletion(habitId, dateStr);
    },
    [toggleHabitCompletion]
  );

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div
            className="h-7 rounded w-2/5"
            style={{ backgroundColor: "var(--color-surface-hover)" }}
          />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-full flex-1"
                style={{ backgroundColor: "var(--color-surface-hover)" }}
              />
            ))}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* 1. Compact greeting */}
      <GreetingBar userName={user?.name || user?.username || "User"} />

      {/* 2. Stat pills (only when habits exist) */}
      {habits.length > 0 && (
        <StatPills
          completed={stats.completed}
          total={stats.total}
          streak={stats.streak}
        />
      )}

      {/* 3. Insights nudge */}
      <InsightsNudge habits={habits} entries={entries} />

      {/* 4. Today's habit checklist */}
      <div data-tour="today-habits">
      <TodayHabits
        habits={todaysHabits}
        entries={entries}
        onToggle={handleToggle}
        onEdit={handleEditHabit}
        onAdd={handleAddHabit}
      />
      </div>

      {/* 5. 7-day heatmap strip */}
      {habits.length > 0 && (
        <WeekStrip habits={habits} entries={entries} onToggle={handleToggleDate} fetchHabitEntries={fetchHabitEntries} />
      )}

      {/* 6. Streak milestone celebration */}
      {stats.streak > 0 && (
        <StreakCelebration
          streak={stats.streak}
          habitName={habits.find(h => {
            const he = entries[h._id];
            if (!he) return false;
            return habitLogic.calculateStreak(
              h._id, h,
              new Map(Object.entries(he).map(([d, e]) => [`${d}_${h._id}`, e])),
              new Date()
            ) === stats.streak;
          })?.name}
        />
      )}

      {/* Habit modal */}
      <CustomHabitEditModal
        isOpen={editModalOpen}
        onClose={handleCloseModal}
        habit={currentHabit}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        onArchive={handleArchiveHabit}
      />

      {/* 7. Dashboard tour (Phase 14) */}
      <DashboardTour />
    </div>
  );
};

export default Dashboard;
