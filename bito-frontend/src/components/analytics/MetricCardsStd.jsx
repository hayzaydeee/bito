import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   MetricCardsStd — DRILL "ledger strip".
   gap-px grid: --line bleeds through gaps → hairline ruled separators.
   Completion Rate removed (shown in page header instead).
   Cells: Active Habits · Completions · Best Streak · (Weekly Goals)
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
    if (!habits.length) return { total: 0, completions: 0, bestStreak: 0, weeklyMet: 0, weeklyTotal: 0, hasWeekly: false };

    const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const dailyHabits = habits.filter(h => h.frequency !== 'weekly');
    const weeklyHabits = habits.filter(h => h.frequency === 'weekly');

    let completions = 0, possible = 0, bestStreak = 0;

    dailyHabits.forEach(habit => {
      if (habit.isActive === false || habit.isArchived) return;

      const hEntries = entries[habit._id] || {};
      let streak = 0;
      const startBasis = habit.activatedAt ? new Date(habit.activatedAt) : (habit.createdAt ? new Date(habit.createdAt) : startDate);
      const effectiveStart = new Date(Math.max(startDate.getTime(), startBasis.getTime()));
      effectiveStart.setHours(0, 0, 0, 0);

      for (let d = new Date(effectiveStart); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
        possible++;
        const entry = hEntries[dateStr];
        if (entry?.completed) { completions++; streak++; if (streak > bestStreak) bestStreak = streak; }
        else streak = 0;
      }
    });

    let weeklyMet = 0, weeklyPossible = 0;
    weeklyHabits.forEach(habit => {
      if (habit.isActive === false || habit.isArchived) return;

      const hEntries = entries[habit._id] || {};
      const target = habit.weeklyTarget || 3;
      const startBasis = habit.activatedAt ? new Date(habit.activatedAt) : (habit.createdAt ? new Date(habit.createdAt) : startDate);
      const effectiveWeekStart = new Date(Math.max(startDate.getTime(), startBasis.getTime()));
      effectiveWeekStart.setHours(0, 0, 0, 0);
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

    return {
      total: habits.filter(h => h.isActive !== false).length,
      completions,
      bestStreak,
      weeklyMet,
      weeklyTotal: weeklyPossible,
      hasWeekly: weeklyHabits.length > 0,
    };
  }, [habits, entries, timeRange, accountAgeDays]);

  const cells = [
    { label: 'Active Habits', value: String(data.total).padStart(2, '0'), color: 'var(--ink)' },
    { label: 'Completions',   value: data.completions,                    color: 'var(--ink)' },
    { label: 'Best Streak',   value: `${data.bestStreak}d`,               color: 'var(--ember, var(--signal))' },
  ];

  if (data.hasWeekly) {
    cells.push({ label: 'Weekly Goals', value: `${data.weeklyMet}/${data.weeklyTotal}w`, color: 'var(--ink-2)' });
  }

  return (
    <div className="std-card overflow-hidden">
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)`, background: 'var(--line)' }}
      >
        {cells.map((c) => (
          <div key={c.label} className="bg-[var(--surface)] px-5 py-5 flex flex-col gap-1">
            <span className="std-num text-3xl font-bold tabular-nums leading-none" style={{ color: c.color }}>
              {c.value}
            </span>
            <span className="std-kicker text-[10px] text-[var(--ink-3)] mt-1">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricCardsStd;
