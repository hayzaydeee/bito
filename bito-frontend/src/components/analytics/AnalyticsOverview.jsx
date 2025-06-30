import React from "react";
import { Flex, Text } from "@radix-ui/themes";

const AnalyticsOverview = () => {
  return (
    <div className="analytics-overview glass-card p-8 rounded-3xl mb-8">
      <Text className="text-3xl font-bold mb-4 gradient-text font-dmSerif">
        Analytics Overview
      </Text>
      <Text className="text-lg font-outfit text-[var(--color-text-secondary)]">
        Explore your habit trends, completion rates, and progress insights. Use the widgets below to dive deeper into your analytics.
      </Text>
    </div>
  );
};

export default AnalyticsOverview;
