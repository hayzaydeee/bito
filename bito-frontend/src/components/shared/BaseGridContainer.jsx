import React, { useState, useRef, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { PlusIcon, Cross2Icon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Lazy load widgets like ContentGrid does
const ChartWidget = lazy(() =>
  import('../widgets/ChartWidget').then((module) => ({
    default: module.ChartWidget,
  }))
);

const DatabaseWidgetBridge = lazy(() =>
  import('../widgets/database/components/DatabaseWidgetBridge.jsx').then(
    (module) => ({
      default: module.DatabaseWidgetBridge,
    })
  )
);

const QuickActionsWidget = lazy(() => import('../widgets/QuickActionsWidget'));

// Widget skeleton
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

const BaseGridContainer = ({
  mode = 'dashboard', // 'dashboard' | 'analytics' | 'settings'
  
  // NEW PATTERN: Direct props like ContentGrid (for Dashboard)
  habits = [],
  entries = {},
  isLoading = false,
  
  // Handlers (NEW PATTERN)
  onToggleCompletion = () => {},
  onAddHabit = () => {},
  onDeleteHabit = () => {},
  onEditHabit = () => {},
  
  // Filter states and handlers (NEW PATTERN)
  chartFilters = {},
  databaseFilters = {},
  chartDateRange = null,
  databaseDateRange = null,
  filterOptions = {},
  updateChartFilter = () => {},
  updateChartMonth = () => {},
  updateDatabaseFilter = () => {},
  updateDatabaseMonth = () => {},
  
  // UI handlers (NEW PATTERN)
  onShowEnhancedCsvImport = () => {},
  onShowLLMSettings = () => {},
  
  // Filter components (NEW PATTERN)
  ChartFilterControls = null,
  DatabaseFilterControls = null,
  
  // OLD PATTERN: Widget factory props (for Analytics/Settings)
  widgets: prebuiltWidgets = null,
  
  // Configuration (BOTH PATTERNS)
  availableWidgets = {},
  defaultWidgets = [],
  defaultLayouts = {},
  storageKeys = {},
  className = '',
  
  // Read-only mode
  readOnly = false
}) => {
  
  // State management (same as ContentGrid)
  const [layouts, setLayouts] = useState(() => loadLayoutsFromStorage(storageKeys.layouts) || defaultLayouts);
  const [activeWidgets, setActiveWidgets] = useState(() => loadActiveWidgetsFromStorage(storageKeys.widgets) || defaultWidgets);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [widgetEditStates, setWidgetEditStates] = useState({});
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    if (storageKeys.layouts) {
      saveLayoutsToStorage(storageKeys.layouts, layouts);
    }
  }, [layouts, storageKeys.layouts]);

  useEffect(() => {
    if (storageKeys.widgets) {
      saveActiveWidgetsToStorage(storageKeys.widgets, activeWidgets);
    }
  }, [activeWidgets, storageKeys.widgets]);

  // Layout change handlers
  const handleLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layouts);
  }, []);

  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  // Calculate responsive props like ContentGrid
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

  // Widget management (same as ContentGrid)
  const addWidget = useCallback((widgetType) => {
    if (activeWidgets.includes(widgetType)) {
      setShowWidgetPicker(false);
      return;
    }

    const typeConfig = availableWidgets[widgetType];
    if (!typeConfig) return;

    setActiveWidgets(prev => [...prev, widgetType]);

    setLayouts(prev => {
      const newLayouts = {};
      Object.keys(prev).forEach(breakpoint => {
        const currentLayout = prev[breakpoint];
        let newY = 0;
        if (currentLayout.length > 0) {
          newY = Math.max(...currentLayout.map(item => item.y + item.h));
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
  }, [activeWidgets, availableWidgets]);

  const removeWidget = useCallback((widgetId) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
    setLayouts(prev => {
      const newLayouts = {};
      Object.keys(prev).forEach(breakpoint => {
        newLayouts[breakpoint] = prev[breakpoint].filter(item => item.i !== widgetId);
      });
      return newLayouts;
    });
    setWidgetEditStates(prev => {
      const newStates = { ...prev };
      delete newStates[widgetId];
      return newStates;
    });
  }, []);

  const toggleWidgetEditMode = useCallback((widgetId) => {
    setWidgetEditStates(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  }, []);

  const isWidgetInEditMode = useCallback((widgetId) => {
    return Boolean(globalEditMode || widgetEditStates[widgetId]);
  }, [globalEditMode, widgetEditStates]);

  const resetLayouts = useCallback(() => {
    setLayouts(defaultLayouts);
    setActiveWidgets(defaultWidgets);
    setWidgetEditStates({});
  }, [defaultLayouts, defaultWidgets]);

  // DETERMINE WHICH PATTERN TO USE
  const isNewPattern = mode === 'dashboard' && !prebuiltWidgets && habits !== undefined;

  // Create widgets - DUAL PATTERN SUPPORT
  const widgets = useMemo(() => {
    // OLD PATTERN: Use prebuilt widgets (for Analytics/Settings)
    if (prebuiltWidgets) {
      return prebuiltWidgets;
    }

    // NEW PATTERN: Build widgets like ContentGrid (for Dashboard)
    if (isNewPattern) {
      const result = {};
      
      result['habits-overview'] = {
        title: "Habits Overview",
        component: (layout) => {
          const props = getWidgetProps("habits-overview", layout);
          return (
            <Suspense fallback={<WidgetSkeleton title="Daily Habits Completion" />}>
              <ChartWidget
                title="Daily Habits Completion"
                type="line"
                chartType="completion"
                dateRange={chartDateRange}
                color="var(--color-brand-400)"
                habits={habits}
                entries={entries}
                onAddHabit={onAddHabit}
                readOnly={readOnly}
                filterComponent={
                  ChartFilterControls ? (
                    <ChartFilterControls
                      mode={chartFilters.mode}
                      period={chartFilters.period}
                      selectedMonth={chartFilters.selectedMonth}
                      onModeChange={(mode) => updateChartFilter(mode, 1)}
                      onPeriodChange={(period) => updateChartFilter(chartFilters.mode, period)}
                      onMonthChange={updateChartMonth}
                      options={filterOptions}
                    />
                  ) : null
                }
                {...props}
              />
            </Suspense>
          );
        },
      };

      result['quick-actions'] = {
        title: "Quick Actions",
        component: (layout) => {
          const props = getWidgetProps("quick-actions", layout);
          return (
            <Suspense fallback={<WidgetSkeleton title="Quick Actions" />}>
              <QuickActionsWidget 
                habits={habits}
                entries={entries}
                onAddHabit={onAddHabit}
                onToggleCompletion={onToggleCompletion}
                onShowCsvImport={onShowEnhancedCsvImport}
                onShowLLMSettings={onShowLLMSettings}
                readOnly={readOnly}
                {...props} 
              />
            </Suspense>
          );
        },
      };

      result['habit-list'] = {
        title: "My Habits",
        component: (layout) => {
          const props = getWidgetProps("habit-list", layout);
          const isInEditMode = isWidgetInEditMode("habit-list");
          return (
            <Suspense fallback={<WidgetSkeleton title="My Habits" />}>
              <DatabaseWidgetBridge
                habits={habits}
                completions={entries}
                entries={entries} // Pass entries for HabitGrid to avoid context usage
                onToggleCompletion={onToggleCompletion}
                onAddHabit={onAddHabit}
                onDeleteHabit={onDeleteHabit}
                onEditHabit={onEditHabit}
                viewType="table"
                persistenceKey={storageKeys?.databaseViewType || "dashboard_databaseViewType"}
                dateRange={databaseDateRange}
                mode="week"
                isInEditMode={isInEditMode}
                readOnly={readOnly}
                filterComponent={
                  DatabaseFilterControls ? (
                    <DatabaseFilterControls
                      period={databaseFilters.period}
                      selectedMonth={databaseFilters.selectedMonth}
                      onPeriodChange={updateDatabaseFilter}
                      onMonthChange={updateDatabaseMonth}
                      options={filterOptions}
                    />
                  ) : null
                }
                {...props}
              />
            </Suspense>
          );
        },
      };

      return result;
    }

    // FALLBACK: Empty widgets object
    return {};
  }, [
    prebuiltWidgets, 
    isNewPattern,
    mode, habits, entries, chartFilters, databaseFilters, chartDateRange, databaseDateRange,
    onToggleCompletion, onAddHabit, onDeleteHabit, onEditHabit, filterOptions,
    updateChartFilter, updateChartMonth, updateDatabaseFilter, updateDatabaseMonth,
    onShowEnhancedCsvImport, onShowLLMSettings, ChartFilterControls, DatabaseFilterControls,
    getWidgetProps, isWidgetInEditMode
  ]);

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Header Controls - Hide in read-only mode */}
      {!readOnly && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] font-outfit">
              <span>View:</span>
              <span className="px-2 py-1 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)] rounded-md text-xs font-medium border border-[var(--color-brand-500)]/20">
                {currentBreakpoint.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global edit mode toggle */}
            <label className="flex items-center gap-2 text-sm font-outfit text-[var(--color-text-secondary)]" data-tour="edit-mode-toggle">
              <input
                type="checkbox"
                checked={globalEditMode}
                onChange={(e) => setGlobalEditMode(e.target.checked)}
                className="w-4 h-4 rounded border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)] focus:ring-2 focus:ring-opacity-50"
              />
              <span>Edit All</span>
            </label>

            {/* Add widget button */}
            <button
              onClick={() => setShowWidgetPicker(!showWidgetPicker)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm transition-all duration-200 font-outfit"
              data-tour="add-widget-btn"
            >
              <PlusIcon className="w-4 h-4" />
              Add Widget
            </button>

            {/* Reset button */}
            {(globalEditMode || Object.values(widgetEditStates).some(Boolean)) && (
              <button
                onClick={resetLayouts}
                className="px-3 py-1.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-sm transition-all duration-200 font-outfit border border-[var(--color-border-primary)]"
              >
                Reset Layout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid Layout (same as ContentGrid) */}
      <ResponsiveGridLayout
        className={`layout ${globalEditMode ? 'resizable-mode edit-active' : ''}`}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={!readOnly && (globalEditMode || Object.values(widgetEditStates).some(Boolean))}
        isResizable={!readOnly && (globalEditMode || Object.values(widgetEditStates).some(Boolean))}
        dragHandleClassName="widget-drag-handle"
        margin={[20, 20]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        preventCollision={false}
        autoSize={true}
        compactType="vertical"
      >
        {activeWidgets
          .filter(widgetId => widgets[widgetId])
          .map(widgetId => {
            const widget = widgets[widgetId];
            const currentLayout = layouts[currentBreakpoint] || [];
            const isInEditMode = isWidgetInEditMode(widgetId);

            return (
              <div
                key={widgetId}
                data-edit-mode={isInEditMode}
                data-grid-widget={widgetId}
                className={`glass-card rounded-xl overflow-hidden transition-all duration-200 ${
                  isInEditMode ? 'hover:shadow-xl hover:border-[var(--color-brand-400)]/50 edit-mode' : ''
                }`}
              >
                <div className="h-full flex flex-col">
                  {/* Widget Header - Hide edit controls in read-only mode */}
                  <div className="px-4 py-3 bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm border-b border-[var(--color-border-primary)]/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {!readOnly && isInEditMode && (
                          <div className="widget-drag-handle flex flex-col gap-0.5 cursor-move opacity-60 hover:opacity-100 transition-opacity" title="Drag to move widget">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full"></div>
                            ))}
                          </div>
                        )}
                        <h3 className={`font-semibold text-[var(--color-text-primary)] truncate font-dmSerif text-lg ${
                          !readOnly && isInEditMode ? "cursor-move widget-drag-handle" : ""
                        }`} title={!readOnly && isInEditMode ? "Drag to move widget" : widget.title}>
                          {widget.title}
                        </h3>
                      </div>

                      {!readOnly && (
                        <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                          {/* Edit toggle */}
                          <button
                            onClick={() => toggleWidgetEditMode(widgetId)}
                            className={`p-1.5 rounded-md transition-all duration-200 hover:bg-[var(--color-surface-hover)] ${
                              widgetEditStates[widgetId]
                                ? 'text-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/30'
                                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                            }`}
                          >
                            <Pencil1Icon className="w-4 h-4" />
                          </button>

                          {/* Remove button */}
                          {isInEditMode && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Remove "${widget.title}" widget?`)) {
                                  removeWidget(widgetId);
                                }
                              }}
                              className="p-1.5 rounded-md transition-all duration-200 text-red-400 border border-red-400"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Widget Content */}
                  <div className="flex-1 p-4 min-h-0 overflow-hidden" onMouseDown={e => e.stopPropagation()}>
                    {widget.component(currentLayout)}
                  </div>
                </div>
              </div>
            );
          })}
      </ResponsiveGridLayout>

      {/* Widget Picker Modal - Hide in read-only mode */}
      {!readOnly && showWidgetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowWidgetPicker(false)}>
          <div className="glass-card rounded-xl shadow-xl p-6 m-4 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
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
              {Object.entries(availableWidgets)
                .filter(([type, config]) => !config.category || config.category === mode)
                .map(([type, config]) => {
                  const isActive = activeWidgets.includes(type);
                  const isComingSoon = type === 'group-challenges';
                  const isDisabled = isActive || isComingSoon;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => !isComingSoon && addWidget(type)}
                      disabled={isDisabled}
                      className={`p-4 text-left border rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'border-[var(--color-success)] bg-[var(--color-success)]/10 cursor-not-allowed opacity-60'
                          : isComingSoon
                          ? 'border-[var(--color-warning)] bg-[var(--color-warning)]/10 cursor-not-allowed opacity-75'
                          : 'border-[var(--color-border-primary)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium transition-colors ${
                              isActive 
                                ? 'text-[var(--color-success)]' 
                                : isComingSoon
                                ? 'text-[var(--color-warning)]'
                                : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-500)]'
                            }`}>
                              {config.title}
                            </h4>
                            {isActive && (
                              <span className="text-xs bg-[var(--color-success)] text-white px-2 py-1 rounded-full">
                                Active
                              </span>
                            )}
                            {isComingSoon && (
                              <span className="text-xs bg-[var(--color-warning)] text-white px-2 py-1 rounded-full">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                            {isComingSoon ? 'Group challenges feature is coming soon!' : config.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Storage utility functions (same as ContentGrid)
const saveLayoutsToStorage = (key, layouts) => {
  try {
    localStorage.setItem(key, JSON.stringify(layouts));
  } catch (error) {
    console.warn('Failed to save layouts:', error);
  }
};

const loadLayoutsFromStorage = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load layouts:', error);
    return null;
  }
};

const saveActiveWidgetsToStorage = (key, widgets) => {
  try {
    localStorage.setItem(key, JSON.stringify(widgets));
  } catch (error) {
    console.warn('Failed to save widgets:', error);
  }
};

const loadActiveWidgetsFromStorage = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load widgets:', error);
    return null;
  }
};

export default BaseGridContainer;
