import React from "react";
import { Flex, Text } from "@radix-ui/themes";

const AnalyticsStats = ({ stats }) => {
  // Example stats: { totalHabits, totalCompletions, streak, bestStreak, completionRate }
  return (
    <div className="analytics-stats grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 border border-[var(--color-border-primary)] text-center">
        <Text className="text-2xl font-bold text-[var(--color-brand-400)] font-dmSerif">{stats.completionRate}%</Text>
        <Text className="text-xs text-[var(--color-text-secondary)] font-outfit">Completion Rate</Text>
      </div>
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 border border-[var(--color-border-primary)] text-center">
        <Text className="text-2xl font-bold text-[var(--color-success)] font-dmSerif">{stats.streak}</Text>
        <Text className="text-xs text-[var(--color-text-secondary)] font-outfit">Current Streak</Text>
      </div>
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 border border-[var(--color-border-primary)] text-center">
        <Text className="text-2xl font-bold text-[var(--color-warning)] font-dmSerif">{stats.bestStreak}</Text>
        <Text className="text-xs text-[var(--color-text-secondary)] font-outfit">Best Streak</Text>
      </div>
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 border border-[var(--color-border-primary)] text-center">
        <Text className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">{stats.totalCompletions}</Text>
        <Text className="text-xs text-[var(--color-text-secondary)] font-outfit">Total Completions</Text>
      </div>
    </div>
  );
};

export default AnalyticsStats;
