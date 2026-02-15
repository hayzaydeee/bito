import React, { useMemo, useState } from 'react';

/* -----------------------------------------------------------------
   ActivityHeatmap -- GitHub-style contribution heatmap
   Rounded cells with hover popover, brand gradient, responsive sizing
----------------------------------------------------------------- */

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const ActivityHeatmap = ({ habits, entries, timeRange }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  const { weeks, maxActivity, totalCompletions } = useMemo(() => {
    if (!habits.length) return { weeks: [], maxActivity: 0, totalCompletions: 0 };

    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Align to Sunday
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const weeksArr = [];
    let maxAct = 0;
    let totalComp = 0;

    for (let d = new Date(gridStart); d <= endDate; ) {
      const week = [];
      for (let i = 0; i < 7 && d <= endDate; i++, d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        let completions = 0;
        let possible = 0;

        habits.forEach(h => {
          if (h.schedule?.days?.length && !h.schedule.days.includes(d.getDay())) return;
          possible++;
          const entry = (entries[h._id] || {})[dateStr];
          if (entry && entry.completed) completions++;
        });

        if (completions > maxAct) maxAct = completions;
        totalComp += completions;
        const inRange = d >= startDate;
        const isToday = dateStr === fmtDate(new Date());
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        week.push({ dateStr, completions, possible, inRange, isToday, day: d.getDay(), label });
      }
      weeksArr.push(week);
    }

    return { weeks: weeksArr, maxActivity: maxAct, totalCompletions: totalComp };
  }, [habits, entries, timeRange]);

  if (!habits.length) {
    return (
      <div className="analytics-chart-card flex flex-col items-center justify-center h-[240px] gap-2">
        <span className="text-3xl opacity-40">📅</span>
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Activity data will appear as you track habits
        </p>
      </div>
    );
  }

  const cellColor = (count) => {
    if (count === 0) return 'rgba(99,102,241,0.06)';
    const ratio = maxActivity > 0 ? count / maxActivity : 0;
    if (ratio <= 0.25) return 'rgba(99,102,241,0.2)';
    if (ratio <= 0.5)  return 'rgba(99,102,241,0.4)';
    if (ratio <= 0.75) return 'rgba(99,102,241,0.6)';
    return 'rgba(99,102,241,0.85)';
  };

  return (
    <div className="analytics-chart-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)]">
          Activity
        </h3>
        {totalCompletions > 0 && (
          <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
            {totalCompletions} completions
          </span>
        )}
      </div>

      <div className="overflow-x-auto relative">
        <div className="inline-flex gap-[3px]">
          {/* Day labels column */}
          <div className="flex flex-col gap-[3px] pr-1.5">
            {DAY_LABELS.map((l, i) => (
              <div
                key={i}
                className="h-[13px] flex items-center text-[10px] font-spartan text-[var(--color-text-tertiary)]"
              >
                {l}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, ci) => (
                <div
                  key={ci}
                  className={`w-[13px] h-[13px] rounded-[3px] transition-all duration-150 cursor-default ${
                    cell.isToday ? 'ring-1.5 ring-[var(--color-brand-400)] ring-offset-1 ring-offset-[var(--color-surface-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: cell.inRange ? cellColor(cell.completions) : 'transparent',
                    opacity: cell.inRange ? 1 : 0.08,
                    transform: hoveredCell === `${wi}-${ci}` ? 'scale(1.3)' : 'scale(1)',
                  }}
                  onMouseEnter={() => cell.inRange && setHoveredCell(`${wi}-${ci}`)}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={cell.inRange ? `${cell.label}: ${cell.completions}/${cell.possible} completed` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.85].map((v, i) => (
          <div
            key={i}
            className="w-[11px] h-[11px] rounded-[2px]"
            style={{ backgroundColor: v === 0 ? 'rgba(99,102,241,0.06)' : `rgba(99,102,241,${v})` }}
          />
        ))}
        <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">More</span>
      </div>
    </div>
  );
};

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default ActivityHeatmap;
