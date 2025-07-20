import { useState, memo, useMemo, useCallback } from "react";
import {
  useHabitData,
  useHabitActions,
  DatabaseHeader,
  GalleryView,
  ProfessionalTableView,
  HabitsTableView,
} from "../index.js";
import { useWeekUtils } from "../../../../hooks/useWeekUtils.js";

// Helper function to get current week range based on user preference
const getCurrentWeekRange = (weekUtils) => {
  const weekStart = weekUtils.getWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Format dates as DD/MM/YY
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
};

const DatabaseWidget = memo(
  ({
    title = "Habit Tracker",
    habits = [],
    completions = {},
    entries = null, // Add entries prop for member dashboard compatibility
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
    readOnly = false, // Add readOnly prop for member dashboards
  }) => {    
    // Get week utilities for user's preferred week start
    const weekUtils = useWeekUtils();
    
    // Debug: Log the week start day to see if it's changing
    console.log('DatabaseWidget - weekStartDay:', weekUtils.weekStartDay);
    
    // Debug: Test current week generation
    const testWeek = weekUtils.getCurrentWeek();
    console.log('DatabaseWidget - test current week day names:', testWeek.map(d => d.dayName).join(', '));
    
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
          return `Week ${getCurrentWeekRange(weekUtils)}`;
        }
      }
      return title;
    }, [title, dateRange, mode]);

    // Transform entries to completions format if entries are provided (for member dashboard)
    const transformedCompletions = useMemo(() => {
      // If entries are provided (member dashboard), transform them to completions format
      if (entries && typeof entries === 'object') {
        const transformed = {};
        
        Object.keys(entries).forEach(habitId => {
          const habitEntries = entries[habitId];
          if (habitEntries && typeof habitEntries === 'object') {
            Object.keys(habitEntries).forEach(date => {
              const entry = habitEntries[date];
              if (entry && entry.completed) {
                // Convert date to day name for the key format expected by useHabitData
                try {
                  const dateObj = new Date(date + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  transformed[`${dayName}-${habitId}`] = true;
                  // Also store with date format for backward compatibility
                  transformed[`${date}-${habitId}`] = true;
                } catch (error) {
                  console.warn('Error converting date for completion:', date, error);
                }
              }
            });
          }
        });
        
        return transformed;
      }
      
      // Otherwise use the provided completions
      return completions;
    }, [entries, completions]);

    // Transform habits to ensure they have the id property that useHabitData expects
    const transformedHabits = useMemo(() => {
      return habits.map(habit => ({
        ...habit,
        id: habit._id || habit.id, // useHabitData expects 'id' property
        _id: habit._id || habit.id
      }));
    }, [habits]);

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
    } = useHabitData({ 
      habits: transformedHabits, 
      completions: transformedCompletions, 
      dateRange, 
      mode,
      weekStartDay: weekUtils.weekStartDay // Force re-render when week start changes
    });

    const {
      newHabitName,
      setNewHabitName,
      showAddForm,
      setShowAddForm,
      handleToggleCompletion,
      handleAddHabit,
      handleCancelAdd,
    } = useHabitActions({
      onToggleCompletion: readOnly ? null : onToggleCompletion,
      onAddHabit: readOnly ? null : onAddHabit,
      onDeleteHabit: readOnly ? null : onDeleteHabit,
      onEditHabit: readOnly ? null : onEditHabit,
      dateRange,
    });    // Common props for all views
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
      readOnly, // Pass readOnly flag to components
      handleEditHabit: onEditHabit, // Pass edit handler function
      onAddHabit: readOnly ? null : onAddHabit, // Pass add habit handler
    };
    // Add an option to show habit management view
    const [showHabitManagement, setShowHabitManagement] = useState(false);
    
    const renderContent = () => {
      // If showing habit management, render the habit table view
      if (showHabitManagement) {
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-outfit font-semibold text-[var(--color-text-secondary)]">
                Manage Habits
              </h3>
              <button
                onClick={() => setShowHabitManagement(false)}
                className="px-3 font-outfit py-1.5 text-xs font-medium bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] rounded-lg transition-all duration-200"
              >
                Back to Tracking
              </button>
            </div>
            <HabitsTableView 
              displayHabits={displayHabits} 
              handleEditHabit={onEditHabit}
              handleDeleteHabit={onDeleteHabit}
              readOnly={readOnly}
            />
          </div>
        );
      }
      
      // Otherwise, render the normal views
      switch (viewType) {
        case "table":
          return (
            <div className="space-y-4">
              <div className="flex justify-end">
                {!readOnly && (
                  <button
                    onClick={() => setShowHabitManagement(true)}
                    className="px-3 font-outfit py-1.5 text-xs font-medium bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-all duration-200"
                  >
                    Manage Habits
                  </button>
                )}
              </div>
              <ProfessionalTableView {...commonProps} />
            </div>
          );
        case "gallery":
        default:
          return (
            <GalleryView
              {...commonProps}
              onAddHabit={readOnly ? null : onAddHabit}
            />
          );
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
