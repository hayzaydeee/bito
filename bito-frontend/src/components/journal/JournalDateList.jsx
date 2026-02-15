import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   JournalDateList — scrollable date sidebar (desktop) or
   horizontal date strip (mobile).
   Shows last N days with dot indicators for entries that exist.
----------------------------------------------------------------- */

const JournalDateList = ({ selectedDate, onSelect, indicators = {}, days = 30, isMobile = false }) => {
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      arr.push({
        dateStr: `${y}-${m}-${dd}`,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
      });
    }
    return arr;
  }, [days]);

  /* ── Mobile: horizontal strip ────────────── */
  if (isMobile) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
        {dates.map(d => {
          const active = d.dateStr === selectedDate;
          const hasEntry = indicators[d.dateStr];
          return (
            <button
              key={d.dateStr}
              onClick={() => onSelect(d.dateStr)}
              className={`snap-start flex-shrink-0 flex flex-col items-center gap-0.5 w-12 py-2 rounded-xl transition-all
                ${active
                  ? 'bg-[var(--color-brand-600)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
            >
              <span className="text-[10px] font-spartan uppercase">{d.day}</span>
              <span className="text-sm font-garamond font-bold">{d.num}</span>
              {hasEntry && (
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/70' : 'bg-[var(--color-brand-400)]'}`} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Desktop: vertical list ──────────────── */
  return (
    <div className="w-48 flex-shrink-0 border-r border-[var(--color-border-primary)] overflow-y-auto h-full">
      <div className="p-3 space-y-0.5">
        {dates.map((d, i) => {
          const active = d.dateStr === selectedDate;
          const hasEntry = indicators[d.dateStr];
          const showMonth = i === 0 || dates[i - 1]?.month !== d.month;

          return (
            <React.Fragment key={d.dateStr}>
              {showMonth && (
                <div className="text-[10px] font-spartan uppercase tracking-wider text-[var(--color-text-tertiary)] pt-3 pb-1 px-2">
                  {d.month}
                </div>
              )}
              <button
                onClick={() => onSelect(d.dateStr)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                  ${active
                    ? 'bg-[var(--color-brand-600)] text-white'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
              >
                <span className={`text-xs font-spartan w-8 ${active ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'}`}>
                  {d.day}
                </span>
                <span className="text-sm font-garamond font-semibold flex-1">{d.num}</span>
                {d.isToday && (
                  <span className={`text-[9px] font-spartan uppercase ${active ? 'text-white/60' : 'text-[var(--color-brand-400)]'}`}>
                    today
                  </span>
                )}
                {hasEntry && !d.isToday && (
                  <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/60' : 'bg-[var(--color-brand-400)]'}`} />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default JournalDateList;
