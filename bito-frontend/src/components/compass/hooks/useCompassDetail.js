import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { compassAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * useCompassDetail — manages a single compass: fetch, apply, edit, remove,
 * archive, refine, personalize. Phase-aware edit/remove (unlike legacy).
 */
export default function useCompassDetail() {
  const { compassId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [compass, setCompass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);

  // Refinement studio
  const [studioOpen, setStudioOpen] = useState(false);

  // ── Fetch single compass ──
  const fetchCompass = useCallback(async () => {
    if (!compassId) return;
    try {
      setLoading(true);
      const res = await compassAPI.get(compassId);
      if (res.success) {
        setCompass(res.compass);
      } else {
        setError("Compass not found");
      }
    } catch {
      setError("Failed to load compass");
    } finally {
      setLoading(false);
    }
  }, [compassId]);

  useEffect(() => {
    fetchCompass();
  }, [fetchCompass]);

  // ── Apply ──
  const handleApply = useCallback(async () => {
    if (!compass) return;
    try {
      setApplyLoading(true);
      setError(null);
      const res = await compassAPI.apply(compass._id);
      if (res.success) {
        setCompass(res.compass);
        navigate("/app/compass");
      } else {
        setError(res.error || "Failed to apply");
      }
    } catch (err) {
      setError(err.message || "Failed to apply compass");
    } finally {
      setApplyLoading(false);
    }
  }, [compass, navigate]);

  // ── Edit habit (PHASE-AWARE) ──
  const handleEditHabit = useCallback(
    async (index, updatedHabit, phaseIndex = undefined) => {
      if (!compass) return;
      const sys = compass.system || {};
      const phases = sys.phases || [];
      const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);

      let updatePayload;
      if (isPhased && phaseIndex != null) {
        // Phase-aware: update the specific habit within the phase
        const updatedPhases = phases.map((phase, pi) => {
          if (pi !== phaseIndex) return phase;
          const updatedHabits = [...(phase.habits || [])];
          updatedHabits[index] = updatedHabit;
          return { ...phase, habits: updatedHabits };
        });
        updatePayload = { phases: updatedPhases };
      } else {
        // Flat / legacy
        const updatedHabits = [...(sys.habits || [])];
        updatedHabits[index] = updatedHabit;
        updatePayload = { habits: updatedHabits };
      }

      try {
        const res = await compassAPI.update(compass._id, updatePayload);
        if (res.success) {
          setCompass(res.compass);
        }
      } catch {
        // Optimistic local update as fallback
        const updated = structuredClone(compass);
        if (isPhased && phaseIndex != null) {
          updated.system.phases[phaseIndex].habits[index] = updatedHabit;
        } else {
          updated.system.habits[index] = updatedHabit;
        }
        setCompass(updated);
      }
    },
    [compass]
  );

  // ── Remove habit (PHASE-AWARE) ──
  const handleRemoveHabit = useCallback(
    async (index, phaseIndex = undefined) => {
      if (!compass) return;
      const sys = compass.system || {};
      const phases = sys.phases || [];
      const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);

      let updatePayload;
      if (isPhased && phaseIndex != null) {
        const updatedPhases = phases.map((phase, pi) => {
          if (pi !== phaseIndex) return phase;
          return { ...phase, habits: (phase.habits || []).filter((_, i) => i !== index) };
        });
        // Check total habit count after removal
        const totalAfter = updatedPhases.reduce((s, p) => s + (p.habits?.length || 0), 0);
        if (totalAfter === 0) return; // Don't let them remove the last habit
        updatePayload = { phases: updatedPhases };
      } else {
        const updatedHabits = (sys.habits || []).filter((_, i) => i !== index);
        if (updatedHabits.length === 0) return;
        updatePayload = { habits: updatedHabits };
      }

      try {
        const res = await compassAPI.update(compass._id, updatePayload);
        if (res.success) setCompass(res.compass);
      } catch {
        const updated = structuredClone(compass);
        if (isPhased && phaseIndex != null) {
          updated.system.phases[phaseIndex].habits = (updated.system.phases[phaseIndex].habits || []).filter((_, i) => i !== index);
        } else {
          updated.system.habits = (updated.system.habits || []).filter((_, i) => i !== index);
        }
        setCompass(updated);
      }
    },
    [compass]
  );

  // ── Archive ──
  const handleArchive = useCallback(
    async (id) => {
      try {
        const res = await compassAPI.archive(id || compass?._id);
        if (res.success) navigate("/app/compass");
      } catch {
        setError("Failed to archive");
      }
    },
    [compass, navigate]
  );

  // ── Personalize ──
  const handlePersonalize = useCallback(
    async (fields) => {
      if (!compass) return;
      try {
        const res = await compassAPI.personalize(compass._id, fields);
        if (res.success && res.compass) {
          setCompass(res.compass);
        }
      } catch {
        // Non-critical — silent fail
      }
    },
    [compass]
  );

  // ── Refinement Studio ──
  const openStudio = useCallback(() => setStudioOpen(true), []);
  const closeStudio = useCallback(() => setStudioOpen(false), []);

  const handleStudioUpdate = useCallback((updated) => {
    setCompass(updated);
  }, []);

  const handleStudioApply = useCallback(
    async (id) => {
      const res = await compassAPI.apply(id);
      if (res.success) {
        setStudioOpen(false);
        setCompass(res.compass);
        navigate("/app/compass");
      } else {
        throw new Error(res.error || "Failed to apply");
      }
    },
    [navigate]
  );

  // ── Back navigation ──
  const goBack = useCallback(() => {
    navigate("/app/compass");
  }, [navigate]);

  return {
    compass,
    loading,
    error,
    setError,
    applyLoading,
    // Actions
    handleApply,
    handleEditHabit,
    handleRemoveHabit,
    handleArchive,
    handlePersonalize,
    // Studio
    studioOpen,
    openStudio,
    closeStudio,
    handleStudioUpdate,
    handleStudioApply,
    // Navigation
    goBack,
    // Auth
    user,
  };
}
