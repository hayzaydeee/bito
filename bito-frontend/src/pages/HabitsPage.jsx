import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useHabits } from "../contexts/HabitContext";
import { useAuth } from "../contexts/AuthContext";
import HabitCard from "../components/habits/HabitCard";
import CompassHabitGroup from "../components/habits/CompassHabitGroup";
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
  const navigate = useNavigate();
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
  const [groupMode, setGroupMode] = useState("grouped"); // grouped | flat
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // ── Derived data ──

  const matchesSearch = useCallback(
    (h) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        h.name?.toLowerCase().includes(q) ||
        h.description?.toLowerCase().includes(q)
      );
    },
    [search]
  );

  const matchesStatus = useCallback(
    (h) => {
      if (statusFilter === "active") return h.isActive !== false && !h.isArchived;
      if (statusFilter === "archived") return h.isArchived;
      return true;
    },
    [statusFilter]
  );

  // Flat list — group-sourced habits live under Groups, so exclude them here.
  const filteredHabits = useMemo(
    () => (habits || []).filter((h) => h.source !== "group" && matchesStatus(h) && matchesSearch(h)),
    [habits, matchesStatus, matchesSearch]
  );

  // Any compass-originated habits? (gates the grouped view + toggle)
  const hasCompassHabits = useMemo(
    () => (habits || []).some((h) => h.source === "compass" && h.compassId),
    [habits]
  );

  // Grouped view — Personal section + one section per origin compass,
  // with not-yet-activated phases surfaced as "upcoming" ghost cards.
  const grouped = useMemo(() => {
    const base = (habits || []).filter((h) => h.source !== "group" && matchesSearch(h));

    const personal = base.filter(
      (h) => (h.source !== "compass" || !h.compassId) && matchesStatus(h)
    );

    const map = new Map();
    base
      .filter((h) => h.source === "compass" && h.compassId)
      .forEach((h) => {
        const id = h.compassId._id;
        if (!map.has(id)) map.set(id, { compass: h.compassId, all: [] });
        map.get(id).all.push(h);
      });

    const compasses = [];
    map.forEach(({ compass, all }) => {
      const phases = compass?.system?.phases || [];
      const phaseMeta = new Map(
        phases.map((p, i) => [String(p._id), { i, name: p.name }])
      );

      const current = all.filter((h) => h.isActive !== false && !h.isArchived);
      const archivedItems = all.filter((h) => h.isArchived);
      const upcoming = all.filter((h) => h.isActive === false && !h.isArchived);

      const upMap = new Map();
      upcoming.forEach((h) => {
        const key = String(h.compassPhaseId || "none");
        if (!upMap.has(key)) {
          const meta = phaseMeta.get(key);
          upMap.set(key, {
            phaseId: key,
            phaseNumber: meta ? meta.i + 1 : "—",
            phaseName: meta?.name || "",
            order: meta ? meta.i : 999,
            habits: [],
          });
        }
        upMap.get(key).habits.push(h);
      });
      const upcomingByPhase = [...upMap.values()].sort((a, b) => a.order - b.order);

      // Apply the page status filter
      let showCurrent = current;
      let showArchived = [];
      let showUpcoming = upcomingByPhase;
      if (statusFilter === "archived") {
        showCurrent = [];
        showUpcoming = [];
        showArchived = archivedItems;
      } else if (statusFilter === "all") {
        showArchived = archivedItems;
      }

      if (showCurrent.length || showArchived.length || showUpcoming.length) {
        compasses.push({ compass, current: showCurrent, archived: showArchived, upcomingByPhase: showUpcoming });
      }
    });

    return { personal, compasses };
  }, [habits, matchesSearch, matchesStatus, statusFilter]);

  const showGrouped = groupMode === "grouped" && hasCompassHabits;
  const groupedEmpty = grouped.personal.length === 0 && grouped.compasses.length === 0;

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

  const handleOpenCompass = useCallback(
    (compassId) => navigate(`/app/compass/${compassId}`),
    [navigate]
  );

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
    <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8">
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
          <div className="flex items-center gap-2 flex-wrap" data-tour="habits-filters">
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

            {/* Grouped ⇄ Flat — only when compass habits exist */}
            {hasCompassHabits && (
              <div className="flex rounded-[var(--r-pill)] border border-[var(--line)] overflow-hidden flex-shrink-0">
                {["grouped", "flat"].map((key) => (
                  <button
                    key={key}
                    onClick={() => setGroupMode(key)}
                    className="px-3 py-2 std-mono text-[10px] uppercase tracking-wider transition-colors"
                    style={
                      groupMode === key
                        ? { background: "var(--signal)", color: "var(--signal-ink)" }
                        : { color: "var(--ink-3)" }
                    }
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collection */}
        {showGrouped ? (
          groupedEmpty ? (
            <HabitsEmptyState
              isFiltered={!!isFiltered && hasAnyHabits}
              onCreateHabit={() => setShowCreateWizard(true)}
            />
          ) : (
            <div className="space-y-6" data-tour="habits-grid">
              {/* Personal section */}
              {grouped.personal.length > 0 && (
                <div>
                  {grouped.compasses.length > 0 && <p className="std-kicker mb-3">Personal</p>}
                  <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grouped.personal.map((habit, i) => (
                      <motion.div key={habit._id} variants={listItemVariants} custom={i}>
                        <HabitCard habit={habit} onClick={handleHabitClick} />
                      </motion.div>
                    ))}
                  </AnimatedList>
                </div>
              )}

              {/* One section per origin compass */}
              {grouped.compasses.map((g) => (
                <CompassHabitGroup
                  key={g.compass._id}
                  compass={g.compass}
                  current={g.current}
                  archived={g.archived}
                  upcomingByPhase={g.upcomingByPhase}
                  onSelect={handleHabitClick}
                  onOpenCompass={handleOpenCompass}
                />
              ))}
            </div>
          )
        ) : filteredHabits.length === 0 ? (
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
