import { useState, useEffect, useCallback, useMemo } from "react";
import { compassAPI } from "../../../services/api";

/**
 * useCompassList — manages compass list state, fetching, archive/discard.
 * Extracted from the monolithic CompassPage orchestrator.
 */
export default function useCompassList() {
  const [compasses, setCompasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Archive / discard state
  const [archiveLoading, setArchiveLoading] = useState(null);
  const [discardTarget, setDiscardTarget] = useState(null);
  const [discardLoading, setDiscardLoading] = useState(false);

  // ── Fetch list ──
  const fetchCompasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await compassAPI.list();
      if (res.success) setCompasses(res.compasses || []);
    } catch {
      setError("Failed to load compasses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompasses();
  }, [fetchCompasses]);

  // ── Archive ──
  const handleArchive = useCallback(
    async (id) => {
      const t =
        compasses.find((c) => c._id === id);
      // Active compasses with existing habits → show discard modal
      if (
        t?.status === "active" &&
        t?.appliedResources?.habitIds?.length > 0
      ) {
        setDiscardTarget(t);
        return;
      }
      try {
        setArchiveLoading(id);
        const res = await compassAPI.archive(id);
        if (res.success) fetchCompasses();
      } catch {
        setError("Failed to archive");
      } finally {
        setArchiveLoading(null);
      }
    },
    [compasses, fetchCompasses]
  );

  // ── Discard (with mode) ──
  const handleDiscard = useCallback(
    async (mode) => {
      if (!discardTarget) return;
      try {
        setDiscardLoading(true);
        const res = await compassAPI.discard(discardTarget._id, mode);
        if (res.success) {
          setDiscardTarget(null);
          fetchCompasses();
        } else {
          setError(res.error || "Failed to discard");
        }
      } catch {
        setError("Failed to discard");
      } finally {
        setDiscardLoading(false);
      }
    },
    [discardTarget, fetchCompasses]
  );

  // ── Derived stats ──
  const activeCount = useMemo(
    () => compasses.filter((t) => t.status === "active").length,
    [compasses]
  );

  const totalHabits = useMemo(
    () =>
      compasses.reduce(
        (sum, t) => sum + (t.system?.habits?.length || t.habitCount || 0),
        0
      ),
    [compasses]
  );

  // ── Suite grouping (memoized) ──
  const { suiteGroups, sortedStandalone } = useMemo(() => {
    const suites = {};
    const standalone = [];
    for (const t of compasses) {
      if (t.suiteId) {
        if (!suites[t.suiteId]) {
          suites[t.suiteId] = {
            suiteId: t.suiteId,
            suiteName: t.suiteName || "Goal Suite",
            compasses: [],
          };
        }
        suites[t.suiteId].compasses.push(t);
      } else {
        standalone.push(t);
      }
    }
    const suiteList = Object.values(suites).sort(
      (a, b) =>
        new Date(b.compasses[0]?.createdAt) -
        new Date(a.compasses[0]?.createdAt)
    );
    suiteList.forEach((s) =>
      s.compasses.sort((a, b) => (a.suiteIndex ?? 0) - (b.suiteIndex ?? 0))
    );

    // Sort standalone: pinned first, then preserve order
    const sorted = [...standalone].sort((a, b) => {
      const aPinned = a.personalization?.isPinned ? 1 : 0;
      const bPinned = b.personalization?.isPinned ? 1 : 0;
      return bPinned - aPinned;
    });

    return { suiteGroups: suiteList, sortedStandalone: sorted };
  }, [compasses]);

  return {
    compasses,
    loading,
    error,
    setError,
    fetchCompasses,
    // Archive/discard
    archiveLoading,
    handleArchive,
    discardTarget,
    setDiscardTarget,
    discardLoading,
    handleDiscard,
    // Derived
    activeCount,
    totalHabits,
    suiteGroups,
    sortedStandalone,
  };
}
