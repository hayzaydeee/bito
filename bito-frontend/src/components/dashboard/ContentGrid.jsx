import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useEffect,
} from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import {
  Pencil1Icon,
  TrashIcon,
  PlusIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../widgets/widgets.css";

// Import data service and filter components
import { useHabits } from "../../contexts/HabitContext";
import {
  ChartFilterControls,
  DatabaseFilterControls,
} from "../ui/FilterControls";
import CsvImportModal from "../ui/CsvImportModal";
import EnhancedCsvImportModal from "../ui/EnhancedCsvImportModal";
import LLMSettingsModal from "../ui/LLMSettingsModal";

// Lazy load widgets for better performance
const ChartWidget = lazy(() =>
  import("../widgets/ChartWidget").then((module) => ({
    default: module.ChartWidget,
  }))
);

const DatabaseWidgetBridge = lazy(() =>
  import("../widgets/database/components/DatabaseWidgetBridge.jsx").then(
    (module) => ({
      default: module.DatabaseWidgetBridge,
    })
  )
);
const QuickActionsWidget = lazy(() => import("../widgets/QuickActionsWidget"));

// Loading component for lazy widgets
const WidgetSkeleton = ({ title }) => (
  <div className="w-full h-full glass-card rounded-xl p-4 animate-pulse">
    <div className="h-4 bg-[var(--color-surface-elevated)] rounded mb-3 w-1/2"></div>
    <div className="space-y-2">
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-3/4"></div>
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-1/2"></div>
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-2/3"></div>
    </div>
  </div>
);

// Performance optimized ResponsiveGridLayout
const ResponsiveGridLayout = WidthProvider(Responsive);

// Storage keys
const LAYOUTS_STORAGE_KEY = "habitTracker_dashboardLayouts";
const WIDGETS_STORAGE_KEY = "habitTracker_dashboardWidgets";

// Available widget types for the picker
const AVAILABLE_WIDGET_TYPES = {
  "habits-overview": {
    title: "Habits Overview",
    icon: "📊",
    description: "Daily habit completion chart",
    defaultProps: { w: 6, h: 4 },
  },
  "weekly-progress": {
    title: "Weekly Progress",
    icon: "📈",
    description: "Weekly habit trend analysis",
    defaultProps: { w: 8, h: 6 },
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

// Default active widgets
const getDefaultActiveWidgets = () => [
  "habits-overview",
  "quick-actions",
  "weekly-progress",
  "habit-list",
];

// Default layouts configuration
const getDefaultLayouts = () => ({
  lg: [
    { i: "habits-overview", x: 0, y: 0, w: 6, h: 4 },
    { i: "quick-actions", x: 6, y: 0, w: 6, h: 4 },
    { i: "weekly-progress", x: 0, y: 4, w: 8, h: 6 },
    { i: "habit-list", x: 8, y: 4, w: 4, h: 6 },
  ],
  md: [
    { i: "habits-overview", x: 0, y: 0, w: 6, h: 4 },
    { i: "quick-actions", x: 6, y: 0, w: 6, h: 4 },
    { i: "weekly-progress", x: 0, y: 4, w: 12, h: 6 },
    { i: "habit-list", x: 0, y: 10, w: 12, h: 6 },
  ],
  sm: [
    { i: "habits-overview", x: 0, y: 0, w: 12, h: 4 },
    { i: "quick-actions", x: 0, y: 4, w: 12, h: 4 },
    { i: "weekly-progress", x: 0, y: 8, w: 12, h: 6 },
    { i: "habit-list", x: 0, y: 14, w: 12, h: 6 },
  ],
  xs: [
    { i: "habits-overview", x: 0, y: 0, w: 4, h: 3 },
    { i: "quick-actions", x: 0, y: 3, w: 4, h: 3 },
    { i: "weekly-progress", x: 0, y: 6, w: 4, h: 4 },
    { i: "habit-list", x: 0, y: 10, w: 4, h: 6 },
  ],
  xxs: [
    { i: "habits-overview", x: 0, y: 0, w: 2, h: 3 },
    { i: "quick-actions", x: 0, y: 3, w: 2, h: 3 },
    { i: "weekly-progress", x: 0, y: 6, w: 2, h: 4 },
    { i: "habit-list", x: 0, y: 10, w: 2, h: 6 },
  ],
});

// Utility functions for localStorage
const saveLayoutsToStorage = (layouts) => {
  try {
    localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(layouts));
  } catch (error) {
    console.warn("Failed to save layouts to localStorage:", error);
  }
};

const saveActiveWidgetsToStorage = (widgets) => {
  try {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
  } catch (error) {
    console.warn("Failed to save active widgets to localStorage:", error);
  }
};

const loadLayoutsFromStorage = () => {
  try {
    const saved = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    if (saved) {
      const parsedLayouts = JSON.parse(saved);
      // Validate that the saved layouts have the expected structure
      const defaultLayouts = getDefaultLayouts();
      const validatedLayouts = {};

      Object.keys(defaultLayouts).forEach((breakpoint) => {
        if (
          parsedLayouts[breakpoint] &&
          Array.isArray(parsedLayouts[breakpoint])
        ) {
          validatedLayouts[breakpoint] = parsedLayouts[breakpoint];
        } else {
          validatedLayouts[breakpoint] = defaultLayouts[breakpoint];
        }
      });

      return validatedLayouts;
    }
  } catch (error) {
    console.warn("Failed to load layouts from localStorage:", error);
  }
  return getDefaultLayouts();
};

const loadActiveWidgetsFromStorage = () => {
  try {
    const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (saved) {
      const parsedWidgets = JSON.parse(saved);
      if (Array.isArray(parsedWidgets)) {
        return parsedWidgets;
      }
    }
  } catch (error) {
    console.warn("Failed to load active widgets from localStorage:", error);
  }
  return getDefaultActiveWidgets();
};

// Clear stored layouts (useful for development/debugging)
const clearStoredLayouts = () => {
  try {
    localStorage.removeItem(LAYOUTS_STORAGE_KEY);
    console.log("Stored layouts cleared");
  } catch (error) {
    console.warn("Failed to clear layouts from localStorage:", error);
  }
};

// Throttle function for performance optimization
const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const ContentGrid = () => {
  const gridRef = useRef(null);
  // Initialize layouts from localStorage or use defaults
  const [layouts, setLayouts] = useState(() => loadLayoutsFromStorage());
  const [activeWidgets, setActiveWidgets] = useState(() =>
    loadActiveWidgetsFromStorage()
  );
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [widgetEditStates, setWidgetEditStates] = useState({});
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showEnhancedCsvImport, setShowEnhancedCsvImport] = useState(false);
  const [showLLMSettings, setShowLLMSettings] = useState(false);

  // Auto-save layouts and widgets to localStorage
  useEffect(() => {
    saveLayoutsToStorage(layouts);
  }, [layouts]);
  useEffect(() => {
    saveActiveWidgetsToStorage(activeWidgets);
  }, [activeWidgets]); // Filter state management
  const [filters, setFilters] = useState({
    chartMode: "week",
    chartPeriod: "current",
    chartSelectedMonth: new Date().getMonth(),
    databaseMode: "week",
    databaseRange: null,
  });

  // Get data from new HabitContext
  const {
    habits,
    entries,
    isLoading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
  } = useHabits();

  // Helper function to get date range from filters
  const getDateRangeFromFilters = useCallback((filterObj) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    if (filterObj.chartMode === "week") {
      return {
        start: startOfWeek,
        end: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
      };
    } else {
      // Month mode
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: startOfMonth,
        end: endOfMonth,
      };
    }
  }, []);

  // Calculate current date range based on filters
  const dateRange = useMemo(() => {
    return getDateRangeFromFilters(filters);
  }, [filters, getDateRangeFromFilters]);
  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  // Get filter options (dynamically based on selected months)
  const filterOptions = useMemo(() => {
    const chartMonth =
      filters.chartMode === "week" ? filters.chartSelectedMonth : null;
    const dbMonth = filters.databaseSelectedMonth; // Database is always weekly

    // Use the appropriate month for generating options
    const monthForOptions = chartMonth || dbMonth || new Date().getMonth() + 1;

    // Simple filter options - can be enhanced later
    return {
      chartModes: [
        { value: "week", label: "Weekly View" },
        { value: "month", label: "Monthly View" },
        { value: "continuous", label: "All Time" },
      ],
      weeks: [
        { value: 1, label: "Week 1" },
        { value: 2, label: "Week 2" },
        { value: 3, label: "Week 3" },
        { value: 4, label: "Week 4" },
      ],
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
  }, [
    filters.chartMode,
    filters.chartSelectedMonth,
    filters.databaseSelectedMonth,
  ]);
  // Filter update handlers
  const updateChartFilter = useCallback((mode, period) => {
    setFilters((prev) => ({
      ...prev,
      chartMode: mode,
      chartPeriod: period,
    }));
  }, []);

  const updateChartMonth = useCallback((month) => {
    setFilters((prev) => ({
      ...prev,
      chartSelectedMonth: month,
      chartPeriod: 1, // Reset to first week when month changes
    }));
  }, []);
  const updateDatabaseFilter = useCallback((period) => {
    setFilters((prev) => ({
      ...prev,
      databasePeriod: period,
    }));
  }, []);
  const updateDatabaseMonth = useCallback((month) => {
    setFilters((prev) => ({
      ...prev,
      databaseSelectedMonth: month,
      databasePeriod: 1, // Reset to first week when month changes
    }));
  }, []);

  // Habit event handlers
  const handleAddHabit = useCallback(
    async (habitData) => {
      console.log("Adding new habit:", habitData);
      const result = await createHabit(habitData);
      if (!result.success) {
        console.error("Failed to create habit:", result.error);
        // You could show a toast notification here
      }
    },
    [createHabit]
  );

  const handleDeleteHabit = useCallback(
    async (habitId) => {
      console.log("Deleting habit:", habitId);
      const result = await deleteHabit(habitId);
      if (!result.success) {
        console.error("Failed to delete habit:", result.error);
        // You could show a toast notification here
      }
    },
    [deleteHabit]
  );

  const handleEditHabit = useCallback(
    async (habitData) => {
      console.log("Editing habit:", habitData);
      const result = await updateHabit(habitData._id, habitData);
      if (!result.success) {
        console.error("Failed to update habit:", result.error);
        // You could show a toast notification here
      }
    },
    [updateHabit]
  );

  const handleToggleCompletion = useCallback(
    async (habitId, date) => {
      console.log("Toggling completion:", habitId, date);
      const result = await toggleHabitCompletion(habitId, date);
      if (!result.success) {
        console.error("Failed to toggle habit:", result.error);
        // You could show a toast notification here
      }
    },
    [toggleHabitCompletion]
  ); // Enhanced CSV Import handler
  const handleEnhancedCsvImport = useCallback((importedData) => {
    console.log("Enhanced CSV import completed:", importedData);
    // The enhanced import uses the HabitContext directly, so we just need to close the modal
    setShowEnhancedCsvImport(false);

    // Optionally show a success message or update UI
    if (importedData.habits.length > 0) {
      console.log(`Successfully imported ${importedData.habits.length} habits`);
    }
  }, []);

  // CSV Import handler (legacy)
  const handleCsvImport = useCallback((importedData) => {
    console.log("Importing CSV data:", importedData);
    // The CSV import should now use the store's dual-write system
    // which is handled in the CsvImportModal, so we just need to close the modal
    setShowCsvImport(false);
  }, []);

  // Throttled callbacks for better performance
  const handleLayoutChange = useCallback(
    throttle((layout, layouts) => {
      setLayouts(layouts);
    }, 100),
    []
  );

  const handleBreakpointChange = useCallback(
    throttle((breakpoint) => {
      setCurrentBreakpoint(breakpoint);
    }, 100),
    []
  );
  // Reset layouts to defaults
  const resetLayouts = useCallback(() => {
    const defaultLayouts = getDefaultLayouts();
    const defaultWidgets = getDefaultActiveWidgets();
    setLayouts(defaultLayouts);
    setActiveWidgets(defaultWidgets);
    setWidgetEditStates({});
  }, []); // Toggle individual widget edit mode
  const toggleWidgetEditMode = useCallback((widgetId) => {
    setWidgetEditStates((prev) => {
      const newState = !prev[widgetId];
      return {
        ...prev,
        [widgetId]: newState,
      };
    });
  }, []);

  // Check if widget is in edit mode (either individual or global)
  const isWidgetInEditMode = useCallback(
    (widgetId) => {
      return Boolean(globalEditMode || widgetEditStates[widgetId]);
    },
    [globalEditMode, widgetEditStates]
  );
  // Remove widget
  const removeWidget = useCallback((widgetId) => {
    setActiveWidgets((prev) => prev.filter((id) => id !== widgetId));

    // Remove from layouts
    setLayouts((prev) => {
      const newLayouts = {};
      Object.keys(prev).forEach((breakpoint) => {
        newLayouts[breakpoint] = prev[breakpoint].filter(
          (item) => item.i !== widgetId
        );
      });
      return newLayouts;
    });

    // Remove from edit states
    setWidgetEditStates((prev) => {
      const newStates = { ...prev };
      delete newStates[widgetId];
      return newStates;
    });
  }, []);

  // Add widget
  const addWidget = useCallback(
    (widgetType) => {
      const typeConfig = AVAILABLE_WIDGET_TYPES[widgetType];

      if (!typeConfig) return;

      // Check if widget is already active
      if (activeWidgets.includes(widgetType)) {
        console.log(`Widget ${widgetType} is already active`);
        setShowWidgetPicker(false);
        return;
      }

      // Add to active widgets
      setActiveWidgets((prev) => [...prev, widgetType]);

      // Add to layouts
      setLayouts((prev) => {
        const newLayouts = {};
        Object.keys(prev).forEach((breakpoint) => {
          const currentLayout = prev[breakpoint];

          // Find a good position for the new widget
          let newY = 0;
          if (currentLayout.length > 0) {
            newY = Math.max(...currentLayout.map((item) => item.y + item.h));
          }

          const newItem = {
            i: widgetType,
            x: 0,
            y: newY,
            w: typeConfig.defaultProps.w,
            h: typeConfig.defaultProps.h,
          };

          newLayouts[breakpoint] = [...currentLayout, newItem];
        });
        return newLayouts;
      });

      setShowWidgetPicker(false);
    },
    [activeWidgets]
  );

  // Calculate responsive props based on breakpoint and widget size
  const getWidgetProps = useCallback(
    (widgetKey, layout) => {
      const widgetLayout = layout.find((item) => item.i === widgetKey);
      if (!widgetLayout)
        return {
          breakpoint: currentBreakpoint,
          availableColumns: 6,
          availableRows: 4,
        };

      // Determine breakpoint based on widget size and current screen breakpoint
      let effectiveBreakpoint = currentBreakpoint;
      if (widgetLayout.w <= 3) effectiveBreakpoint = "xs";
      else if (widgetLayout.w <= 6) effectiveBreakpoint = "sm";
      else if (widgetLayout.w <= 8) effectiveBreakpoint = "md";

      return {
        breakpoint: effectiveBreakpoint,
        availableColumns: widgetLayout.w,
        availableRows: widgetLayout.h,
        size: {
          width: widgetLayout.w * 100, // Approximate pixel width
          height: widgetLayout.h * 60, // 60px row height
        },
      };
    },
    [currentBreakpoint]
  ); // Get filtered data based on current filters (now using backend entries)
  const filteredData = useMemo(() => {
    // For now, return a simple structure - we can enhance filtering later
    return {
      chartData: [], // Will be handled by useChartData hook in widgets
      databaseCompletions: entries, // Use backend entries directly
      chartRange: dateRange,
      databaseRange: dateRange,
      chartMode: "week",
      databaseMode: "week",
    };
  }, [habits, entries, filters, dateRange]);

  // Helper function to calculate daily completion data (now using filtered data)
  const calculateDailyCompletions = useCallback(() => {
    return filteredData.chartData;
  }, [filteredData.chartData]);

  // Memoized widget data to prevent unnecessary re-renders
  const widgetData = useMemo(
    () => ({
      "habits-overview": {
        title: "Daily Habits Completion",
        type: "area", // Changed from line to area to match weekly progress style
        data: calculateDailyCompletions(),
      },
      "weekly-progress": {
        title: "Weekly Progress Trend",
        type: "area",
        data: [
          { name: "Week 1", value: 75 },
          { name: "Week 2", value: 82 },
          { name: "Week 3", value: 78 },
          { name: "Week 4", value: 85 },
          { name: "Week 5", value: 89 },
          { name: "Week 6", value: 92 },
        ],
      },
      "habit-list": [
        { id: 1, name: "Morning Exercise", completed: true, streak: 15 },
        { id: 2, name: "Read 30 minutes", completed: true, streak: 8 },
        { id: 3, name: "Meditate", completed: false, streak: 5 },
        { id: 4, name: "Drink water", completed: true, streak: 22 },
        { id: 5, name: "Learn coding", completed: false, streak: 3 },
      ],
    }),
    [calculateDailyCompletions]
  );
  // Memoized widgets configuration for performance
  const widgets = useMemo(
    () => ({
      "habits-overview": {
        title: "Habits Overview",
        component: (layout) => {
          const props = getWidgetProps("habits-overview", layout);
          return (
            <Suspense
              fallback={<WidgetSkeleton title="Daily Habits Completion" />}
            >
              {" "}
              <ChartWidget
                title="Daily Habits Completion"
                type="line"
                chartType="completion"
                dateRange={dateRange}
                color="var(--color-brand-400)"
                filterComponent={
                  <ChartFilterControls
                    mode={filters.chartMode}
                    period={filters.chartPeriod}
                    selectedMonth={filters.chartSelectedMonth}
                    onModeChange={(mode) =>
                      updateChartFilter(mode, filters.chartPeriod)
                    }
                    onPeriodChange={(period) =>
                      updateChartFilter(filters.chartMode, period)
                    }
                    onMonthChange={updateChartMonth}
                    options={filterOptions}
                  />
                }
                {...props}
              />
            </Suspense>
          );
        },
      },
      "quick-actions": {
        title: "Quick Actions",
        component: (layout) => {
          const props = getWidgetProps("quick-actions", layout);
          return (
            <Suspense fallback={<WidgetSkeleton title="Quick Actions" />}>
              <QuickActionsWidget {...props} />
            </Suspense>
          );
        },
      },
      "weekly-progress": {
        title: "Weekly Progress",
        component: (layout) => {
          const props = getWidgetProps("weekly-progress", layout);
          return (
            <Suspense fallback={<WidgetSkeleton title="Weekly Progress" />}>
              {" "}
              <ChartWidget
                title="Weekly Habit Streaks"
                type="line"
                chartType="weekly"
                dateRange={dateRange}
                color="var(--color-brand-400)"
                {...props}
              />
            </Suspense>
          );
        },
      },
      "habit-list": {
        title: "My Habits",
        component: (layout) => {
          const props = getWidgetProps("habit-list", layout);
          return (
            <Suspense fallback={<WidgetSkeleton title="My Habits" />}>
              <DatabaseWidgetBridge
                habits={habits}
                completions={filteredData.databaseCompletions}
                onToggleCompletion={handleToggleCompletion}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
                onEditHabit={handleEditHabit}
                viewType="table"
                dateRange={filteredData.databaseRange}
                mode={filteredData.databaseMode}
                filterComponent={
                  <DatabaseFilterControls
                    period={filters.databasePeriod}
                    selectedMonth={filters.databaseSelectedMonth}
                    onPeriodChange={updateDatabaseFilter}
                    onMonthChange={updateDatabaseMonth}
                    options={filterOptions}
                  />
                }
                {...props}
              />
            </Suspense>
          );
        },
      },
    }),
    [
      currentBreakpoint,
      getWidgetProps,
      habits,
      entries,
      handleToggleCompletion,
      handleAddHabit,
      handleDeleteHabit,
      handleEditHabit,
      widgetData,
      filters,
      filteredData,
      updateChartFilter,
      updateChartMonth,
      updateDatabaseFilter,
      updateDatabaseMonth,
      filterOptions,
    ]
  );
  return (
    <div className="w-full h-full">
      {/* Enhanced Edit Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Breakpoint indicator */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] font-outfit">
            <span>View:</span>
            <span className="px-2 py-1 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)] rounded-md text-xs font-medium border border-[var(--color-brand-500)]/20">
              {currentBreakpoint.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Global edit mode toggle */}
          <label className="flex items-center gap-2 text-sm font-outfit text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={globalEditMode}
              onChange={(e) => setGlobalEditMode(e.target.checked)}
              className="w-4 h-4 rounded border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)] focus:ring-2 focus:ring-opacity-50"
            />
            <span>Edit All</span>
          </label>{" "}
          {/* Add widget button */}
          <button
            onClick={() => setShowWidgetPicker(!showWidgetPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm transition-all duration-200 font-outfit"
          >
            <PlusIcon className="w-4 h-4" />
            Add Widget
          </button>{" "}
          {/* Primary CSV Import button - Enhanced with AI */}
          {/* <button
            onClick={() => setShowEnhancedCsvImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg text-sm transition-all duration-200 font-outfit font-medium shadow-lg"
          >
            <span className="text-sm">🤖</span>
            Import CSV with AI
          </button> */}
          {/* LLM Settings button */}
          {/* <button
            onClick={() => setShowLLMSettings(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-all duration-200 font-outfit"
          >
            <span className="text-sm">⚙️</span>
            AI Settings
          </button> */}
          {/* Legacy CSV Import button - Secondary option */}
          {/* <button
            onClick={() => setShowCsvImport(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-xs transition-all duration-200 font-outfit opacity-75"
            title="Basic CSV import without AI assistance"
          >
            📄 Basic Import
          </button> */}
          {/* Reset layouts button */}
          {(globalEditMode ||
            Object.values(widgetEditStates).some(Boolean)) && (
            <button
              onClick={resetLayouts}
              className="px-3 py-1.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-sm transition-all duration-200 font-outfit border border-[var(--color-border-primary)]"
            >
              Reset Layout
            </button>
          )}
        </div>
      </div>{" "}
      <ResponsiveGridLayout
        ref={gridRef}
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={
          globalEditMode || Object.values(widgetEditStates).some(Boolean)
        }
        isResizable={
          globalEditMode || Object.values(widgetEditStates).some(Boolean)
        }
        margin={[20, 20]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        preventCollision={false}
        autoSize={true}
        compactType="vertical"
      >
        {activeWidgets
          .filter((widgetId) => widgets[widgetId])
          .map((widgetId) => {
            const widget = widgets[widgetId];
            if (!widget) return null;

            const currentLayout = layouts[currentBreakpoint] || [];
            const isInEditMode = isWidgetInEditMode(widgetId);
            return (
              <div
                key={widgetId}
                data-edit-mode={isInEditMode}
                className={`glass-card rounded-xl overflow-hidden transition-all duration-200 ${
                  isInEditMode
                    ? "hover:shadow-xl hover:border-[var(--color-brand-400)]/50 edit-mode"
                    : ""
                }`}
              >
                {" "}
                <div className="h-full flex flex-col">
                  {/* Widget header with controls */}
                  <div
                    className={`px-4 py-3 bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm border-b border-[var(--color-border-primary)]/30 ${
                      isInEditMode ? "cursor-move" : ""
                    }`}
                    onMouseDown={(e) => {
                      // Allow dragging only if clicking on the title area, not on buttons
                      const target = e.target;
                      const isButton = target.closest("button");
                      if (isButton) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {" "}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Drag handle indicator for edit mode */}
                        {isInEditMode && (
                          <div className="flex flex-col gap-0.5 cursor-move opacity-60 hover:opacity-100 transition-opacity">
                            <div className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full"></div>
                            <div className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full"></div>
                            <div className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full"></div>
                            <div className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full"></div>
                          </div>
                        )}

                        <h3
                          className={`font-semibold text-[var(--color-text-primary)] truncate font-dmSerif ${
                            getWidgetProps(widgetId, currentLayout)
                              .breakpoint === "xs"
                              ? "text-sm"
                              : "text-lg"
                          } ${isInEditMode ? "cursor-move" : ""}`}
                        >
                          {widget.title}
                        </h3>
                      </div>
                      <div
                        className="flex items-center gap-2 relative z-10 widget-header-buttons"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Individual edit mode toggle */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWidgetEditMode(widgetId);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className={`relative z-20 p-1.5 rounded-md transition-all duration-200 hover:bg-[var(--color-surface-hover)] ${
                            widgetEditStates[widgetId]
                              ? "text-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/30"
                              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                          }`}
                          style={{ pointerEvents: "auto" }}
                          title={
                            widgetEditStates[widgetId]
                              ? "Exit edit mode"
                              : "Edit this widget"
                          }
                        >
                          <Pencil1Icon className="w-4 h-4" />
                        </button>

                        {/* Remove widget button - only show in edit mode */}
                        {isInEditMode && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Are you sure you want to remove the "${widget.title}" widget?`
                                )
                              ) {
                                removeWidget(widgetId);
                              }
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="relative z-20 p-1.5 rounded-md transition-all duration-200  text-red-400  border border-red-400"
                            style={{ pointerEvents: "auto" }}
                            title="Remove this widget"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                        {/* Edit mode indicators */}
                        {isInEditMode && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                              Drag to move • Resize from corner
                            </span>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-[var(--color-brand-400)] rounded-full opacity-60"></div>
                              <div className="w-2 h-2 bg-[var(--color-success)] rounded-full opacity-60"></div>
                              <div className="w-2 h-2 bg-[var(--color-warning)] rounded-full opacity-60"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Widget content */}
                  <div className="flex-1 p-4 min-h-0 overflow-hidden">
                    {widget.component(currentLayout)}
                  </div>
                </div>
              </div>
            );
          })}
      </ResponsiveGridLayout>
      {/* Enhanced Widget Picker */}
      {showWidgetPicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowWidgetPicker(false)}
        >
          <div
            className="glass-card rounded-xl shadow-xl p-6 m-4 max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] font-dmSerif">
                Add New Widget
              </h3>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className="p-2 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(AVAILABLE_WIDGET_TYPES).map(([type, config]) => {
                const isActive = activeWidgets.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => addWidget(type)}
                    disabled={isActive}
                    className={`p-4 text-left border rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "border-[var(--color-success)] bg-[var(--color-success)]/10 cursor-not-allowed opacity-60"
                        : "border-[var(--color-border-primary)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-medium transition-colors ${
                              isActive
                                ? "text-[var(--color-success)]"
                                : "text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-500)]"
                            }`}
                          >
                            {config.title}
                          </h4>
                          {isActive && (
                            <span className="text-xs bg-[var(--color-success)] text-white px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-text-tertiary] mt-1">
                          {config.description}
                        </p>
                        <p className="text-xs text-[var(--color-text-quaternary)] mt-2">
                          Size: {config.defaultProps.w}×{config.defaultProps.h}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>{" "}
        </div>
      )}{" "}
      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onImport={handleCsvImport}
      />
      {/* Enhanced CSV Import Modal */}
      <EnhancedCsvImportModal
        isOpen={showEnhancedCsvImport}
        onClose={() => setShowEnhancedCsvImport(false)}
        onImportComplete={handleEnhancedCsvImport}
      />
      {/* LLM Settings Modal */}
      <LLMSettingsModal
        isOpen={showLLMSettings}
        onClose={() => setShowLLMSettings(false)}
      />
    </div>
  );
};

export default ContentGrid;
