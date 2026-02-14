import React, { useMemo, memo } from "react";
import { habitUtils } from "../../utils/habitLogic";

/* ─── 7-day compact heatmap strip ─── */
const WeekStrip = memo(({ habits, entries }) => {
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

      return { date, shortDay, isToday, pct, total, completed };
    });
  }, [habits, entries]);

  /* Color intensity based on % */
  const cellColor = (pct) => {
    if (pct === 0) return "var(--color-surface-hover)";
    if (pct < 0.5) return "rgba(99,102,241,0.25)";
    if (pct < 1) return "rgba(99,102,241,0.5)";
    return "var(--color-brand-500)";
  };

  return (
    <div>
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

            {/* Heatmap cell */}
            <div
              className="w-full aspect-square rounded-lg transition-colors duration-300 relative"
              style={{ backgroundColor: cellColor(day.pct) }}
              title={`${day.shortDay}: ${day.completed}/${day.total}`}
            >
              {/* Today ring indicator */}
              {day.isToday && (
                <div
                  className="absolute inset-0 rounded-lg border-2"
                  style={{ borderColor: "var(--color-brand-500)" }}
                />
              )}
            </div>

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
    </div>
  );
});

WeekStrip.displayName = "WeekStrip";
export default WeekStrip;
