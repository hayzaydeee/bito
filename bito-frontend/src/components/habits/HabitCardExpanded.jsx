import React, { memo, useMemo, useEffect, useState } from "react";
import {
  Cross2Icon,
  Pencil1Icon,
  ArchiveIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import ProgressRing from "../shared/ProgressRing";
import CATEGORY_META from "../../data/categoryMeta";
import { useHabits } from "../../contexts/HabitContext";

/**
 * HabitCardExpanded — minimal slide-over detail panel.
 * Progress ring, 30-day heatmap, key stats, actions.
 */
const HabitCardExpanded = memo(
  ({ habit, onClose, onEdit, onArchive, onDelete }) => {
    const cat = CATEGORY_META[habit?.category] || CATEGORY_META.custom;
    const accentColor = habit?.color || cat.accent || "var(--color-brand-500)";
    const isArchived = habit?.isArchived;
    const { fetchHabitEntries, entries } = useHabits();

    // Fetch last 30 days of entries when panel opens
    useEffect(() => {
      if (!habit?._id) return;
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      fetchHabitEntries(
        habit._id,
        start.toISOString().split("T")[0],
        end.toISOString().split("T")[0]
      );
    }, [habit?._id, fetchHabitEntries]);

    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
      const handler = (e) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const completionPct = useMemo(() => {
      const rate = habit?.stats?.completionRate;
      return rate != null ? Math.round(rate) : 0;
    }, [habit?.stats?.completionRate]);

    // 30-day heatmap from real entries
    const heatmapCells = useMemo(() => {
      if (!habit?._id) return [];
      const habitEntries = entries[habit._id] || {};
      const cells = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const entry = habitEntries[key];
        cells.push({ done: entry?.completed === true });
      }

      // Pad to fill a 7-col grid (up to 35)
      while (cells.length < 35) cells.push({ empty: true });
      return cells;
    }, [habit?._id, entries]);

    const freqLabel = useMemo(() => {
      if (!habit) return "";
      if (habit.frequency === "daily") return "Daily";
      if (habit.frequency === "weekly") return `${habit.weeklyTarget || 3}×/week`;
      if (habit.frequency === "monthly") return "Monthly";
      return "";
    }, [habit]);

    if (!habit) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Panel */}
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] flex flex-col habit-slideout">
          <div
            className="flex-1 overflow-y-auto border-l"
            style={{
              background: "var(--color-surface-primary)",
              borderColor: "var(--color-border-primary)",
            }}
          >
            {/* Accent bar */}
            <div className="h-[3px] w-full" style={{ background: accentColor }} />

            {/* Close */}
            <div className="flex justify-end p-4 pb-0">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-8 space-y-8">
              {/* Icon + Name */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${accentColor}12` }}
                >
                  {habit.icon || cat.icon || "🎯"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] leading-tight">
                    {habit.name}
                  </h2>
                  {freqLabel && (
                    <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5">
                      {freqLabel}
                      {isArchived && " · Archived"}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {habit.description && (
                <p className="text-sm font-spartan text-[var(--color-text-secondary)] leading-relaxed">
                  {habit.description}
                </p>
              )}

              {/* Progress ring + streaks — centered */}
              <div className="flex items-center justify-center gap-8">
                <div className="relative">
                  <ProgressRing
                    value={completionPct}
                    size={72}
                    stroke={5}
                    color={accentColor}
                  />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-base font-garamond font-bold"
                    style={{ color: accentColor }}
                  >
                    {completionPct}%
                  </span>
                </div>

                <div className="space-y-2 text-sm font-spartan">
                  {habit.stats?.currentStreak > 0 && (
                    <p>
                      <span className="text-[var(--color-text-tertiary)]">Streak </span>
                      <span className="font-bold" style={{ color: accentColor }}>
                        {habit.stats.currentStreak}d
                      </span>
                    </p>
                  )}
                  {habit.stats?.longestStreak > 0 && (
                    <p>
                      <span className="text-[var(--color-text-tertiary)]">Best </span>
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {habit.stats.longestStreak}d
                      </span>
                    </p>
                  )}
                  {habit.stats?.totalChecks > 0 && (
                    <p>
                      <span className="text-[var(--color-text-tertiary)]">Total </span>
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {habit.stats.totalChecks}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* 30-day heatmap */}
              <div>
                <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">
                  Last 30 days
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {heatmapCells.slice(0, 35).map((cell, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-[3px]"
                      style={{
                        background: cell.empty
                          ? "transparent"
                          : cell.done
                            ? `${accentColor}cc`
                            : "var(--color-surface-hover)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-primary)]/15">
                <button
                  onClick={() => onEdit(habit)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-spartan font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `${accentColor}12`, color: accentColor }}
                >
                  <Pencil1Icon className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => onArchive(habit._id, isArchived)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-spartan font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <ArchiveIcon className="w-3.5 h-3.5" />
                  {isArchived ? "Unarchive" : "Archive"}
                </button>
                <button
                  onClick={() => onDelete(habit._id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-spartan font-medium text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

HabitCardExpanded.displayName = "HabitCardExpanded";
export default HabitCardExpanded;
