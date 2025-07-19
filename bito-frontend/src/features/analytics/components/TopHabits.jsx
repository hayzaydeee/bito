import React, { useMemo, useCallback } from "react";
import {
  StarIcon,
  StarFilledIcon,
  CheckCircledIcon,
  DoubleArrowUpIcon,
  TargetIcon,
} from "@radix-ui/react-icons";

const TopHabits = ({
  habits,
  entries,
  timeRange,
  persistenceKey = null, // Optional key for localStorage persistence
  onCategoryChange = null, // Optional callback for category changes
}) => {
  const habitStats = useMemo(() => {
    if (!habits.length) return [];

    const days = parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    return habits.map((habit) => {
      const habitEntries = entries[habit._id] || {};
      let completions = 0;
      let possible = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Calculate stats for the time range
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const entry = habitEntries[dateStr];

        possible++;
        if (entry && entry.completed) {
          completions++;
          tempStreak++;

          // Check if this is part of current streak (from today backwards)
          if (d.toDateString() === endDate.toDateString()) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 0;
        }
      }

      // Final check for longest streak
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      const completionRate = possible > 0 ? (completions / possible) * 100 : 0;

      return {
        ...habit,
        completions,
        possible,
        completionRate,
        currentStreak,
        longestStreak,
        color: habit.color || "#6366f1",
      };
    });
  }, [habits, entries, timeRange]);

  const topCategories = useMemo(() => {
    // Most completed habits
    const byCompletions = [...habitStats]
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 5);

    // Best completion rates (min 3 completions to qualify)
    const byRate = [...habitStats]
      .filter((habit) => habit.completions >= 3)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    // Best streaks
    const byStreak = [...habitStats]
      .sort((a, b) => b.longestStreak - a.longestStreak)
      .slice(0, 5);

    return { byCompletions, byRate, byStreak };
  }, [habitStats]);

  const [activeCategory, setActiveCategory] = React.useState(() => {
    // Try to load from localStorage if persistence key is provided
    if (persistenceKey) {
      try {
        const saved = localStorage.getItem(persistenceKey);
        if (saved && ["completions", "rate", "streak"].includes(saved)) {
          return saved;
        }
      } catch (error) {
        console.warn(
          "Failed to load top habits category from localStorage:",
          error
        );
      }
    }
    return "completions"; // Default value
  });

  // Custom handler for category changes with persistence
  const handleCategoryChange = useCallback(
    (category) => {
      setActiveCategory(category);

      // Save to localStorage if persistence key is provided
      if (persistenceKey) {
        try {
          localStorage.setItem(persistenceKey, category);
        } catch (error) {
          console.warn(
            "Failed to save top habits category to localStorage:",
            error
          );
        }
      }

      // Call the optional callback
      if (onCategoryChange) {
        onCategoryChange(category);
      }
    },
    [persistenceKey, onCategoryChange]
  );

  const categories = [
    {
      key: "completions",
      label: "Most Active",
      icon: CheckCircledIcon,
      data: topCategories.byCompletions,
      color: "var(--color-success)",
    },
    {
      key: "rate",
      label: "Best Rate",
      icon: TargetIcon,
      data: topCategories.byRate,
      color: "var(--color-brand-400)",
    },
    {
      key: "streak",
      label: "Best Streaks",
      icon: DoubleArrowUpIcon,
      data: topCategories.byStreak,
      color: "var(--color-warning)",
    },
  ];

  const activeData =
    categories.find((cat) => cat.key === activeCategory)?.data || [];

  if (!habits.length) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)] mb-4">
          Top Habits
        </h3>
        <div className="text-center py-12">
          <StarIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Your top performing habits will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)]">
          Top Habits
        </h3>
        <StarIcon className="w-5 h-5 text-[var(--color-warning)]" />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center bg-[var(--color-surface-elevated)] rounded-lg p-0.5 mb-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.key}
              onClick={() => handleCategoryChange(category.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-200 text-xs font-outfit ${
                activeCategory === category.key
                  ? "bg-[var(--color-brand-600)] text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {activeData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--color-text-secondary)] font-outfit text-sm">
              No data available for this category yet
            </p>
          </div>
        ) : (
          activeData.map((habit, index) => (
            <div
              key={habit._id}
              className="flex items-center gap-4 p-4 bg-[var(--color-surface-elevated)]/50 rounded-xl hover:bg-[var(--color-surface-elevated)]/70 transition-all duration-200"
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? "bg-[var(--color-warning)] text-white"
                      : index === 1
                      ? "bg-[var(--color-text-tertiary)] text-white"
                      : index === 2
                      ? "bg-[var(--color-warning)]/60 text-white"
                      : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : index + 1}
                </div>
              </div>

              {/* Habit Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: habit.color }}
                  ></div>
                  <h4 className="font-medium text-[var(--color-text-primary)] font-outfit truncate">
                    {habit.name}
                  </h4>
                </div>

                {/* Category-specific subtitle */}
                <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                  {activeCategory === "completions" &&
                    `${habit.completions} completions`}
                  {activeCategory === "rate" &&
                    `${habit.completionRate.toFixed(1)}% completion rate`}
                  {activeCategory === "streak" &&
                    `${habit.longestStreak} day best streak`}
                </p>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                {activeCategory === "completions" && (
                  <div>
                    <div className="text-lg font-bold text-[var(--color-success)] font-dmSerif">
                      {habit.completions}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      {habit.completionRate.toFixed(0)}% rate
                    </div>
                  </div>
                )}

                {activeCategory === "rate" && (
                  <div>
                    <div className="text-lg font-bold text-[var(--color-brand-400)] font-dmSerif">
                      {habit.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      {habit.completions} times
                    </div>
                  </div>
                )}

                {activeCategory === "streak" && (
                  <div>
                    <div className="text-lg font-bold text-[var(--color-warning)] font-dmSerif">
                      {habit.longestStreak}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      {habit.currentStreak} current
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Performance Indicator */}
      {activeData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)]/20">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
            <StarFilledIcon className="w-4 h-4 text-[var(--color-warning)]" />
            <span>
              {activeCategory === "completions" && "Showing most active habits"}
              {activeCategory === "rate" && "Showing highest completion rates"}
              {activeCategory === "streak" &&
                "Showing longest streaks achieved"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopHabits;
