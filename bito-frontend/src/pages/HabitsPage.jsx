import { useState, useMemo, useCallback } from "react";
import { PlusIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useHabits } from "../contexts/HabitContext";
import { useAuth } from "../contexts/AuthContext";
import HabitCard from "../components/habits/HabitCard";
import HabitCardExpanded from "../components/habits/HabitCardExpanded";
import HabitsEmptyState from "../components/habits/HabitsEmptyState";
import HabitsSkeleton from "../components/habits/HabitsSkeleton";
import FeatureHeader from "../components/shared/standard/FeatureHeader";
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
  const activeList = (habits || []).filter((h) => h.isActive !== false && !h.isArchived);
  const activeCount = activeList.length;
  const avgCompletion = useMemo(() => {
    if (!activeList.length) return 0;
    const sum = activeList.reduce((acc, h) => acc + (h.stats?.completionRate ?? 0), 0);
    return Math.round(sum / activeList.length);
  }, [activeList]);

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
    <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header — shared Feature-Home masthead (twin of Compass / Groups home) */}
        <div data-tour="habits-header">
          <FeatureHeader
            kicker=""
            title="Habits"
            stats={
              hasAnyHabits ? (
                <>
                  <span className="text-[var(--signal)]">{String(activeCount).padStart(2, "0")}</span> ACTIVE
                  {"  ·  "}
                  <span className="text-[var(--ink-2)]">{totalCount}</span> TOTAL
                  {"  ·  "}
                  <span className="text-[var(--ink-2)]">{avgCompletion}%</span> AVG RATE
                </>
              ) : (
                "THE DAILY DISCIPLINES YOU'RE TRACKING"
              )
            }
            actions={
              <button
                onClick={() => setShowCreateWizard(true)}
                data-tour="habits-add"
                className="std-btn std-btn--signal w-full sm:w-auto"
              >
                <PlusIcon className="w-4 h-4" />
                New habit
              </button>
            }
          />
        </div>

        {/* Slim filter row — search + status */}
        {hasAnyHabits && (
          <div className="flex items-center gap-2 flex-wrap mb-6 -mt-2" data-tour="habits-filters">
            <div className="flex-1 min-w-[180px] relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full h-10 pl-9 pr-4 rounded-[var(--r-btn)] bg-[var(--surface-2)] border border-[var(--line)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none focus:border-[var(--signal)] transition-colors"
              />
            </div>
            <div className="flex rounded-[var(--r-pill)] border border-[var(--line)] overflow-hidden flex-shrink-0">
              {["active", "archived", "all"].map((key) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className="px-3 py-2 std-mono text-[10px] uppercase tracking-wider transition-colors"
                  style={
                    statusFilter === key
                      ? { background: "var(--signal)", color: "var(--signal-ink)" }
                      : { color: "var(--ink-3)" }
                  }
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collection */}
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
