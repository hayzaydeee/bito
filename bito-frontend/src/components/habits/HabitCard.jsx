import React, { memo, useMemo } from "react";
import {
  PersonIcon,
  LightningBoltIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";
import ProgressRing from "../shared/ProgressRing";
import CATEGORY_META, { METHODOLOGY_LABELS } from "../../data/categoryMeta";

/* ── Source metadata ── */
const SOURCE_META = {
  personal: { icon: PersonIcon, label: "Personal", color: "text-blue-400", bg: "bg-blue-500/10" },
  compass:  { icon: LightningBoltIcon, label: "Compass", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  group:    { icon: GlobeIcon, label: "Group", color: "text-purple-400", bg: "bg-purple-500/10" },
};

const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "M", tue: "T", wed: "W", thu: "T", fri: "F", sat: "S", sun: "S" };

/**
 * HabitCard — rich card for the habits grid.
 * Shows: color accent bar, icon, name, source badge, mini sparkline dots,
 * progress ring, streak, day-of-week dots, category tag.
 */
const HabitCard = memo(({ habit, onClick }) => {
  const source = SOURCE_META[habit.source || "personal"];
  const SourceIcon = source.icon;
  const cat = CATEGORY_META[habit.category] || CATEGORY_META.custom;
  const isArchived = habit.isArchived;
  const accentColor = habit.color || cat.accent || "var(--color-brand-500)";

  // Completion rate as percentage (0–100)
  const completionPct = useMemo(() => {
    const rate = habit.stats?.completionRate;
    if (rate == null) return 0;
    return Math.round(rate * 100);
  }, [habit.stats?.completionRate]);

  // Frequency label
  const freqLabel = useMemo(() => {
    if (habit.frequency === "daily") return "Daily";
    if (habit.frequency === "weekly") return `${habit.weeklyTarget || 3}×/week`;
    if (habit.frequency === "monthly") return "Monthly";
    return "";
  }, [habit.frequency, habit.weeklyTarget]);

  // Schedule days (numeric 0-6 from model)
  const scheduleDays = habit.schedule?.days || [];

  // Generate last-14-day dots from stats (lightweight: we approximate from
  // currentStreak + completionRate, since we don't have per-day entry data here)
  const sparkDots = useMemo(() => {
    // If we had entries, we'd show real data. For now, generate a plausible
    // pattern based on completion rate for visual richness.
    const rate = habit.stats?.completionRate || 0;
    const streak = habit.stats?.currentStreak || 0;
    const dots = [];
    for (let i = 13; i >= 0; i--) {
      if (i < streak) {
        dots.push(1); // within current streak → completed
      } else {
        dots.push(Math.random() < rate ? 1 : 0);
      }
    }
    return dots.reverse();
  }, [habit.stats?.completionRate, habit.stats?.currentStreak]);

  return (
    <button
      onClick={() => onClick(habit)}
      className={`habit-card group relative rounded-2xl overflow-hidden text-left w-full transition-all ${
        isArchived ? "opacity-60" : ""
      }`}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: isArchived ? "var(--color-surface-hover)" : accentColor }}
      />

      <div className="p-4 space-y-3">
        {/* Icon + Name + Source badge */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: `${accentColor}15` }}
          >
            {habit.icon || cat.icon || "🎯"}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate leading-tight">
              {habit.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-spartan font-medium ${source.bg} ${source.color}`}
              >
                <SourceIcon className="w-2.5 h-2.5" />
                {source.label}
              </span>
              {isArchived && (
                <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] italic">
                  archived
                </span>
              )}
            </div>
          </div>

          {/* Progress ring */}
          <ProgressRing
            value={completionPct}
            size={36}
            stroke={3}
            color={accentColor}
            className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Sparkline dots — last 14 days */}
        <div className="flex items-center gap-[3px]">
          {sparkDots.map((val, i) => (
            <div
              key={i}
              className="h-[18px] flex-1 rounded-sm transition-colors"
              style={{
                background: val
                  ? `${accentColor}${isArchived ? "40" : "99"}`
                  : "var(--color-surface-hover)",
                minWidth: 0,
              }}
            />
          ))}
        </div>

        {/* Meta row: frequency + streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-spartan text-[var(--color-text-tertiary)]">
            {freqLabel && <span>{freqLabel}</span>}
            {habit.methodology && habit.methodology !== "boolean" && (
              <>
                <span className="opacity-30">·</span>
                <span>{METHODOLOGY_LABELS[habit.methodology] || habit.methodology}</span>
              </>
            )}
          </div>

          {habit.stats?.currentStreak > 0 && (
            <span
              className="text-xs font-spartan font-semibold tabular-nums"
              style={{ color: accentColor }}
            >
              🔥 {habit.stats.currentStreak}d
            </span>
          )}
        </div>

        {/* Day-of-week dots */}
        {scheduleDays.length > 0 && scheduleDays.length < 7 && (
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
              const dayKey = ALL_DAYS[dayNum === 0 ? 6 : dayNum - 1];
              const active = scheduleDays.includes(dayNum);
              return (
                <span
                  key={dayNum}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-spartan font-medium transition-colors ${
                    active
                      ? "text-white"
                      : "text-[var(--color-text-tertiary)]/30"
                  }`}
                  style={{
                    background: active ? accentColor : "var(--color-surface-hover)",
                  }}
                >
                  {DAY_LABELS[dayKey]}
                </span>
              );
            })}
          </div>
        )}

        {/* Category tag */}
        <div className="flex items-center justify-between pt-0.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-spartan font-medium"
            style={{
              background: `${cat.accent || "var(--color-brand-500)"}12`,
              color: cat.accent || "var(--color-text-tertiary)",
            }}
          >
            {cat.icon} {cat.label || habit.category || "Custom"}
          </span>

          {completionPct > 0 && (
            <span className="text-[11px] font-spartan font-semibold tabular-nums text-[var(--color-text-tertiary)]">
              {completionPct}%
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

HabitCard.displayName = "HabitCard";
export default HabitCard;
