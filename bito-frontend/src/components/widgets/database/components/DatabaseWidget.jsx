import { useState, memo, useMemo, useCallback } from "react";
import {
  useHabitData,
  useHabitActions,
  DatabaseHeader,
  GalleryView,
  ProfessionalTableView,
} from "../index.js";

// Helper function to get current week range
const getCurrentWeekRange = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);

  // Calculate start of week (Monday)
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
  startOfWeek.setDate(today.getDate() - daysToSubtract);

  // Calculate end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Format dates as DD/MM/YY
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
};

const DatabaseWidget = memo(
  ({
    title = "Habit Tracker",
    habits = [],
    completions = {},
    onToggleCompletion,
    onAddHabit,
    onDeleteHabit,
    onEditHabit,
    viewType: initialViewType = "table",
    onViewTypeChange = null, // Callback for view type changes
    persistenceKey = null, // Key for localStorage persistence
    breakpoint = "lg",
    filterComponent = null,
    dateRange = null,
    mode = "week",
  }) => {    
    const [viewType, setViewType] = useState(() => {
      // Try to load from localStorage if persistence key is provided
      if (persistenceKey) {
        try {
          const saved = localStorage.getItem(persistenceKey);
          if (saved && (saved === "table" || saved === "gallery")) {
            return saved;
          }
        } catch (error) {
          console.warn('Failed to load view type from localStorage:', error);
        }
      }
      return initialViewType;
    });

    // Custom setViewType function that handles persistence and callbacks
    const handleViewTypeChange = useCallback((newViewType) => {
      setViewType(newViewType);
      
      // Save to localStorage if persistence key is provided
      if (persistenceKey) {
        try {
          localStorage.setItem(persistenceKey, newViewType);
        } catch (error) {
          console.warn('Failed to save view type to localStorage:', error);
        }
      }
      
      // Call the optional callback
      if (onViewTypeChange) {
        onViewTypeChange(newViewType);
      }
    }, [persistenceKey, onViewTypeChange]);

    // Calculate dynamic title with date range
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
          return `Week ${getCurrentWeekRange()}`;
        }
      }
      return title;
    }, [title, dateRange, mode]);

    // Use custom hooks for data management
    const {
      daysOfWeek,
      displayHabits,
      displayCompletions,
      getCurrentWeekDates,
      getCompletionStatus,
      getDayCompletion,
      getHabitCompletion,
      weekStats,
    } = useHabitData({ habits, completions, dateRange, mode });

    const {
      newHabitName,
      setNewHabitName,
      showAddForm,
      setShowAddForm,
      handleToggleCompletion,
      handleAddHabit,
      handleCancelAdd,
    } = useHabitActions({
      onToggleCompletion,
      onAddHabit,
      onDeleteHabit,
      onEditHabit,
      dateRange,
    });// Common props for all views
    const commonProps = {
      daysOfWeek,
      displayHabits,
      displayCompletions,
      getCurrentWeekDates,
      getCompletionStatus,
      getDayCompletion,
      getHabitCompletion,
      weekStats,
      handleToggleCompletion,
      breakpoint,
    };
    const renderContent = () => {
      switch (viewType) {
        case "table":
          return <ProfessionalTableView {...commonProps} />;
        case "gallery":
        default:
          return (
            <GalleryView
              {...commonProps}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              newHabitName={newHabitName}
              setNewHabitName={setNewHabitName}
              handleAddHabit={handleAddHabit}
              handleCancelAdd={handleCancelAdd}
            />          );
      }
    };
    
    return (
      <div className="w-full h-full flex flex-col">
        <DatabaseHeader
          title={displayTitle}
          viewType={viewType}
          setViewType={handleViewTypeChange}
          filterComponent={filterComponent}
        />
        <div className="widget-content-area">{renderContent()}</div>
      </div>
    );
  }
);

DatabaseWidget.displayName = "DatabaseWidget";

export { DatabaseWidget };
