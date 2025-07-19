import React, { useState, memo } from "react";
import { DatabaseHeader } from "./DatabaseHeader.jsx";
import { GalleryView } from "./GalleryView.jsx";
import { TableView } from "./TableView.jsx";
import "../../widgets.css";

/**
 * DatabaseWidget (V1) - Original working version
 * 
 * This is the original database widget that was working correctly.
 * It uses the simple TableView component that connects directly to HabitContext.
 */
const DatabaseWidget = memo(
  ({
    title = "Habit Tracker",
    viewType: initialViewType = "table",
    onViewTypeChange = null,
    persistenceKey = null,
    dateRange = null,
    filterComponent = null,
    habits = null,
    entries = null,
    onAddHabit = null,
    onEditHabit = null,
    onToggleCompletion = null,
    readOnly = false,
  }) => {
    // View type state with persistence
    const [viewType, setViewType] = useState(() => {
      if (persistenceKey) {
        try {
          const saved = localStorage.getItem(persistenceKey);
          if (saved) return saved;
        } catch (error) {
          console.warn("Failed to load view type from localStorage:", error);
        }
      }
      return initialViewType;
    });

    // Handle view type changes
    const handleViewTypeChange = (newViewType) => {
      setViewType(newViewType);
      
      // Save to localStorage if persistence key is provided
      if (persistenceKey) {
        try {
          localStorage.setItem(persistenceKey, newViewType);
        } catch (error) {
          console.warn("Failed to save view type to localStorage:", error);
        }
      }
      
      // Call external handler if provided
      if (onViewTypeChange) {
        onViewTypeChange(newViewType);
      }
    };

    // Calculate date range for TableView
    const startDate = dateRange?.start || (() => {
      const today = new Date();
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);
      return startOfWeek.toISOString().split('T')[0];
    })();

    const endDate = dateRange?.end || (() => {
      const today = new Date();
      const endOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
      endOfWeek.setDate(diff);
      return endOfWeek.toISOString().split('T')[0];
    })();

    const renderContent = () => {
      switch (viewType) {
        case "table":
          return (
            <TableView 
              startDate={startDate}
              endDate={endDate}
              readOnly={readOnly}
            />
          );
        case "gallery":
        default:
          return (
            <GalleryView
              startDate={startDate}
              endDate={endDate}
              onAddHabit={readOnly ? null : onAddHabit}
              onEditHabit={readOnly ? null : onEditHabit}
              readOnly={readOnly}
            />
          );
      }
    };

    return (
      <div className="widget-container w-full h-full bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border-primary)] flex flex-col overflow-hidden">
        <DatabaseHeader
          title={title}
          viewType={viewType}
          setViewType={handleViewTypeChange}
          filterComponent={filterComponent}
        />
        <div className="widget-content-area flex-1">
          {renderContent()}
        </div>
      </div>
    );
  }
);

DatabaseWidget.displayName = 'DatabaseWidget';

export { DatabaseWidget };
