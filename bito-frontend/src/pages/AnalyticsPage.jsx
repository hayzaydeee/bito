import React, { useState, useMemo, useCallback } from 'react';
import { CalendarIcon, BarChartIcon, ArrowUpIcon, TargetIcon, ClockIcon } from '@radix-ui/react-icons';
import { useHabits } from '../contexts/HabitContext';
import BaseGridContainer from '../components/shared/BaseGridContainer';
import { WIDGET_TYPES, DEFAULT_WIDGETS, DEFAULT_LAYOUTS, STORAGE_KEYS } from '../components/shared/widgetRegistry';
import { createWidgetComponent } from '../components/shared/widgetFactory';

const AnalyticsPage = () => {
  const { habits, entries, isLoading } = useHabits();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Time range options
  const timeRangeOptions = [
    { value: '7d', label: '7 Days', icon: ClockIcon },
    { value: '30d', label: '30 Days', icon: CalendarIcon },
    { value: '90d', label: '90 Days', icon: BarChartIcon },
  ];

  // Widget dependencies for analytics
  const widgetDependencies = useMemo(() => ({
    habits,
    entries,
    isLoading,
    timeRange: selectedTimeRange,
    getWidgetProps: (widgetKey, layout) => {
      const widgetLayout = Array.isArray(layout) ? layout.find(item => item.i === widgetKey) : {};
      return {
        breakpoint: 'lg', // TODO: Make this dynamic based on actual breakpoint
        availableColumns: widgetLayout?.w || 6,
        availableRows: widgetLayout?.h || 4,
      };
    },
  }), [habits, entries, isLoading, selectedTimeRange]);

  // Create analytics widgets
  const widgets = useMemo(() => {
    const result = {};
    Object.keys(WIDGET_TYPES).forEach(widgetType => {
      if (WIDGET_TYPES[widgetType].category === 'analytics') {
        result[widgetType] = {
          title: WIDGET_TYPES[widgetType].title,
          component: createWidgetComponent(widgetType, WIDGET_TYPES[widgetType], widgetDependencies)
        };
      }
    });
    return result;
  }, [widgetDependencies]);

  if (isLoading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--color-surface-elevated)] rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-2">
              Analytics
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
              Track your progress and discover insights about your habits. 
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 sm:gap-2 mt-6 lg:mt-0">
            <span className="text-sm font-medium text-[var(--color-text-secondary)] font-outfit mr-2 hidden md:inline">
              Time Range:
            </span>
            <div className="flex items-center bg-[var(--color-surface-elevated)] rounded-lg sm:rounded-xl p-0.5 sm:p-1">
              {timeRangeOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeRange(option.value)}
                    className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg transition-all duration-200 font-outfit text-xs sm:text-sm ${
                      selectedTimeRange === option.value
                        ? 'bg-[var(--color-brand-600)] text-white shadow-md'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Start Guide for empty state */}
        {(!habits || habits.length === 0) && (
          <div className="mb-8 p-6 bg-gradient-to-r from-[var(--color-brand-500)]/10 to-[var(--color-brand-600)]/5 rounded-2xl border border-[var(--color-brand-400)]/20">
            <div className="flex items-start gap-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
                  Welcome to Your Analytics Dashboard!
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-3">
                  Start tracking habits to see beautiful analytics and insights. You can customize this dashboard by adding, removing, and rearranging widgets.
                </p>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
                  <span>💡 Try the "Edit All" toggle below to customize your layout</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Grid Container */}
        <BaseGridContainer
          mode="analytics"
          widgets={widgets}
          availableWidgets={WIDGET_TYPES}
          defaultWidgets={DEFAULT_WIDGETS.analytics}
          defaultLayouts={DEFAULT_LAYOUTS.analytics}
          storageKeys={STORAGE_KEYS.analytics}
          className="analytics-grid"
        />

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
            💡 <strong>Pro tip:</strong> Use "Edit All" to customize your analytics layout, or click the pencil icon on individual widgets to edit them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;