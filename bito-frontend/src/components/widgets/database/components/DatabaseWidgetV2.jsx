import React, { useState, memo, useMemo } from "react";
import { HabitGrid } from "../../../HabitGrid/index.js";
import { DatabaseHeader } from "./DatabaseHeader.jsx";
import { GalleryViewV2 } from "./GalleryViewV2.jsx";
import { habitUtils } from "../../../../contexts/HabitContext";

const DatabaseWidgetV2 = memo(({
  title = "Habit Tracker",
  viewType: initialViewType = "table",
  breakpoint = "lg",
  filterComponent = null,
  dateRange = null,
  mode = "week",
}) => {
  const [viewType, setViewType] = useState(initialViewType);

  // Calculate display title with date range
  const displayTitle = useMemo(() => {
    if (title === "Today's Habits" || title === "Habit Tracker" || title === "My Habits") {
      if (dateRange && dateRange.start && dateRange.end) {
        const formatDate = (date) => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${day}/${month}`;
        };
        
        const startStr = formatDate(dateRange.start);
        const endStr = formatDate(dateRange.end);
        const modeLabel = mode === 'week' ? 'Week' : 'Month';
        
        return `${modeLabel} (${startStr} - ${endStr})`;
      } else {
        const weekStart = habitUtils.getWeekStart(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const formatDate = (date) => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear().toString().slice(-2);
          return `${day}/${month}/${year}`;
        };
        
        return `Week ${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
      }
    }
    return title;
  }, [title, dateRange, mode]);
  // Memoize the start date to prevent re-renders
  const startDate = useMemo(() => {
    return dateRange?.start || habitUtils.getWeekStart(new Date());
  }, [dateRange?.start]);
  const renderContent = () => {
    switch (viewType) {
      case "table":
        return (
          <HabitGrid
            startDate={startDate}
            endDate={dateRange?.end}
            className="w-full"
            showStats={true}
            showHeader={true}
            tableStyle={true}
          />
        );      case "gallery":
      default:
        return (
          <GalleryViewV2
            startDate={startDate}
            endDate={dateRange?.end}
            breakpoint={breakpoint}
          />
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <DatabaseHeader
        title={displayTitle}
        viewType={viewType}
        setViewType={setViewType}
        filterComponent={filterComponent}
      />
      <div className="flex-1 min-h-0 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
});

DatabaseWidgetV2.displayName = "DatabaseWidgetV2";

export { DatabaseWidgetV2 };
