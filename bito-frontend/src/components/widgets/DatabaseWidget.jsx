import React, { useMemo, useState } from 'react';
import { CheckIcon, ClockIcon, Cross1Icon, EyeOpenIcon } from '@radix-ui/react-icons';

const DatabaseWidget = ({ 
  title = "Habit Tracker",
  data = [],
  viewType = 'table',
  breakpoint = 'lg', 
  availableColumns = 8, 
  size = { width: 320, height: 200 },
  widgetConfig = {}
}) => {
  const [currentView, setCurrentView] = useState(viewType);

  const defaultHabits = [
    { id: 1, habit: 'Morning Exercise', status: 'completed', streak: 5, category: 'Health' },
    { id: 2, habit: 'Read 30 mins', status: 'pending', streak: 3, category: 'Learning' },
    { id: 3, habit: 'Drink 8 glasses water', status: 'completed', streak: 7, category: 'Health' },
    { id: 4, habit: 'Meditate', status: 'completed', streak: 2, category: 'Wellness' },
    { id: 5, habit: 'No social media', status: 'in-progress', streak: 1, category: 'Digital' },
  ];

  const habits = data.length > 0 ? data : defaultHabits;

  // Auto-switch view type based on size constraints
  const effectiveViewType = useMemo(() => {
    if (breakpoint === 'xs' || availableColumns < 4) {
      return 'gallery'; // Force gallery view on small widgets
    }
    if (currentView === 'table' && availableColumns < 6) {
      return 'gallery'; // Switch to gallery if table won't fit well
    }
    return currentView;
  }, [currentView, breakpoint, availableColumns]);

  const getStatusIcon = (status) => {
    const iconSize = breakpoint === 'xs' ? 'w-3 h-3' : 'w-4 h-4';
    switch (status) {
      case 'completed':
        return <CheckIcon className={`${iconSize} text-green-500`} />;
      case 'in-progress':
        return <ClockIcon className={`${iconSize} text-yellow-500`} />;      case 'pending':
        return <Cross1Icon className={`${iconSize} text-gray-400`} />;
      default:
        return <Cross1Icon className={`${iconSize} text-gray-400`} />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = breakpoint === 'xs' ? "px-1 py-0.5 rounded text-xs" : "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'in-progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'pending':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  const handleToggleHabit = (habitId, currentStatus) => {
    console.log(`Toggling habit ${habitId} from ${currentStatus}`);
  };

  // Gallery view with responsive columns
  if (effectiveViewType === 'gallery') {
    const columnCount = useMemo(() => {
      if (breakpoint === 'xs') return 1;
      if (breakpoint === 'sm' || availableColumns < 4) return 1;
      if (breakpoint === 'md' || availableColumns < 6) return 2;
      return Math.min(3, Math.floor(availableColumns / 2));
    }, [breakpoint, availableColumns]);

    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <h4 className={`font-medium text-gray-700 dark:text-gray-300 truncate ${
            breakpoint === 'sm' ? 'text-sm' : 'text-base'
          }`}>
            {title}
          </h4>
          {availableColumns > 6 && (
            <button 
              onClick={() => setCurrentView(currentView === 'gallery' ? 'table' : 'gallery')}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              <EyeOpenIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div 
            className="grid gap-2 h-fit"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            }}
          >
            {habits.map(habit => (
              <GalleryCard 
                key={habit.id} 
                habit={habit} 
                compact={breakpoint === 'xs'}
                onToggle={() => handleToggleHabit(habit.id, habit.status)}
                getStatusIcon={getStatusIcon}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Table view with responsive columns
  const visibleColumns = useMemo(() => {
    const allColumns = ['habit', 'status', 'streak', 'category'];
    
    if (breakpoint === 'xs') return ['habit', 'status'];
    if (breakpoint === 'sm') return ['habit', 'status', 'streak'];
    if (availableColumns < 6) return ['habit', 'status', 'streak'];
    return allColumns;
  }, [breakpoint, availableColumns]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h4 className={`font-medium text-gray-700 dark:text-gray-300 truncate ${
          breakpoint === 'sm' ? 'text-sm' : 'text-base'
        }`}>
          {title}
        </h4>
        {availableColumns > 6 && (
          <button 
            onClick={() => setCurrentView(currentView === 'gallery' ? 'table' : 'gallery')}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            <EyeOpenIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ResponsiveTable 
          data={habits}
          visibleColumns={visibleColumns}
          compact={breakpoint === 'xs' || breakpoint === 'sm'}
          onToggle={handleToggleHabit}
          getStatusIcon={getStatusIcon}
          getStatusBadge={getStatusBadge}
        />
      </div>
    </div>
  );
};

// Gallery Card Component
const GalleryCard = ({ habit, compact, onToggle, getStatusIcon, getStatusBadge }) => {
  const categoryColors = {
    Health: 'bg-green-100 text-green-800',
    Learning: 'bg-blue-100 text-blue-800',
    Wellness: 'bg-purple-100 text-purple-800',
    Digital: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-700 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer ${
      compact ? 'p-2' : 'p-3'
    }`}
    onClick={() => onToggle(habit.id, habit.status)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getStatusIcon(habit.status)}
          </div>
          <span className={`font-medium truncate ${
            compact ? 'text-xs' : 'text-sm'
          } text-gray-900 dark:text-gray-100`}>
            {habit.habit}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={getStatusBadge(habit.status)}>
          {habit.status.replace('-', ' ')}
        </span>
        {!compact && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{habit.streak} day streak</span>
          </div>
        )}
      </div>
      
      {!compact && habit.category && (
        <div className="mt-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            categoryColors[habit.category] || 'bg-gray-100 text-gray-800'
          }`}>
            {habit.category}
          </span>
        </div>
      )}
    </div>
  );
};

// Responsive Table Component
const ResponsiveTable = ({ data, visibleColumns, compact, onToggle, getStatusIcon, getStatusBadge }) => {
  const columnConfig = {
    habit: { header: 'Habit', width: 'flex-1' },
    status: { header: 'Status', width: 'w-20' },
    streak: { header: 'Streak', width: 'w-16' },
    category: { header: 'Category', width: 'w-24' },
  };

  return (
    <div className="space-y-2">
      {data.map((habit) => (
        <div 
          key={habit.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          onClick={() => onToggle(habit.id, habit.status)}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getStatusIcon(habit.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-gray-900 dark:text-gray-100 truncate ${
                compact ? 'text-sm' : 'text-base'
              }`}>
                {habit.habit}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={getStatusBadge(habit.status)}>
                  {habit.status.replace('-', ' ')}
                </span>
                {visibleColumns.includes('streak') && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {habit.streak} day streak
                  </span>
                )}
                {visibleColumns.includes('category') && habit.category && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {habit.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <p className={compact ? 'text-sm' : 'text-base'}>No habits found</p>
        </div>
      )}
    </div>
  );
};

export { DatabaseWidget };
