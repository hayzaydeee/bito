import React, { useState, useRef, useCallback, useMemo, lazy, Suspense, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../widgets/widgets.css";

// Lazy load widgets for better performance
const ChartWidget = lazy(() => import("../widgets/ChartWidget").then(module => ({ default: module.ChartWidget })));
const DatabaseWidget = lazy(() => import("../widgets/DatabaseWidget").then(module => ({ default: module.DatabaseWidget })));
const QuickActionsWidget = lazy(() => import("../widgets/QuickActionsWidget").then(module => ({ default: module.QuickActionsWidget })));

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

// Storage key for layouts
const LAYOUTS_STORAGE_KEY = "habitTracker_dashboardLayouts";

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
    // Optional: Show a brief notification that layouts were saved
    console.log("Dashboard layout saved");
  } catch (error) {
    console.warn("Failed to save layouts to localStorage:", error);
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
      
      Object.keys(defaultLayouts).forEach(breakpoint => {
        if (parsedLayouts[breakpoint] && Array.isArray(parsedLayouts[breakpoint])) {
          validatedLayouts[breakpoint] = parsedLayouts[breakpoint];
        } else {
          validatedLayouts[breakpoint] = defaultLayouts[breakpoint];
        }
      });
      
      console.log("Dashboard layout loaded from storage");
      return validatedLayouts;
    }
  } catch (error) {
    console.warn("Failed to load layouts from localStorage:", error);
  }
  console.log("Using default dashboard layout");
  return getDefaultLayouts();
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
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

const ContentGrid = () => {
  const gridRef = useRef(null);
  // Initialize layouts from localStorage or use defaults
  const [layouts, setLayouts] = useState(() => loadLayoutsFromStorage());
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [isEditMode, setIsEditMode] = useState(false);

  // Auto-save layouts to localStorage whenever they change
  useEffect(() => {
    saveLayoutsToStorage(layouts);
  }, [layouts]);
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
    setLayouts(defaultLayouts);
    // The useEffect will automatically save to localStorage
  }, []);

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
  );

  // Memoized widget data to prevent unnecessary re-renders
  const widgetData = useMemo(() => ({
    "habits-overview": {
      title: "Daily Habits Completion",
      type: "bar",
      data: [
        { name: "Mon", value: 85 },
        { name: "Tue", value: 92 },
        { name: "Wed", value: 78 },
        { name: "Thu", value: 88 },
        { name: "Fri", value: 94 },
        { name: "Sat", value: 76 },
        { name: "Sun", value: 89 },
      ]
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
      ]
    },
    "habit-list": [
      { id: 1, name: "Morning Exercise", completed: true, streak: 15 },
      { id: 2, name: "Read 30 minutes", completed: true, streak: 8 },
      { id: 3, name: "Meditate", completed: false, streak: 5 },
      { id: 4, name: "Drink water", completed: true, streak: 22 },
      { id: 5, name: "Learn coding", completed: false, streak: 3 },
    ]
  }), []);
  // Memoized widgets configuration for performance
  const widgets = useMemo(() => ({
    "habits-overview": {
      title: "Habits Overview",
      component: (layout) => {
        const props = getWidgetProps("habits-overview", layout);
        return (
          <Suspense fallback={<WidgetSkeleton title="Daily Habits Completion" />}>
            <ChartWidget
              title="Daily Habits Completion"
              type="bar"
              data={widgetData["habits-overview"].data}
              color="var(--color-brand-500)"
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
        const props = getWidgetProps("habit-list", layout);
        return (
          <DatabaseWidget
            title="Today's Habits"
            data={[
              {
                id: 1,
                habit: "Morning Meditation",
                status: "completed",
                streak: 12,
              },
              {
                id: 2,
                habit: "Drink 8 glasses of water",
                status: "in-progress",
                streak: 8,
              },
              {
                id: 3,
                habit: "Read for 30 minutes",
                status: "pending",
                streak: 15,
              },
              { id: 4, habit: "Exercise", status: "completed", streak: 5 },
              {
                id: 5,
                habit: "Write in journal",
                status: "pending",
                streak: 22,
              },
            ]}
            viewType="table"
            {...props}
          />
        );      },
    },
  }), [currentBreakpoint, getWidgetProps]);

  return (
    <div className="w-full h-full">
      {/* Edit Controls - More Compact and Theme-Consistent */}
      <div className="mb-6 flex items-center justify-end gap-3">
        {/* Breakpoint indicator */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] font-outfit">
          <span>View:</span>
          <span className="px-2 py-1 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)] rounded-md text-xs font-medium border border-[var(--color-brand-500)]/20">
            {currentBreakpoint.toUpperCase()}
          </span>
        </div>

        {/* Edit mode toggle */}
        <label className="flex items-center gap-2 text-sm font-outfit text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={isEditMode}
            onChange={(e) => setIsEditMode(e.target.checked)}
            className="w-4 h-4 rounded border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)] focus:ring-2 focus:ring-opacity-50"
          />
          <span>Edit Layout</span>
        </label>

        {/* Reset layouts button */}
        {isEditMode && (
          <button
            onClick={resetLayouts}
            className="px-3 py-1.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-sm transition-all duration-200 font-outfit border border-[var(--color-border-primary)]"
          >
            Reset Layout
          </button>
        )}
      </div>

      <ResponsiveGridLayout
        ref={gridRef}
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[20, 20]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        preventCollision={false}
        autoSize={true}
        compactType="vertical"
      >
        {Object.entries(widgets).map(([key, widget]) => {
          const currentLayout = layouts[currentBreakpoint] || [];

          return (
            <div
              key={key}
              className={`glass-card rounded-xl overflow-hidden transition-all duration-200 ${
                isEditMode ? "hover:shadow-xl hover:border-[var(--color-brand-400)]/50" : ""
              }`}
            >
              <div className="h-full flex flex-col">
                {/* Widget header - responsive sizing */}                <div
                  className={`px-4 py-3 bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm border-b border-[var(--color-border-primary)]/30 ${
                    isEditMode ? "cursor-move" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {" "}                    <h3
                      className={`font-semibold text-[var(--color-text-primary)] truncate font-dmSerif ${
                        getWidgetProps(key, currentLayout).breakpoint === "xs"
                          ? "text-sm"
                          : "text-lg"
                      }`}
                    >
                      {widget.title}
                    </h3>
                    {isEditMode && (                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[var(--color-brand-400)] rounded-full opacity-60"></div>
                        <div className="w-2 h-2 bg-[var(--color-success)] rounded-full opacity-60"></div>
                        <div className="w-2 h-2 bg-[var(--color-warning)] rounded-full opacity-60"></div>
                      </div>
                    )}
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
      </ResponsiveGridLayout>      {/* Widget adding palette - shown in edit mode */}
      {isEditMode && (
        <div className="font-outfit fixed bottom-4 left-1/2 transform -translate-x-1/2 glass-card rounded-xl shadow-xl p-4 z-50">
          <h3 className="text-sm font-medium mb-3 text-[var(--color-text-primary)] font-outfit">
            Add Widgets
          </h3>
          <div className="flex space-x-2">
            <button className="px-3 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm transition-all duration-200 font-outfit">
              📊 Chart
            </button>
            <button className="px-3 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white rounded-lg text-sm transition-all duration-200 font-outfit">
              📋 Habits
            </button>
            <button className="px-3 py-2 bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)] text-white rounded-lg text-sm transition-all duration-200 font-outfit">
              ⚡ Actions
            </button>
            <button className="px-3 py-2 bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80 text-white rounded-lg text-sm transition-all duration-200 font-outfit">
              📈 Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGrid;
