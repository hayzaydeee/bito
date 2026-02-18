import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   MetricCards -- 4-5 compact stat cards with accent glow + trend
   Desktop: 4-col grid  |  Mobile: 2-col grid
   Weekly habits tracked via weeks-met metric, not daily possible.
----------------------------------------------------------------- */

const MetricCards = ({ habits, entries, timeRange, accountAgeDays = 365 }) => {
  const data = useMemo(() => {
    if (!habits.length) return { total: 0, completions: 0, rate: 0, bestStreak: 0, prevRate: 0, weeklyMet: 0, weeklyTotal: 0 };

    const days = timeRange === 'all' ? accountAgeDays : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Previous period for trend comparison
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    // Separate daily and weekly habits
    const dailyHabits = habits.filter(h => h.frequency !== 'weekly');
    const weeklyHabits = habits.filter(h => h.frequency === 'weekly');

    let completions = 0, possible = 0, bestStreak = 0;
    let prevCompletions = 0, prevPossible = 0;

    // ── Daily habits: per-day counting ──
    dailyHabits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      let streak = 0;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
        possible++;
        const entry = hEntries[dateStr];
        if (entry && entry.completed) { completions++; streak++; if (streak > bestStreak) bestStreak = streak; }
        else { streak = 0; }
      }

      for (let d = new Date(prevStart); d < startDate; d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
        prevPossible++;
        const entry = hEntries[dateStr];
        if (entry && entry.completed) prevCompletions++;
      }
    });

    // ── Weekly habits: per-week counting ──
    let weeklyMet = 0, weeklyPossible = 0;
    let bestWeeklyStreak = 0;

    weeklyHabits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      const target = habit.weeklyTarget || 3;
      let weekStreak = 0;

      // Walk through weeks in the time range
      const ws = getMonday(new Date(startDate));
      for (let w = new Date(ws); w <= endDate; w.setDate(w.getDate() + 7)) {
        const weekEnd = new Date(w);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd < startDate) continue;

        let count = 0;
        for (let d = new Date(w); d <= weekEnd && d <= endDate; d.setDate(d.getDate() + 1)) {
          const entry = hEntries[fmtDate(d)];
          if (entry && entry.completed) count++;
        }

        weeklyPossible++;
        if (count >= target) {
          weeklyMet++;
          weekStreak++;
          if (weekStreak > bestWeeklyStreak) bestWeeklyStreak = weekStreak;
        } else {
          weekStreak = 0;
        }
      }
    });

    // Combine best streak (use whichever is higher, labeled appropriately)
    const rate = possible > 0 ? Math.round((completions / possible) * 100) : 0;
    const prevRate = prevPossible > 0 ? Math.round((prevCompletions / prevPossible) * 100) : 0;

    return {
      total: habits.filter(h => h.isActive !== false).length,
      completions,
      rate,
      bestStreak,
      bestWeeklyStreak,
      prevRate,
      weeklyMet,
      weeklyTotal: weeklyPossible,
      hasWeekly: weeklyHabits.length > 0,
    };
  }, [habits, entries, timeRange]);

  const rateDelta = data.rate - data.prevRate;

  const cards = [
    { label: 'Active Habits', value: data.total, icon: '📋',
      gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.03) 100%)',
      accent: 'var(--color-brand-400)', glow: 'rgba(99,102,241,0.12)' },
    { label: 'Completions', value: data.completions, icon: '✅',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.03) 100%)',
      accent: 'var(--color-success)', glow: 'rgba(16,185,129,0.12)' },
    { label: 'Success Rate', value: `${data.rate}%`, icon: '📈',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 100%)',
      accent: 'var(--color-info)', glow: 'rgba(59,130,246,0.12)',
      trend: rateDelta !== 0 ? rateDelta : null },
    { label: 'Best Streak', value: `${data.bestStreak}d`, icon: '🔥',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.03) 100%)',
      accent: 'var(--color-warning)', glow: 'rgba(245,158,11,0.12)' },
  ];

  // Add weekly goals card when weekly habits exist
  if (data.hasWeekly) {
    cards.push({
      label: 'Weekly Goals',
      value: `${data.weeklyMet}/${data.weeklyTotal}w`,
      icon: '🎯',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.03) 100%)',
      accent: '#8B5CF6',
      glow: 'rgba(139,92,246,0.12)',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3"
      style={cards.length > 4 ? { gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' } : undefined}
    >
      {cards.map(c => (
        <div
          key={c.label}
          className="relative overflow-hidden rounded-xl border border-[var(--color-border-primary)] p-4 flex flex-col gap-1 transition-shadow duration-200"
          style={{
            background: c.gradient,
            boxShadow: `0 2px 8px ${c.glow}`,
          }}
        >
          {/* Subtle glow orb */}
          <div
            className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-40"
            style={{ background: c.accent }}
          />

          <span className="text-lg relative z-10">{c.icon}</span>
          <span
            className="text-2xl font-garamond font-bold relative z-10"
            style={{ color: c.accent }}
          >
            {c.value}
          </span>
          <div className="flex items-center gap-1.5 relative z-10">
            <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
              {c.label}
            </span>
            {c.trend != null && (
              <span className={`text-[10px] font-spartan font-semibold ${c.trend > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                {c.trend > 0 ? '↑' : '↓'}{Math.abs(c.trend)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

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

export default MetricCards;
