import React, { useMemo } from 'react';
import { PlusIcon, BarChartIcon, GearIcon, ResetIcon, CheckIcon, ActivityLogIcon } from '@radix-ui/react-icons';

const QuickActionsWidget = ({
  breakpoint = 'lg',
  availableColumns = 4,
  availableRows = 2,
  widgetConfig = {}
}) => {
  const defaultActions = [
    {
      id: 'add-habit',
      label: 'Add Habit',
      icon: <PlusIcon />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => console.log('Add new habit')
    },
    {
      id: 'quick-complete',
      label: 'Mark Complete',
      icon: <CheckIcon />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => console.log('Quick complete habits')
    },
    {
      id: 'view-analytics',
      label: 'Analytics',
      icon: <BarChartIcon />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => console.log('View analytics')
    },
    {
      id: 'activity-log',
      label: 'Activity',
      icon: <ActivityLogIcon />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => console.log('View activity log')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <GearIcon />,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => console.log('Open settings')
    },
    {
      id: 'reset-day',
      label: 'Reset Day',
      icon: <ResetIcon />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => console.log('Reset day progress')
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
        showProgress: false
      };
    }
    
    if (breakpoint === 'sm') {
      return {
        columns: 2,
        rows: Math.ceil(Math.min(totalButtons, availableRows * 2) / 2),
        buttonSize: 'medium',
        showLabels: true,
        showProgress: availableRows > 3
      };
    }

    // For md, lg, xl - calculate optimal grid
    const maxCols = Math.floor(availableColumns);
    const maxRows = Math.floor(availableRows);
    const optimalCols = Math.min(maxCols, Math.ceil(Math.sqrt(totalButtons)));
    
    return {
      columns: Math.min(optimalCols, 3), // Max 3 columns for readability
      rows: Math.ceil(Math.min(totalButtons, maxCols * maxRows) / Math.min(optimalCols, 3)),
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
      text-white rounded-lg 
      flex items-center justify-center
      transition-all duration-200 transform hover:scale-105
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      shadow-md hover:shadow-lg
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
      <div className={`mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 ${
        breakpoint === 'sm' ? 'text-xs' : 'text-sm'
      }`}>
        <h5 className={`font-medium text-blue-900 dark:text-blue-100 mb-2 ${
          breakpoint === 'sm' ? 'text-xs' : 'text-sm'
        }`}>
          Today's Progress
        </h5>
        <div className="flex items-center justify-between">
          <span className="text-blue-700 dark:text-blue-300">Completed:</span>
          <span className="font-semibold text-blue-900 dark:text-blue-100">
            {completed}/{total} habits
          </span>
        </div>
        <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div 
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300" 
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
          gridTemplateRows: `repeat(${buttonLayout.rows}, 1fr)`
        }}
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
              <span className={`font-medium text-center leading-tight ${
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
};

export { QuickActionsWidget };
