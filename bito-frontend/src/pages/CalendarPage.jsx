import React from "react";
import { Text } from "@radix-ui/themes";

const CalendarPage = () => {
  return (
    <div className="p-8 page-container">
      <div className="glass-card p-8 rounded-3xl">
        <Text className="text-3xl font-bold mb-6 gradient-text font-dmSerif">
          Calendar View
        </Text>
        <Text
          className="text-lg font-outfit"
          style={{ color: "var(--color-text-secondary)" }}
        >
          View your habit progress in calendar format. Visualize your
          consistency over time.
        </Text>
      </div>
    </div>
  );
};

export default CalendarPage;
