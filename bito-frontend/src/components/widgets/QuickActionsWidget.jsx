import React, { useMemo, memo, useCallback } from 'react';
import { PlusIcon, BarChartIcon, GearIcon, ResetIcon, CheckIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { useHabits } from '../../contexts/HabitContext';

const QuickActionsWidget = memo(({
  breakpoint = 'lg',
  availableColumns = 4,
  availableRows = 2,
  widgetConfig = {}
}) => {
  // Get habit context for actions
  const { habits, createHabit, toggleHabitCompletion } = useHabits();

  // Action handlers
  const handleAddHabit = useCallback(() => {
    createHabit({
      name: 'New Habit',
      color: 'var(--color-brand-500)',
      icon: '⭐'
    });
  }, [createHabit]);
  const handleQuickComplete = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    habits.forEach(habit => {
      toggleHabitCompletion(habit._id, today);
    });
  }, [habits, toggleHabitCompletion]);

  const handleViewAnalytics = useCallback(() => {
    window.location.hash = '#/analytics';
  }, []);

  const handleViewSettings = useCallback(() => {
    window.location.hash = '#/settings';
  }, []);

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
      label: 'Mark Complete',
      icon: <CheckIcon />,
      color: 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/80',
      action: handleQuickComplete
    },
    {
      id: 'view-analytics',
      label: 'Analytics',
      icon: <BarChartIcon />,
      color: 'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
      action: handleViewAnalytics
    },
    {
      id: 'activity-log',
      label: 'Activity',
      icon: <ActivityLogIcon />,
      color: 'bg-[var(--color-brand-400)] hover:bg-[var(--color-brand-500)]',
      action: () => console.log('View activity log - feature coming soon')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <GearIcon />,
      color: 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]',
      action: handleViewSettings
    },
    {
      id: 'reset-day',
      label: 'Reset Day',
      icon: <ResetIcon />,
      color: 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80',
      action: () => console.log('Reset day progress - feature coming soon')
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
        columns: 3, // Changed from 2 to 3 for better layout
        rows: Math.ceil(totalButtons / 3),
        buttonSize: 'medium',
        showLabels: true,
        showProgress: availableRows > 3      };
    }
    
    // For md, lg, xl - use 3 columns by default for better layout
    const maxCols = Math.floor(availableColumns);
    const maxRows = Math.floor(availableRows);
    const preferredCols = 3; // Always prefer 3 columns for optimal button layout
    
    return {
      columns: Math.min(preferredCols, maxCols), // Always use 3 columns if space allows
      rows: Math.ceil(totalButtons / Math.min(preferredCols, maxCols)),
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

    const completed = 3; // This would come from actual data
    const total = 5;
    const percentage = (completed / total) * 100;
    
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
      <div 
        className="grid gap-3 flex-1"
        style={{
          gridTemplateColumns: `repeat(${buttonLayout.columns}, 1fr)`,
          gridTemplateRows: `repeat(${buttonLayout.rows}, 1fr)`        }}
      >
        {visibleActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={getButtonClasses(action)}
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
    </div>
  );
});

QuickActionsWidget.displayName = 'QuickActionsWidget';

export default QuickActionsWidget;
