import React from "react";
import { Text } from "@radix-ui/themes";

const AnalyticsPage = () => {
  return (
    <div className="p-8 page-container">
      <div className="glass-card p-8 rounded-3xl">
        <Text className="text-3xl font-bold mb-6 gradient-text font-dmSerif">
          Analytics
        </Text>
        <Text
          className="text-lg font-outfit"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Track your progress with detailed analytics and insights.
          Understand your patterns.
        </Text>
      </div>
    </div>
  );
};

export default AnalyticsPage;
