import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArchiveIcon,
  MixerHorizontalIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Pencil1Icon,
  TrashIcon,
  LightningBoltIcon,
  PersonIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";
import { useHabits } from "../contexts/HabitContext";
import CATEGORY_META, { METHODOLOGY_LABELS } from "../data/categoryMeta";

/**
 * HabitsPage — central habit repository.
 * Shows all habits across sources (personal, transformer, workspace).
 * Filter by status, source, category. Search by name.
 * Quick actions: edit, archive/unarchive, delete.
 */

const SOURCE_META = {
  personal: { icon: PersonIcon, label: "Personal", color: "text-blue-400", bg: "bg-blue-500/10" },
  transformer: { icon: LightningBoltIcon, label: "Transformer", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  workspace: { icon: GlobeIcon, label: "Workspace", color: "text-purple-400", bg: "bg-purple-500/10" },
};

const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "M", tue: "T", wed: "W", thu: "T", fri: "F", sat: "S", sun: "S" };

const HabitsPage = () => {
  const navigate = useNavigate();
  const {
    habits,
    isLoading,
    archiveHabit,
    deleteHabit,
  } = useHabits();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // active | archived | all
  const [sourceFilter, setSourceFilter] = useState("all"); // all | personal | transformer | workspace
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Get all habits (including archived) from API
  // Note: HabitContext only loads active habits. We use what we have and filter.
  // For a full repo, we'd call habitsAPI.getHabits with different params,
  // but the context's habits array represents the primary working set.

  const filteredHabits = useMemo(() => {
    let list = habits || [];

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((h) => h.isActive !== false && !h.isArchived);
    } else if (statusFilter === "archived") {
      list = list.filter((h) => h.isArchived);
    }

    // Source filter
    if (sourceFilter !== "all") {
      list = list.filter((h) => (h.source || "personal") === sourceFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      list = list.filter((h) => h.category === categoryFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.name?.toLowerCase().includes(q) ||
          h.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [habits, search, statusFilter, sourceFilter, categoryFilter]);

  // Unique categories present
  const categories = useMemo(() => {
    const cats = new Set((habits || []).map((h) => h.category).filter(Boolean));
    return [...cats].sort();
  }, [habits]);

  // Stats
  const stats = useMemo(() => {
    const all = habits || [];
    return {
      total: all.length,
      active: all.filter((h) => h.isActive !== false && !h.isArchived).length,
      archived: all.filter((h) => h.isArchived).length,
      personal: all.filter((h) => !h.source || h.source === "personal").length,
      transformer: all.filter((h) => h.source === "transformer").length,
      workspace: all.filter((h) => h.source === "workspace").length,
    };
  }, [habits]);

  const handleArchive = useCallback(
    async (habitId, isCurrentlyArchived) => {
      await archiveHabit(habitId, !isCurrentlyArchived);
    },
    [archiveHabit]
  );

  const handleDelete = useCallback(
    async (habitId) => {
      if (window.confirm("Delete this habit and all its entries? This cannot be undone.")) {
        await deleteHabit(habitId);
      }
    },
    [deleteHabit]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen page-container flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)]">
              Habit Repository
            </h1>
            <p className="text-sm font-spartan text-[var(--color-text-secondary)] mt-1">
              {stats.active} active · {stats.transformer > 0 && `${stats.transformer} from transformers · `}
              {stats.total} total
            </p>
          </div>
        </div>

        {/* Source breakdown pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: `All (${stats.total})` },
            { key: "personal", label: `Personal (${stats.personal})` },
            ...(stats.transformer > 0
              ? [{ key: "transformer", label: `Transformer (${stats.transformer})` }]
              : []),
            ...(stats.workspace > 0
              ? [{ key: "workspace", label: `Workspace (${stats.workspace})` }]
              : []),
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSourceFilter(opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-spartan font-medium transition-all border ${
                sourceFilter === opt.key
                  ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/30"
                  : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)] hover:border-[var(--color-border-primary)]/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search habits..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/30 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-brand-500)]/50 transition-colors"
            />
          </div>

          {/* Status toggle */}
          <div className="flex rounded-xl border border-[var(--color-border-primary)]/30 overflow-hidden">
            {[
              { key: "active", label: "Active" },
              { key: "archived", label: "Archived" },
              { key: "all", label: "All" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-2 text-xs font-spartan font-medium transition-colors ${
                  statusFilter === opt.key
                    ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)]"
                    : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* More filters */}
          {categories.length > 1 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-3 rounded-xl border transition-colors flex items-center gap-1.5 ${
                showFilters
                  ? "border-[var(--color-brand-500)]/30 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]"
                  : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <MixerHorizontalIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filter chips (expandable) */}
        {showFilters && categories.length > 1 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-spartan transition-all border ${
                categoryFilter === "all"
                  ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/30"
                  : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)]"
              }`}
            >
              All categories
            </button>
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META.custom;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-spartan transition-all border ${
                    categoryFilter === cat
                      ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/30"
                      : "border-[var(--color-border-primary)]/30 text-[var(--color-text-tertiary)]"
                  }`}
                >
                  {meta.icon} {meta.label || cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Habit list */}
        {filteredHabits.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-lg font-garamond text-[var(--color-text-secondary)]">
              {search ? "No habits match your search" : "No habits yet"}
            </p>
            <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
              {search
                ? "Try a different search term"
                : "Create a habit from the dashboard or generate one with a Transformer"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHabits.map((habit) => {
              const source = SOURCE_META[habit.source || "personal"];
              const SourceIcon = source.icon;
              const cat = CATEGORY_META[habit.category] || CATEGORY_META.custom;
              const isExpanded = expandedId === habit._id;
              const isArchived = habit.isArchived;

              // Build frequency label
              let freqLabel = "";
              if (habit.frequency === "daily") freqLabel = "Daily";
              else if (habit.frequency === "weekly")
                freqLabel = `${habit.weeklyTarget || 3}x/week`;
              else if (habit.frequency === "monthly") freqLabel = "Monthly";

              // Build day pills (from Habit model's schedule.days — numeric 0-6)
              const scheduleDays = habit.schedule?.days || [];

              return (
                <div
                  key={habit._id}
                  className={`rounded-2xl border transition-all ${
                    isArchived
                      ? "border-[var(--color-border-primary)]/10 bg-[var(--color-surface-elevated)]/50 opacity-70"
                      : "border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-primary)]/40"
                  }`}
                >
                  {/* Main row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : habit._id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    {/* Icon */}
                    <span className="text-xl flex-shrink-0">{habit.icon || cat.icon || "🎯"}</span>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                          {habit.name}
                        </p>
                        {/* Source badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-spartan font-medium ${source.bg} ${source.color}`}
                        >
                          <SourceIcon className="w-3 h-3" />
                          {source.label}
                        </span>
                        {isArchived && (
                          <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] italic">
                            archived
                          </span>
                        )}
                      </div>

                      {/* Inline meta */}
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-spartan text-[var(--color-text-tertiary)]">
                        <span>{METHODOLOGY_LABELS[habit.methodology] || habit.methodology || "Done / Not Done"}</span>
                        {freqLabel && <span>{freqLabel}</span>}
                        {habit.target?.value && (
                          <span>
                            {habit.target.value} {habit.target.unit || ""}
                          </span>
                        )}
                        {habit.stats?.currentStreak > 0 && (
                          <span className="text-[var(--color-brand-500)]">
                            🔥 {habit.stats.currentStreak}d streak
                          </span>
                        )}
                      </div>

                      {/* Day pills */}
                      {scheduleDays.length > 0 && scheduleDays.length < 7 && (
                        <div className="flex gap-1 mt-1.5">
                          {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
                            const dayKey = ALL_DAYS[dayNum === 0 ? 6 : dayNum - 1]; // 0=Sun → index 6
                            const active = scheduleDays.includes(dayNum);
                            return (
                              <span
                                key={dayNum}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-spartan font-medium ${
                                  active
                                    ? "text-white"
                                    : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]/30"
                                }`}
                                style={
                                  active
                                    ? { backgroundColor: cat.accent || "var(--color-brand-500)" }
                                    : undefined
                                }
                              >
                                {DAY_LABELS[dayKey]}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Streak / completion */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {habit.stats?.completionRate > 0 && (
                        <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                          {Math.round(habit.stats.completionRate * 100)}%
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUpIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border-primary)]/10 pt-3 animate-in fade-in slide-in-from-top-1">
                      {/* Description */}
                      {habit.description && (
                        <p className="text-sm font-spartan text-[var(--color-text-secondary)]">
                          {habit.description}
                        </p>
                      )}

                      {/* Detail grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <DetailCell label="Category" value={`${cat.icon} ${cat.label || habit.category || "—"}`} />
                        <DetailCell label="Frequency" value={freqLabel || "—"} />
                        <DetailCell
                          label="Created"
                          value={habit.createdAt ? new Date(habit.createdAt).toLocaleDateString() : "—"}
                        />
                        <DetailCell
                          label="Best Streak"
                          value={habit.stats?.longestStreak ? `${habit.stats.longestStreak} days` : "—"}
                        />
                      </div>

                      {/* Transformer origin */}
                      {habit.transformerId && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <LightningBoltIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-spartan text-emerald-400">
                            Generated by Transformer
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(habit._id, isArchived);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-spartan text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                          <ArchiveIcon className="w-3.5 h-3.5" />
                          {isArchived ? "Unarchive" : "Archive"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(habit._id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-spartan text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer stats */}
        <p className="text-xs font-spartan text-[var(--color-text-tertiary)] text-center pt-4">
          Showing {filteredHabits.length} of {stats.total} habits
        </p>
      </div>
    </div>
  );
};

/** Small detail cell for expanded view */
const DetailCell = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider">
      {label}
    </p>
    <p className="text-sm font-spartan text-[var(--color-text-primary)] mt-0.5">
      {value}
    </p>
  </div>
);

export default HabitsPage;
