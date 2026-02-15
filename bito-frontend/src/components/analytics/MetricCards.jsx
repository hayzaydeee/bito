import React, { useMemo } from 'react';

/* -----------------------------------------------------------------
   MetricCards -- 4 compact stat cards with accent glow + trend
   Desktop: 4-col grid  |  Mobile: 2-col grid
----------------------------------------------------------------- */

const MetricCards = ({ habits, entries, timeRange }) => {
  const data = useMemo(() => {
    if (!habits.length) return { total: 0, completions: 0, rate: 0, bestStreak: 0, prevRate: 0 };

    const days = timeRange === 'all' ? 365 : parseInt(timeRange) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Previous period for trend comparison
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    let completions = 0, possible = 0, bestStreak = 0;
    let prevCompletions = 0, prevPossible = 0;

    habits.forEach(habit => {
      const hEntries = entries[habit._id] || {};
      let streak = 0;

      // Current period
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
        possible++;
        const entry = hEntries[dateStr];
        if (entry && entry.completed) { completions++; streak++; if (streak > bestStreak) bestStreak = streak; }
        else { streak = 0; }
      }

      // Previous period
      for (let d = new Date(prevStart); d < startDate; d.setDate(d.getDate() + 1)) {
        const dateStr = fmtDate(d);
        if (habit.schedule?.days?.length && !habit.schedule.days.includes(d.getDay())) continue;
        prevPossible++;
        const entry = hEntries[dateStr];
        if (entry && entry.completed) prevCompletions++;
      }
    });

    const rate = possible > 0 ? Math.round((completions / possible) * 100) : 0;
    const prevRate = prevPossible > 0 ? Math.round((prevCompletions / prevPossible) * 100) : 0;

    return {
      total: habits.filter(h => h.isActive !== false).length,
      completions,
      rate,
      bestStreak,
      prevRate,
    };
  }, [habits, entries, timeRange]);

  const rateDelta = data.rate - data.prevRate;

  const cards = [
    { label: 'Active Habits', value: data.total, icon: '\uD83D\uDCCB',
      gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.03) 100%)',
      accent: 'var(--color-brand-400)', glow: 'rgba(99,102,241,0.12)' },
    { label: 'Completions', value: data.completions, icon: '\u2705',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.03) 100%)',
      accent: 'var(--color-success)', glow: 'rgba(16,185,129,0.12)' },
    { label: 'Success Rate', value: `${data.rate}%`, icon: '\uD83D\uDCC8',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 100%)',
      accent: 'var(--color-info)', glow: 'rgba(59,130,246,0.12)',
      trend: rateDelta !== 0 ? rateDelta : null },
    { label: 'Best Streak', value: `${data.bestStreak}d`, icon: '\uD83D\uDD25',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.03) 100%)',
      accent: 'var(--color-warning)', glow: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                {c.trend > 0 ? '\u2191' : '\u2193'}{Math.abs(c.trend)}%
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

export default MetricCards;
