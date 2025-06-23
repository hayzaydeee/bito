import React from "react";
import { Text } from "@radix-ui/themes";

const HabitsPage = () => {
  return (
    <div className="p-8 page-container">
      <div className="glass-card p-8 rounded-3xl">
        <Text className="text-3xl font-bold mb-6 gradient-text font-dmSerif">
          Habits Management
        </Text>
        <Text
          className="text-lg font-outfit"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Create, edit, and manage your habits here. Build consistency and
          track your progress.
        </Text>
      </div>
    </div>
  );
};

export default HabitsPage;
