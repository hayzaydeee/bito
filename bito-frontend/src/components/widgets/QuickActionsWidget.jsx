import React, { useMemo, memo, useCallback } from 'react';
import { PlusIcon, GearIcon, ResetIcon, CheckIcon, UploadIcon } from '@radix-ui/react-icons';

const QuickActionsWidget = memo(({
  breakpoint = 'lg',
  availableColumns = 4,
  availableRows = 2,
  widgetConfig = {},
  habits = [],
  onAddHabit,
  onToggleCompletion,
  onShowCsvImport,
  entries = {} // Add entries to get completion status
}) => {
  // Action handlers
  const handleAddHabit = useCallback(() => {
    if (onAddHabit) {
      onAddHabit({
        name: 'New Habit',
        color: 'var(--color-brand-500)',
        icon: '⭐'
      });
    }
  }, [onAddHabit]);

  const handleQuickComplete = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    // Only complete habits that are not already completed today
    habits.forEach(habit => {
      const habitEntries = entries[habit._id];
      const todayEntry = habitEntries && habitEntries[today];
      const isCompleted = todayEntry && todayEntry.completed;
      
      // Only toggle if not already completed
      if (!isCompleted && onToggleCompletion) {
        onToggleCompletion(habit._id, today);
      }
    });
  }, [habits, entries, onToggleCompletion]);

  const handleCsvImport = useCallback(() => {
    if (onShowCsvImport) {
      onShowCsvImport();
    }
  }, [onShowCsvImport]);


  const handleResetDay = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    // Only reset habits that are currently completed today
    habits.forEach(habit => {
      const habitEntries = entries[habit._id];
      const todayEntry = habitEntries && habitEntries[today];
      const isCompleted = todayEntry && todayEntry.completed;
      
      // Only toggle if currently completed
      if (isCompleted && onToggleCompletion) {
        onToggleCompletion(habit._id, today);
      }
    });
  }, [habits, entries, onToggleCompletion]);

  const defaultActions = [
    {
      id: 'add-habit',
      label: 'Add Habit',
      icon: <PlusIcon />,
      color: 'bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)]',
      action: handleAddHabit
    },
    {
      id: 'quick-complete',
      label: 'Complete All',
      icon: <CheckIcon />,
      color: 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/80',
      action: handleQuickComplete
    },
    {
      id: 'csv-import',
      label: 'Import Data',
      icon: <UploadIcon />,
      color: 'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
      action: handleCsvImport
    },
    {
      id: 'reset-day',
      label: 'Reset Day',
      icon: <ResetIcon />,
      color: 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80',
      action: handleResetDay
    }
  ];

  const actions = widgetConfig.actions || defaultActions;

  // Calculate optimal button layout based on available space
  const buttonLayout = useMemo(() => {
    const totalButtons = actions.length;
    
    if (breakpoint === 'xs') {
      return {
        columns: 1,
        rows: Math.min(totalButtons, availableRows),
        buttonSize: 'large',
        showLabels: true,
        showProgress: false      };
    }
    
    if (breakpoint === 'sm') {
      return {
        columns: 2, // Changed back to 2 for better layout with 5 buttons
        rows: Math.ceil(totalButtons / 2),
        buttonSize: 'medium',
        showLabels: true,
        showProgress: availableRows > 3
      };
    }
    
    // For md, lg, xl - use optimal columns for 5 buttons
    const maxCols = Math.floor(availableColumns);
    const maxRows = Math.floor(availableRows);
    const preferredCols = totalButtons <= 3 ? totalButtons : Math.min(3, maxCols); // Use 3 columns for 4-5 buttons
    
    return {
      columns: preferredCols,
      rows: Math.ceil(totalButtons / preferredCols),
      buttonSize: availableColumns > 6 ? 'large' : 'medium',
      showLabels: availableRows > 2,
      showProgress: availableRows > 3
    };
  }, [actions.length, breakpoint, availableColumns, availableRows]);

  const maxButtons = buttonLayout.columns * buttonLayout.rows;
  const visibleActions = actions.slice(0, maxButtons);
  const getButtonClasses = (action) => {
    const baseClasses = `
      ${action.color} 
      text-white rounded-xl 
      flex items-center justify-center
      transition-all duration-200 transform hover:scale-105
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-500)]
      shadow-lg hover:shadow-xl backdrop-blur-sm
    `;

    const sizeClasses = {
      large: 'p-4 space-y-2 flex-col',
      medium: 'p-3 space-y-1 flex-col',
      small: 'p-2 space-x-2 flex-row'
    };

    return `${baseClasses} ${sizeClasses[buttonLayout.buttonSize]}`;
  };

  const getIconSize = () => {
    switch (buttonLayout.buttonSize) {
      case 'large': return 'w-6 h-6';
      case 'medium': return 'w-5 h-5';
      case 'small': return 'w-4 h-4';
      default: return 'w-5 h-5';
    }
  };

  const renderProgress = () => {
    if (!buttonLayout.showProgress) return null;

    // Calculate actual progress from habits and entries
    const today = new Date().toISOString().split('T')[0];
    const total = habits.length;
    const completed = habits.filter(habit => {
      // Check if habit is completed today using entries structure
      // entries = { [habitId]: { [date]: entryObject } }
      const habitEntries = entries[habit._id];
      if (!habitEntries) return false;
      
      const todayEntry = habitEntries[today];
      return todayEntry && todayEntry.completed;
    }).length;
    
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return (
      <div className={`mt-3 p-3 bg-[var(--color-brand-500)]/10 rounded-xl border border-[var(--color-brand-500)]/20 backdrop-blur-sm ${
        breakpoint === 'sm' ? 'text-xs' : 'text-sm'
      }`}>
        <h5 className={`font-medium text-[var(--color-brand-400)] mb-2 font-dmSerif ${
          breakpoint === 'sm' ? 'text-xs' : 'text-sm'
        }`}>
          Today's Progress
        </h5>
        <div className="flex items-center justify-between font-outfit">
          <span className="text-[var(--color-text-secondary)]">Completed:</span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {completed}/{total} habits
          </span>
        </div>
        <div className="mt-2 w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-500)] h-2 rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {habits.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div className="text-[var(--color-text-secondary)]">
            <PlusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-4">No habits yet. Create your first habit!</p>
            <button
              onClick={handleAddHabit}
              className="bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Add Habit
            </button>
          </div>
        </div>
      ) : (
        <>
          <div 
            className="grid gap-3 flex-1"
            style={{
              gridTemplateColumns: `repeat(${buttonLayout.columns}, 1fr)`,
              gridTemplateRows: `repeat(${buttonLayout.rows}, 1fr)`
            }}
          >
            {visibleActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={getButtonClasses(action)}
                disabled={action.id === 'quick-complete' && habits.length === 0}
              >
                <div className="flex-shrink-0">
                  {React.cloneElement(action.icon, { className: getIconSize() })}
                </div>
                {buttonLayout.showLabels && (
                  <span className={`font-medium text-center leading-tight font-outfit ${
                    buttonLayout.buttonSize === 'large' ? 'text-sm' : 
                    buttonLayout.buttonSize === 'medium' ? 'text-xs' : 'text-xs'
                  }`}>
                    {action.label}
                  </span>
                )}
              </button>
            ))}
          </div>
          {renderProgress()}
        </>
      )}
    </div>
  );
});

QuickActionsWidget.displayName = 'QuickActionsWidget';

export default QuickActionsWidget;
