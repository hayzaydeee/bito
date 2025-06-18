import React, { useState, memo } from "react";
import {
  useHabitData,
  useResizableColumns,
  useHabitActions,
  DatabaseHeader,
  MatrixTableView,
  GalleryView,
  ProfessionalTableView,
} from "./database/index.js";

const DatabaseWidget = memo(
  ({
    title = "Habit Tracker",
    habits = [],
    completions = {},
    onToggleCompletion,
    onAddHabit,
    onDeleteHabit,
    onEditHabit,
    viewType: initialViewType = "table",
    breakpoint = "lg",
    availableColumns = 8,
    availableRows = 6,
  }) => {
    const [viewType, setViewType] = useState(initialViewType);

    // Use custom hooks for data management
    const {
      daysOfWeek,
      displayHabits,
      displayCompletions,
      getCompletionStatus,
      getDayCompletion,
      getHabitCompletion,
      weekStats,
    } = useHabitData({ habits, completions });

    const {
      tableRef,
      getColumnWidth,
      handleResizeStart,
      resetColumnWidths,
    } = useResizableColumns();

    const {
      editingHabit,
      setEditingHabit,
      newHabitName,
      setNewHabitName,
      showAddForm,
      setShowAddForm,
      handleToggleCompletion,
      handleAddHabit,
      handleCancelAdd,
      handleEditHabit,
      handleDeleteHabit,
    } = useHabitActions({
      onToggleCompletion,
      onAddHabit,
      onDeleteHabit,
      onEditHabit,
    });

    // Common props for all views
    const commonProps = {
      daysOfWeek,
      displayHabits,
      displayCompletions,
      getCompletionStatus,
      getDayCompletion,
      getHabitCompletion,
      weekStats,
      handleToggleCompletion,
      breakpoint,
    };

    const renderContent = () => {
      switch (viewType) {
        case "table":
          return (
            <MatrixTableView
              {...commonProps}
              tableRef={tableRef}
              getColumnWidth={getColumnWidth}
              handleResizeStart={handleResizeStart}
              resetColumnWidths={resetColumnWidths}
            />
          );
        case "professional":
          return <ProfessionalTableView {...commonProps} />;
        case "gallery":
        default:
          return (
            <GalleryView
              {...commonProps}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              newHabitName={newHabitName}
              setNewHabitName={setNewHabitName}
              handleAddHabit={handleAddHabit}
              handleCancelAdd={handleCancelAdd}
            />
          );
      }
    };

    return (
      <div className="w-full h-full flex flex-col">
        <DatabaseHeader
          title={title}
          viewType={viewType}
          setViewType={setViewType}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          {renderContent()}
        </div>
      </div>
    );
  }
);
    const [viewType, setViewType] = useState(initialViewType);
    const [editingHabit, setEditingHabit] = useState(null);
    const [newHabitName, setNewHabitName] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    // Generate days of the week
    const daysOfWeek = useMemo(
      () => [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      []
    );

    // Default habits if none provided
    const defaultHabits = useMemo(
      () => [
        { id: 1, name: "Exercise", color: "#ef4444", icon: "💪" },
        { id: 2, name: "Read", color: "#3b82f6", icon: "📚" },
        { id: 3, name: "Meditate", color: "#8b5cf6", icon: "🧘" },
        { id: 4, name: "Water", color: "#06b6d4", icon: "💧" },
        { id: 5, name: "Sleep 8h", color: "#6366f1", icon: "😴" },
      ],
      []
    );

    const displayHabits = habits.length > 0 ? habits : defaultHabits;

    // Default completions if none provided
    const defaultCompletions = useMemo(() => {
      const comps = {};
      daysOfWeek.forEach((day, dayIndex) => {
        displayHabits.forEach((habit) => {
          // Simulate some random completions for demo
          const key = `${day}-${habit.id}`;
          comps[key] = Math.random() > 0.4; // 60% completion rate
        });
      });
      return comps;
    }, [daysOfWeek, displayHabits]);

    const displayCompletions =
      Object.keys(completions).length > 0 ? completions : defaultCompletions;

    // Handle completion toggle
    const handleToggleCompletion = useCallback(
      (day, habitId) => {
        const key = `${day}-${habitId}`;
        if (onToggleCompletion) {
          onToggleCompletion(key, !displayCompletions[key]);
        }
      },
      [displayCompletions, onToggleCompletion]
    );

    // Handle adding new habit
    const handleAddHabit = useCallback(() => {
      if (newHabitName.trim()) {
        const newHabit = {
          id: Date.now(),
          name: newHabitName.trim(),
          color: "#6366f1",
          icon: "✨",
        };
        if (onAddHabit) {
          onAddHabit(newHabit);
        }
        setNewHabitName("");
        setShowAddForm(false);
      }
    }, [newHabitName, onAddHabit]);

    // Get completion status for a specific day and habit
    const getCompletionStatus = useCallback(
      (day, habitId) => {
        const key = `${day}-${habitId}`;
        return displayCompletions[key] || false;
      },
      [displayCompletions]
    );

    // Calculate daily completion percentages
    const getDayCompletion = useCallback(
      (day) => {
        const totalHabits = displayHabits.length;
        const completedHabits = displayHabits.filter((habit) =>
          getCompletionStatus(day, habit.id)
        ).length;
        return totalHabits > 0
          ? Math.round((completedHabits / totalHabits) * 100)
          : 0;
      },
      [displayHabits, getCompletionStatus]
    );

    // Calculate habit completion percentages across the week
    const getHabitCompletion = useCallback(
      (habitId) => {
        const completedDays = daysOfWeek.filter((day) =>
          getCompletionStatus(day, habitId)
        ).length;
        return Math.round((completedDays / daysOfWeek.length) * 100);
      },
      [daysOfWeek, getCompletionStatus]
    );

    // Calculate overall statistics
    const weekStats = useMemo(() => {
      const totalCells = displayHabits.length * daysOfWeek.length;
      const completedCells = displayHabits.reduce(
        (sum, habit) =>
          sum +
          daysOfWeek.filter((day) => getCompletionStatus(day, habit.id)).length,
        0
      );
      const averageCompletion = Math.round(
        daysOfWeek.reduce((sum, day) => sum + getDayCompletion(day), 0) /
          daysOfWeek.length
      );
      const perfectDays = daysOfWeek.filter(
        (day) => getDayCompletion(day) === 100
      ).length;

      return {
        totalCells,
        completedCells,
        averageCompletion,
        perfectDays,
        completionRate: Math.round((completedCells / totalCells) * 100),
      };
    }, [displayHabits, daysOfWeek, getCompletionStatus, getDayCompletion]); // Modern Table View - Compact Matrix Style
    const TableView = () => (
      <div className="w-full space-y-4">
        {/* Header with Summary Stats */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/70 rounded-xl border border-[var(--color-border-primary)]">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
            <div>
              <h4 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
                Weekly Habit Matrix
              </h4>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                {displayHabits.length} habits × 7 days = {weekStats.totalCells}{" "}
                checkpoints
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-brand-400)] font-dmSerif">
                {weekStats.completionRate}%
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Overall
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-success)] font-dmSerif">
                {weekStats.perfectDays}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Perfect Days
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Scrollable Matrix Container */}
        <div
          className="overflow-x-auto border border-[var(--color-border-primary)] rounded-xl bg-[var(--color-surface-elevated)]"
          ref={tableRef}
        >
          <div className="min-w-max">
            {/* Matrix Header */}
            <div className="sticky top-0 bg-[var(--color-surface-elevated)] z-10 border-b border-[var(--color-border-primary)]">
              <div className="flex">
                {/* Corner Cell */}
                <div className="w-32 p-3 border-r border-[var(--color-border-primary)] flex items-center justify-between">
                  <div className="flex items-center">
                    <TargetIcon className="w-4 h-4 text-[var(--color-text-tertiary)] mr-2" />
                    <span className="text-sm font-semibold text-[var(--color-text-secondary)] font-outfit">
                      Day / Habit
                    </span>
                  </div>
                  <button
                    onClick={resetColumnWidths}
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] transition-colors font-outfit"
                    title="Reset column widths"
                  >
                    Reset
                  </button>
                </div>

                {/* Habit Headers - Resizable */}
                {displayHabits.map((habit, index) => {
                  const completion = getHabitCompletion(habit.id);
                  const width = getColumnWidth(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className={`p-3 text-center border-r border-[var(--color-border-primary)] relative ${
                        index === displayHabits.length - 1 ? "border-r-0" : ""
                      }`}
                      style={{ width: `${width}px` }}
                    >
                      <div
                        className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer shadow-sm"
                        style={{
                          backgroundColor: `${habit.color}15`,
                          border: `2px solid ${habit.color}30`,
                          boxShadow: `0 2px 8px ${habit.color}20`,
                        }}
                      >
                        <span className="text-lg">{habit.icon}</span>
                      </div>
                      <div className="text-xs font-semibold text-[var(--color-text-primary)] font-outfit mb-1 truncate">
                        {habit.name}
                      </div>
                      <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-1.5 mb-1">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${completion}%`,
                            backgroundColor: habit.color,
                            boxShadow:
                              completion > 0
                                ? `0 0 4px ${habit.color}50`
                                : "none",
                          }}
                        />
                      </div>
                      <div
                        className="text-xs font-bold font-outfit"
                        style={{ color: habit.color }}
                      >
                        {completion}%
                      </div>

                      {/* Resize Handle */}
                      {index < displayHabits.length - 1 && (
                        <div
                          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--color-brand-400)] transition-colors bg-transparent group"
                          onMouseDown={(e) => handleResizeStart(e, habit.id)}
                          title="Drag to resize column"
                        >
                          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-3 h-6 bg-[var(--color-surface-elevated)] rounded-sm border border-[var(--color-border-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <DragHandleHorizontalIcon className="w-2 h-2 text-[var(--color-text-tertiary)]" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Summary Column Header */}
                <div className="w-20 p-3 text-center bg-[var(--color-surface-secondary)]/30">
                  <div className="text-xs font-semibold text-[var(--color-text-secondary)] font-outfit mb-2">
                    Daily Score
                  </div>
                  <div className="w-8 h-8 mx-auto bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center">
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Rows */}
            <div className="divide-y divide-[var(--color-border-primary)]">
              {daysOfWeek.map((day, dayIndex) => {
                const dayCompletion = getDayCompletion(day);
                const isToday =
                  new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                  }) === day;
                const completedCount = displayHabits.filter((h) =>
                  getCompletionStatus(day, h.id)
                ).length;

                return (
                  <div
                    key={day}
                    className={`flex transition-all duration-200 hover:bg-[var(--color-surface-hover)]/30 ${
                      isToday
                        ? "bg-[var(--color-brand-500)]/8 ring-1 ring-inset ring-[var(--color-brand-400)]/30"
                        : ""
                    }`}
                  >
                    {/* Day Label Cell */}
                    <div className="w-32 p-3 border-r border-[var(--color-border-primary)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold font-dmSerif ${
                            isToday
                              ? "text-[var(--color-brand-400)]"
                              : "text-[var(--color-text-primary)]"
                          }`}
                        >
                          {day}
                        </span>
                        {isToday && (
                          <div className="w-2 h-2 bg-[var(--color-brand-400)] rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                        {completedCount}/{displayHabits.length}
                      </div>
                    </div>{" "}
                    {/* Habit Checkbox Cells */}
                    {displayHabits.map((habit, habitIndex) => {
                      const isCompleted = getCompletionStatus(day, habit.id);
                      const width = getColumnWidth(habit.id);
                      return (
                        <div
                          key={habit.id}
                          className={`p-3 flex items-center justify-center border-r border-[var(--color-border-primary)] ${
                            habitIndex === displayHabits.length - 1
                              ? "border-r-0"
                              : ""
                          }`}
                          style={{ width: `${width}px` }}
                        >
                          <button
                            onClick={() =>
                              handleToggleCompletion(day, habit.id)
                            }
                            className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center relative group hover:scale-110 active:scale-95 ${
                              isCompleted
                                ? "shadow-lg transform scale-105"
                                : "hover:shadow-md"
                            }`}
                            style={{
                              backgroundColor: isCompleted
                                ? habit.color
                                : "transparent",
                              border: `2px solid ${habit.color}`,
                              boxShadow: isCompleted
                                ? `0 4px 12px ${habit.color}30`
                                : `0 2px 8px ${habit.color}20`,
                            }}
                          >
                            {/* Completion checkmark */}
                            {isCompleted && (
                              <CheckIcon className="w-5 h-5 text-white font-bold z-10" />
                            )}

                            {/* Hover effect overlay */}
                            <div
                              className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
                                isCompleted
                                  ? "opacity-0"
                                  : "opacity-0 group-hover:opacity-20"
                              }`}
                              style={{ backgroundColor: habit.color }}
                            />
                          </button>
                        </div>
                      );
                    })}
                    {/* Daily Score Cell */}
                    <div className="w-20 p-3 flex items-center justify-center bg-[var(--color-surface-secondary)]/30">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-outfit transition-all duration-200 shadow-sm"
                        style={{
                          backgroundColor:
                            dayCompletion === 100
                              ? "#10b981"
                              : dayCompletion >= 80
                              ? "#3b82f6"
                              : dayCompletion >= 60
                              ? "#f59e0b"
                              : dayCompletion >= 40
                              ? "#f97316"
                              : dayCompletion > 0
                              ? "#ef4444"
                              : "var(--color-surface-elevated)",
                          color:
                            dayCompletion >= 40
                              ? "white"
                              : "var(--color-text-secondary)",
                          border:
                            dayCompletion === 0
                              ? "2px solid var(--color-border-primary)"
                              : "none",
                          boxShadow:
                            dayCompletion > 0
                              ? `0 2px 8px ${
                                  dayCompletion === 100
                                    ? "#10b98120"
                                    : dayCompletion >= 80
                                    ? "#3b82f620"
                                    : dayCompletion >= 60
                                    ? "#f59e0b20"
                                    : dayCompletion >= 40
                                    ? "#f9731620"
                                    : "#ef444420"
                                }`
                              : "none",
                        }}
                      >
                        {dayCompletion}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-brand-500)]/20 rounded-lg flex items-center justify-center">
                <TargetIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Week Average
                </div>
                <div className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {weekStats.averageCompletion}%
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-success)]/20 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-[var(--color-success)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Total Progress
                </div>
                <div className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {weekStats.completedCells}/{weekStats.totalCells}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-warning)]/20 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-[var(--color-warning)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Streak Days
                </div>
                <div className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {weekStats.perfectDays}/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // Gallery View Component (Card-based view of habits)
    const GalleryView = () => (
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns:
            breakpoint === "xs"
              ? "1fr"
              : breakpoint === "sm"
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        {displayHabits.map((habit) => {
          const habitCompletion = getHabitCompletion(habit.id);
          const completedDays = daysOfWeek.filter((day) =>
            getCompletionStatus(day, habit.id)
          );

          return (
            <div
              key={habit.id}
              className="glass-card rounded-xl p-5 hover:shadow-lg transition-all duration-200 border border-[var(--color-border-primary)]"
            >
              {/* Habit Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: `${habit.color}15`,
                      border: `2px solid ${habit.color}30`,
                    }}
                  >
                    <span className="text-xl">{habit.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
                      {habit.name}
                    </h4>
                    <div className="text-sm text-[var(--color-text-tertiary)] font-outfit">
                      {completedDays.length}/7 completed
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
                    <Pencil1Icon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
                    <DotsHorizontalIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                  </button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Weekly Progress
                  </span>
                  <span
                    className="text-sm font-bold font-outfit"
                    style={{ color: habit.color }}
                  >
                    {habitCompletion}%
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${habitCompletion}%`,
                      backgroundColor: habit.color,
                      boxShadow:
                        habitCompletion > 0
                          ? `0 0 8px ${habit.color}40`
                          : "none",
                    }}
                  />
                </div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => {
                  const isCompleted = getCompletionStatus(day, habit.id);
                  const isToday =
                    new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    }) === day;

                  return (
                    <div key={day} className="text-center">
                      <div
                        className={`text-xs mb-2 font-outfit ${
                          isToday
                            ? "text-[var(--color-brand-400)] font-bold"
                            : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </div>
                      <button
                        onClick={() => handleToggleCompletion(day, habit.id)}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center relative ${
                          isCompleted ? "shadow-md" : "hover:shadow-sm"
                        } ${
                          isToday
                            ? "ring-2 ring-[var(--color-brand-400)]/50"
                            : ""
                        }`}
                        style={{
                          backgroundColor: isCompleted
                            ? habit.color
                            : "var(--color-surface-elevated)",
                          border: `2px solid ${
                            isCompleted
                              ? habit.color
                              : "var(--color-border-primary)"
                          }`,
                          boxShadow: isCompleted
                            ? `0 2px 8px ${habit.color}30`
                            : "none",
                        }}
                      >
                        {isCompleted && (
                          <CheckIcon className="w-4 h-4 text-white" />
                        )}
                        {isToday && !isCompleted && (
                          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] animate-pulse" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add New Habit Card */}
        {showAddForm ? (
          <div className="glass-card rounded-xl p-5 border-2 border-dashed border-[var(--color-brand-400)] bg-[var(--color-brand-500)]/5">
            <input
              type="text"
              placeholder="Enter habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
              className="w-full bg-transparent border-none outline-none text-base font-outfit text-[var(--color-text-primary)] mb-4 placeholder:text-[var(--color-text-tertiary)]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddHabit}
                className="flex-1 py-2.5 bg-[var(--color-brand-500)] text-white rounded-lg text-sm font-outfit font-semibold hover:bg-[var(--color-brand-600)] transition-colors"
              >
                Add Habit
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewHabitName("");
                }}
                className="px-4 py-2.5 bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] rounded-lg text-sm font-outfit hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="glass-card rounded-xl p-5 border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-brand-400)] transition-all duration-200 flex flex-col items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] min-h-[240px] group"
          >
            <div className="w-14 h-14 bg-[var(--color-surface-elevated)] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[var(--color-brand-500)]/10 transition-all duration-200">
              <PlusIcon className="w-7 h-7" />
            </div>
            <span className="text-base font-outfit font-semibold">
              Add New Habit
            </span>
            <span className="text-sm font-outfit opacity-70 mt-1">
              Track your progress
            </span>
          </button>
        )}
      </div>
    );

    // Professional Table View - Inspired by Reference
    const ProfessionalTableView = () => (
      <div className="w-full space-y-3">
        {/* Compact Table Container */}
        <div className="overflow-x-auto bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)]">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]/30">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[120px]">
                  Day
                </th>
                {displayHabits.map((habit) => (
                  <th
                    key={habit.id}
                    className="text-center py-3 px-3 text-xs font-medium text-[var(--color-text-secondary)] font-outfit min-w-[60px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-base">{habit.icon}</span>
                      <span className="truncate max-w-[50px]">
                        {habit.name}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[80px]">
                  Score
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)] font-outfit min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {daysOfWeek.map((day, dayIndex) => {
                const dayCompletion = getDayCompletion(day);
                const isToday =
                  new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                  }) === day;
                const completedCount = displayHabits.filter((h) =>
                  getCompletionStatus(day, h.id)
                ).length;

                return (
                  <tr
                    key={day}
                    className={`border-b border-[var(--color-border-primary)]/30 transition-all duration-150 hover:bg-[var(--color-surface-hover)]/30 ${
                      dayIndex % 2 === 0
                        ? "bg-[var(--color-surface-primary)]/10"
                        : "bg-transparent"
                    } ${
                      isToday
                        ? "bg-[var(--color-brand-500)]/8 border-[var(--color-brand-400)]/30"
                        : ""
                    }`}
                  >
                    {/* Day Label */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium font-outfit ${
                              isToday
                                ? "text-[var(--color-brand-400)]"
                                : "text-[var(--color-text-primary)]"
                            }`}
                          >
                            {day}
                          </span>
                          <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                            {completedCount}/{displayHabits.length} completed
                          </span>
                        </div>
                        {isToday && (
                          <span className="px-2 py-1 bg-[var(--color-brand-500)] text-white text-xs font-bold rounded-full font-outfit">
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Habit Checkboxes */}
                    {displayHabits.map((habit) => {
                      const isCompleted = getCompletionStatus(day, habit.id);
                      return (
                        <td key={habit.id} className="py-3 px-3 text-center">
                          <button
                            onClick={() =>
                              handleToggleCompletion(day, habit.id)
                            }
                            className={`w-7 h-7 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
                              isCompleted
                                ? "shadow-md transform scale-105"
                                : "hover:shadow-sm"
                            }`}
                            style={{
                              backgroundColor: isCompleted
                                ? habit.color
                                : "transparent",
                              border: `2px solid ${habit.color}`,
                              boxShadow: isCompleted
                                ? `0 2px 6px ${habit.color}30`
                                : "none",
                            }}
                          >
                            {isCompleted && (
                              <CheckIcon className="w-4 h-4 text-white font-bold" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* Score - Status Badge Style */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-outfit border ${
                          dayCompletion === 100
                            ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30"
                            : dayCompletion >= 75
                            ? "bg-[var(--color-brand-400)]/10 text-[var(--color-brand-400)] border-[var(--color-brand-400)]/30"
                            : dayCompletion >= 50
                            ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30"
                            : dayCompletion > 0
                            ? "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/30"
                            : "bg-[var(--color-text-tertiary)]/10 text-[var(--color-text-tertiary)] border-[var(--color-text-tertiary)]/30"
                        }`}
                      >
                        {dayCompletion === 100 && (
                          <CheckIcon className="w-3 h-3 mr-1" />
                        )}
                        {dayCompletion}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="text-xs text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] font-outfit font-medium transition-colors"
                          onClick={() => {
                            /* Handle view day details */
                          }}
                        >
                          View
                        </button>
                        <span className="text-[var(--color-border-primary)]">
                          •
                        </span>
                        <button
                          className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] font-outfit font-medium transition-colors"
                          onClick={() => {
                            /* Handle edit day */
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats - Compact Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--color-brand-400)] font-dmSerif">
                {weekStats.completionRate}%
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Overall
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--color-success)] font-dmSerif">
                {weekStats.perfectDays}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Perfect Days
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
                {weekStats.completedCells}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Completed
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-lg p-3 border border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--color-warning)] font-dmSerif">
                {weekStats.averageCompletion}%
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-outfit">
                Average
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // Column width management with localStorage
    const COLUMN_WIDTHS_KEY = "habit-tracker-column-widths";
    const DEFAULT_COLUMN_WIDTH = 120;
    const MIN_COLUMN_WIDTH = 80;
    const MAX_COLUMN_WIDTH = 200;

    // Load column widths from localStorage
    const [columnWidths, setColumnWidths] = useState(() => {
      try {
        const saved = localStorage.getItem(COLUMN_WIDTHS_KEY);
        return saved ? JSON.parse(saved) : {};
      } catch (error) {
        console.warn("Failed to load column widths from localStorage:", error);
        return {};
      }
    });

    // Save column widths to localStorage
    useEffect(() => {
      try {
        localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
      } catch (error) {
        console.warn("Failed to save column widths to localStorage:", error);
      }
    }, [columnWidths]);

    // Refs for resize functionality
    const tableRef = useRef(null);
    const resizingRef = useRef(null);

    // Get column width for a habit
    const getColumnWidth = useCallback(
      (habitId) => {
        return columnWidths[habitId] || DEFAULT_COLUMN_WIDTH;
      },
      [columnWidths]
    );

    // Handle column resize
    const handleColumnResize = useCallback((habitId, newWidth) => {
      const clampedWidth = Math.max(
        MIN_COLUMN_WIDTH,
        Math.min(MAX_COLUMN_WIDTH, newWidth)
      );
      setColumnWidths((prev) => ({
        ...prev,
        [habitId]: clampedWidth,
      }));
    }, []);

    // Mouse down handler for resize
    const handleResizeStart = useCallback(
      (e, habitId) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = getColumnWidth(habitId);

        resizingRef.current = { habitId, startX, startWidth };

        const handleMouseMove = (e) => {
          if (!resizingRef.current) return;

          const deltaX = e.clientX - resizingRef.current.startX;
          const newWidth = resizingRef.current.startWidth + deltaX;
          handleColumnResize(resizingRef.current.habitId, newWidth);
        };

        const handleMouseUp = () => {
          resizingRef.current = null;
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          document.body.style.cursor = "default";
          document.body.style.userSelect = "auto";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      },
      [getColumnWidth, handleColumnResize]
    );

    // Reset column widths
    const resetColumnWidths = useCallback(() => {
      setColumnWidths({});
    }, []);

    return (
      <div className="w-full h-full flex flex-col">
        {/* Widget Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-brand-500)]/20 rounded-lg flex items-center justify-center">
              <TargetIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
              {title}
            </h3>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--color-surface-elevated)] rounded-xl p-1 border border-[var(--color-border-primary)]">
              <button
                onClick={() => setViewType("table")}
                className={`p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewType === "table"
                    ? "bg-[var(--color-brand-500)] text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                <span className="text-sm font-outfit font-medium">Matrix</span>
              </button>
              <button
                onClick={() => setViewType("gallery")}
                className={`p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewType === "gallery"
                    ? "bg-[var(--color-brand-500)] text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <GridIcon className="w-4 h-4" />
                <span className="text-sm font-outfit font-medium">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {viewType === "table" ? <ProfessionalTableView /> : <GalleryView />}
        </div>
      </div>
    );
  }
);

DatabaseWidget.displayName = "DatabaseWidget";

export { DatabaseWidget };
