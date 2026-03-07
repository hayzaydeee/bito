import React, { memo, useMemo } from "react";
import ProgressRing from "../shared/ProgressRing";
import CATEGORY_META from "../../data/categoryMeta";

/**
 * HabitMetricCards — 4 summary stat cards with gradient backgrounds & glow orbs.
 * Modeled after analytics MetricCards. Uses habit.stats for lightweight data.
 */
const HabitMetricCards = memo(({ habits }) => {
  const data = useMemo(() => {
    const all = habits || [];
    const active = all.filter((h) => h.isActive !== false && !h.isArchived);

    // Avg completion rate
    const rates = active
      .map((h) => h.stats?.completionRate ?? null)
      .filter((r) => r !== null);
    const avgRate =
      rates.length > 0
        ? Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 100)
        : 0;

    // Best streak across all habits
    const bestStreak = all.reduce(
      (max, h) => Math.max(max, h.stats?.longestStreak || 0),
      0
    );

    // Total active streak days
    const totalCurrentStreak = active.reduce(
      (sum, h) => sum + (h.stats?.currentStreak || 0),
      0
    );

    // Top category by count
    const catCounts = {};
    active.forEach((h) => {
      const cat = h.category || "custom";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    const topCatMeta = topCat
      ? CATEGORY_META[topCat[0]] || CATEGORY_META.custom
      : null;

    return {
      activeCount: active.length,
      totalCount: all.length,
      avgRate,
      bestStreak,
      totalCurrentStreak,
      topCat: topCat ? { key: topCat[0], count: topCat[1], meta: topCatMeta } : null,
    };
  }, [habits]);

  const cards = [
    {
      label: "Active Habits",
      value: data.activeCount,
      icon: "📋",
      gradient:
        "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.03) 100%)",
      accent: "var(--color-brand-400)",
      glow: "rgba(99,102,241,0.12)",
      ring: data.totalCount > 0
        ? Math.round((data.activeCount / data.totalCount) * 100)
        : 0,
    },
    {
      label: "Avg. Completion",
      value: `${data.avgRate}%`,
      icon: "✅",
      gradient:
        "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.03) 100%)",
      accent: "#10b981",
      glow: "rgba(16,185,129,0.12)",
      ring: data.avgRate,
    },
    {
      label: "Best Streak",
      value: `${data.bestStreak}d`,
      icon: "🔥",
      gradient:
        "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.03) 100%)",
      accent: "#f59e0b",
      glow: "rgba(245,158,11,0.12)",
    },
    {
      label: data.topCat ? data.topCat.meta.label : "Top Category",
      value: data.topCat ? `${data.topCat.meta.icon} ${data.topCat.count}` : "—",
      gradient: data.topCat
        ? `linear-gradient(135deg, ${data.topCat.meta.accent}26 0%, ${data.topCat.meta.accent}08 100%)`
        : "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.03) 100%)",
      accent: data.topCat ? data.topCat.meta.accent : "#8b5cf6",
      glow: data.topCat
        ? `${data.topCat.meta.accent}1f`
        : "rgba(139,92,246,0.12)",
      icon: "🏷️",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
      data-tour="habits-metrics"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="habit-metric-card relative overflow-hidden rounded-xl border border-[var(--color-border-primary)] p-4 flex flex-col gap-1"
          style={{
            background: c.gradient,
            boxShadow: `0 2px 8px ${c.glow}`,
          }}
        >
          {/* Glow orb */}
          <div
            className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-40"
            style={{ background: c.accent }}
          />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-lg">{c.icon}</span>
            {c.ring != null && (
              <ProgressRing
                value={c.ring}
                size={28}
                stroke={2.5}
                color={c.accent}
              />
            )}
          </div>

          <span
            className="text-2xl font-garamond font-bold relative z-10"
            style={{ color: c.accent }}
          >
            {c.value}
          </span>

          <span className="text-xs font-spartan text-[var(--color-text-tertiary)] relative z-10">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
});

HabitMetricCards.displayName = "HabitMetricCards";
export default HabitMetricCards;
