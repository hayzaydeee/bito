import React, { useMemo, memo, useState, useCallback } from "react";
import { habitUtils } from "../../utils/habitLogic";
import { CheckIcon, EyeOpenIcon } from "@radix-ui/react-icons";

/* ─── Inline habit row for the expanded day panel ─── */
const DayHabitRow = memo(({ habit, isCompleted, onToggle, dateStr }) => {
  const [animating, setAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    setAnimating(true);
    onToggle(habit._id, dateStr);
    setTimeout(() => setAnimating(false), 400);
  }, [habit._id, dateStr, onToggle]);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200"
      style={{
        backgroundColor: isCompleted
          ? "rgba(99,102,241,0.04)"
          : "var(--color-surface-primary)",
        borderColor: isCompleted
          ? "rgba(99,102,241,0.2)"
          : "var(--color-border-primary)",
      }}
    >
      <button
        onClick={handleToggle}
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: isCompleted
            ? "var(--color-brand-500)"
            : "var(--color-border-secondary)",
          backgroundColor: isCompleted
            ? "var(--color-brand-500)"
            : "transparent",
          transform: animating ? "scale(1.2)" : "scale(1)",
        }}
        aria-label={isCompleted ? `Uncheck ${habit.name}` : `Check ${habit.name}`}
      >
        {isCompleted && <CheckIcon className="w-3 h-3 text-white" />}
      </button>

      <span className="text-base flex-shrink-0">{habit.icon || "⭐"}</span>

      <span
        className="text-sm font-spartan font-medium truncate transition-colors duration-200"
        style={{
          color: isCompleted
            ? "var(--color-text-tertiary)"
            : "var(--color-text-primary)",
          textDecoration: isCompleted ? "line-through" : "none",
        }}
      >
        {habit.name}
      </span>

      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-auto"
        style={{ backgroundColor: habit.color || "var(--color-brand-500)" }}
      />
    </div>
  );
});
DayHabitRow.displayName = "DayHabitRow";

/* ─── 7-day compact heatmap strip ─── */
const WeekStrip = memo(({ habits, entries, onToggle }) => {
  const [expandedDate, setExpandedDate] = useState(null);

  const weekData = useMemo(() => {
    const today = new Date();
    const weekStart = habitUtils.getWeekStart(today);
    const dates = habitUtils.getWeekDates(weekStart);

    return dates.map(({ date, shortDay, isToday, dateObj }) => {
      const scheduled = habitUtils.getHabitsForDate(habits, dateObj);
      const total = scheduled.length;
      let completed = 0;

      scheduled.forEach((habit) => {
        const entry = entries[habit._id]?.[date];
        if (entry && entry.completed) completed++;
      });

      const pct = total > 0 ? completed / total : 0;

      return { date, shortDay, isToday, pct, total, completed, scheduled, dateObj };
    });
  }, [habits, entries]);

  /* Color intensity based on % */
  const cellColor = (pct) => {
    if (pct === 0) return "var(--color-surface-hover)";
    if (pct < 0.5) return "rgba(99,102,241,0.25)";
    if (pct < 1) return "rgba(99,102,241,0.5)";
    return "var(--color-brand-500)";
  };

  const handleCellClick = useCallback((date) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  }, []);

  /* The expanded day's data */
  const expandedDay = expandedDate
    ? weekData.find((d) => d.date === expandedDate)
    : null;

  return (
    <div data-tour="week-strip">
      <h2
        className="text-base font-garamond font-bold mb-3"
        style={{ color: "var(--color-text-primary)" }}
      >
        This week
      </h2>
      <div className="flex items-end gap-1.5 sm:gap-2">
        {weekData.map((day) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
            {/* Day label */}
            <span
              className="text-[10px] font-spartan font-medium"
              style={{
                color: day.isToday
                  ? "var(--color-brand-500)"
                  : "var(--color-text-tertiary)",
              }}
            >
              {day.shortDay.charAt(0)}
            </span>

            {/* Heatmap cell — clickable */}
            <button
              onClick={() => day.total > 0 && handleCellClick(day.date)}
              className="week-cell w-full aspect-square rounded-lg transition-colors duration-300 relative group"
              style={{
                backgroundColor: cellColor(day.pct),
                cursor: day.total > 0 ? "pointer" : "default",
                outline: expandedDate === day.date
                  ? "2px solid var(--color-brand-500)"
                  : "none",
                outlineOffset: "1px",
              }}
              aria-label={`${day.shortDay}: ${day.completed}/${day.total} — click to view habits`}
              disabled={day.total === 0}
            >
              {/* Today ring indicator */}
              {day.isToday && (
                <div
                  className="absolute inset-0 rounded-lg border-2 pointer-events-none"
                  style={{ borderColor: "var(--color-brand-500)" }}
                />
              )}

              {/* Hover overlay — "View" / icon */}
              {day.total > 0 && (
                <div
                  className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ backgroundColor: "rgba(99,102,241,0.65)" }}
                >
                  <EyeOpenIcon className="w-3.5 h-3.5 text-white sm:hidden" />
                  <span className="hidden sm:block text-[9px] font-spartan font-semibold text-white leading-tight text-center px-0.5">
                    View
                  </span>
                </div>
              )}
            </button>

            {/* Fraction label */}
            {day.total > 0 && (
              <span
                className="text-[9px] font-spartan tabular-nums"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {day.completed}/{day.total}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Expanded day habit list */}
      {expandedDay && (
        <div
          className="mt-3 rounded-xl border overflow-hidden week-expand-enter"
          style={{
            backgroundColor: "var(--color-surface-elevated)",
            borderColor: "var(--color-border-primary)",
          }}
        >
          {/* Day header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: "var(--color-border-primary)" }}
          >
            <span
              className="text-sm font-spartan font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {expandedDay.dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span
              className="text-xs font-spartan tabular-nums"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {expandedDay.completed}/{expandedDay.total} done
            </span>
          </div>

          {/* Habit rows */}
          <div className="p-2 space-y-1.5">
            {expandedDay.scheduled.map((habit) => {
              const entry = entries[habit._id]?.[expandedDay.date];
              const isCompleted = !!(entry && entry.completed);
              return (
                <DayHabitRow
                  key={habit._id}
                  habit={habit}
                  isCompleted={isCompleted}
                  onToggle={onToggle}
                  dateStr={expandedDay.date}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

WeekStrip.displayName = "WeekStrip";
export default WeekStrip;
