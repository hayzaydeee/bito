import React from "react";
import { Text, Badge, Flex } from "@radix-ui/themes";

const ScheduleDisplay = ({ 
  habit, 
  size = "medium", 
  variant = "pills",
  showFullNames = false,
  maxDisplay = 7
}) => {
  // Get schedule from habit (support both new schedule.days and legacy frequency)
  const scheduleDays = habit?.schedule?.days || habit?.frequency || [];
  
  // Day names mapping (0=Sunday to 6=Saturday)
  const dayNames = {
    0: { short: "Sun", full: "Sunday" },
    1: { short: "Mon", full: "Monday" },
    2: { short: "Tue", full: "Tuesday" },
    3: { short: "Wed", full: "Wednesday" },
    4: { short: "Thu", full: "Thursday" },
    5: { short: "Fri", full: "Friday" },
    6: { short: "Sat", full: "Saturday" },
  };

  // Convert legacy format (1-7) to new format (0-6) if needed
  const normalizedDays = scheduleDays.map(day => {
    if (day >= 1 && day <= 7) {
      // Legacy format: 1=Monday, 7=Sunday -> 0=Sunday, 6=Saturday
      return day === 7 ? 0 : day;
    }
    return day;
  }).sort();

  // Handle special cases
  if (normalizedDays.length === 0) {
    return (
      <Badge color="gray" variant="soft" size={size === "small" ? "1" : "2"}>
        No schedule
      </Badge>
    );
  }

  if (normalizedDays.length === 7) {
    return (
      <Badge color="green" variant="soft" size={size === "small" ? "1" : "2"}>
        Daily
      </Badge>
    );
  }

  // Check for weekdays only (Mon-Fri)
  const weekdays = [1, 2, 3, 4, 5];
  if (normalizedDays.length === 5 && weekdays.every(day => normalizedDays.includes(day))) {
    return (
      <Badge color="blue" variant="soft" size={size === "small" ? "1" : "2"}>
        Weekdays
      </Badge>
    );
  }

  // Check for weekends only (Sat-Sun)
  const weekends = [0, 6];
  if (normalizedDays.length === 2 && weekends.every(day => normalizedDays.includes(day))) {
    return (
      <Badge color="purple" variant="soft" size={size === "small" ? "1" : "2"}>
        Weekends
      </Badge>
    );
  }

  // Display individual days
  if (variant === "pills") {
    const displayDays = normalizedDays.slice(0, maxDisplay);
    const hasMore = normalizedDays.length > maxDisplay;

    return (
      <Flex gap="1" wrap="wrap" align="center">
        {displayDays.map(day => (
          <Badge 
            key={day} 
            color="blue" 
            variant="soft" 
            size={size === "small" ? "1" : "2"}
          >
            {showFullNames ? dayNames[day]?.full : dayNames[day]?.short}
          </Badge>
        ))}
        {hasMore && (
          <Badge color="gray" variant="soft" size={size === "small" ? "1" : "2"}>
            +{normalizedDays.length - maxDisplay}
          </Badge>
        )}
      </Flex>
    );
  }

  // Text variant - show as comma-separated list
  if (variant === "text") {
    const daysList = normalizedDays
      .map(day => showFullNames ? dayNames[day]?.full : dayNames[day]?.short)
      .filter(Boolean);
    
    return (
      <Text 
        size={size === "small" ? "1" : "2"} 
        color="gray"
        className="font-outfit"
      >
        {daysList.join(", ")}
      </Text>
    );
  }

  // Compact variant - show count and type
  return (
    <Text 
      size={size === "small" ? "1" : "2"} 
      color="gray"
      className="font-outfit"
    >
      {normalizedDays.length === 1 
        ? "Once/week" 
        : `${normalizedDays.length}x/week`}
    </Text>
  );
};

export default ScheduleDisplay;
