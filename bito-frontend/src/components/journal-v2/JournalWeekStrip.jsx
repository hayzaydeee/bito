import React, { useState, useMemo, useCallback, memo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@radix-ui/react-icons';

/* ═══════════════════════════════════════════════════════════════
   JournalWeekStrip — 7-day navigation strip with indicator dots
   + calendar popover for date jumping
   ═══════════════════════════════════════════════════════════════ */

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isToday = (d) => isSameDay(d, new Date());

/* ── Single day cell ─────────────────────────────────────────── */
const DayCell = memo(({ date, isSelected, isCurrentDay, indicator, onSelect }) => {
  const dateStr = toDateStr(date);
  const hasEntry = !!indicator;
  const hasLongform = indicator?.hasLongform;

  return (
    <button
      onClick={() => onSelect(dateStr)}
      className="flex flex-col items-center gap-0.5 py-2 px-2.5 sm:px-3 rounded-xl transition-all duration-200 min-w-[40px] group"
      style={{
        backgroundColor: isSelected
          ? 'var(--color-brand-500)'
          : 'transparent',
        color: isSelected
          ? 'white'
          : isCurrentDay
          ? 'var(--color-brand-500)'
          : 'var(--color-text-primary)',
      }}
      aria-label={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      aria-pressed={isSelected}
    >
      {/* Day letter */}
      <span className="text-[10px] font-spartan font-semibold uppercase opacity-60">
        {DAY_LABELS[date.getDay()]}
      </span>

      {/* Day number */}
      <span className={`text-sm font-spartan font-bold leading-none ${isSelected ? '' : 'group-hover:text-[var(--color-brand-500)]'}`}>
        {date.getDate()}
      </span>

      {/* Indicator dot */}
      <div className="h-1.5 flex items-center justify-center gap-0.5">
        {hasLongform && (
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-brand-400)' }}
          />
        )}
        {indicator?.hasMicro && !hasLongform && (
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--color-text-tertiary)' }}
          />
        )}
      </div>
    </button>
  );
});
DayCell.displayName = 'DayCell';

/* ── Calendar popover ────────────────────────────────────────── */
const CalendarPopover = memo(({ selectedDate, onSelect, onClose, indicators }) => {
  const selected = parseDate(selectedDate);
  const [viewMonth, setViewMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startPad = firstDay.getDay();
    const result = [];

    // Padding days from previous month
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      result.push({ date: d, isCurrentMonth: false });
    }

    // Days in current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      result.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i), isCurrentMonth: true });
    }

    // Padding days to complete grid
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() + i);
      result.push({ date: d, isCurrentMonth: false });
    }

    return result;
  }, [viewMonth]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelect(toDateStr(now));
    onClose();
  };

  return (
    <div
      className="absolute top-full mt-2 right-0 z-50 p-4 rounded-2xl shadow-xl border"
      style={{
        backgroundColor: 'var(--color-surface-primary)',
        borderColor: 'var(--color-border-primary)',
        minWidth: '300px',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <span className="text-sm font-spartan font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-spartan font-semibold uppercase py-1"
            style={{ color: 'var(--color-text-tertiary)' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map(({ date, isCurrentMonth }, i) => {
          const ds = toDateStr(date);
          const isSel = ds === selectedDate;
          const isTdy = isToday(date);
          const ind = indicators[ds];
          const isFuture = date > new Date();

          return (
            <button
              key={i}
              onClick={() => { if (!isFuture) { onSelect(ds); onClose(); } }}
              disabled={isFuture}
              className="relative flex flex-col items-center justify-center w-full aspect-square rounded-lg transition-all text-xs font-spartan"
              style={{
                backgroundColor: isSel ? 'var(--color-brand-500)' : 'transparent',
                color: isSel
                  ? 'white'
                  : !isCurrentMonth || isFuture
                  ? 'var(--color-text-tertiary)'
                  : isTdy
                  ? 'var(--color-brand-500)'
                  : 'var(--color-text-primary)',
                fontWeight: isTdy || isSel ? 700 : 500,
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.4 : 1,
              }}
            >
              {date.getDate()}
              {ind && (
                <div
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: isSel ? 'rgba(255,255,255,0.7)' : 'var(--color-brand-400)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <button
        onClick={goToToday}
        className="w-full mt-3 py-1.5 rounded-lg text-xs font-spartan font-semibold transition-colors hover:bg-[var(--color-surface-hover)]"
        style={{ color: 'var(--color-brand-500)' }}
      >
        Today
      </button>
    </div>
  );
});
CalendarPopover.displayName = 'CalendarPopover';

/* ── Main component ──────────────────────────────────────────── */
const JournalWeekStrip = ({ selectedDate, onSelect, indicators = {} }) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Build 7-day array centered on selected date's week
  const weekDays = useMemo(() => {
    const sel = parseDate(selectedDate);
    const startOfWeek = new Date(sel);
    startOfWeek.setDate(sel.getDate() - sel.getDay()); // Sunday start

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const navigateWeek = useCallback((direction) => {
    const sel = parseDate(selectedDate);
    sel.setDate(sel.getDate() + direction * 7);
    // Don't go into future
    const now = new Date();
    if (sel > now) return;
    onSelect(toDateStr(sel));
  }, [selectedDate, onSelect]);

  return (
    <div className="relative">
      {/* Week strip with calendar toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors flex-shrink-0"
          aria-label="Previous week"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-between">
          {weekDays.map(day => (
            <DayCell
              key={toDateStr(day)}
              date={day}
              isSelected={toDateStr(day) === selectedDate}
              isCurrentDay={isToday(day)}
              indicator={indicators[toDateStr(day)]}
              onSelect={onSelect}
            />
          ))}
        </div>

        <button
          onClick={() => navigateWeek(1)}
          className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors flex-shrink-0"
          aria-label="Next week"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        {/* Calendar toggle */}
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors flex-shrink-0 ml-0.5"
          aria-label="Open calendar"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar popover */}
      {calendarOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCalendarOpen(false)} />
          <CalendarPopover
            selectedDate={selectedDate}
            onSelect={onSelect}
            onClose={() => setCalendarOpen(false)}
            indicators={indicators}
          />
        </>
      )}
    </div>
  );
};

export default memo(JournalWeekStrip);
