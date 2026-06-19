import React, { useMemo, memo, useState, useCallback, useEffect } from "react";
import { habitUtils } from "../../utils/habitLogic";
import {
  CheckIcon,
  EyeOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { useWeekStartDay } from "../../hooks/useUserPreferences";
import HabitIcon from "../shared/HabitIcon";

/* ════════════════════════════════════════════
   WeekStrip — DRILL completion heat-rail
   Day strip for traversing past data (week/month/year).
   Shared across dashboard variants; signal heat tints.
   ════════════════════════════════════════════ */

/* ─── Inline habit row for the expanded day panel ─── */
const DayHabitRow = memo(({ habit, isCompleted, onToggle, onEdit, dateStr, readOnly, weekProgress }) => {
  const [animating, setAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    setAnimating(true);
    onToggle(habit._id, dateStr);
    setTimeout(() => setAnimating(false), 400);
  }, [habit._id, dateStr, onToggle]);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 border-b border-[var(--line)] last:border-b-0 transition-all duration-200 hover:bg-[var(--surface-2)]"
    >
      <button
        onClick={handleToggle}
        disabled={readOnly}
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: isCompleted ? "var(--signal)" : "var(--line-2)",
          backgroundColor: isCompleted ? "var(--signal)" : "transparent",
          transform: animating ? "scale(1.2)" : "scale(1)",
          cursor: readOnly ? "default" : "pointer",
          opacity: readOnly ? 0.8 : 1,
        }}
        aria-label={isCompleted ? `Uncheck ${habit.name}` : `Check ${habit.name}`}
      >
        {isCompleted && <CheckIcon className="w-3 h-3 text-[var(--signal-ink)]" />}
      </button>

      <HabitIcon icon={habit.icon || "Star"} size={16} className="flex-shrink-0" />

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className="std-display text-[15px] font-semibold truncate transition-colors duration-200"
          style={{
            color: isCompleted ? "var(--ink-3)" : "var(--ink)",
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {habit.name}
        </span>
        {weekProgress && (
          <span className="std-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--line-2)] text-[var(--ink-3)] flex-shrink-0 bg-[var(--surface-2)] mt-0.5">
            {weekProgress.completed}/{weekProgress.target} done
          </span>
        )}
      </div>

      {!readOnly && onEdit && (
        <button
          onClick={() => onEdit(habit)}
          className="p-1 rounded-md ml-auto flex-shrink-0 transition-opacity text-[var(--ink-2)]"
          aria-label={`Edit ${habit.name}`}
        >
          <Pencil1Icon className="w-3.5 h-3.5" />
        </button>
      )}
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
    <div className="flex items-center gap-0.5 rounded-[var(--r-pill)] p-0.5 border border-[var(--line)]">
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className="px-3 py-1 rounded-[var(--r-pill)] std-mono text-[11px] uppercase tracking-wider transition-all duration-200"
          style={{
            backgroundColor: value === v.value ? "var(--signal)" : "transparent",
            color: value === v.value ? "var(--signal-ink)" : "var(--ink-3)",
          }}
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
        <span key={i} className="text-center std-mono text-[10px] uppercase text-[var(--ink-3)]">
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
  if (pct === 0) return "var(--surface-2)";
  if (pct < 0.5) return "color-mix(in srgb, var(--signal) 28%, transparent)";
  if (pct < 1) return "color-mix(in srgb, var(--signal) 58%, transparent)";
  return "var(--signal)";
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

const WeekStrip = memo(({ habits, entries, onToggle, onEdit, fetchHabitEntries, variant = "daybook", readOnly = false, defaultExpandedDate = null }) => {
  const [weekStartDay] = useWeekStartDay();
  const [view, setView] = useState(() => {
    try { const v = localStorage.getItem('bito:weekstrip:view'); if (['week','month','year'].includes(v)) return v; } catch {}
    return 'week';
  }); // week | month | year
  const [anchor, setAnchor] = useState(() => new Date());
  const [expandedDate, setExpandedDate] = useState(defaultExpandedDate);
  const isControl = variant === "control";

  // View change resets expanded
  const handleViewChange = useCallback((v) => {
    setView(v);
    setExpandedDate(null);
    try { localStorage.setItem('bito:weekstrip:view', v); } catch {}
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
      return habitUtils.normalizeDate(habitUtils.getWeekStart(now, weekStartDay)) === habitUtils.normalizeDate(habitUtils.getWeekStart(anchor, weekStartDay));
    }
    if (view === "month") {
      return now.getFullYear() === anchor.getFullYear() && now.getMonth() === anchor.getMonth();
    }
    return now.getFullYear() === anchor.getFullYear();
  }, [view, anchor, weekStartDay]);

  // Fetch entries for the visible range
  useEffect(() => {
    if (!fetchHabitEntries || !habits.length) return;
    const { start, end } = habitUtils.getDateRangeForView(view, anchor, weekStartDay);
    habits.forEach((h) => fetchHabitEntries(h._id, start, end));
  }, [view, anchor, habits, fetchHabitEntries, weekStartDay]);

  // Range label
  const rangeLabel = useMemo(() => habitUtils.getRangeLabel(view, anchor, weekStartDay), [view, anchor, weekStartDay]);

  // ── WEEK data ──
  const weekData = useMemo(() => {
    if (view !== "week") return [];
    const ws = habitUtils.getWeekStart(anchor, weekStartDay);
    const dates = habitUtils.getWeekDates(ws, weekStartDay);
    return buildDayStats(dates, habits, entries);
  }, [view, anchor, habits, entries, weekStartDay]);

  // ── MONTH data ──
  const monthGrid = useMemo(() => {
    if (view !== "month") return [];
    const cells = habitUtils.getMonthCalendarGrid(anchor, weekStartDay);
    return buildDayStats(cells, habits, entries);
  }, [view, anchor, habits, entries, weekStartDay]);

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

  // Header: range label + view pills, centered nav below
  const renderHeader = () => (
    <div className="mb-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2
          className={isControl
            ? "std-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-2)]"
            : "std-display text-lg font-bold text-[var(--ink)]"}
        >
          {rangeLabel}
        </h2>
        <div data-tour="ws-view-pills">
          <ViewPills value={view} onChange={handleViewChange} />
        </div>
      </div>
      <div data-tour="ws-nav" className="flex items-center justify-center gap-2">
        <button onClick={handlePrev} className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors" aria-label="Previous">
          <ChevronLeftIcon className="w-4 h-4 text-[var(--ink-2)]" />
        </button>
        <button onClick={handleNext} className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors" aria-label="Next">
          <ChevronRightIcon className="w-4 h-4 text-[var(--ink-2)]" />
        </button>
        {!isCurrentPeriod && (
          <button onClick={handleToday} className="std-btn std-btn--signal std-btn--sm">
            Today
          </button>
        )}
      </div>
    </div>
  );

  // 7-cell week row
  const renderWeekCells = (data) => (
    <div className="flex items-end gap-1.5 sm:gap-2">
      {data.map((day) => (
        <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
          <span
            className="std-mono text-[9px] uppercase truncate w-full text-center"
            style={{ color: day.isToday ? "var(--signal)" : "var(--ink-3)" }}
          >
            {day.dayName || day.shortDay || ""}
          </span>
          <button
            onClick={() => day.total > 0 && handleCellClick(day.date)}
            className="w-full aspect-square rounded-md transition-colors duration-300 relative group"
            style={{
              backgroundColor: cellColor(day.pct),
              cursor: day.total > 0 ? "pointer" : "default",
              outline: expandedDate === day.date ? "2px solid var(--signal)" : "none",
              outlineOffset: "1px",
            }}
            aria-label={`${day.shortDay || ""}: ${day.completed}/${day.total}`}
            disabled={day.total === 0}
          >
            {day.isToday && (
              <div className="absolute inset-0 rounded-md border-2 pointer-events-none" style={{ borderColor: "var(--signal)" }} />
            )}
            {day.total > 0 && (
              <div className="absolute inset-0 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: "color-mix(in srgb, var(--signal) 70%, transparent)" }}>
                <EyeOpenIcon className="w-3.5 h-3.5 text-[var(--signal-ink)] sm:hidden" />
                <span className="hidden sm:block std-mono text-[9px] uppercase text-[var(--signal-ink)] text-center">View</span>
              </div>
            )}
          </button>
          {day.total > 0 && (
            <span className="std-mono text-[9px] tabular-nums text-[var(--ink-3)]">
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
      <DayLabels weekStartDay={weekStartDay} />
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
              outline: expandedDate === cell.date ? "2px solid var(--signal)" : "none",
              outlineOffset: "1px",
            }}
            aria-label={`${cell.date}: ${cell.completed}/${cell.total}`}
          >
            <span
              className="std-mono text-[10px] leading-none tabular-nums"
              style={{
                color: cell.isToday
                  ? "var(--signal)"
                  : cell.isCurrentMonth
                  ? "var(--ink-2)"
                  : "var(--ink-3)",
                fontWeight: cell.isToday ? 700 : 400,
              }}
            >
              {cell.day}
            </span>
            {cell.isToday && cell.isCurrentMonth && (
              <div className="absolute inset-0 rounded-md border-2 pointer-events-none" style={{ borderColor: "var(--signal)" }} />
            )}
            {cell.total > 0 && cell.isCurrentMonth && (
              <div className="absolute inset-0 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: "color-mix(in srgb, var(--signal) 70%, transparent)" }}>
                <EyeOpenIcon className="w-3 h-3 text-[var(--signal-ink)]" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Year — 12 mini-month blocks
  const renderYearGrid = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {yearData.map((m) => {
        const pctLabel = m.totalScheduled > 0 ? Math.round(m.pct * 100) : null;
        return (
          <button
            key={m.month}
            onClick={() => handleMonthDrill(m.month)}
            className="std-card std-card-hover p-3 text-left"
          >
            <span className="std-mono text-[10px] uppercase tracking-wider block mb-1.5 text-[var(--ink-2)]">
              {m.label}
            </span>
            <div className="h-1.5 rounded-full overflow-hidden bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(m.pct * 100).toFixed(0)}%`,
                  backgroundColor: cellColor(m.pct >= 1 ? 1 : m.pct > 0 ? Math.max(0.5, m.pct) : 0),
                }}
              />
            </div>
            <span className="std-mono text-[10px] tabular-nums mt-1 block text-[var(--ink-3)]">
              {pctLabel !== null ? `${pctLabel}%` : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );

  // Expanded day panel
  const renderExpandedDay = () => {
    if (!expandedDay) return null;
    return (
      <div className="std-card mt-3 overflow-hidden p-0 week-expand-enter">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)]">
          <span className="std-display text-sm font-bold text-[var(--ink)]">
            {expandedDay.dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
          <span className="std-mono text-[10px] tabular-nums uppercase text-[var(--ink-3)]">
            {expandedDay.completed}/{expandedDay.total} done
          </span>
        </div>
        <div>
          {expandedDay.scheduled.map((habit) => {
            const entry = entries[habit._id]?.[expandedDay.date];
            const isCompleted = !!(entry && entry.completed);
            
            let weekProgress = null;
            if (habitUtils.isWeeklyHabit(habit)) {
               weekProgress = habitUtils.getWeeklyProgress(habit, entries, expandedDay.dateObj);
            }

            return (
              <DayHabitRow 
                key={habit._id} 
                habit={habit} 
                isCompleted={isCompleted} 
                onToggle={onToggle} 
                onEdit={onEdit} 
                dateStr={expandedDay.date} 
                readOnly={readOnly} 
                weekProgress={weekProgress}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div data-tour="week-strip" className="std-card p-4">
      {renderHeader()}

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
