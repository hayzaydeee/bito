import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
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
import { useHabits, habitUtils } from "../../contexts/HabitContext";
import {
  ChartFilterControls,
  DatabaseFilterControls,
} from "../ui/FilterControls";
// Temporarily disabled for deployment
// import CsvImportModal from "../ui/CsvImportModal";
// import EnhancedCsvImportModal from "../ui/EnhancedCsvImportModal";
import LLMSettingsModal from "../ui/LLMSettingsModal";
import CustomHabitEditModal from "../ui/CustomHabitEditModal";

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
  "habit-list",
];

// Default layouts configuration (optimized for better content display)
const getDefaultLayouts = () => ({
  lg: [
    { i: "habits-overview", x: 0, y: 0, w: 8, h: 6, moved: false, static: false },
    { i: "quick-actions", x: 8, y: 0, w: 4, h: 5, moved: false, static: false },
    { i: "habit-list", x: 0, y: 6, w: 12, h: 10, moved: false, static: false },
  ],
  md: [
    { i: "habits-overview", x: 0, y: 0, w: 6, h: 4, moved: false, static: false },
    { i: "quick-actions", x: 6, y: 0, w: 6, h: 4, moved: false, static: false },
    { i: "habit-list", x: 0, y: 4, w: 12, h: 6, moved: false, static: false },
  ],
  sm: [
    { i: "habits-overview", x: 0, y: 0, w: 12, h: 4, moved: false, static: false },
    { i: "quick-actions", x: 0, y: 4, w: 12, h: 4, moved: false, static: false },
    { i: "habit-list", x: 0, y: 8, w: 12, h: 6, moved: false, static: false },
  ],
  xs: [
    { i: "habits-overview", x: 0, y: 0, w: 4, h: 3, moved: false, static: false },
    { i: "quick-actions", x: 0, y: 3, w: 4, h: 3, moved: false, static: false },
    { i: "habit-list", x: 0, y: 6, w: 4, h: 6, moved: false, static: false },
  ],
  xxs: [
    { i: "habits-overview", x: 0, y: 0, w: 2, h: 3, moved: false, static: false },
    { i: "quick-actions", x: 0, y: 3, w: 2, h: 3, moved: false, static: false },
    { i: "habit-list", x: 0, y: 6, w: 2, h: 6, moved: false, static: false },
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
  const navigate = useNavigate();
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
  
  // Habit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentHabit, setCurrentHabit] = useState(null);

  // Auto-save layouts and widgets to localStorage
  useEffect(() => {
    saveLayoutsToStorage(layouts);
  }, [layouts]);
  useEffect(() => {
    saveActiveWidgetsToStorage(activeWidgets);
  }, [activeWidgets]);

  // Independent filter state management for each widget
  const [chartFilters, setChartFilters] = useState(() => {
    const getCurrentWeekNumber = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Get first day of current month
      const monthStart = new Date(currentYear, currentMonth, 1);

      // Get the Monday of the week containing the first day of month
      const firstWeekStart = habitUtils.getWeekStart(monthStart);

      // Get the Monday of the week containing today
      const currentWeekStart = habitUtils.getWeekStart(today);

      // Calculate week number by comparing week starts
      const weekDiff = Math.floor(
        (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
      );

      // Week numbers start from 1
      return weekDiff + 1;
    };

    const currentMonth = new Date().getMonth() + 1; // 1-12 range for UI consistency
    const currentWeekNumber = getCurrentWeekNumber();

    return {
      mode: "week",
      period: currentWeekNumber, // Default to current week
      selectedMonth: currentMonth,
    };
  });

  const [databaseFilters, setDatabaseFilters] = useState(() => {
    const getCurrentWeekNumber = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Get first day of current month
      const monthStart = new Date(currentYear, currentMonth, 1);

      // Get the Monday of the week containing the first day of month
      const firstWeekStart = habitUtils.getWeekStart(monthStart);

      // Get the Monday of the week containing today
      const currentWeekStart = habitUtils.getWeekStart(today);

      // Calculate week number by comparing week starts
      const weekDiff = Math.floor(
        (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
      );

      // Week numbers start from 1
      return weekDiff + 1;
    };

    const currentMonth = new Date().getMonth() + 1; // 1-12 range for UI consistency
    const currentWeekNumber = getCurrentWeekNumber();

    return {
      mode: "week",
      period: currentWeekNumber, // Default to current week
      selectedMonth: currentMonth,
    };
  });

  // Helper function to get the current week number within a month
  const getCurrentWeekNumber = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get first day of current month
    const monthStart = new Date(currentYear, currentMonth, 1);

    // Get the Monday of the week containing the first day of month
    const firstWeekStart = habitUtils.getWeekStart(monthStart);

    // Get the Monday of the week containing today
    const currentWeekStart = habitUtils.getWeekStart(today);

    // Calculate week number by comparing week starts
    const weekDiff = Math.floor(
      (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
    );

    // Week numbers start from 1
    return weekDiff + 1;
  }, []);

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

  // Helper function to get date range from filters using HabitContext's calculations (fixed timezone)
  const getDateRangeFromFilters = useCallback((filterObj) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (filterObj.chartMode === "week") {
      // Use proper calendar weeks with local time (fixed timezone issues)
      const selectedMonth = filterObj.chartSelectedMonth - 1; // Convert to 0-11 range
      const weekPeriod = filterObj.chartPeriod || 1;

      // Get first day of selected month
      const monthStart = new Date(currentYear, selectedMonth, 1);

      // Get the Monday of the week containing the first day of month
      const firstWeekStart = habitUtils.getWeekStart(monthStart);

      // Calculate the specific week start (0-based, so subtract 1)
      const weekStart = new Date(firstWeekStart);
      weekStart.setDate(firstWeekStart.getDate() + (weekPeriod - 1) * 7);

      // Week end is 6 days after week start
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return {
        start: weekStart,
        end: weekEnd,
      };
    } else if (filterObj.chartMode === "month") {
      // For month mode, use the selected month
      const selectedMonth = filterObj.chartSelectedMonth - 1; // Convert to 0-11 range
      const startOfMonth = new Date(currentYear, selectedMonth, 1);
      const endOfMonth = new Date(currentYear, selectedMonth + 1, 0);
      return {
        start: startOfMonth,
        end: endOfMonth,
      };
    } else {
      // Continuous/all time mode - get a 90-day range
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 89);
      return {
        start: startDate,
        end: endDate,
      };
    }
  }, []);

  // Calculate chart-specific date range (only for chart widgets)
  const chartDateRange = useMemo(() => {
    const filterObj = {
      chartMode: chartFilters.mode,
      chartPeriod: chartFilters.period,
      chartSelectedMonth: chartFilters.selectedMonth,
    };
    const range = getDateRangeFromFilters(filterObj);
    return range;
  }, [chartFilters, getDateRangeFromFilters]);

  // Calculate database-specific date range (only for database widgets)
  const databaseDateRange = useMemo(() => {
    const filterObj = {
      chartMode: "week", // Database is always weekly
      chartPeriod: databaseFilters.period,
      chartSelectedMonth: databaseFilters.selectedMonth,
    };
    const range = getDateRangeFromFilters(filterObj);
    return range;
  }, [databaseFilters, getDateRangeFromFilters]);

  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Get filter options - generate proper calendar weeks
  const filterOptions = useMemo(() => {
    // Generate weeks for the selected chart month using HabitContext logic
    const getWeeksForMonth = (month) => {
      const year = new Date().getFullYear();
      const weeks = [];

      // Get first day of selected month
      const monthStart = new Date(year, month - 1, 1); // month is 1-based
      const monthEnd = new Date(year, month, 0);

      // Start from the Monday of the week containing the first day of month
      let currentWeekStart = habitUtils.getWeekStart(monthStart);
      let weekNumber = 1;

      // Generate weeks that overlap with this month
      while (currentWeekStart <= monthEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);

        // Format dates as DD/MM
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

        // Move to next week
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

  // Filter update handlers
  const updateChartFilter = useCallback((mode, period) => {
    setChartFilters((prev) => {
      // When mode changes, reset period to 1 to ensure validity
      const newPeriod = mode !== prev.mode ? 1 : period;
      return {
        ...prev,
        mode: mode,
        period: newPeriod,
      };
    });
  }, []);

  const updateChartMonth = useCallback((month) => {
    setChartFilters((prev) => {
      // Calculate which week of the new month contains the current date
      const getCurrentWeekInMonth = (targetMonth) => {
        const today = new Date();
        const currentYear = today.getFullYear();

        // Check if the target month contains today
        if (targetMonth - 1 === today.getMonth()) {
          // Calculate current week number for current month
          const monthStart = new Date(currentYear, targetMonth - 1, 1);
          const firstWeekStart = habitUtils.getWeekStart(monthStart);
          const currentWeekStart = habitUtils.getWeekStart(today);
          const weekDiff = Math.floor(
            (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
          );
          return weekDiff + 1;
        } else {
          // For other months, default to first week
          return 1;
        }
      };

      const newPeriod = getCurrentWeekInMonth(month);

      return {
        ...prev,
        selectedMonth: month,
        period: newPeriod,
      };
    });
  }, []);

  const updateDatabaseFilter = useCallback((period) => {
    setDatabaseFilters((prev) => ({
      ...prev,
      period: period,
    }));
  }, []);

  const updateDatabaseMonth = useCallback((month) => {
    setDatabaseFilters((prev) => {
      // Calculate which week of the new month contains the current date
      const getCurrentWeekInMonth = (targetMonth) => {
        const today = new Date();
        const currentYear = today.getFullYear();

        // Check if the target month contains today
        if (targetMonth - 1 === today.getMonth()) {
          // Calculate current week number for current month
          const monthStart = new Date(currentYear, targetMonth - 1, 1);
          const firstWeekStart = habitUtils.getWeekStart(monthStart);
          const currentWeekStart = habitUtils.getWeekStart(today);
          const weekDiff = Math.floor(
            (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
          );
          return weekDiff + 1;
        } else {
          // For other months, default to first week
          return 1;
        }
      };

      const newPeriod = getCurrentWeekInMonth(month);

      return {
        ...prev,
        selectedMonth: month,
        period: newPeriod,
      };
    });
  }, []);

  useEffect(() => {
    const handleAddHabitEvent = () => {
      // Navigate to habits page where user can create habits
      navigate('/app/habits');
    };

    const handleQuickActionsEvent = () => {
      // Could show a quick actions modal or navigate to habits page
      // For now, let's also navigate to habits page as a useful action
      navigate('/app/habits');
    };

    window.addEventListener("openAddHabitModal", handleAddHabitEvent);
    window.addEventListener("openQuickActions", handleQuickActionsEvent);

    return () => {
      window.removeEventListener("openAddHabitModal", handleAddHabitEvent);
      window.removeEventListener("openQuickActions", handleQuickActionsEvent);
    };
  }, []);

  // Habit event handlers
  const handleAddHabit = useCallback(() => {
    setCurrentHabit(null);
    setEditModalOpen(true);
  }, []);

  const handleCloseHabitModal = useCallback(() => {
    setEditModalOpen(false);
    setCurrentHabit(null);
  }, []);

  const handleDeleteHabit = useCallback(
    async (habitId) => {
      const result = await deleteHabit(habitId);
      if (!result.success) {
        console.error("Failed to delete habit:", result.error);
        // You could show a toast notification here
      }
    },
    [deleteHabit]
  );

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

  const handleToggleCompletion = useCallback(
    async (habitId, date) => {
      const result = await toggleHabitCompletion(habitId, date);
      if (!result.success) {
        console.error("Failed to toggle habit:", result.error);
        // You could show a toast notification here
      }
    },
    [toggleHabitCompletion]
  ); // Enhanced CSV Import handler
  const handleEnhancedCsvImport = useCallback((importedData) => {
    // The enhanced import uses the HabitContext directly, so we just need to close the modal
    setShowEnhancedCsvImport(false);

    // Optionally show a success message or update UI
    if (importedData.habits.length > 0) {
      // Could show a toast notification here
    }
  }, []);

  // CSV Import handler (legacy)
  const handleCsvImport = useCallback((importedData) => {
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
  ); // Remove shared filteredData - each widget will manage its own data

  // Remove helper function - each widget will calculate its own data

  // Remove shared widgetData - each widget will manage its own data independently

  // Independent chart widgets (habits-overview)
  const chartWidgets = useMemo(
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
                type="line"
                chartType="completion"
                dateRange={chartDateRange}
                color="var(--color-brand-400)"
                onAddHabit={handleAddHabit}
                filterComponent={
                  <ChartFilterControls
                    mode={chartFilters.mode}
                    period={chartFilters.period}
                    selectedMonth={chartFilters.selectedMonth}
                    onModeChange={
                      (mode) => updateChartFilter(mode, 1) // Reset to first period when mode changes
                    }
                    onPeriodChange={(period) =>
                      updateChartFilter(chartFilters.mode, period)
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
    }),
    [
      chartFilters,
      chartDateRange,
      updateChartFilter,
      updateChartMonth,
      getWidgetProps,
      filterOptions,
    ]
  );

  // Independent quick actions widget
  const quickActionsWidget = useMemo(
    () => ({
      "quick-actions": {
        title: "Quick Actions",
        component: (layout) => {
          const props = getWidgetProps("quick-actions", layout);
          return (
            <Suspense fallback={<WidgetSkeleton title="Quick Actions" />}>
              <QuickActionsWidget 
                habits={habits}
                entries={entries}
                onAddHabit={handleAddHabit}
                onToggleCompletion={handleToggleCompletion}
                onShowCsvImport={() => {}} // Disabled for deployment
                onShowLLMSettings={() => setShowLLMSettings(true)}
                {...props} 
              />
            </Suspense>
          );
        },
      },
    }),
    [getWidgetProps, habits, entries, handleAddHabit, handleToggleCompletion]
  );

  // Independent database widget (habit-list)
  const databaseWidget = useMemo(
    () => ({
      "habit-list": {
        title: "My Habits",
        component: (layout) => {
          const props = getWidgetProps("habit-list", layout);
          const isInEditMode = isWidgetInEditMode("habit-list");
          return (
            <Suspense fallback={<WidgetSkeleton title="My Habits" />}>
              <DatabaseWidgetBridge
                habits={habits}
                completions={entries} // Use raw entries, let the widget filter them
                onToggleCompletion={handleToggleCompletion}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
                onEditHabit={handleEditHabit}
                viewType="table"
                persistenceKey="contentGrid_databaseViewType"
                dateRange={databaseDateRange}
                mode="week" // Database is always weekly
                isInEditMode={isInEditMode}
                filterComponent={
                  <DatabaseFilterControls
                    period={databaseFilters.period}
                    selectedMonth={databaseFilters.selectedMonth}
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
      databaseFilters,
      databaseDateRange,
      habits,
      entries,
      handleToggleCompletion,
      handleAddHabit,
      handleDeleteHabit,
      handleEditHabit,
      updateDatabaseFilter,
      updateDatabaseMonth,
      getWidgetProps,
      filterOptions,
    ]
  );

  // Combine all widgets into a single object for rendering
  const widgets = useMemo(
    () => ({
      ...chartWidgets,
      ...quickActionsWidget,
      ...databaseWidget,
    }),
    [chartWidgets, quickActionsWidget, databaseWidget]
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
              id="global-edit-mode"
              name="globalEditMode"
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
        dragHandleClassName="widget-drag-handle"
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
                    className={`px-4 py-3 bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm border-b border-[var(--color-border-primary)]/30`}
                  >
                    {" "}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Drag handle indicator for edit mode - ONLY this should be draggable */}
                        {isInEditMode && (
                          <div 
                            className="widget-drag-handle flex flex-col gap-0.5 cursor-move opacity-60 hover:opacity-100 transition-opacity"
                            title="Drag to move widget"
                          >
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
                          } ${isInEditMode ? "cursor-move widget-drag-handle" : ""}`}
                          title={isInEditMode ? "Drag to move widget" : widget.title}
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
                  <div 
                    className="flex-1 p-4 min-h-0 overflow-hidden"
                    onMouseDown={(e) => {
                      // Prevent widget dragging from content area to allow internal DnD
                      e.stopPropagation();
                    }}
                  >
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
      {/* CSV Import Modal - Temporarily disabled for deployment */}
      {/* <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onImport={handleCsvImport}
      /> */}
      {/* Enhanced CSV Import Modal - Temporarily disabled for deployment */}
      {/* <EnhancedCsvImportModal
        isOpen={showEnhancedCsvImport}
        onClose={() => setShowEnhancedCsvImport(false)}
        onImportComplete={handleEnhancedCsvImport}
      /> */}
      {/* LLM Settings Modal */}
      <LLMSettingsModal
        isOpen={showLLMSettings}
        onClose={() => setShowLLMSettings(false)}
      />
      {/* Habit Edit/Create Modal */}
      <CustomHabitEditModal
        isOpen={editModalOpen}
        onClose={handleCloseHabitModal}
        habit={currentHabit}
        onSave={handleSaveHabit}
      />
    </div>
  );
};

export default ContentGrid;
