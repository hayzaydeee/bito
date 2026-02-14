import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   ActivityHeatmap — GitHub-style heatmap with rounded cells
   Uses brand colour at varying opacities.
   Respects timeRange (7d / 30d / 90d / all).
----------------------------------------------------------------- */

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ActivityHeatmap = ({ habits, entries, timeRange }) => {
  const { weeks, maxActivity } = useMemo(() => {
    if (!habits.length) return { weeks: [], maxActivity: 0 };

    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Align to Sunday
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const weeksArr = [];
    let maxAct = 0;

    for (let d = new Date(gridStart); d <= endDate; ) {
      const week = [];
      for (let i = 0; i < 7 && d <= endDate; i++, d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dd}`;

        let completions = 0;
        let possible = 0;
        habits.forEach(h => {
          if (h.schedule?.days?.length && !h.schedule.days.includes(d.getDay())) return;
          possible++;
          const entry = (entries[h._id] || {})[dateStr];
          if (entry && entry.completed) completions++;
        });

        if (completions > maxAct) maxAct = completions;
        const inRange = d >= startDate;
        const isToday = dateStr === new Date().toISOString().split('T')[0];

        week.push({ dateStr, completions, possible, inRange, isToday, day: d.getDay() });
      }
      weeksArr.push(week);
    }

    return { weeks: weeksArr, maxActivity: maxAct };
  }, [habits, entries, timeRange]);

  if (!habits.length) {
    return (
      <div className="card p-6 flex items-center justify-center h-[200px]">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Activity data will appear here as you track habits
        </p>
      </div>
    );
  }

  const cellColor = (count) => {
    if (count === 0) return 'var(--color-surface-elevated)';
    const ratio = maxActivity > 0 ? count / maxActivity : 0;
    if (ratio <= 0.25) return 'rgba(99, 102, 241, 0.25)';
    if (ratio <= 0.5)  return 'rgba(99, 102, 241, 0.45)';
    if (ratio <= 0.75) return 'rgba(99, 102, 241, 0.65)';
    return 'rgba(99, 102, 241, 0.9)';
  };

  return (
    <div className="card p-5">
      <h3 className="text-base font-garamond font-semibold text-[var(--color-text-primary)] mb-4">
        Activity
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-[3px]">
          {/* Day labels column */}
          <div className="flex flex-col gap-[3px] pr-1">
            {DAY_LABELS.map((l, i) => (
              <div
                key={l}
                className="h-[14px] flex items-center text-[10px] font-spartan text-[var(--color-text-tertiary)]"
              >
                {i % 2 === 1 ? l : ''}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, ci) => (
                <div
                  key={ci}
                  title={cell.inRange ? `${cell.dateStr}: ${cell.completions}/${cell.possible}` : ''}
                  className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${
                    cell.isToday ? 'ring-1 ring-[var(--color-brand-400)]' : ''
                  }`}
                  style={{
                    backgroundColor: cell.inRange ? cellColor(cell.completions) : 'transparent',
                    opacity: cell.inRange ? 1 : 0.15,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] font-spartan text-[var(--color-text-tertiary)]">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div
            key={i}
            className="w-[12px] h-[12px] rounded-[2px]"
            style={{ backgroundColor: v === 0 ? 'var(--color-surface-elevated)' : `rgba(99,102,241,${0.25 + v * 0.65})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
