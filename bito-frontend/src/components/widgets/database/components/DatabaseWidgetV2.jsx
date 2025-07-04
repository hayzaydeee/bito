import React, { useState, memo, useMemo, useCallback } from "react";
import { HabitGrid } from "../../../HabitGrid/index.js";
import { DatabaseHeader } from "./DatabaseHeader.jsx";
import { GalleryViewV2 } from "./GalleryViewV2.jsx";
import { habitUtils, useHabits } from "../../../../contexts/HabitContext";

const DatabaseWidgetV2 = memo(
  ({
    title = "Habit Tracker",
    viewType: initialViewType = "table",
    onViewTypeChange = null, // Callback for view type changes
    persistenceKey = null, // Key for localStorage persistence
    breakpoint = "lg",
    filterComponent = null,
    dateRange = null,
    mode = "week",
    habits: habitsProps = null, // Add habits prop
    completions: completionsProps = null, // Add completions prop
    entries: entriesProps = null, // Add entries prop for HabitGrid
    onAddHabit = null,
    onEditHabit = null,
    isInEditMode = false,
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
    const { habits: contextHabits } = useHabits();
    
    // Use props if provided, otherwise use context (for backwards compatibility)
    const habits = habitsProps !== null ? habitsProps : contextHabits;
    
    // Safe habit ID extraction
    const safeGetHabitId = useCallback((habit) => {
      if (!habit) return null;
      
      try {
        // Try _id first, then id, then generate a fallback
        const id = habit._id || habit.id;
        if (id === null || id === undefined) {
          console.warn('Habit missing ID:', habit);
          return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return String(id);
      } catch (error) {
        console.warn('Error extracting habit ID:', error);
        return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }, []);
    
    // State for custom habit order
    const [habitOrder, setHabitOrder] = useState(() => {
      try {
        const saved = localStorage.getItem('habit-order');
        if (saved) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.warn('Error loading habit order from localStorage:', error);
      }
      return [];
    });

    // Memoized ordered habits with safe ID handling
    const orderedHabits = useMemo(() => {
      if (!habits || habits.length === 0) return [];
      
      // Ensure all habits have valid IDs and filter out invalid ones
      const validHabits = habits.filter(h => {
        const id = safeGetHabitId(h);
        return id && typeof id === 'string' && id.length > 0;
      }).map(h => ({
        ...h,
        _id: safeGetHabitId(h) // Ensure consistent ID
      }));
      
      // If no custom order, use default order
      if (habitOrder.length === 0) {
        return validHabits;
      }
      
      // Apply custom order safely
      const ordered = [];
      const habitMap = new Map();
      
      // Populate habit map with safe string keys
      validHabits.forEach(habit => {
        const id = safeGetHabitId(habit);
        if (id) {
          habitMap.set(id, habit);
        }
      });
      
      // Add habits in custom order
      habitOrder.forEach(id => {
        try {
          const stringId = String(id);
          if (habitMap.has(stringId)) {
            ordered.push(habitMap.get(stringId));
            habitMap.delete(stringId);
          }
        } catch (error) {
          console.warn('Error processing habit order ID:', id, error);
        }
      });
      
      // Add any new habits that weren't in the saved order
      habitMap.forEach(habit => ordered.push(habit));
      
      return ordered;
    }, [habits, habitOrder, safeGetHabitId]);

    // Handle habit reorder with safe ID conversion
    const handleHabitReorder = useCallback((newOrder) => {
      try {
        // Ensure all IDs are valid strings
        const safeOrder = newOrder
          .map(id => {
            try {
              return String(id);
            } catch (error) {
              console.warn('Error converting habit ID to string:', id, error);
              return null;
            }
          })
          .filter(id => id && id.length > 0);
        
        setHabitOrder(safeOrder);
        
        // Save to localStorage safely
        try {
          localStorage.setItem('habit-order', JSON.stringify(safeOrder));
        } catch (error) {
          console.warn('Error saving habit order to localStorage:', error);
        }
        
      } catch (error) {
        console.warn('Error in handleHabitReorder:', error);
      }
    }, []);

    // Calculate display title with date range - safe string handling
    const displayTitle = useMemo(() => {
      try {
        if (
          title === "Today's Habits" ||
          title === "Habit Tracker" ||
          title === "My Habits"
        ) {
          if (dateRange && dateRange.start && dateRange.end) {
            const formatDate = (date) => {
              try {
                const day = date.getDate().toString().padStart(2, "0");
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                return `${day}/${month}`;
              } catch (error) {
                console.warn('Error formatting date:', error);
                return 'Invalid Date';
              }
            };

            const startStr = formatDate(dateRange.start);
            const endStr = formatDate(dateRange.end);
            const modeLabel = mode === "week" ? "Week" : "Month";

            return `${modeLabel} (${startStr} - ${endStr})`;
          } else {
            const weekStart = habitUtils.getWeekStart(new Date());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const formatDate = (date) => {
              try {
                const day = date.getDate().toString().padStart(2, "0");
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const year = date.getFullYear().toString().slice(-2);
                return `${day}/${month}/${year}`;
              } catch (error) {
                console.warn('Error formatting date:', error);
                return 'Invalid Date';
              }
            };

            return `Week ${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
          }
        }
        return String(title);
      } catch (error) {
        console.warn('Error calculating display title:', error);
        return String(title);
      }
    }, [title, dateRange, mode]);
    
    // Memoize the start date to prevent re-renders
    const startDate = useMemo(() => {
      try {
        return dateRange?.start || habitUtils.getWeekStart(new Date());
      } catch (error) {
        console.warn('Error calculating start date:', error);
        return new Date();
      }
    }, [dateRange?.start]);
    
    const renderContent = () => {
      try {
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
                habits={orderedHabits}
                entries={completionsProps} // Use completions from props as entries
                isInEditMode={isInEditMode}
                onHabitReorder={handleHabitReorder}
                onAddHabit={onAddHabit}
                onEditHabit={onEditHabit}
              />
            );
          case "gallery":
          default:
            return (
              <GalleryViewV2
                startDate={startDate}
                endDate={dateRange?.end}
                breakpoint={breakpoint}
                onAddHabit={onAddHabit}
                onEditHabit={onEditHabit}
                habits={orderedHabits}
                entries={completionsProps} // Use completions from props as entries
                isInEditMode={isInEditMode}
                onHabitReorder={handleHabitReorder}
              />
            );
        }
      } catch (error) {
        console.warn('Error rendering database widget content:', error);
        return (
          <div className="w-full h-full flex items-center justify-center text-red-500">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">Rendering Error</div>
              <div className="text-sm">Failed to render widget content</div>
            </div>
          </div>
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

DatabaseWidgetV2.displayName = "DatabaseWidgetV2";

export { DatabaseWidgetV2 };
