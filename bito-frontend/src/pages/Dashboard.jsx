import React, { useMemo, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHabits, habitUtils } from '../contexts/HabitContext';
import { ContextGridAdapter } from '../components/shared';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import { ChartFilterControls, DatabaseFilterControls } from '../components/ui/FilterControls';
import CustomHabitEditModal from '../components/ui/CustomHabitEditModal';
import OnboardingControls from '../components/shared/OnboardingControls';

// Available widget types (same as ContentGrid)
const AVAILABLE_WIDGET_TYPES = {
  "habits-overview": {
    title: "Habits Overview",
    icon: "📊",
    description: "Daily habit completion chart",
    defaultProps: { w: 6, h: 4 },
  },
  "habit-list": {
    title: "Habits List",
    icon: "📋",
    description: "Manage your daily habits",
    defaultProps: { w: 4, h: 6 },
  },
  "quick-actions": {
    title: "Quick Actions",
    icon: "⚡",
    description: "Fast habit logging buttons",
    defaultProps: { w: 6, h: 4 },
  },
};

// Default layouts (optimized for better content display)
const getDefaultLayouts = () => ({
  lg: [
    { i: "habits-overview", x: 0, y: 0, w: 8, h: 6, moved: false, static: false },
    { i: "quick-actions", x: 8, y: 0, w: 4, h: 5, moved: false, static: false },
    { i: "habit-list", x: 0, y: 6, w: 12, h: 10, moved: false, static: false },
  ],
  md: [
    { i: "habits-overview", x: 0, y: 0, w: 12, h: 6, moved: false, static: false },
    { i: "quick-actions", x: 3, y: 0, w: 6, h: 4, moved: false, static: false },
    { i: "habit-list", x: 0, y: 4, w: 12, h: 10, moved: false, static: false },
  ],
  sm: [
    { i: "habits-overview", x: 0, y: 0, w: 12, h: 6, moved: false, static: false },
    { i: "quick-actions", x: 0, y: 4, w: 12, h: 4, moved: false, static: false },
    { i: "habit-list", x: 0, y: 8, w: 12, h: 10, moved: false, static: false },
  ],
  xs: [
    { i: "habits-overview", x: 0, y: 0, w: 4, h: 6, moved: false, static: false },
    { i: "quick-actions", x: 0, y: 3, w: 4, h: 4, moved: false, static: false },
    { i: "habit-list", x: 0, y: 6, w: 4, h: 10, moved: false, static: false },
  ],
  xxs: [
    { i: "habits-overview", x: 0, y: 0, w: 2, h: 3, moved: false, static: false },
    { i: "quick-actions", x: 0, y: 3, w: 2, h: 3, moved: false, static: false },
    { i: "habit-list", x: 0, y: 6, w: 2, h: 6, moved: false, static: false },
  ],
});

// Default widgets
const getDefaultActiveWidgets = () => [
  "habits-overview",
  "quick-actions", 
  "habit-list",
];

// Storage keys
const STORAGE_KEYS = {
  layouts: "habitTracker_dashboardLayouts",
  widgets: "habitTracker_dashboardWidgets",
  chartFilters: "habitTracker_dashboardChartFilters",
  databaseFilters: "habitTracker_dashboardDatabaseFilters",
  databaseViewType: "habitTracker_dashboardDatabaseViewType"
};

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    habits, 
    entries, 
    isLoading, 
    createHabit, 
    updateHabit, 
    deleteHabit, 
    archiveHabit,
    toggleHabitCompletion 
  } = useHabits();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentHabit, setCurrentHabit] = useState(null);

  // Filter states with localStorage persistence
  const [chartFilters, setChartFilters] = useState(() => {
    const getCurrentWeekNumber = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Get first day of current month
      const monthStart = new Date(currentYear, currentMonth, 1);
      const firstWeekStart = habitUtils.getWeekStart(monthStart);
      const currentWeekStart = habitUtils.getWeekStart(today);

      // Calculate week number by comparing week starts
      const weekDiff = Math.floor(
        (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
      );

      return weekDiff + 1;
    };

    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.chartFilters);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the structure and ensure all required fields exist
        if (parsed && typeof parsed === 'object' && 
            parsed.mode && typeof parsed.period === 'number' && typeof parsed.selectedMonth === 'number') {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load chart filters from localStorage:', error);
    }

    // Default values if no valid localStorage data
    return {
      mode: "week",
      period: getCurrentWeekNumber(),
      selectedMonth: new Date().getMonth() + 1,
    };
  });

  const [databaseFilters, setDatabaseFilters] = useState(() => {
    const getCurrentWeekNumber = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const monthStart = new Date(currentYear, currentMonth, 1);
      const firstWeekStart = habitUtils.getWeekStart(monthStart);
      const currentWeekStart = habitUtils.getWeekStart(today);

      const weekDiff = Math.floor(
        (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
      );

      return weekDiff + 1;
    };

    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.databaseFilters);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the structure and ensure all required fields exist
        if (parsed && typeof parsed === 'object' && 
            typeof parsed.period === 'number' && typeof parsed.selectedMonth === 'number') {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load database filters from localStorage:', error);
    }

    // Default values if no valid localStorage data
    return {
      period: getCurrentWeekNumber(),
      selectedMonth: new Date().getMonth() + 1,
    };
  });

  // Date range calculation (same as ContentGrid)
  const getDateRangeFromFilters = useCallback((filterObj) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (filterObj.chartMode === "week") {
      const selectedMonth = filterObj.chartSelectedMonth - 1;
      const weekPeriod = filterObj.chartPeriod || 1;

      const monthStart = new Date(currentYear, selectedMonth, 1);
      const firstWeekStart = habitUtils.getWeekStart(monthStart);
      
      const weekStart = new Date(firstWeekStart);
      weekStart.setDate(firstWeekStart.getDate() + (weekPeriod - 1) * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return { start: weekStart, end: weekEnd };
    } else if (filterObj.chartMode === "month") {
      const selectedMonth = filterObj.chartSelectedMonth - 1;
      const startOfMonth = new Date(currentYear, selectedMonth, 1);
      const endOfMonth = new Date(currentYear, selectedMonth + 1, 0);
      return { start: startOfMonth, end: endOfMonth };
    } else {
      // Continuous mode - get a 90-day range
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 89);
      return { start: startDate, end: endDate };
    }
  }, []);

  // Calculate date ranges
  const chartDateRange = useMemo(() => {
    const filterObj = {
      chartMode: chartFilters.mode,
      chartPeriod: chartFilters.period,
      chartSelectedMonth: chartFilters.selectedMonth,
    };
    return getDateRangeFromFilters(filterObj);
  }, [chartFilters, getDateRangeFromFilters]);

  const databaseDateRange = useMemo(() => {
    const filterObj = {
      chartMode: "week",
      chartPeriod: databaseFilters.period,
      chartSelectedMonth: databaseFilters.selectedMonth,
    };
    return getDateRangeFromFilters(filterObj);
  }, [databaseFilters, getDateRangeFromFilters]);

  // Filter options (same as ContentGrid)
  const filterOptions = useMemo(() => {
    const getWeeksForMonth = (month) => {
      const year = new Date().getFullYear();
      const weeks = [];

      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      let currentWeekStart = habitUtils.getWeekStart(monthStart);
      let weekNumber = 1;

      while (currentWeekStart <= monthEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);

        const formatDate = (date) => {
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          return `${day}/${month}`;
        };

        const startStr = formatDate(currentWeekStart);
        const endStr = formatDate(weekEnd);

        weeks.push({
          value: weekNumber,
          label: `Week ${weekNumber} (${startStr} - ${endStr})`,
        });

        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNumber++;
      }

      return weeks;
    };

    const chartWeeks = getWeeksForMonth(chartFilters.selectedMonth);
    const databaseWeeks = getWeeksForMonth(databaseFilters.selectedMonth);

    return {
      chartModes: [
        { value: "week", label: "Weekly View" },
        { value: "month", label: "Monthly View" },
        { value: "continuous", label: "All Time" },
      ],
      weeks: chartWeeks,
      databaseWeeks: databaseWeeks,
      months: [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
      ],
    };
  }, [chartFilters.selectedMonth, databaseFilters.selectedMonth]);

  // Filter update handlers with localStorage persistence
  const updateChartFilter = useCallback((mode, period) => {
    setChartFilters((prev) => {
      const newPeriod = mode !== prev.mode ? 1 : period;
      const newFilters = {
        ...prev,
        mode: mode,
        period: newPeriod,
      };
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.chartFilters, JSON.stringify(newFilters));
      } catch (error) {
        console.warn('Failed to save chart filters to localStorage:', error);
      }
      
      return newFilters;
    });
  }, []);

  const updateChartMonth = useCallback((month) => {
    setChartFilters((prev) => {
      const getCurrentWeekInMonth = (targetMonth) => {
        const today = new Date();
        const currentYear = today.getFullYear();

        if (targetMonth - 1 === today.getMonth()) {
          const monthStart = new Date(currentYear, targetMonth - 1, 1);
          const firstWeekStart = habitUtils.getWeekStart(monthStart);
          const currentWeekStart = habitUtils.getWeekStart(today);
          const weekDiff = Math.floor(
            (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
          );
          return weekDiff + 1;
        } else {
          return 1;
        }
      };

      const newPeriod = getCurrentWeekInMonth(month);

      const newFilters = {
        ...prev,
        selectedMonth: month,
        period: newPeriod,
      };
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.chartFilters, JSON.stringify(newFilters));
      } catch (error) {
        console.warn('Failed to save chart filters to localStorage:', error);
      }
      
      return newFilters;
    });
  }, []);

  const updateDatabaseFilter = useCallback((period) => {
    setDatabaseFilters((prev) => {
      const newFilters = {
        ...prev,
        period: period,
      };
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.databaseFilters, JSON.stringify(newFilters));
      } catch (error) {
        console.warn('Failed to save database filters to localStorage:', error);
      }
      
      return newFilters;
    });
  }, []);

  const updateDatabaseMonth = useCallback((month) => {
    setDatabaseFilters((prev) => {
      const getCurrentWeekInMonth = (targetMonth) => {
        const today = new Date();
        const currentYear = today.getFullYear();

        if (targetMonth - 1 === today.getMonth()) {
          const monthStart = new Date(currentYear, targetMonth - 1, 1);
          const firstWeekStart = habitUtils.getWeekStart(monthStart);
          const currentWeekStart = habitUtils.getWeekStart(today);
          const weekDiff = Math.floor(
            (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
          );
          return weekDiff + 1;
        } else {
          return 1;
        }
      };

      const newPeriod = getCurrentWeekInMonth(month);

      const newFilters = {
        ...prev,
        selectedMonth: month,
        period: newPeriod,
      };
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.databaseFilters, JSON.stringify(newFilters));
      } catch (error) {
        console.warn('Failed to save database filters to localStorage:', error);
      }
      
      return newFilters;
    });
  }, []);

  // Event handlers (same as ContentGrid)
  const handleAddHabit = useCallback(() => {
    setCurrentHabit(null);
    setEditModalOpen(true);
  }, []);

  const handleCloseHabitModal = useCallback(() => {
    setEditModalOpen(false);
    setCurrentHabit(null);
  }, []);

  const handleEditHabit = useCallback((habit) => {
    setCurrentHabit(habit);
    setEditModalOpen(true);
  }, []);

  const handleSaveHabit = useCallback(async (habitData) => {
    try {
      let result;
      if (currentHabit) {
        // Updating existing habit
        result = await updateHabit(currentHabit._id, habitData);
      } else {
        // Creating new habit
        result = await createHabit(habitData);
      }
      
      if (result.success) {
        setEditModalOpen(false);
        setCurrentHabit(null);
      } else {
        console.error("Failed to save habit:", result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  }, [currentHabit, createHabit, updateHabit]);

  const handleDeleteHabit = useCallback(async (habitId) => {
    const result = await deleteHabit(habitId);
    if (!result.success) {
      console.error("Failed to delete habit:", result.error);
    }
  }, [deleteHabit]);

  const handleArchiveHabit = useCallback(async (habit) => {
    const result = await archiveHabit(habit._id, !habit.isActive);
    if (!result.success) {
      console.error("Failed to archive habit:", result.error);
    }
  }, [archiveHabit]);

  const handleToggleCompletion = useCallback(async (habitId, date) => {
    const result = await toggleHabitCompletion(habitId, date);
    if (!result.success) {
      console.error("Failed to toggle habit:", result.error);
    }
  }, [toggleHabitCompletion]);

  if (isLoading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--color-surface-elevated)] rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 page-container space-y-8">
      {/* Welcome Section */}
      <div className="relative" data-tour="welcome-card">
        <WelcomeCard userName={user?.name || user?.username || 'User'} />
      </div>
      
      {/* Dashboard Grid Container using ContextGridAdapter */}
      <div className="relative">
        <ContextGridAdapter
          mode="dashboard"
          
          // Habit handlers for modal integration
          onAddHabit={handleAddHabit}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
          onToggleCompletion={handleToggleCompletion}
          
          // Filter props
          chartFilters={chartFilters}
          databaseFilters={databaseFilters}
          chartDateRange={chartDateRange}
          databaseDateRange={databaseDateRange}
          filterOptions={filterOptions}
          updateChartFilter={updateChartFilter}
          updateChartMonth={updateChartMonth}
          updateDatabaseFilter={updateDatabaseFilter}
          updateDatabaseMonth={updateDatabaseMonth}
          
          // UI handlers - CSV import temporarily disabled for deployment
          onShowEnhancedCsvImport={() => {/* CSV import disabled for deployment */}}
          onShowLLMSettings={() => {/* LLM settings disabled for deployment */}}
          
          // Filter components
          ChartFilterControls={ChartFilterControls}
          DatabaseFilterControls={DatabaseFilterControls}
          
          // Configuration
          availableWidgets={AVAILABLE_WIDGET_TYPES}
          defaultWidgets={getDefaultActiveWidgets()}
          defaultLayouts={getDefaultLayouts()}
          storageKeys={STORAGE_KEYS}
          className="dashboard-grid"
        />
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
          💡 <strong>Pro tip:</strong> Use "Edit All" to customize your dashboard layout, or click the pencil icon on individual widgets to edit them.
        </p>
      </div>

      {/* Habit Edit/Create Modal */}
      <CustomHabitEditModal
        isOpen={editModalOpen}
        onClose={handleCloseHabitModal}
        habit={currentHabit}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        onArchive={handleArchiveHabit}
      />

      {/* Onboarding Controls (dev mode only) */}
      <OnboardingControls />
    </div>
  );
};

export default Dashboard;
