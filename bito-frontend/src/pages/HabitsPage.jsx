import { useState, useMemo, useCallback } from "react";
import { PlusIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useHabits } from "../contexts/HabitContext";
import { useAuth } from "../contexts/AuthContext";
import HabitCard from "../components/habits/HabitCard";
import HabitCardExpanded from "../components/habits/HabitCardExpanded";
import HabitsEmptyState from "../components/habits/HabitsEmptyState";
import HabitsSkeleton from "../components/habits/HabitsSkeleton";
import HabitModal from "../components/ui/HabitModal";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import AnimatedList from "../components/ui/AnimatedList";
import { motion } from "framer-motion";
import { listItemVariants } from "../utils/motion";

/**
 * HabitsPage — redesigned habit collection / gallery page.
 * Thin orchestrator composing sub-components from components/habits/.
 */
const HabitsPage = () => {
  const { user } = useAuth();
  const {
    habits,
    isLoading,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
  } = useHabits();

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // ── Derived data ──

  const filteredHabits = useMemo(() => {
    let list = habits || [];

    if (statusFilter === "active") {
      list = list.filter((h) => h.isActive !== false && !h.isArchived);
    } else if (statusFilter === "archived") {
      list = list.filter((h) => h.isArchived);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.name?.toLowerCase().includes(q) ||
          h.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [habits, search, statusFilter]);

  const totalCount = (habits || []).length;
  const activeCount = (habits || []).filter((h) => h.isActive !== false && !h.isArchived).length;

  // ── Handlers ──

  const handleArchive = useCallback(
    async (habitId, isCurrentlyArchived) => {
      await archiveHabit(habitId, !isCurrentlyArchived);
      setSelectedHabit(null);
    },
    [archiveHabit]
  );

  const handleDelete = useCallback(
    async (habitId) => {
      if (window.confirm("Delete this habit and all its entries? This cannot be undone.")) {
        await deleteHabit(habitId);
        setSelectedHabit(null);
      }
    },
    [deleteHabit]
  );

  const handleEditSave = useCallback(
    async (habitData) => {
      if (editingHabit?._id) {
        await updateHabit(editingHabit._id, habitData);
      }
      setEditingHabit(null);
    },
    [editingHabit, updateHabit]
  );

  const handleEditDelete = useCallback(
    async (habitId) => {
      await deleteHabit(habitId);
      setEditingHabit(null);
    },
    [deleteHabit]
  );

  const handleEditArchive = useCallback(
    async (habit) => {
      await archiveHabit(habit._id, !habit.isActive);
      setEditingHabit(null);
    },
    [archiveHabit]
  );

  const handleCreateSave = useCallback(
    async (habitData) => {
      await createHabit(habitData);
      setShowCreateWizard(false);
    },
    [createHabit]
  );

  const handleHabitClick = useCallback((habit) => {
    setSelectedHabit(habit);
  }, []);

  const handleOpenEdit = useCallback((habit) => {
    setSelectedHabit(null);
    // Small delay so the slideout closes before the modal opens
    setTimeout(() => setEditingHabit(habit), 150);
  }, []);

  // ── Render ──

  const hasAnyHabits = totalCount > 0;
  const isFiltered = search || statusFilter !== "active";

  return (
    <SkeletonTransition isLoading={isLoading} skeleton={<HabitsSkeleton />}>
    <div className="min-h-screen page-container px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between" data-tour="habits-header">
          <div>
            <h1 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)]">
              Habits
            </h1>
            <p className="text-sm font-spartan text-[var(--color-text-tertiary)] mt-0.5">
              {activeCount} active{totalCount !== activeCount ? ` · ${totalCount} total` : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreateWizard(true)}
            data-tour="habits-add"
            className="h-9 w-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: "var(--color-brand-500)" }}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search + status — single clean row */}
        {hasAnyHabits && (
          <div className="flex items-center gap-3" data-tour="habits-filters">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-brand-500)]/40 transition-colors"
              />
            </div>
            <div className="flex rounded-xl border border-[var(--color-border-primary)]/20 overflow-hidden flex-shrink-0">
              {["active", "archived", "all"].map((key) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-2 text-xs font-spartan font-medium capitalize transition-colors ${
                    statusFilter === key
                      ? "bg-[var(--color-brand-500)]/12 text-[var(--color-brand-500)]"
                      : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {filteredHabits.length === 0 ? (
          <HabitsEmptyState
            isFiltered={!!isFiltered && hasAnyHabits}
            onCreateHabit={() => setShowCreateWizard(true)}
          />
        ) : (
          <AnimatedList
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-tour="habits-grid"
          >
            {filteredHabits.map((habit, i) => (
              <motion.div key={habit._id} variants={listItemVariants} custom={i}>
                <HabitCard
                  habit={habit}
                  onClick={handleHabitClick}
                />
              </motion.div>
            ))}
          </AnimatedList>
        )}
      </div>

      {/* Slide-over detail panel */}
      {selectedHabit && (
        <HabitCardExpanded
          habit={selectedHabit}
          onClose={() => setSelectedHabit(null)}
          onEdit={handleOpenEdit}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}

      {/* Create wizard modal */}
      <HabitModal
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSave={handleCreateSave}
        userId={user?._id}
      />

      {/* Edit modal */}
      <HabitModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        habit={editingHabit}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        onArchive={handleEditArchive}
      />
    </div>
    </SkeletonTransition>
  );
};

export default HabitsPage;
