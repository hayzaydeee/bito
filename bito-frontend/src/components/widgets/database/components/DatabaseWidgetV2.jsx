import React, { useState, memo, useMemo, useCallback } from "react";
import { HabitGrid } from "../../../HabitGrid/index.js";
import { DatabaseHeader } from "./DatabaseHeader.jsx";
import { GalleryViewV2 } from "./GalleryViewV2.jsx";
import { ProfessionalTableView } from "./ProfessionalTableView.jsx";
import { useHabitData } from "../hooks/useHabitData.js";
import { habitUtils, useHabits } from "../../../../contexts/HabitContext";

const DatabaseWidgetV2 = memo(
  ({
    title = "Habit Tracker",
    viewType: initialViewType = "table",
    onViewTypeChange = null,
    persistenceKey = null,
    breakpoint = "lg",
    filterComponent = null,
    dateRange = null,
    mode = "week",
    habits: habitsProps = null,
    completions: completionsProps = null,
    entries: entriesProps = null,
    onAddHabit = null,
    onEditHabit = null,
    onToggleCompletion = null,
    isInEditMode = false,
    readOnly = false,
  }) => {
    const [viewType, setViewType] = useState(() => {
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

    const handleViewTypeChange = useCallback((newViewType) => {
      setViewType(newViewType);
      
      if (persistenceKey) {
        try {
          localStorage.setItem(persistenceKey, newViewType);
        } catch (error) {
          console.warn('Failed to save view type to localStorage:', error);
        }
      }
      
      if (onViewTypeChange) {
        onViewTypeChange(newViewType);
      }
    }, [persistenceKey, onViewTypeChange]);

    // Get context data but prefer props
    const { 
      habits: contextHabits, 
      entries: contextEntries,
      isLoading: contextLoading,
      error: contextError,
      toggleHabitCompletion: contextToggleCompletion
    } = useHabits();

    // Use props if provided, otherwise fall back to context
    const habits = habitsProps !== null ? habitsProps : contextHabits;
    const entries = entriesProps !== null ? entriesProps : contextEntries;
    const isLoading = habits === null;
    const error = contextError;
    const toggleHabitCompletion = onToggleCompletion || contextToggleCompletion;

    // Transform entries format to completions format for useHabitData hook
    const transformedCompletions = useMemo(() => {
      if (!entries || typeof entries !== 'object') return {};
      
      const completions = {};
      
      // Convert from entries[habitId][date] = {completed: boolean} 
      // to completions[`${date}-${habitId}`] = boolean format
      Object.keys(entries).forEach(habitId => {
        const habitEntries = entries[habitId];
        if (habitEntries && typeof habitEntries === 'object') {
          Object.keys(habitEntries).forEach(date => {
            const entry = habitEntries[date];
            if (entry && entry.completed) {
              completions[`${date}-${habitId}`] = true;
            }
          });
        }
      });
      
      return completions;
    }, [entries]);

    // Calculate date range
    const startDate = useMemo(() => {
      try {
        return dateRange?.start || habitUtils.getWeekStart(new Date());
      } catch (error) {
        console.warn('Error calculating start date:', error);
        return new Date();
      }
    }, [dateRange?.start]);

    const endDate = useMemo(() => {
      try {
        return dateRange?.end || (() => {
          const end = new Date(startDate);
          end.setDate(startDate.getDate() + 6);
          return end;
        })();
      } catch (error) {
        console.warn('Error calculating end date:', error);
        const fallback = new Date(startDate);
        fallback.setDate(startDate.getDate() + 6);
        return fallback;
      }
    }, [dateRange?.end, startDate]);

    // Use the existing useHabitData hook for table view data processing
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
      habits, 
      completions: transformedCompletions, 
      dateRange: { start: startDate, end: endDate }, 
      mode 
    });

    // Handle toggle completion
    const handleToggleCompletion = useCallback(async (day, habitId, completions) => {
      if (readOnly) return;
      
      try {
        // Find the date for this day
        const dateInfo = getCurrentWeekDates?.find(d => d.day === day);
        const date = dateInfo?.date;
        
        if (date && toggleHabitCompletion) {
          await toggleHabitCompletion(habitId, date);
        }
      } catch (error) {
        console.error('Error toggling completion:', error);
      }
    }, [readOnly, getCurrentWeekDates, toggleHabitCompletion]);

    const renderContent = () => {
      try {
        switch (viewType) {
          case "table":
            return (
              <ProfessionalTableView
                daysOfWeek={daysOfWeek}
                displayHabits={displayHabits}
                displayCompletions={displayCompletions}
                getCurrentWeekDates={getCurrentWeekDates}
                getCompletionStatus={getCompletionStatus}
                getDayCompletion={getDayCompletion}
                handleToggleCompletion={handleToggleCompletion}
                weekStats={weekStats}
                readOnly={readOnly}
                onAddHabit={readOnly ? null : onAddHabit}
              />
            );
          case "gallery":
          default:
            return (
              <GalleryViewV2
                startDate={startDate}
                endDate={endDate}
                breakpoint={breakpoint}
                onAddHabit={readOnly ? null : onAddHabit}
                onEditHabit={readOnly ? null : onEditHabit}
                habits={habits}
                entries={entries}
                isInEditMode={isInEditMode}
              />
            );
        }
      } catch (error) {
        console.error('Error rendering database widget content:', error);
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-400 mb-2">Error rendering content</p>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {error.message || 'Please try refreshing the page'}
              </p>
            </div>
          </div>
        );
      }
    };

    if (isLoading && habits === null) {
      return (
        <div className="w-full h-full bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border-primary)] p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
              <p className="text-[var(--color-text-secondary)]">Loading habits...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error && habits === null) {
      return (
        <div className="w-full h-full bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border-primary)] p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-400 mb-2">Error loading habits</p>
              <p className="text-[var(--color-text-secondary)] text-sm">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
        <DatabaseHeader
          title={title}
          viewType={viewType}
          setViewType={handleViewTypeChange}
          filterComponent={filterComponent}
        />
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    );
  }
);

DatabaseWidgetV2.displayName = 'DatabaseWidgetV2';

export { DatabaseWidgetV2 };
