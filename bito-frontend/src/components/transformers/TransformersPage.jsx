import { useState, useEffect, useCallback } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { transformersAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import CATEGORY_META from "../../data/categoryMeta";
import TransformerCard from "./TransformerCard";
import TransformerDetail from "./TransformerDetail";
import GoalInput from "./GoalInput";
import GeneratingOverlay from "./GeneratingOverlay";
import RefinementStudio from "./RefinementStudio";

/**
 * TransformersPage — orchestrator component.
 * Manages view state machine (list → create → generating → preview/detail)
 * and delegates rendering to sub-components.
 */
const TransformersPage = () => {
  const { user } = useAuth();

  // ── View state ──
  const [view, setView] = useState("list"); // "list" | "create" | "preview" | "detail"
  const [transformers, setTransformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create flow
  const [goalText, setGoalText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);

  // Preview / detail
  const [activeTransformer, setActiveTransformer] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(null);

  // Refinement studio
  const [studioTransformer, setStudioTransformer] = useState(null);

  // ── Fetch ──
  const fetchTransformers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transformersAPI.list();
      if (res.success) setTransformers(res.transformers || []);
    } catch {
      setError("Failed to load transformers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransformers();
  }, [fetchTransformers]);

  // ── Generate ──
  const handleGenerate = async () => {
    if (!goalText.trim() || goalText.trim().length < 5) return;
    try {
      setGenerating(true);
      setError(null);
      setGeneratingStep(0);

      const stepTimer = setInterval(() => {
        setGeneratingStep((s) => Math.min(s + 1, 3));
      }, 1500);

      const res = await transformersAPI.generate(goalText.trim());
      clearInterval(stepTimer);

      if (res.success) {
        setActiveTransformer(res.transformer);
        setView("preview");
        setGoalText("");
        fetchTransformers();
      } else {
        setError(res.error || "Generation failed");
        setView("create");
      }
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
      setView("create");
    } finally {
      setGenerating(false);
      setGeneratingStep(0);
    }
  };

  // ── Apply ──
  const handleApply = async () => {
    if (!activeTransformer) return;
    try {
      setApplyLoading(true);
      setError(null);
      const res = await transformersAPI.apply(activeTransformer._id);
      if (res.success) {
        setActiveTransformer(res.transformer);
        setView("list");
        fetchTransformers();
      } else {
        setError(res.error || "Failed to apply");
      }
    } catch (err) {
      setError(err.message || "Failed to apply transformer");
    } finally {
      setApplyLoading(false);
    }
  };

  // ── Edit habit ──
  const handleEditHabit = async (index, updatedHabit) => {
    const updatedHabits = [...activeTransformer.system.habits];
    updatedHabits[index] = updatedHabit;

    try {
      const res = await transformersAPI.update(activeTransformer._id, {
        habits: updatedHabits,
      });
      if (res.success) {
        setActiveTransformer(res.transformer);
      }
    } catch {
      const updated = { ...activeTransformer };
      updated.system.habits = updatedHabits;
      setActiveTransformer(updated);
    }
  };

  // ── Remove habit ──
  const handleRemoveHabit = async (index) => {
    const updatedHabits = activeTransformer.system.habits.filter(
      (_, i) => i !== index
    );
    if (updatedHabits.length === 0) return;

    try {
      const res = await transformersAPI.update(activeTransformer._id, {
        habits: updatedHabits,
      });
      if (res.success) {
        setActiveTransformer(res.transformer);
      }
    } catch {
      const updated = { ...activeTransformer };
      updated.system.habits = updatedHabits;
      setActiveTransformer(updated);
    }
  };

  // ── Archive ──
  const handleArchive = async (id) => {
    try {
      setArchiveLoading(id);
      const res = await transformersAPI.archive(id);
      if (res.success) {
        fetchTransformers();
        if (activeTransformer?._id === id) {
          setView("list");
          setActiveTransformer(null);
        }
      }
    } catch {
      setError("Failed to archive");
    } finally {
      setArchiveLoading(null);
    }
  };

  // ── View detail ──
  const openDetail = async (t) => {
    try {
      const res = await transformersAPI.get(t._id);
      if (res.success) {
        setActiveTransformer(res.transformer);
        setView(res.transformer.status === "preview" ? "preview" : "detail");
      }
    } catch {
      setError("Failed to load transformer");
    }
  };

  // ── Open refinement studio ──
  const handleOpenStudio = (t) => {
    setStudioTransformer(t);
  };

  const handleStudioClose = () => {
    setStudioTransformer(null);
  };

  const handleStudioUpdate = (updated) => {
    // Keep active transformer and list in sync
    setActiveTransformer(updated);
    setTransformers((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  };

  const handleStudioApply = async (id) => {
    const res = await transformersAPI.apply(id);
    if (res.success) {
      setStudioTransformer(null);
      setActiveTransformer(res.transformer);
      setView("list");
      fetchTransformers();
    } else {
      throw new Error(res.error || "Failed to apply");
    }
  };

  // ── Derived stats ──
  const activeCount = transformers.filter((t) => t.status === "active").length;
  const totalHabits = transformers.reduce(
    (sum, t) => sum + (t.system?.habits?.length || t.habitCount || 0),
    0
  );

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  // ── Generating overlay ──
  if (generating) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <GeneratingOverlay step={generatingStep} />
        </div>
      </div>
    );
  }

  // ── Refinement Studio (full-page overlay) ──
  const studioOverlay = studioTransformer ? (
    <RefinementStudio
      transformer={studioTransformer}
      onClose={handleStudioClose}
      onApply={handleStudioApply}
      onUpdate={handleStudioUpdate}
    />
  ) : null;

  // ── Preview / Detail ──
  if ((view === "preview" || view === "detail") && activeTransformer) {
    return (
      <>
        {studioOverlay}
        <div className="min-h-screen page-container px-4 sm:px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <TransformerDetail
              transformer={activeTransformer}
              onBack={() => {
                setView("list");
                setActiveTransformer(null);
              }}
              onApply={handleApply}
              applyLoading={applyLoading}
              onArchive={handleArchive}
              onEditHabit={handleEditHabit}
              onRemoveHabit={handleRemoveHabit}
              onOpenStudio={handleOpenStudio}
              error={error}
            />
          </div>
        </div>
      </>
    );
  }

  // ── Create ──
  if (view === "create") {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <GoalInput
            goalText={goalText}
            setGoalText={setGoalText}
            onGenerate={handleGenerate}
            onBack={() => setView("list")}
            error={error}
          />
        </div>
      </div>
    );
  }

  // ── List (default) ──
  return (
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold font-garamond text-[var(--color-text-primary)] mb-1">
              Transformers
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
              AI-powered habit systems from your goals
              {transformers.length > 0 && (
                <span className="ml-2">
                  · {activeCount} active · {totalHabits} habit
                  {totalHabits !== 1 && "s"} created
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setView("create");
              setError(null);
            }}
            className="flex items-center gap-2 h-10 px-5 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Transformer
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-400 font-spartan mb-4">{error}</p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[160px] bg-[var(--color-surface-elevated)] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && transformers.length === 0 && (
          <div className="glass-card-minimal rounded-2xl p-12 text-center max-w-lg mx-auto">
            <p className="text-6xl mb-6">🧠</p>
            <h3 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)] mb-2">
              No transformers yet
            </h3>
            <p className="text-base text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto mb-6">
              Tell us your goal and AI will design a personalized habit system
              for you.
            </p>
            <button
              onClick={() => setView("create")}
              className="inline-flex items-center gap-2 h-12 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" /> Create your first Transformer
            </button>
          </div>
        )}

        {/* Transformer grid */}
        {!loading && transformers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {transformers.map((t, i) => (
              <TransformerCard
                key={t._id}
                transformer={t}
                index={i}
                onOpen={openDetail}
                onArchive={handleArchive}
                archiveLoading={archiveLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransformersPage;
