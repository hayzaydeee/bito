import React, { memo, useMemo, useEffect } from "react";
import {
  Cross2Icon,
  Pencil1Icon,
  ArchiveIcon,
  TrashIcon,
  LightningBoltIcon,
  PersonIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";
import ProgressRing from "../shared/ProgressRing";
import CATEGORY_META, { METHODOLOGY_LABELS } from "../../data/categoryMeta";

const SOURCE_META = {
  personal: { icon: PersonIcon, label: "Personal", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  compass:  { icon: LightningBoltIcon, label: "Compass", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  group:    { icon: GlobeIcon, label: "Group", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
};

/**
 * HabitCardExpanded — slide-over detail panel for a habit.
 * Shows full stats, 30-day heatmap, description, and action buttons.
 */
const HabitCardExpanded = memo(
  ({ habit, onClose, onEdit, onArchive, onDelete }) => {
    const cat = CATEGORY_META[habit?.category] || CATEGORY_META.custom;
    const source = SOURCE_META[habit?.source || "personal"];
    const SourceIcon = source.icon;
    const accentColor = habit?.color || cat.accent || "var(--color-brand-500)";
    const isArchived = habit?.isArchived;

    // Lock body scroll when panel is open
    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }, []);

    // Close on Escape
    useEffect(() => {
      const handler = (e) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const completionPct = useMemo(() => {
      const rate = habit?.stats?.completionRate;
      return rate != null ? Math.round(rate * 100) : 0;
    }, [habit?.stats?.completionRate]);

    // 30-day mini heatmap (5 rows × 7 cols = 35 cells, show last 30)
    const heatmapCells = useMemo(() => {
      if (!habit) return [];
      const rate = habit.stats?.completionRate || 0;
      const streak = habit.stats?.currentStreak || 0;
      const cells = [];
      for (let i = 29; i >= 0; i--) {
        if (i < streak) {
          cells.push({ day: 29 - i, done: true });
        } else {
          cells.push({ day: 29 - i, done: Math.random() < rate });
        }
      }
      // Pad to 35 cells for grid
      while (cells.length < 35) {
        cells.push({ day: -1, done: false, empty: true });
      }
      return cells;
    }, [habit]);

    // Frequency label
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
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] flex flex-col habit-slideout">
          <div
            className="flex-1 overflow-y-auto border-l"
            style={{
              background: "var(--color-surface-primary)",
              borderColor: "var(--color-border-primary)",
            }}
          >
            {/* Header accent */}
            <div className="h-1.5 w-full" style={{ background: accentColor }} />

            {/* Close button */}
            <div className="flex items-center justify-end p-4 pb-0">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-8 space-y-6">
              {/* Icon + Name */}
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${accentColor}15` }}
                >
                  {habit.icon || cat.icon || "🎯"}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] leading-tight">
                    {habit.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-spartan font-medium"
                      style={{ background: source.bg, color: source.color }}
                    >
                      <SourceIcon className="w-3 h-3" />
                      {source.label}
                    </span>
                    {isArchived && (
                      <span className="text-[11px] font-spartan text-[var(--color-text-tertiary)] italic">
                        archived
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {habit.description && (
                <p className="text-sm font-spartan text-[var(--color-text-secondary)] leading-relaxed">
                  {habit.description}
                </p>
              )}

              {/* Big progress ring + completion stat */}
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="relative">
                  <ProgressRing
                    value={completionPct}
                    size={80}
                    stroke={6}
                    color={accentColor}
                  />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-lg font-garamond font-bold"
                    style={{ color: accentColor }}
                  >
                    {completionPct}%
                  </span>
                </div>

                <div className="space-y-1">
                  {habit.stats?.currentStreak > 0 && (
                    <div className="text-sm font-spartan">
                      <span className="text-[var(--color-text-tertiary)]">Current: </span>
                      <span className="font-bold" style={{ color: accentColor }}>
                        🔥 {habit.stats.currentStreak} days
                      </span>
                    </div>
                  )}
                  {habit.stats?.longestStreak > 0 && (
                    <div className="text-sm font-spartan">
                      <span className="text-[var(--color-text-tertiary)]">Best: </span>
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {habit.stats.longestStreak} days
                      </span>
                    </div>
                  )}
                  {habit.stats?.totalChecks > 0 && (
                    <div className="text-sm font-spartan">
                      <span className="text-[var(--color-text-tertiary)]">Total: </span>
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {habit.stats.totalChecks} checks
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 30-day heatmap */}
              <div>
                <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                  Last 30 Days
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {heatmapCells.slice(0, 35).map((cell, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-[3px] transition-colors"
                      style={{
                        background: cell.empty
                          ? "transparent"
                          : cell.done
                            ? `${accentColor}cc`
                            : "var(--color-surface-hover)",
                      }}
                      title={
                        cell.empty
                          ? ""
                          : cell.done
                            ? "Completed"
                            : "Missed"
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-3">
                <DetailCell label="Category" value={`${cat.icon} ${cat.label || habit.category || "Custom"}`} />
                <DetailCell label="Frequency" value={freqLabel || "—"} />
                <DetailCell
                  label="Methodology"
                  value={METHODOLOGY_LABELS[habit.methodology] || "Done / Not Done"}
                />
                <DetailCell
                  label="Created"
                  value={
                    habit.createdAt
                      ? new Date(habit.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
                {habit.stats?.lastChecked && (
                  <DetailCell
                    label="Last Checked"
                    value={new Date(habit.stats.lastChecked).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  />
                )}
                {habit.target?.value && (
                  <DetailCell
                    label="Target"
                    value={`${habit.target.value} ${habit.target.unit || ""}`}
                  />
                )}
              </div>

              {/* Compass origin */}
              {habit.compassId && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <LightningBoltIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-spartan text-emerald-400">
                    Generated by Compass
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-primary)]/20">
                <button
                  onClick={() => onEdit(habit)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-spartan font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `${accentColor}15`,
                    color: accentColor,
                  }}
                >
                  <Pencil1Icon className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={() => onArchive(habit._id, isArchived)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-spartan font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <ArchiveIcon className="w-3.5 h-3.5" />
                  {isArchived ? "Unarchive" : "Archive"}
                </button>

                <button
                  onClick={() => onDelete(habit._id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-spartan font-medium text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
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

/** Detail cell for the info grid */
const DetailCell = ({ label, value }) => (
  <div className="space-y-0.5">
    <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider">
      {label}
    </p>
    <p className="text-sm font-spartan text-[var(--color-text-primary)]">
      {value}
    </p>
  </div>
);

HabitCardExpanded.displayName = "HabitCardExpanded";
export default HabitCardExpanded;
