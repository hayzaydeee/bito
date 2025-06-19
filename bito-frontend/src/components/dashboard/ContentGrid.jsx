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
import habitDataService, { filterState } from "../../services/habitDataService";
import {
  ChartFilterControls,
  DatabaseFilterControls,
} from "../ui/FilterControls";
import CsvImportModal from "../ui/CsvImportModal";

// Lazy load widgets for better performance
const ChartWidget = lazy(() =>
  import("../widgets/ChartWidget").then((module) => ({
    default: module.ChartWidget,
  }))
);
const DatabaseWidget = lazy(() =>
  import("../widgets/database/components/DatabaseWidget.jsx").then((module) => ({
    default: module.DatabaseWidget,
  }))
);
const QuickActionsWidget = lazy(() =>
  import("../widgets/QuickActionsWidget").then((module) => ({
    default: module.QuickActionsWidget,
  }))
);

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

  // Auto-save layouts and widgets to localStorage
  useEffect(() => {
    saveLayoutsToStorage(layouts);
  }, [layouts]);
  useEffect(() => {
    saveActiveWidgetsToStorage(activeWidgets);
  }, [activeWidgets]);
  // Filter state management
  const [filters, setFilters] = useState(() => filterState.loadFilters());

  // Initialize habit data with enhanced historical data
  const { habits: initialHabits, completions: initialCompletions } = useMemo(
    () => habitDataService.initialize(),
    []
  );

  // Habit data state management
  const [habits, setHabits] = useState(initialHabits);
  const [completions, setCompletions] = useState(initialCompletions);

  // Save filters when they change
  useEffect(() => {
    filterState.saveFilters(filters);
  }, [filters]);

  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Get filter options (dynamically based on selected months)
  const filterOptions = useMemo(() => {
    const chartMonth = filters.chartMode === 'week' ? filters.chartSelectedMonth : null;
    const dbMonth = filters.databaseSelectedMonth; // Database is always weekly
    
    // Use the appropriate month for generating options
    const monthForOptions = chartMonth || dbMonth || new Date().getMonth() + 1;
    return habitDataService.getFilterOptions(monthForOptions);
  }, [filters.chartMode, filters.chartSelectedMonth, filters.databaseSelectedMonth]);
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
  const handleToggleCompletion = useCallback((key, isCompleted) => {
    console.log(`Toggling completion for ${key}: ${isCompleted}`);

    // Handle both new date-based keys and old day-based keys
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    startOfWeek.setDate(today.getDate() - daysToSubtract);

    setCompletions((prev) => {
      const newCompletions = { ...prev };

      if (key.includes("-")) {
        // Parse the key to determine if it's day-based or date-based
        const parts = key.split("-");
        const lastPart = parts[parts.length - 1];
        const habitId = parseInt(lastPart);

        if (!isNaN(habitId)) {
          const keyWithoutId = parts.slice(0, -1).join("-");

          // Check if it's a date (YYYY-MM-DD format) or day name
          const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(keyWithoutId);

          if (isDateKey) {
            // It's a date-based key, also set the corresponding day-based key
            const date = new Date(keyWithoutId);
            const dayName = date.toLocaleDateString("en-US", {
              weekday: "long",
            });
            const dayKey = `${dayName}-${habitId}`;

            newCompletions[key] = isCompleted;
            newCompletions[dayKey] = isCompleted;
          } else {
            // It's a day-based key, also set the corresponding date-based key
            const dayName = keyWithoutId;
            const daysOfWeek = [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ];
            const dayIndex = daysOfWeek.indexOf(dayName);

            if (dayIndex >= 0) {
              const date = new Date(startOfWeek);
              date.setDate(startOfWeek.getDate() + dayIndex);
              const dateStr = date.toISOString().split("T")[0];
              const dateKey = `${dateStr}-${habitId}`;

              newCompletions[key] = isCompleted;
              newCompletions[dateKey] = isCompleted;
            } else {
              newCompletions[key] = isCompleted;
            }
          }
        } else {
          newCompletions[key] = isCompleted;
        }
      } else {
        newCompletions[key] = isCompleted;
      }

      return newCompletions;
    });
  }, []);

  const handleAddHabit = useCallback((habit) => {
    console.log("Adding new habit:", habit);
    setHabits((prev) => [...prev, habit]);
  }, []);

  const handleDeleteHabit = useCallback((habitId) => {
    console.log("Deleting habit:", habitId);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    // Also remove completions for this habit
    setCompletions((prev) => {
      const newCompletions = { ...prev };
      Object.keys(newCompletions).forEach((key) => {
        if (key.endsWith(`-${habitId}`)) {
          delete newCompletions[key];
        }
      });
      return newCompletions;
    });
  }, []);

  const handleEditHabit = useCallback((habit) => {
    console.log("Editing habit:", habit);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));
  }, []);

  // CSV Import handler
  const handleCsvImport = useCallback((importedData) => {
    console.log("Importing CSV data:", importedData);
    setHabits(importedData.habits);
    setCompletions(importedData.completions);
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
  ); // Get filtered data based on current filters
  const filteredData = useMemo(() => {
    return habitDataService.getFilteredData(habits, completions, filters);
  }, [habits, completions, filters]);

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
              <ChartWidget
                title="Daily Habits Completion"
                type="area"
                data={widgetData["habits-overview"].data}
                color="var(--color-brand-400)"                filterComponent={
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
              <ChartWidget
                title="Weekly Habit Streaks"
                type="area"
                data={widgetData["weekly-progress"].data}
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
          const props = getWidgetProps("habit-list", layout);          return (
            <DatabaseWidget
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
          );
        },
      },    }),
    [
      currentBreakpoint,
      getWidgetProps,
      habits,
      completions,
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
          </label>          {/* Add widget button */}
          <button
            onClick={() => setShowWidgetPicker(!showWidgetPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm transition-all duration-200 font-outfit"
          >
            <PlusIcon className="w-4 h-4" />
            Add Widget
          </button>

          {/* CSV Import button */}
          <button
            onClick={() => setShowCsvImport(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-all duration-200 font-outfit"
          >
            📄 Import CSV
          </button>

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
          </div>        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onImport={handleCsvImport}
        existingHabits={habits}
        existingCompletions={completions}
      />
    </div>
  );
};

export default ContentGrid;
