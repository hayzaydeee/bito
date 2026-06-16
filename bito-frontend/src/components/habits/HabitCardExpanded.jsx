import React, { memo, useMemo, useEffect } from "react";
import {
  Cross2Icon,
  Pencil1Icon,
  ArchiveIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import ProgressRing from "../shared/ProgressRing";
import CATEGORY_META from "../../data/categoryMeta";
import { useHabits } from "../../contexts/HabitContext";
import HabitIcon from "../shared/HabitIcon";

/**
 * HabitCardExpanded — DRILL slide-over dossier.
 * Per-habit colour on ring + heatmap; serif name, mono telemetry stats.
 */
const HabitCardExpanded = memo(
  ({ habit, onClose, onEdit, onArchive, onDelete }) => {
    const cat = CATEGORY_META[habit?.category] || CATEGORY_META.custom;
    const accentColor = habit?.color || cat.accent || "var(--signal)";
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

    const Stat = ({ label, value, accent }) => (
      <div>
        <p className="std-kicker">{label}</p>
        <p
          className="std-num text-lg font-bold tabular-nums mt-0.5"
          style={{ color: accent ? accentColor : "var(--ink)" }}
        >
          {value}
        </p>
      </div>
    );

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/45 z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Panel */}
        <div className="std fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] flex flex-col habit-slideout">
          <div
            className="flex-1 overflow-y-auto border-l border-[var(--line)]"
            style={{ background: "var(--surface)" }}
          >
            {/* Colour spine */}
            <div className="h-1 w-full" style={{ background: accentColor }} />

            {/* Close */}
            <div className="flex justify-end p-4 pb-0">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-[var(--r-btn)] flex items-center justify-center text-[var(--ink-3)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-8 space-y-7">
              {/* Icon + Name */}
              <div>
                <p className="std-kicker">Dossier · {isArchived ? "Archived" : "Active"}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div
                    className="w-12 h-12 rounded-[var(--r-card)] flex items-center justify-center flex-shrink-0"
                    style={{ background: `color-mix(in srgb, ${accentColor} 14%, transparent)` }}
                  >
                    <HabitIcon icon={habit.icon || cat.icon || "Target"} size={24} color={accentColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="std-display text-xl font-bold text-[var(--ink)] leading-tight">
                      {habit.name}
                    </h2>
                    {freqLabel && (
                      <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)] mt-1">
                        {freqLabel}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {habit.description && (
                <p className="std-display text-[15px] text-[var(--ink-2)] leading-relaxed italic">
                  {habit.description}
                </p>
              )}

              {/* Progress ring + telemetry */}
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <ProgressRing value={completionPct} size={72} stroke={5} color={accentColor} />
                  <span
                    className="absolute inset-0 flex items-center justify-center std-num text-base font-bold tabular-nums"
                    style={{ color: accentColor }}
                  >
                    {completionPct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-3 flex-1">
                  {habit.stats?.currentStreak > 0 && (
                    <Stat label="Streak" value={`${habit.stats.currentStreak}d`} accent />
                  )}
                  {habit.stats?.longestStreak > 0 && (
                    <Stat label="Best" value={`${habit.stats.longestStreak}d`} />
                  )}
                  {habit.stats?.totalChecks > 0 && (
                    <Stat label="Total" value={habit.stats.totalChecks} />
                  )}
                </div>
              </div>

              {/* 30-day heatmap */}
              <div>
                <p className="std-kicker mb-2">Last 30 days</p>
                <div className="grid grid-cols-7 gap-1">
                  {heatmapCells.slice(0, 35).map((cell, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-[3px]"
                      style={{
                        background: cell.empty
                          ? "transparent"
                          : cell.done
                            ? accentColor
                            : "var(--surface-2)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--line)]">
                <button onClick={() => onEdit(habit)} className="std-btn std-btn--sm gap-1.5">
                  <Pencil1Icon className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => onArchive(habit._id, isArchived)}
                  className="std-btn std-btn--sm gap-1.5"
                >
                  <ArchiveIcon className="w-3.5 h-3.5" />
                  {isArchived ? "Unarchive" : "Archive"}
                </button>
                <button
                  onClick={() => onDelete(habit._id)}
                  className="h-[34px] px-3 rounded-[var(--r-pill)] std-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 ml-auto transition-colors"
                  style={{ color: "var(--rose)" }}
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
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
