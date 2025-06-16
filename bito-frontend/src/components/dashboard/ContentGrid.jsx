import React, { useState, useRef, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../widgets/widgets.css';
import { ChartWidget } from '../widgets/ChartWidget';
import { DatabaseWidget } from '../widgets/DatabaseWidget';
import { QuickActionsWidget } from '../widgets/QuickActionsWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const ContentGrid = () => {
  const gridRef = useRef(null);
  
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'habits-overview', x: 0, y: 0, w: 6, h: 4 },
      { i: 'quick-actions', x: 6, y: 0, w: 6, h: 4 },
      { i: 'weekly-progress', x: 0, y: 4, w: 8, h: 6 },
      { i: 'habit-list', x: 8, y: 4, w: 4, h: 6 },
    ],
    md: [
      { i: 'habits-overview', x: 0, y: 0, w: 6, h: 4 },
      { i: 'quick-actions', x: 6, y: 0, w: 6, h: 4 },
      { i: 'weekly-progress', x: 0, y: 4, w: 12, h: 6 },
      { i: 'habit-list', x: 0, y: 10, w: 12, h: 6 },
    ],
    sm: [
      { i: 'habits-overview', x: 0, y: 0, w: 12, h: 4 },
      { i: 'quick-actions', x: 0, y: 4, w: 12, h: 4 },
      { i: 'weekly-progress', x: 0, y: 8, w: 12, h: 6 },
      { i: 'habit-list', x: 0, y: 14, w: 12, h: 6 },
    ],
    xs: [
      { i: 'habits-overview', x: 0, y: 0, w: 4, h: 3 },
      { i: 'quick-actions', x: 0, y: 3, w: 4, h: 3 },
      { i: 'weekly-progress', x: 0, y: 6, w: 4, h: 4 },
      { i: 'habit-list', x: 0, y: 10, w: 4, h: 6 },
    ],
    xxs: [
      { i: 'habits-overview', x: 0, y: 0, w: 2, h: 3 },
      { i: 'quick-actions', x: 0, y: 3, w: 2, h: 3 },
      { i: 'weekly-progress', x: 0, y: 6, w: 2, h: 4 },
      { i: 'habit-list', x: 0, y: 10, w: 2, h: 6 },
    ],
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [isEditMode, setIsEditMode] = useState(false);

  const handleLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layouts);
  }, []);

  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  // Calculate responsive props based on breakpoint and widget size
  const getWidgetProps = useCallback((widgetKey, layout) => {
    const widgetLayout = layout.find(item => item.i === widgetKey);
    if (!widgetLayout) return { breakpoint: currentBreakpoint, availableColumns: 6, availableRows: 4 };

    // Determine breakpoint based on widget size and current screen breakpoint
    let effectiveBreakpoint = currentBreakpoint;
    if (widgetLayout.w <= 3) effectiveBreakpoint = 'xs';
    else if (widgetLayout.w <= 6) effectiveBreakpoint = 'sm';
    else if (widgetLayout.w <= 8) effectiveBreakpoint = 'md';

    return {
      breakpoint: effectiveBreakpoint,
      availableColumns: widgetLayout.w,
      availableRows: widgetLayout.h,
      size: { 
        width: widgetLayout.w * 100, // Approximate pixel width
        height: widgetLayout.h * 60   // 60px row height
      }
    };
  }, [currentBreakpoint]);

  const widgets = {
    'habits-overview': {
      title: 'Habits Overview',
      component: (layout) => {
        const props = getWidgetProps('habits-overview', layout);
        return (
          <ChartWidget 
            title="Daily Habits Completion" 
            type="bar"
            data={[
              { name: 'Mon', value: 85 },
              { name: 'Tue', value: 92 },
              { name: 'Wed', value: 78 },
              { name: 'Thu', value: 88 },
              { name: 'Fri', value: 95 },
              { name: 'Sat', value: 82 },
              { name: 'Sun', value: 90 }
            ]}
            {...props}
          />
        );
      }
    },
    'quick-actions': {
      title: 'Quick Actions',
      component: (layout) => {
        const props = getWidgetProps('quick-actions', layout);
        return <QuickActionsWidget {...props} />;
      }
    },
    'weekly-progress': {
      title: 'Weekly Progress',
      component: (layout) => {
        const props = getWidgetProps('weekly-progress', layout);
        return (
          <ChartWidget 
            title="Weekly Habit Streaks" 
            type="line"
            data={[
              { name: 'Week 1', value: 65 },
              { name: 'Week 2', value: 72 },
              { name: 'Week 3', value: 68 },
              { name: 'Week 4', value: 85 },
              { name: 'Week 5', value: 92 },
              { name: 'Week 6', value: 88 }
            ]}
            color="#8B5CF6"
            {...props}
          />
        );
      }
    },
    'habit-list': {
      title: 'My Habits',
      component: (layout) => {
        const props = getWidgetProps('habit-list', layout);
        return (
          <DatabaseWidget 
            title="Today's Habits"
            data={[
              { id: 1, habit: 'Morning Meditation', status: 'completed', streak: 12 },
              { id: 2, habit: 'Drink 8 glasses of water', status: 'in-progress', streak: 8 },
              { id: 3, habit: 'Read for 30 minutes', status: 'pending', streak: 15 },
              { id: 4, habit: 'Exercise', status: 'completed', streak: 5 },
              { id: 5, habit: 'Write in journal', status: 'pending', streak: 22 }
            ]}
            viewType="table"
            {...props}
          />
        );
      }
    }  };

  const resetLayouts = () => {
    setLayouts({
      lg: [
        { i: 'habits-overview', x: 0, y: 0, w: 6, h: 4 },
        { i: 'quick-actions', x: 6, y: 0, w: 6, h: 4 },
        { i: 'weekly-progress', x: 0, y: 4, w: 8, h: 6 },
        { i: 'habit-list', x: 8, y: 4, w: 4, h: 6 },
      ],
      md: [
        { i: 'habits-overview', x: 0, y: 0, w: 6, h: 4 },
        { i: 'quick-actions', x: 6, y: 0, w: 6, h: 4 },
        { i: 'weekly-progress', x: 0, y: 4, w: 12, h: 6 },
        { i: 'habit-list', x: 0, y: 10, w: 12, h: 6 },
      ],
      sm: [
        { i: 'habits-overview', x: 0, y: 0, w: 12, h: 4 },
        { i: 'quick-actions', x: 0, y: 4, w: 12, h: 4 },
        { i: 'weekly-progress', x: 0, y: 8, w: 12, h: 6 },
        { i: 'habit-list', x: 0, y: 14, w: 12, h: 6 },
      ],
      xs: [
        { i: 'habits-overview', x: 0, y: 0, w: 4, h: 3 },
        { i: 'quick-actions', x: 0, y: 3, w: 4, h: 3 },
        { i: 'weekly-progress', x: 0, y: 6, w: 4, h: 4 },
        { i: 'habit-list', x: 0, y: 10, w: 4, h: 6 },
      ],
      xxs: [
        { i: 'habits-overview', x: 0, y: 0, w: 2, h: 3 },
        { i: 'quick-actions', x: 0, y: 3, w: 2, h: 3 },
        { i: 'weekly-progress', x: 0, y: 6, w: 2, h: 4 },
        { i: 'habit-list', x: 0, y: 10, w: 2, h: 6 },
      ],
    });
  };

  return (
    <div className="w-full h-full p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Habit Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? 'Drag and resize widgets to customize your view' : 'Your personalized habit tracking dashboard'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Breakpoint indicator */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
            <span>View:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
              {currentBreakpoint.toUpperCase()}
            </span>
          </div>
          
          {/* Edit mode toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={(e) => setIsEditMode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span>Edit Mode</span>
          </label>
          
          {/* Reset layouts button */}
          {isEditMode && (
            <button
              onClick={resetLayouts}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              Reset Layout
            </button>
          )}
        </div>
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
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        preventCollision={false}
        autoSize={true}
      >
        {Object.entries(widgets).map(([key, widget]) => {
          const currentLayout = layouts[currentBreakpoint] || [];
          
          return (
            <div 
              key={key} 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 ${
                isEditMode ? 'hover:shadow-xl hover:border-blue-300' : ''
              }`}
            >
              <div className="h-full flex flex-col">
                {/* Widget header - responsive sizing */}
                <div className={`px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${
                  isEditMode ? 'cursor-move' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${
                      getWidgetProps(key, currentLayout).breakpoint === 'xs' ? 'text-sm' : 'text-lg'
                    }`}>
                      {widget.title}
                    </h3>
                    {isEditMode && (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
                        <div className="w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
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
      </ResponsiveGridLayout>

      {/* Widget adding palette - shown in edit mode */}
      {isEditMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
          <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Add Widgets</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              📊 Chart
            </button>
            <button className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
              📋 Habits
            </button>
            <button className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors">
              ⚡ Actions
            </button>
            <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors">
              📈 Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGrid;
