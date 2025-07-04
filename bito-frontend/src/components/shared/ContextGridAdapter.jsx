import React, { useCallback, useEffect } from 'react';
import { useHabits, habitUtils } from '../../contexts/HabitContext';
import BaseGridContainer from './BaseGridContainer';

/**
 * ContextGridAdapter
 * 
 * This adapter component sits between components that expect context data (like Dashboard)
 * and components that expect props (like BaseGridContainer after refactoring).
 * 
 * It extracts data from context and passes it as props, allowing both patterns to coexist.
 */
const ContextGridAdapter = ({
  // Pass through all props that don't come from context
  mode = 'dashboard',
  chartFilters,
  databaseFilters,
  chartDateRange,
  databaseDateRange,
  filterOptions,
  updateChartFilter,
  updateChartMonth,
  updateDatabaseFilter,
  updateDatabaseMonth,
  onShowEnhancedCsvImport,
  onShowLLMSettings,
  ChartFilterControls,
  DatabaseFilterControls,
  availableWidgets,
  defaultWidgets,
  defaultLayouts,
  storageKeys,
  className,
  readOnly = false,
  // Optional override props (for testing or specialized cases)
  habits: habitsProp = null,
  entries: entriesProp = null,
  isLoading: isLoadingProp = null,
  onAddHabit: onAddHabitProp = null,
  onDeleteHabit: onDeleteHabitProp = null,
  onEditHabit: onEditHabitProp = null,
  onToggleCompletion: onToggleCompletionProp = null,
  // Any additional props
  ...otherProps
}) => {
  // Extract data and handlers from context
  const {
    habits: contextHabits,
    entries: contextEntries,
    isLoading: contextIsLoading,
    createHabit,
    deleteHabit,
    updateHabit,
    toggleHabitCompletion,
    fetchHabitEntries,
  } = useHabits();

  // Use prop values if provided, otherwise use context
  const habits = habitsProp !== null ? habitsProp : contextHabits;
  const entries = entriesProp !== null ? entriesProp : contextEntries;
  const isLoading = isLoadingProp !== null ? isLoadingProp : contextIsLoading;

  // Debug logging for entries
  useEffect(() => {
    // Check if entries are empty or undefined
    const entriesEmpty = !entries || Object.keys(entries).length === 0;
  }, [entries, contextEntries, entriesProp]);

  // Wrap context handlers with useCallback to prevent unnecessary renders
  const handleAddHabit = useCallback(
    onAddHabitProp !== null ? onAddHabitProp : (habitData) => {
      // If onAddHabit prop is provided (from parent component), use it
      if (onAddHabitProp) {
        onAddHabitProp();
        return;
      }
      
      // If no data is provided or it's an event, use default data
      if (!habitData || typeof habitData !== 'object' || habitData.preventDefault || habitData.target) {
        // Create default habit data
        habitData = {
          name: 'New Habit',
          description: '',
          category: 'other',
          color: '#4f46e5',
          icon: '⭐',
        };
      }
      
      // Create a clean data object with only primitive values
      const cleanHabitData = {
        name: String(habitData.name || 'New Habit'),
        description: String(habitData.description || ''),
        category: String(habitData.category || 'other'),
        color: String(habitData.color || '#4f46e5'),
        icon: String(habitData.icon || '⭐'),
        frequency: String(habitData.frequency || 'daily'),
        ...(habitData.schedule && {
          schedule: {
            days: Array.isArray(habitData.schedule.days) ? habitData.schedule.days : [0, 1, 2, 3, 4, 5, 6],
            reminderTime: String(habitData.schedule.reminderTime || ''),
            reminderEnabled: Boolean(habitData.schedule.reminderEnabled)
          }
        }),
        ...(habitData.target && {
          target: {
            value: Number(habitData.target.value) || 1,
            unit: String(habitData.target.unit || 'times')
          }
        })
      };
      
      return createHabit(cleanHabitData);
    },
    [onAddHabitProp, createHabit]
  );

  const handleDeleteHabit = useCallback(
    onDeleteHabitProp !== null ? onDeleteHabitProp : (habitId) => deleteHabit(habitId),
    [onDeleteHabitProp, deleteHabit]
  );

  const handleEditHabit = useCallback(
    onEditHabitProp !== null ? onEditHabitProp : (habitId, habitData) => {
      // Ensure we have clean data object for updates
      if (!habitData || typeof habitData !== 'object' || habitData.preventDefault) {
        console.error('Invalid habit data passed to handleEditHabit:', habitData);
        return;
      }
      
      // Create a clean data object with only primitive values
      const cleanHabitData = {
        name: String(habitData.name || ''),
        description: String(habitData.description || ''),
        category: String(habitData.category || 'other'),
        color: String(habitData.color || '#4f46e5'),
        icon: String(habitData.icon || '⭐'),
        isActive: Boolean(habitData.isActive !== undefined ? habitData.isActive : true),
        ...(habitData.schedule && {
          schedule: {
            days: Array.isArray(habitData.schedule.days) ? habitData.schedule.days : [0, 1, 2, 3, 4, 5, 6],
            reminderTime: String(habitData.schedule.reminderTime || ''),
            reminderEnabled: Boolean(habitData.schedule.reminderEnabled)
          }
        }),
        ...(habitData.target && {
          target: {
            value: Number(habitData.target.value) || 1,
            unit: String(habitData.target.unit || 'times')
          }
        })
      };
      
      return updateHabit(habitId, cleanHabitData);
    },
    [onEditHabitProp, updateHabit]
  );

  const handleToggleCompletion = useCallback(
    onToggleCompletionProp !== null
      ? onToggleCompletionProp
      : (habitId, date) => toggleHabitCompletion(habitId, date),
    [onToggleCompletionProp, toggleHabitCompletion]
  );

  // Proactively fetch entries for all habits in the date range
  useEffect(() => {
    if (!habits || habits.length === 0) return;
    
    // Only run this effect when we're using context data (not when props are passed)
    if (entriesProp !== null) return;
    
    // Determine date range to fetch
    let startDateObj, endDateObj;
    
    if (chartDateRange && databaseDateRange) {
      // Use the wider date range between chart and database filters
      startDateObj = new Date(Math.min(
        chartDateRange.start.getTime(),
        databaseDateRange.start.getTime()
      ));
      
      endDateObj = new Date(Math.max(
        chartDateRange.end.getTime(),
        databaseDateRange.end.getTime()
      ));
    } else if (chartDateRange) {
      startDateObj = chartDateRange.start;
      endDateObj = chartDateRange.end;
    } else if (databaseDateRange) {
      startDateObj = databaseDateRange.start;
      endDateObj = databaseDateRange.end;
    } else {
      // Default to current week if no date range is provided
      startDateObj = habitUtils.getWeekStart(new Date());
      endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + 6); // Add 6 days to get end of week
    }
    
    // Fetch entries for all habits for the date range
    habits.forEach(habit => {
      fetchHabitEntries(habit._id, startDateObj, endDateObj);
    });
  }, [habits, chartDateRange, databaseDateRange, entriesProp, fetchHabitEntries]);

  return (
    <BaseGridContainer
      mode={mode}
      // Pass context data as props
      habits={habits}
      entries={entries}
      isLoading={isLoading}
      // Pass context handlers as props
      onAddHabit={handleAddHabit}
      onDeleteHabit={handleDeleteHabit}
      onEditHabit={handleEditHabit}
      onToggleCompletion={handleToggleCompletion}
      // Pass through all other props
      chartFilters={chartFilters}
      databaseFilters={databaseFilters}
      chartDateRange={chartDateRange}
      databaseDateRange={databaseDateRange}
      filterOptions={filterOptions}
      updateChartFilter={updateChartFilter}
      updateChartMonth={updateChartMonth}
      updateDatabaseFilter={updateDatabaseFilter}
      updateDatabaseMonth={updateDatabaseMonth}
      onShowEnhancedCsvImport={onShowEnhancedCsvImport}
      onShowLLMSettings={onShowLLMSettings}
      ChartFilterControls={ChartFilterControls}
      DatabaseFilterControls={DatabaseFilterControls}
      availableWidgets={availableWidgets}
      defaultWidgets={defaultWidgets}
      defaultLayouts={defaultLayouts}
      storageKeys={storageKeys}
      className={className}
      readOnly={readOnly}
      {...otherProps}
    />
  );
};

export default ContextGridAdapter;
