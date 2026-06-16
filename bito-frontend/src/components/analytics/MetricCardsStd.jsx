import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   MetricCardsStd — DRILL "ledger strip" variant of MetricCards.
   gap-px grid trick: --line bleeds through gaps → hairline rules.
   Hero metric (Completion Rate) gets signal accent; streak = ember.
----------------------------------------------------------------- */

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

const MetricCardsStd = ({ habits, entries, timeRange, accountAgeDays = 365 }) => {
  const data = useMemo(() => {
    if (!habits.length) return { total: 0, completions: 0, rate: 0, bestStreak: 0, prevRate: 0, weeklyMet: 0, weeklyTotal: 0, hasWeekly: false };

    const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    const dailyHabits = habits.filter(h => h.frequency !== 'weekly');
    const weeklyHabits = habits.filter(h => h.frequency === 'weekly');

    let completions = 0, possible = 0, bestStreak = 0;
    let prevCompletions = 0, prevPossible = 0;

    dailyHabits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      let streak = 0;
      const habitCreatedAt = habit.createdAt ? new Date(habit.createdAt) : startDate;
      const effectiveStart   = new Date(Math.max(startDate.getTime(),  habitCreatedAt.getTime()));
      const effectivePrevStart = new Date(Math.max(prevStart.getTime(), habitCreatedAt.getTime()));

      for (let d = new Date(effectiveStart); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
        possible++;
        const entry = hEntries[dateStr];
        if (entry?.completed) { completions++; streak++; if (streak > bestStreak) bestStreak = streak; }
        else streak = 0;
      }

      for (let d = new Date(effectivePrevStart); d < startDate; d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
        prevPossible++;
        const entry = hEntries[dateStr];
        if (entry?.completed) prevCompletions++;
      }
    });

    let weeklyMet = 0, weeklyPossible = 0;
    weeklyHabits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      const target = habit.weeklyTarget || 3;
      const habitCreatedAt = habit.createdAt ? new Date(habit.createdAt) : startDate;
      const effectiveWeekStart = new Date(Math.max(startDate.getTime(), habitCreatedAt.getTime()));
      const ws = getMonday(new Date(effectiveWeekStart));
      for (let w = new Date(ws); w <= endDate; w.setDate(w.getDate() + 7)) {
        const weekEnd = new Date(w);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd < startDate) continue;
        let count = 0;
        for (let d = new Date(w); d <= weekEnd && d <= endDate; d.setDate(d.getDate() + 1)) {
          const entry = hEntries[fmtDate(d)];
          if (entry?.completed) count++;
        }
        weeklyPossible++;
        if (count >= target) weeklyMet++;
      }
    });

    const rate     = possible     > 0 ? Math.round((completions / possible)         * 100) : 0;
    const prevRate = prevPossible > 0 ? Math.round((prevCompletions / prevPossible) * 100) : 0;

    return {
      total: habits.filter(h => h.isActive !== false).length,
      completions,
      rate,
      bestStreak,
      prevRate,
      weeklyMet,
      weeklyTotal: weeklyPossible,
      hasWeekly: weeklyHabits.length > 0,
    };
  }, [habits, entries, timeRange, accountAgeDays]);

  const rateDelta = data.rate - data.prevRate;

  const cells = [
    {
      label: 'Completion Rate',
      value: `${data.rate}%`,
      color: 'var(--signal)',
      trend: rateDelta !== 0 ? rateDelta : null,
    },
    {
      label: 'Active Habits',
      value: String(data.total).padStart(2, '0'),
      color: 'var(--ink)',
    },
    {
      label: 'Completions',
      value: data.completions,
      color: 'var(--ink)',
    },
    {
      label: 'Best Streak',
      value: `${data.bestStreak}d`,
      color: 'var(--ember, var(--signal))',
    },
  ];

  if (data.hasWeekly) {
    cells.push({
      label: 'Weekly Goals',
      value: `${data.weeklyMet}/${data.weeklyTotal}w`,
      color: 'var(--ink-2)',
    });
  }

  return (
    <div className="std-card overflow-hidden">
      {/* gap-px + bg = hairline ruled separators between cells */}
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${Math.min(cells.length, 4)}, 1fr)`,
          background: 'var(--line)',
        }}
      >
        {cells.map((c) => (
          <div key={c.label} className="bg-[var(--surface)] px-5 py-5 flex flex-col gap-1">
            <span
              className="std-num text-3xl font-bold tabular-nums leading-none"
              style={{ color: c.color }}
            >
              {c.value}
            </span>
            <span className="std-kicker text-[10px] text-[var(--ink-3)] mt-1">{c.label}</span>
            {c.trend != null && (
              <span
                className="std-mono text-[10px] tabular-nums"
                style={{ color: c.trend > 0 ? 'var(--signal)' : 'var(--rose, #e11d48)' }}
              >
                {c.trend > 0 ? '▲' : '▼'} {Math.abs(c.trend)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricCardsStd;
