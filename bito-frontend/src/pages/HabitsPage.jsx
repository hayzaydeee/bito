import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useHabits } from "../contexts/HabitContext";
import { useAuth } from "../contexts/AuthContext";
import HabitsHeader from "../components/habits/HabitsHeader";
import HabitMetricCards from "../components/habits/HabitMetricCards";
import HabitFilterBar from "../components/habits/HabitFilterBar";
import HabitCard from "../components/habits/HabitCard";
import HabitCategoryGroup from "../components/habits/HabitCategoryGroup";
import HabitCardExpanded from "../components/habits/HabitCardExpanded";
import HabitsEmptyState from "../components/habits/HabitsEmptyState";
import HabitsSkeleton from "../components/habits/HabitsSkeleton";
import HabitCreationWizard from "../components/ui/HabitCreationWizard";
import CustomHabitEditModal from "../components/ui/CustomHabitEditModal";

/**
 * HabitsPage — redesigned habit collection / gallery page.
 * Thin orchestrator composing sub-components from components/habits/.
 */
const HabitsPage = () => {
  const navigate = useNavigate();
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
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
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

    if (sourceFilter !== "all") {
      list = list.filter((h) => (h.source || "personal") === sourceFilter);
    }

    if (categoryFilter !== "all") {
      list = list.filter((h) => h.category === categoryFilter);
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
  }, [habits, search, statusFilter, sourceFilter, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set((habits || []).map((h) => h.category).filter(Boolean));
    return [...cats].sort();
  }, [habits]);

  const stats = useMemo(() => {
    const all = habits || [];
    return {
      total: all.length,
      active: all.filter((h) => h.isActive !== false && !h.isArchived).length,
      archived: all.filter((h) => h.isArchived).length,
      personal: all.filter((h) => !h.source || h.source === "personal").length,
      compass: all.filter((h) => h.source === "compass").length,
      group: all.filter((h) => h.source === "group").length,
    };
  }, [habits]);

  // Group habits by category for visual sections
  const groupedHabits = useMemo(() => {
    const isFilteredToOneCategory = categoryFilter !== "all";
    if (isFilteredToOneCategory) return null; // render flat grid when filtered

    const groups = {};
    filteredHabits.forEach((h) => {
      const cat = h.category || "custom";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(h);
    });

    // Sort categories by count (descending)
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredHabits, categoryFilter]);

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

  if (isLoading) return <HabitsSkeleton />;

  const hasAnyHabits = (habits || []).length > 0;
  const isFiltered = search || statusFilter !== "active" || sourceFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="min-h-screen page-container px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <HabitsHeader stats={stats} onCreateHabit={() => setShowCreateWizard(true)} />

        {hasAnyHabits && <HabitMetricCards habits={habits} />}

        {hasAnyHabits && (
          <HabitFilterBar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sourceFilter={sourceFilter}
            onSourceChange={setSourceFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            categories={categories}
            stats={stats}
          />
        )}

        {/* Habit grid */}
        {filteredHabits.length === 0 ? (
          <HabitsEmptyState
            isFiltered={!!isFiltered && hasAnyHabits}
            onCreateHabit={() => setShowCreateWizard(true)}
            onNavigateCompass={() => navigate("/compass")}
          />
        ) : groupedHabits ? (
          // Grouped by category
          <div className="space-y-8" data-tour="habits-grid">
            {groupedHabits.map(([catKey, catHabits]) => (
              <HabitCategoryGroup
                key={catKey}
                categoryKey={catKey}
                habits={catHabits}
                onHabitClick={handleHabitClick}
              />
            ))}
          </div>
        ) : (
          // Flat grid (filtered to specific category)
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-tour="habits-grid"
          >
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onClick={handleHabitClick}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {filteredHabits.length > 0 && (
          <p className="text-xs font-spartan text-[var(--color-text-tertiary)] text-center pt-4">
            Showing {filteredHabits.length} of {stats.total} habits
          </p>
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
      <HabitCreationWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSave={handleCreateSave}
        userId={user?._id}
      />

      {/* Edit modal */}
      <CustomHabitEditModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        habit={editingHabit}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default HabitsPage;
