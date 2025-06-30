import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import {
  CalendarIcon,
  DoubleArrowUpIcon,
  CheckCircledIcon,
  TargetIcon,
  PlusIcon,
  PlayIcon,
} from "@radix-ui/react-icons";
import { useHabits, habitUtils } from "../../contexts/HabitContext";
import { habitUtils as habitLogic } from "../../utils/habitLogic";

const WelcomeCard = memo(({ userName = "User" }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get habit data from context
  const { habits, entries, isLoading } = useHabits();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Memoized date calculations that only change when the actual date changes
  const dateCalculations = useMemo(() => {
    const now = new Date();
    const dateString = habitUtils.normalizeDate(now);

    return {
      currentDateString: dateString,
      baseDate: now, // Use consistent date for all calculations
    };
  }, [
    currentTime.getDate(),
    currentTime.getMonth(),
    currentTime.getFullYear(),
  ]);

  // Memoized calculations to prevent unnecessary re-renders
  const timeData = useMemo(() => {
    const timeOfDay =
      currentTime.getHours() < 12
        ? "morning"
        : currentTime.getHours() < 18
        ? "afternoon"
        : "evening";
    const greeting = `Good ${timeOfDay}`;

    const currentDate = currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const timeString = currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return { greeting, currentDate, timeString };
  }, [currentTime]);

  // Calculate real stats from backend data - respecting habit scheduling
  const stats = useMemo(() => {
    console.log("🎯 WelcomeCard: Recalculating stats", {
      isLoading,
      habitsCount: habits.length,
      entriesKeys: Object.keys(entries),
      currentDate: dateCalculations.currentDateString,
    });

    if (isLoading || !habits.length) {
      return {
        completed: 0,
        streak: 0,
        progress: 0,
        todayTotal: 0,
      };
    }

    // Use the memoized date string that only changes when the date actually changes
    const todayStr = dateCalculations.currentDateString;
    const baseDate = dateCalculations.baseDate;

    console.log("🎯 WelcomeCard: Today string for stats:", todayStr);

    // Get only habits that are scheduled for today
    const todaysHabits = habitLogic.getTodaysHabits(habits);
    console.log(
      "🎯 WelcomeCard: Todays scheduled habits:",
      todaysHabits.map((h) => h.name)
    );

    // Calculate today's completed habits (only among scheduled ones)
    let completedToday = 0;
    const todayTotal = todaysHabits.length;

    todaysHabits.forEach((habit) => {
      const habitEntries = entries[habit._id];
      const todayEntry = habitEntries?.[todayStr];
      // Use the same logic as HabitGrid: entry exists AND is completed
      const isCompleted = todayEntry && todayEntry.completed;

      console.log(
        `🎯 WelcomeCard: Habit ${habit.name} - today entry:`,
        todayEntry,
        "completed:",
        isCompleted
      );

      if (isCompleted) {
        completedToday++;
      }
    });

    // Calculate longest current streak across all habits using consistent base date
    const calculateStreak = (habitId) => {
      const habit = habits.find((h) => h._id === habitId);
      if (!habit) return 0;

      const habitEntries = entries[habitId];
      if (!habitEntries) return 0;

      return habitLogic.calculateStreak(
        habitId,
        habit,
        new Map(
          Object.entries(habitEntries).map(([date, entry]) => [
            `${date}_${habitId}`,
            entry,
          ])
        ),
        baseDate
      );
    };

    const maxStreak =
      habits.length > 0
        ? Math.max(...habits.map((habit) => calculateStreak(habit._id)))
        : 0;

    // Calculate weekly progress using scheduling logic
    const weekStart = habitLogic.getWeekStart(baseDate);
    const weeklyProgress = habitLogic.calculateWeeklyProgress(
      habits,
      entries,
      weekStart
    );

    const finalStats = {
      completed: completedToday,
      streak: maxStreak,
      progress: weeklyProgress,
      todayTotal: todayTotal,
    };

    console.log("🎯 WelcomeCard: Final stats:", finalStats);
    return finalStats;
  }, [habits, entries, isLoading, dateCalculations]); // Only depends on actual data and date changes

  const handleAddHabit = useCallback(() => {
    // Dispatch a custom event that the parent can listen to
    // This allows the WelcomeCard to trigger actions in the ContentGrid
    window.dispatchEvent(new CustomEvent("openAddHabitModal"));
  }, []);

  const handleQuickAction = useCallback(() => {
    // Could open a quick habit completion modal or navigation
    window.dispatchEvent(new CustomEvent("openQuickActions"));
  }, []);

  // Show loading state when data is being loaded
  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-6"></div>
          <div className="h-20 bg-[var(--color-surface-elevated)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/3 via-[var(--color-brand-400)]/2 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-brand-400)]/8 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      </div>

      <div className="relative z-10">
        {/* Header - More Compact */}
        <div className="flex items-center justify-between mb-6">
          {/* Left - Greeting */}
          <div>
            {" "}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent font-dmSerif leading-tight mb-1">
              {timeData.greeting}, {userName}!
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[var(--color-brand-400)]" />
                <span className="font-outfit text-[var(--color-text-secondary)] font-medium">
                  {timeData.currentDate}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)]"></div>
              <span className="font-outfit text-[var(--color-text-tertiary)] font-medium tabular-nums">
                {timeData.timeString}
              </span>
            </div>
          </div>

        </div>

        {/* Progress Overview - Conditional based on habits */}
        {stats.todayTotal === 0 ? (
          // Empty state when no habits exist
          <div className="text-center p-6 bg-[var(--color-surface-elevated)]/30 backdrop-blur-sm rounded-xl border border-[var(--color-border-primary)]/20">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-brand-400)]/20 to-[var(--color-brand-500)]/10 border border-[var(--color-brand-400)]/20 flex items-center justify-center mx-auto mb-4">
              <PlusIcon className="w-8 h-8 text-[var(--color-brand-400)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
              Ready to start your journey?
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit mb-4">
              You haven't added any habits yet. Click "Add Habit" to get
              started!
            </p>
            <button
              onClick={handleAddHabit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-all duration-200 hover:scale-105 font-outfit text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Your First Habit
            </button>
          </div>
        ) : (
          // Normal progress display when habits exist
          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)]/30 backdrop-blur-sm rounded-xl border border-[var(--color-border-primary)]/20">
            {/* Today's Progress */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-success)]/20 to-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center justify-center">
                  <CheckCircledIcon className="w-5 h-5 text-[var(--color-success)]" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-success)] rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {stats.completed}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">
                  {stats.completed} of {stats.todayTotal}
                </div>
                <div className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                  {stats.completed === 0
                    ? "No habits completed yet today"
                    : stats.completed === stats.todayTotal
                    ? "All habits completed! 🎉"
                    : "habits completed today"}
                </div>
              </div>
            </div>

            {/* Streak & Progress */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DoubleArrowUpIcon className="w-4 h-4 text-[var(--color-brand-400)]" />
                  <span className="text-xl font-bold font-dmSerif text-[var(--color-brand-400)]">
                    {stats.streak}
                  </span>
                </div>
                <div className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                  day streak
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TargetIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                  <span className="text-xl font-bold font-dmSerif text-[var(--color-brand-500)]">
                    {stats.progress}%
                  </span>
                </div>
                <div className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                  weekly goal
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar - Only show when there are habits */}
        {stats.todayTotal > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-outfit text-[var(--color-text-secondary)]">
                Daily Progress
              </span>
              <span className="text-sm font-outfit font-medium text-[var(--color-brand-500)]">
                {stats.todayTotal > 0
                  ? Math.round((stats.completed / stats.todayTotal) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-500)] h-2 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${
                    stats.todayTotal > 0
                      ? (stats.completed / stats.todayTotal) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

WelcomeCard.displayName = "WelcomeCard";

export default WelcomeCard;
