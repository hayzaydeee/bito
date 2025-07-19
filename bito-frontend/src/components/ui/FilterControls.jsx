import React from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { habitUtils } from '@utils/habitLogic';

/**
 * Filter Dropdown Component
 * Reusable dropdown for filtering widgets
 */
export const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  className = "",
  size = "sm",
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs text-[var(--color-text-tertiary)] font-outfit whitespace-nowrap">
          {label}:
        </span>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            ${sizeClasses[size]}
            bg-[var(--color-surface-elevated)] 
            border border-[var(--color-border-primary)] 
            rounded-md 
            text-[var(--color-text-primary)] 
            font-outfit 
            appearance-none 
            cursor-pointer
            focus:outline-none 
            focus:ring-2 
            focus:ring-[var(--color-brand-500)] 
            focus:ring-opacity-50
            hover:bg-[var(--color-surface-hover)]
            transition-all duration-200
            pr-8
          `}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[var(--color-text-tertiary)] pointer-events-none" />
      </div>
    </div>
  );
};

/**
 * Chart Filter Controls
 * Filter controls specifically for chart widgets
 */
export const ChartFilterControls = ({
  mode,
  period,
  selectedMonth = new Date().getMonth() + 1,
  onModeChange,
  onPeriodChange,
  onMonthChange,
  options,
}) => {
  const getPeriodOptions = () => {
    switch (mode) {
      case "week":
        return options.weeks || [];
      case "month":
        return options.months;
      case "continuous":
        return [{ value: "all", label: "All Time" }];
      default:
        return [];
    }
  };

  const periodOptions = getPeriodOptions();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <FilterDropdown
        label="View"
        value={mode}
        options={options.chartModes}
        onChange={onModeChange}
        size="sm"
      />

      {(mode === "week" || mode === "month") && (
        <FilterDropdown
          label="Month"
          value={selectedMonth}
          options={options.months}
          onChange={(value) => onMonthChange(parseInt(value))}
          size="sm"
        />
      )}

      {mode === "week" && periodOptions.length > 0 && (
        <FilterDropdown
          label="Week"
          value={period}
          options={periodOptions}
          onChange={(value) => onPeriodChange(parseInt(value))}
          size="sm"
        />
      )}
    </div>
  );
};

/**
 * Database Filter Controls
 * Filter controls specifically for database widgets (weekly view only)
 */
export const DatabaseFilterControls = ({ 
  period, 
  selectedMonth = new Date().getMonth() + 1,
  onPeriodChange,
  onMonthChange,
  options 
}) => {
  // Generate calendar weeks using HabitContext's logic (fixed timezone issues)
  const getCalendarWeeksForMonth = () => {
    if (selectedMonth) {
      const year = new Date().getFullYear();
      const weeks = [];
      
      // Get first day of selected month
      const monthStart = new Date(year, selectedMonth - 1, 1);
      const monthEnd = new Date(year, selectedMonth, 0);
      
      // Start from the Monday of the week containing the first day of month
      let currentWeekStart = habitUtils.getWeekStart(monthStart);
      let weekNumber = 1;
      
      // Generate weeks that overlap with this month
      while (currentWeekStart <= monthEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        // Format dates as DD/MM
        const formatDate = (date) => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${day}/${month}`;
        };
        
        const startStr = formatDate(currentWeekStart);
        const endStr = formatDate(weekEnd);
        
        weeks.push({
          value: weekNumber,
          label: `Week ${weekNumber} (${startStr} - ${endStr})`,
          start: new Date(currentWeekStart),
          end: new Date(weekEnd)
        });
        
        // Move to next week
        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNumber++;
      }
      
      return weeks;
    }
    return [];
  };

  const weekOptions = getCalendarWeeksForMonth();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <FilterDropdown
        label="Month"
        value={selectedMonth}
        options={options.months}
        onChange={(value) => onMonthChange(parseInt(value))}
        size="sm"
      />

      {weekOptions.length > 0 && (
        <FilterDropdown
          label="Week"
          value={period}
          options={weekOptions}
          onChange={(value) => onPeriodChange(parseInt(value))}
          size="sm"
        />
      )}
    </div>
  );
};

/**
 * Widget Header with Filters
 * Enhanced widget header that includes filter controls
 */
export const WidgetHeaderWithFilters = ({
  title,
  filterComponent,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-between mb-4 flex-shrink-0 ${className}`}
    >
      <h4 className="font-medium text-[var(--color-text-secondary)] font-dmSerif text-sm truncate">
        {title}
      </h4>

      {filterComponent && (
        <div className="flex-shrink-0 ml-2">{filterComponent}</div>
      )}
    </div>
  );
};
