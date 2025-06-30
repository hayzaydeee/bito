import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { PlusIcon, Cross2Icon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const BaseGridContainer = ({
  mode = 'dashboard', // 'dashboard' | 'analytics'
  children,
  widgets,
  availableWidgets,
  defaultWidgets,
  defaultLayouts,
  storageKeys,
  onWidgetAction,
  className = ''
}) => {
  // State management
  const [layouts, setLayouts] = useState(() => loadLayoutsFromStorage(storageKeys.layouts) || defaultLayouts);
  const [activeWidgets, setActiveWidgets] = useState(() => loadActiveWidgetsFromStorage(storageKeys.widgets) || defaultWidgets);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [widgetEditStates, setWidgetEditStates] = useState({});
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Auto-save to localStorage
  useEffect(() => {
    saveLayoutsToStorage(storageKeys.layouts, layouts);
  }, [layouts, storageKeys.layouts]);

  useEffect(() => {
    saveActiveWidgetsToStorage(storageKeys.widgets, activeWidgets);
  }, [activeWidgets, storageKeys.widgets]);

  // Layout change handlers
  const handleLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layouts);
  }, []);

  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  // Widget management
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

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Header Controls */}
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
          <label className="flex items-center gap-2 text-sm font-outfit text-[var(--color-text-secondary)]">
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

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={globalEditMode || Object.values(widgetEditStates).some(Boolean)}
        isResizable={globalEditMode || Object.values(widgetEditStates).some(Boolean)}
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
                className={`glass-card rounded-xl overflow-hidden transition-all duration-200 ${
                  isInEditMode ? 'hover:shadow-xl hover:border-[var(--color-brand-400)]/50 edit-mode' : ''
                }`}
              >
                <div className="h-full flex flex-col">
                  {/* Widget Header */}
                  <div className="px-4 py-3 bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm border-b border-[var(--color-border-primary)]/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isInEditMode && (
                          <div className="flex flex-col gap-0.5 cursor-move opacity-60 hover:opacity-100 transition-opacity">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full"></div>
                            ))}
                          </div>
                        )}
                        <h3 className="font-semibold text-[var(--color-text-primary)] truncate font-dmSerif text-lg">
                          {widget.title}
                        </h3>
                      </div>

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

      {/* Enhanced Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowWidgetPicker(false)}>
          <div className="glass-card rounded-xl shadow-xl p-6 m-4 max-w-4xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] font-dmSerif">
                Add New Widget - {mode === 'analytics' ? 'Analytics' : 'Dashboard'}
              </h3>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className="p-2 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex mb-6 border-b border-[var(--color-border-primary)]">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  selectedCategory === 'all'
                    ? 'border-[var(--color-brand-500)] text-[var(--color-brand-500)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                All Widgets
              </button>
              {mode === 'analytics' && (
                <button
                  onClick={() => setSelectedCategory('analytics')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedCategory === 'analytics'
                      ? 'border-[var(--color-brand-500)] text-[var(--color-brand-500)]'
                      : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Analytics
                </button>
              )}
              {mode === 'dashboard' && (
                <button
                  onClick={() => setSelectedCategory('dashboard')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedCategory === 'dashboard'
                      ? 'border-[var(--color-brand-500)] text-[var(--color-brand-500)]'
                      : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Dashboard
                </button>
              )}
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(availableWidgets)
                .filter(([type, config]) => {
                  if (selectedCategory === 'all') return true;
                  return config.category === selectedCategory || config.category === mode;
                })
                .map(([type, config]) => {
                  const isActive = activeWidgets.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => addWidget(type)}
                      disabled={isActive}
                      className={`p-4 text-left border rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'border-[var(--color-success)] bg-[var(--color-success)]/10 cursor-not-allowed opacity-60'
                          : 'border-[var(--color-border-primary)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium transition-colors truncate ${
                              isActive ? 'text-[var(--color-success)]' : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-500)]'
                            }`}>
                              {config.title}
                            </h4>
                            {isActive && (
                              <span className="text-xs bg-[var(--color-success)] text-white px-2 py-1 rounded-full flex-shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--color-text-tertiary)] mb-2 line-clamp-2">
                            {config.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-[var(--color-text-quaternary)]">
                            <span>Size: {config.defaultProps.w}×{config.defaultProps.h}</span>
                            <span className="px-2 py-1 bg-[var(--color-surface-elevated)] rounded text-xs">
                              {config.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)] flex justify-between">
              <div className="text-sm text-[var(--color-text-tertiary)]">
                {activeWidgets.length} of {Object.keys(availableWidgets).filter(key => 
                  availableWidgets[key].category === mode
                ).length} widgets active
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Add all available widgets for current mode
                    const modeWidgets = Object.keys(availableWidgets).filter(key => 
                      availableWidgets[key].category === mode && !activeWidgets.includes(key)
                    );
                    modeWidgets.forEach(widgetType => addWidget(widgetType));
                  }}
                  className="text-sm px-3 py-1 bg-[var(--color-brand-500)] text-white rounded hover:bg-[var(--color-brand-600)] transition-colors"
                >
                  Add All
                </button>
                <button
                  onClick={() => setShowWidgetPicker(false)}
                  className="text-sm px-3 py-1 bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Storage utility functions
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