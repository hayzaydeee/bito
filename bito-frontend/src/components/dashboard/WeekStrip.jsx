import React, { useMemo, memo, useState, useCallback, useEffect } from "react";
import { habitUtils } from "../../utils/habitLogic";
import {
  CheckIcon,
  EyeOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

/* ════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════ */

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

/* ─── View toggle pills (W / M / Y) ─── */
const ViewPills = memo(({ value, onChange }) => {
  const views = [
    { value: "week", label: "W" },
    { value: "month", label: "M" },
    { value: "year", label: "Y" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-full p-0.5" style={{ backgroundColor: "var(--color-surface-elevated)" }}>
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={`px-3 py-1 rounded-full text-xs font-spartan font-semibold transition-all duration-200 ${
            value === v.value
              ? "bg-[var(--color-brand-600)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
});
ViewPills.displayName = "ViewPills";

/* ─── Day label row for week/month grids ─── */
const DayLabels = memo(({ weekStartDay }) => {
  let startDay = weekStartDay;
  if (startDay == null) {
    try {
      const ups = require("../../services/userPreferencesService").default;
      startDay = ups.getWeekStartDay();
    } catch { startDay = 1; }
  }
  const labels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, startDay + i); // Jan 2024 starts Mon=1
    labels.push(d.toLocaleDateString("en-US", { weekday: "narrow" }));
  }
  return (
    <div className="grid grid-cols-7 mb-1">
      {labels.map((l, i) => (
        <span key={i} className="text-center text-[10px] font-spartan font-medium" style={{ color: "var(--color-text-tertiary)" }}>
          {l}
        </span>
      ))}
    </div>
  );
});
DayLabels.displayName = "DayLabels";

/* ════════════════════════════════════════════
   Shared helpers
   ════════════════════════════════════════════ */

const cellColor = (pct) => {
  if (pct === 0) return "var(--color-surface-hover)";
  if (pct < 0.5) return "rgba(99,102,241,0.25)";
  if (pct < 1) return "rgba(99,102,241,0.5)";
  return "var(--color-brand-500)";
};

/** Build per-day stats for an array of dateObj items */
const buildDayStats = (dates, habits, entries) =>
  dates.map((d) => {
    const dateStr = typeof d === "string" ? d : d.date || habitUtils.normalizeDate(d.dateObj || d);
    const dateObj = d.dateObj || new Date(dateStr + "T00:00:00");
    const scheduled = habitUtils.getHabitsForDate(habits, dateObj);
    const total = scheduled.length;
    let completed = 0;
    scheduled.forEach((h) => {
      const entry = entries[h._id]?.[dateStr];
      if (entry && entry.completed) completed++;
    });
    const pct = total > 0 ? completed / total : 0;
    return { ...d, date: dateStr, dateObj, scheduled, total, completed, pct };
  });

/* ════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════ */

const WeekStrip = memo(({ habits, entries, onToggle, fetchHabitEntries }) => {
  const [view, setView] = useState("week"); // week | month | year
  const [anchor, setAnchor] = useState(() => new Date());
  const [expandedDate, setExpandedDate] = useState(null);

  // View change resets expanded
  const handleViewChange = useCallback((v) => {
    setView(v);
    setExpandedDate(null);
  }, []);

  // Navigation
  const handlePrev = useCallback(() => {
    setAnchor((a) => habitUtils.navigateRange(view, a, -1));
    setExpandedDate(null);
  }, [view]);
  const handleNext = useCallback(() => {
    setAnchor((a) => habitUtils.navigateRange(view, a, 1));
    setExpandedDate(null);
  }, [view]);
  const handleToday = useCallback(() => {
    setAnchor(new Date());
    setExpandedDate(null);
  }, []);

  // Check if anchor is current period
  const isCurrentPeriod = useMemo(() => {
    const now = new Date();
    if (view === "week") {
      return habitUtils.normalizeDate(habitUtils.getWeekStart(now)) === habitUtils.normalizeDate(habitUtils.getWeekStart(anchor));
    }
    if (view === "month") {
      return now.getFullYear() === anchor.getFullYear() && now.getMonth() === anchor.getMonth();
    }
    return now.getFullYear() === anchor.getFullYear();
  }, [view, anchor]);

  // Fetch entries for the visible range
  useEffect(() => {
    if (!fetchHabitEntries || !habits.length) return;
    const { start, end } = habitUtils.getDateRangeForView(view, anchor);
    habits.forEach((h) => fetchHabitEntries(h._id, start, end));
  }, [view, anchor, habits, fetchHabitEntries]);

  // Range label
  const rangeLabel = useMemo(() => habitUtils.getRangeLabel(view, anchor), [view, anchor]);

  // ── WEEK data ──
  const weekData = useMemo(() => {
    if (view !== "week") return [];
    const ws = habitUtils.getWeekStart(anchor);
    const dates = habitUtils.getWeekDates(ws);
    return buildDayStats(dates, habits, entries);
  }, [view, anchor, habits, entries]);

  // ── MONTH data ──
  const monthGrid = useMemo(() => {
    if (view !== "month") return [];
    const cells = habitUtils.getMonthCalendarGrid(anchor);
    return buildDayStats(cells, habits, entries);
  }, [view, anchor, habits, entries]);

  // ── YEAR data ──
  const yearData = useMemo(() => {
    if (view !== "year") return [];
    const months = habitUtils.getYearMonths(anchor.getFullYear());
    return months.map((m) => {
      let totalScheduled = 0;
      let totalCompleted = 0;
      for (let day = 1; day <= m.daysInMonth; day++) {
        const d = new Date(anchor.getFullYear(), m.month, day);
        const dateStr = habitUtils.normalizeDate(d);
        const scheduled = habitUtils.getHabitsForDate(habits, d);
        totalScheduled += scheduled.length;
        scheduled.forEach((h) => {
          const entry = entries[h._id]?.[dateStr];
          if (entry && entry.completed) totalCompleted++;
        });
      }
      const pct = totalScheduled > 0 ? totalCompleted / totalScheduled : 0;
      return { ...m, totalScheduled, totalCompleted, pct };
    });
  }, [view, anchor, habits, entries]);

  // Cell click
  const handleCellClick = useCallback((date) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  }, []);

  // Month block click → drill into that month
  const handleMonthDrill = useCallback((monthIdx) => {
    setAnchor(new Date(anchor.getFullYear(), monthIdx, 1));
    setView("month");
    setExpandedDate(null);
  }, [anchor]);

  // Find expanded day across views
  const expandedDay = useMemo(() => {
    if (!expandedDate) return null;
    const source = view === "week" ? weekData : view === "month" ? monthGrid : [];
    return source.find((d) => d.date === expandedDate) || null;
  }, [expandedDate, view, weekData, monthGrid]);

  /* ═══ Render helpers ═══ */

  // Header: view pills on top, centered nav arrows below
  const renderHeader = () => (
    <div className="mb-3 space-y-2">
      {/* Row 1: ViewPills right-aligned */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-garamond font-bold" style={{ color: "var(--color-text-primary)" }}>
          {rangeLabel}
        </h2>
        <div data-tour="ws-view-pills">
          <ViewPills value={view} onChange={handleViewChange} />
        </div>
      </div>
      {/* Row 2: Centered nav arrows + Today button */}
      <div data-tour="ws-nav" className="flex items-center justify-center gap-2">
        <button onClick={handlePrev} className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors" aria-label="Previous">
          <ChevronLeftIcon className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
        </button>
        <button onClick={handleNext} className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors" aria-label="Next">
          <ChevronRightIcon className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
        </button>
        {!isCurrentPeriod && (
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-full text-xs font-spartan font-semibold transition-colors shadow-sm"
            style={{ backgroundColor: "var(--color-brand-500)", color: "white" }}
          >
            Today
          </button>
        )}
      </div>
    </div>
  );

  // 7-cell week row (reused in both modes)
  const renderWeekCells = (data) => (
    <div className="flex items-end gap-1.5 sm:gap-2">
      {data.map((day) => (
        <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-spartan font-medium truncate w-full text-center" style={{ color: day.isToday ? "var(--color-brand-500)" : "var(--color-text-tertiary)" }}>
            {day.dayName || day.shortDay || ""}
          </span>
          <button
            onClick={() => day.total > 0 && handleCellClick(day.date)}
            className="w-full aspect-square rounded-lg transition-colors duration-300 relative group"
            style={{
              backgroundColor: cellColor(day.pct),
              cursor: day.total > 0 ? "pointer" : "default",
              outline: expandedDate === day.date ? "2px solid var(--color-brand-500)" : "none",
              outlineOffset: "1px",
            }}
            aria-label={`${day.shortDay || ""}: ${day.completed}/${day.total}`}
            disabled={day.total === 0}
          >
            {day.isToday && (
              <div className="absolute inset-0 rounded-lg border-2 pointer-events-none" style={{ borderColor: "var(--color-brand-500)" }} />
            )}
            {day.total > 0 && (
              <div className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: "rgba(99,102,241,0.65)" }}>
                <EyeOpenIcon className="w-3.5 h-3.5 text-white sm:hidden" />
                <span className="hidden sm:block text-[9px] font-spartan font-semibold text-white text-center">View</span>
              </div>
            )}
          </button>
          {day.total > 0 && (
            <span className="text-[9px] font-spartan tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>
              {day.completed}/{day.total}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  // Month calendar grid
  const renderMonthGrid = () => (
    <div>
      <DayLabels />
      <div className="grid grid-cols-7 gap-1">
        {monthGrid.map((cell, i) => (
          <button
            key={i}
            onClick={() => cell.total > 0 && cell.isCurrentMonth && handleCellClick(cell.date)}
            disabled={cell.total === 0 || !cell.isCurrentMonth}
            className="aspect-square rounded-md relative group transition-all duration-200 flex items-center justify-center"
            style={{
              backgroundColor: cell.isCurrentMonth ? cellColor(cell.pct) : "transparent",
              opacity: cell.isCurrentMonth ? 1 : 0.25,
              cursor: cell.total > 0 && cell.isCurrentMonth ? "pointer" : "default",
              outline: expandedDate === cell.date ? "2px solid var(--color-brand-500)" : "none",
              outlineOffset: "1px",
            }}
            aria-label={`${cell.date}: ${cell.completed}/${cell.total}`}
          >
            <span
              className="text-[10px] font-spartan font-medium leading-none"
              style={{
                color: cell.isToday
                  ? "var(--color-brand-500)"
                  : cell.isCurrentMonth
                  ? "var(--color-text-secondary)"
                  : "var(--color-text-tertiary)",
                fontWeight: cell.isToday ? 800 : 500,
              }}
            >
              {cell.day}
            </span>
            {cell.isToday && cell.isCurrentMonth && (
              <div className="absolute inset-0 rounded-md border-2 pointer-events-none" style={{ borderColor: "var(--color-brand-500)" }} />
            )}
            {cell.total > 0 && cell.isCurrentMonth && (
              <div className="absolute inset-0 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: "rgba(99,102,241,0.65)" }}>
                <EyeOpenIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Year — 12 mini-month blocks in 3×4 grid
  const renderYearGrid = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {yearData.map((m) => {
        const pctLabel = m.totalScheduled > 0 ? Math.round(m.pct * 100) : null;
        return (
          <button
            key={m.month}
            onClick={() => handleMonthDrill(m.month)}
            className="rounded-xl p-3 border transition-all duration-200 hover:border-[var(--color-brand-500)] text-left"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              borderColor: "var(--color-border-primary)",
            }}
          >
            <span className="text-xs font-spartan font-semibold block mb-1.5" style={{ color: "var(--color-text-primary)" }}>
              {m.label}
            </span>
            {/* Mini progress bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-hover)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(m.pct * 100).toFixed(0)}%`,
                  backgroundColor: m.pct >= 0.8 ? "var(--color-brand-500)" : m.pct >= 0.5 ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.25)",
                }}
              />
            </div>
            {pctLabel !== null && (
              <span className="text-[10px] font-spartan tabular-nums mt-1 block" style={{ color: "var(--color-text-tertiary)" }}>
                {pctLabel}%
              </span>
            )}
            {pctLabel === null && (
              <span className="text-[10px] font-spartan mt-1 block" style={{ color: "var(--color-text-tertiary)" }}>—</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Expanded day panel (shared)
  const renderExpandedDay = () => {
    if (!expandedDay) return null;
    return (
      <div
        className="mt-3 rounded-xl border overflow-hidden week-expand-enter"
        style={{
          backgroundColor: "var(--color-surface-elevated)",
          borderColor: "var(--color-border-primary)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--color-border-primary)" }}>
          <span className="text-sm font-spartan font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {expandedDay.dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
          <span className="text-xs font-spartan tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>
            {expandedDay.completed}/{expandedDay.total} done
          </span>
        </div>
        <div className="p-2 space-y-1.5">
          {expandedDay.scheduled.map((habit) => {
            const entry = entries[habit._id]?.[expandedDay.date];
            const isCompleted = !!(entry && entry.completed);
            return (
              <DayHabitRow key={habit._id} habit={habit} isCompleted={isCompleted} onToggle={onToggle} dateStr={expandedDay.date} />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div data-tour="week-strip">
      {renderHeader()}

      {/* View-specific grid */}
      <div data-tour="ws-grid" className="ws-view-fade">
        {view === "week" && renderWeekCells(weekData)}
        {view === "month" && renderMonthGrid()}
        {view === "year" && renderYearGrid()}
      </div>

      {renderExpandedDay()}
    </div>
  );
});

WeekStrip.displayName = "WeekStrip";
export default WeekStrip;
