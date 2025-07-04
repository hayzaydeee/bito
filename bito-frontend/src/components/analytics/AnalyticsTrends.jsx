import React from "react";
import { Flex, Text } from "@radix-ui/themes";

const AnalyticsTrends = () => {
  // Placeholder for future chart or trend visualizations
  return (
    <div className="analytics-trends glass-card p-6 rounded-2xl mt-4">
      <Text className="text-xl font-bold mb-2 font-dmSerif gradient-text">Trends & Insights</Text>
      <Text className="text-sm text-[var(--color-text-secondary)] font-outfit mb-4">
        Visualize your progress over time. (Charts and deeper analytics coming soon!)
      </Text>
      <div className="h-40 flex items-center justify-center text-[var(--color-text-tertiary)]">
        {/* Placeholder for chart */}
        <span>Charts will appear here.</span>
      </div>
    </div>
  );
};

export default AnalyticsTrends;
