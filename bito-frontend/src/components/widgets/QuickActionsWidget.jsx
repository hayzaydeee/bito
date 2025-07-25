import React, { useMemo, memo, useCallback, useState, useEffect } from "react";
import {
  PlusIcon,
  GearIcon,
  ResetIcon,
  CheckIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { EmptyStateWithAddHabit } from "../dbComponents/EmptyStateWithAddHabit";
import { habitUtils } from "../../utils/habitLogic.js";

const QuickActionsWidget = memo(
  ({
    breakpoint = "lg",
    availableColumns = 4,
    availableRows = 2,
    widgetConfig = {},
    habits = [],
    onAddHabit,
    onToggleCompletion,
    onShowCsvImport,
    entries = {}, // Add entries to get completion status
  }) => {
    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
    // Action handlers
    const handleAddHabit = useCallback(() => {
      if (onAddHabit) {
        onAddHabit();
      }
    }, [onAddHabit]);

    const handleQuickComplete = useCallback(() => {
      const today = new Date().toISOString().split("T")[0];
      // Only complete habits that are scheduled for today
      const todaysHabits = habitUtils.getTodaysHabits(habits);
      
      todaysHabits.forEach((habit) => {
        const habitEntries = entries[habit._id];
        const todayEntry = habitEntries && habitEntries[today];
        const isCompleted = todayEntry && todayEntry.completed;

        // Only toggle if not already completed
        if (!isCompleted && onToggleCompletion) {
          onToggleCompletion(habit._id, today);
        }
      });
    }, [habits, entries, onToggleCompletion]);

    const handleCsvImport = useCallback(() => {
      if (onShowCsvImport) {
        onShowCsvImport();
      }
    }, [onShowCsvImport]);

    const handleResetDay = useCallback(() => {
      const today = new Date().toISOString().split("T")[0];
      // Only reset habits that are scheduled for today and currently completed
      const todaysHabits = habitUtils.getTodaysHabits(habits);
      
      todaysHabits.forEach((habit) => {
        const habitEntries = entries[habit._id];
        const todayEntry = habitEntries && habitEntries[today];
        const isCompleted = todayEntry && todayEntry.completed;

        // Only toggle if currently completed
        if (isCompleted && onToggleCompletion) {
          onToggleCompletion(habit._id, today);
        }
      });
    }, [habits, entries, onToggleCompletion]);

    const defaultActions = [
      {
        id: "add-habit",
        label: "Add Habit",
        icon: <PlusIcon />,
        color: "bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)]",
        action: handleAddHabit,
      },
      {
        id: "quick-complete",
        label: "Complete All",
        icon: <CheckIcon />,
        color: "bg-[var(--color-success)] hover:bg-[var(--color-success)]/80",
        action: handleQuickComplete,
      },
      {
        id: "csv-import",
        label: "Import Data",
        subtitle: "Coming Soon",
        icon: <UploadIcon />,
        color: "bg-gray-400 cursor-not-allowed",
        action: () => {},
      },
      {
        id: "reset-day",
        label: "Reset Day",
        icon: <ResetIcon />,
        color: "bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80",
        action: handleResetDay,
      },
    ];

    const actions = widgetConfig.actions || defaultActions;

    // Calculate optimal button layout based on available space
    const buttonLayout = useMemo(() => {
      const totalButtons = actions.length;

      // Mobile-first approach
      if (isMobile || breakpoint === "xs") {
        return {
          columns: 1,
          rows: Math.min(totalButtons, availableRows),
          buttonSize: "medium", // Changed from large to medium for better fit
          showLabels: true,
          showProgress: false,
        };
      }

      if (breakpoint === "sm") {
        return {
          columns: 2,
          rows: Math.ceil(totalButtons / 2),
          buttonSize: "medium",
          showLabels: true,
          showProgress: availableRows > 3,
        };
      }

      // For md, lg, xl - use optimal columns for buttons
      const maxCols = Math.floor(availableColumns);
      const maxRows = Math.floor(availableRows);
      const preferredCols =
        totalButtons <= 3 ? totalButtons : Math.min(3, maxCols);

      return {
        columns: preferredCols,
        rows: Math.ceil(totalButtons / preferredCols),
        buttonSize: availableColumns > 6 ? "large" : "medium",
        showLabels: availableRows > 2,
        showProgress: availableRows > 3,
      };
    }, [actions.length, breakpoint, availableColumns, availableRows]);

    const maxButtons = buttonLayout.columns * buttonLayout.rows;
    const visibleActions = actions.slice(0, maxButtons);
    const getButtonClasses = (action) => {
      const isDisabled = action.id === "csv-import";
      const baseClasses = `
      ${action.color} 
      text-white rounded-xl 
      flex items-center justify-center
      ${
        isDisabled
          ? ""
          : "transition-all duration-200 transform hover:scale-105"
      }
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-500)]
      shadow-lg ${isDisabled ? "" : "hover:shadow-xl"} backdrop-blur-sm
    `;

      const sizeClasses = {
        large: "p-4 space-y-2 flex-col",
        medium: isMobile ? "p-3 space-y-1 flex-col min-h-[44px]" : "p-3 space-y-1 flex-col", // Add min-height for mobile
        small: "p-2 space-x-2 flex-row min-h-[44px]", // Add min-height for touch targets
      };

      return `${baseClasses} ${sizeClasses[buttonLayout.buttonSize]}`;
    };

    const getIconSize = () => {
      if (isMobile) {
        return "w-5 h-5"; // Consistent size for mobile
      }
      
      switch (buttonLayout.buttonSize) {
        case "large":
          return "w-6 h-6";
        case "medium":
          return "w-5 h-5";
        case "small":
          return "w-4 h-4";
        default:
          return "w-5 h-5";
      }
    };

    return (
      <div className="w-full h-full flex flex-col">
        <div className="widget-content-area">
          {habits.length === 0 ? (
            <EmptyStateWithAddHabit onAddHabit={handleAddHabit} />
          ) : (
            <div
              className="grid gap-4 flex-1"
              style={{
                gridTemplateColumns: `repeat(${buttonLayout.columns}, 1fr)`,
                gridTemplateRows: `repeat(${buttonLayout.rows}, 1fr)`,
              }}
            >
              {visibleActions.map((action) => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    action.action();
                  }}
                  className={getButtonClasses(action)}
                  disabled={
                    (action.id === "quick-complete" && habits.length === 0) ||
                    action.id === "csv-import"
                  }
                  
                >
                  <div className="flex-shrink-0">
                    {React.cloneElement(action.icon, {
                      className: getIconSize(),
                    })}
                  </div>
                  {buttonLayout.showLabels && (
                    <div className="text-center">
                      <span
                        className={`font-medium leading-tight font-outfit block ${
                          isMobile 
                            ? "text-sm" // Larger text on mobile for better readability
                            : buttonLayout.buttonSize === "large"
                            ? "text-sm"
                            : buttonLayout.buttonSize === "medium"
                            ? "text-xs"
                            : "text-xs"
                        }`}
                      >
                        {action.label}
                      </span>
                      {action.subtitle && (
                        <span
                          className={`text-xs opacity-75 font-outfit block ${
                            isMobile
                              ? "text-xs" // Consistent subtitle size on mobile
                              : buttonLayout.buttonSize === "large"
                              ? "text-xs"
                              : "text-[10px]"
                          }`}
                        >
                          {action.subtitle}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

QuickActionsWidget.displayName = "QuickActionsWidget";

export default QuickActionsWidget;
