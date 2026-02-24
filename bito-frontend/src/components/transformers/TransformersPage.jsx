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
import SuitePreview from "./SuitePreview";
import DiscardModal from "./DiscardModal";

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
  const [clarification, setClarification] = useState(null); // { questions, reasoning, goalAnalysis }
  const [clarifyLoading, setClarifyLoading] = useState(false);

  // Preview / detail
  const [activeTransformer, setActiveTransformer] = useState(null);
  const [activeSuite, setActiveSuite] = useState(null); // { suiteId, suiteName, transformers[] }
  const [applyLoading, setApplyLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(null);

  // Refinement studio
  const [studioTransformer, setStudioTransformer] = useState(null);

  // Discard modal
  const [discardTarget, setDiscardTarget] = useState(null); // transformer to discard
  const [discardLoading, setDiscardLoading] = useState(false);

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

  // ── Generate (two-step: clarify → generate) ──
  const handleGenerate = async () => {
    if (!goalText.trim() || goalText.trim().length < 5) return;

    // If already have clarification answers pending, go straight to generation
    // Otherwise, try the clarification round first
    if (!clarification) {
      try {
        setClarifyLoading(true);
        setError(null);
        const res = await transformersAPI.clarify(goalText.trim());
        if (res.success && res.needsClarification && res.questions?.length > 0) {
          setClarification({
            questions: res.questions,
            reasoning: res.reasoning,
            goalAnalysis: res.goalAnalysis || null,
            answers: res.questions.map(() => ""),
          });
          setClarifyLoading(false);
          return; // Stop here — show clarification UI
        }
        // Even if no questions needed, store goalAnalysis for display
        if (res.goalAnalysis) {
          setClarification((prev) => prev ? { ...prev, goalAnalysis: res.goalAnalysis } : null);
        }
      } catch {
        // Clarification failed — proceed to generate anyway
      } finally {
        setClarifyLoading(false);
      }
    }

    // Proceed with generation (optionally with clarification answers)
    await doGenerate();
  };

  const doGenerate = async (answers = null) => {
    try {
      setGenerating(true);
      setError(null);
      setGeneratingStep(0);

      const stepTimer = setInterval(() => {
        setGeneratingStep((s) => Math.min(s + 1, 3));
      }, 1500);

      // Build clarification answers if provided
      let clarificationAnswers = null;
      const answersSource = answers || clarification?.answers;
      if (clarification?.questions && answersSource) {
        clarificationAnswers = clarification.questions
          .map((q, i) => ({ question: q.question, answer: answersSource[i] }))
          .filter((qa) => qa.answer?.trim());
      }

      const res = await transformersAPI.generate(
        goalText.trim(),
        clarificationAnswers?.length > 0 ? clarificationAnswers : null
      );
      clearInterval(stepTimer);

      if (res.success) {
        if (res.goalType === "multi" && Array.isArray(res.transformers)) {
          // Suite — show suite preview
          setActiveSuite({
            suiteId: res.suiteId,
            suiteName: res.suiteName,
            transformers: res.transformers,
          });
          setActiveTransformer(null);
          setView("preview");
        } else {
          // Single — existing flow
          setActiveTransformer(res.transformer);
          setActiveSuite(null);
          setView("preview");
        }
        setGoalText("");
        setClarification(null);
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

  const handleClarificationSubmit = async () => {
    await doGenerate();
  };

  const handleSkipClarification = async () => {
    setClarification(null);
    await doGenerate([]);
  };

  const updateClarificationAnswer = (index, value) => {
    setClarification((prev) => {
      if (!prev) return prev;
      const newAnswers = [...prev.answers];
      newAnswers[index] = value;
      return { ...prev, answers: newAnswers };
    });
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

  // ── Archive / Discard ──
  const handleArchive = async (id) => {
    // For active transformers with habits, show the discard modal
    const t = transformers.find((t) => t._id === id) || activeTransformer;
    if (t?.status === 'active' && t?.appliedResources?.habitIds?.length > 0) {
      setDiscardTarget(t);
      return;
    }
    // For non-active (preview/draft), simple archive
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

  const handleDiscard = async (mode) => {
    if (!discardTarget) return;
    try {
      setDiscardLoading(true);
      const res = await transformersAPI.discard(discardTarget._id, mode);
      if (res.success) {
        setDiscardTarget(null);
        fetchTransformers();
        if (activeTransformer?._id === discardTarget._id) {
          setView("list");
          setActiveTransformer(null);
        }
      } else {
        setError(res.error || "Failed to discard");
      }
    } catch {
      setError("Failed to discard");
    } finally {
      setDiscardLoading(false);
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

  // ── Personalize transformer ──
  const handlePersonalize = async (fields) => {
    if (!activeTransformer) return;
    try {
      const res = await transformersAPI.personalize(activeTransformer._id, fields);
      if (res.success && res.transformer) {
        setActiveTransformer(res.transformer);
        setTransformers((prev) =>
          prev.map((t) => (t._id === res.transformer._id ? res.transformer : t))
        );
      }
    } catch {
      // Silently fail — personalization is non-critical
    }
  };

  // ── Derived stats ──
  const activeCount = transformers.filter((t) => t.status === "active").length;
  const totalHabits = transformers.reduce(
    (sum, t) => sum + (t.system?.habits?.length || t.habitCount || 0),
    0
  );

  // ── Group transformers: suite members together, standalone separate ──
  const { suiteGroups, standaloneTransformers } = (() => {
    const suites = {};
    const standalone = [];
    for (const t of transformers) {
      if (t.suiteId) {
        if (!suites[t.suiteId]) {
          suites[t.suiteId] = {
            suiteId: t.suiteId,
            suiteName: t.suiteName || "Goal Suite",
            transformers: [],
          };
        }
        suites[t.suiteId].transformers.push(t);
      } else {
        standalone.push(t);
      }
    }
    // Sort suites by newest first (by first transformer's createdAt)
    const suiteList = Object.values(suites).sort(
      (a, b) =>
        new Date(b.transformers[0]?.createdAt) -
        new Date(a.transformers[0]?.createdAt)
    );
    // Sort members within each suite by suiteIndex
    suiteList.forEach((s) =>
      s.transformers.sort((a, b) => (a.suiteIndex ?? 0) - (b.suiteIndex ?? 0))
    );
    return { suiteGroups: suiteList, standaloneTransformers: standalone };
  })();

  // Sort: pinned first, then by date
  const sortedStandalone = [...standaloneTransformers].sort((a, b) => {
    const aPinned = a.personalization?.isPinned ? 1 : 0;
    const bPinned = b.personalization?.isPinned ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;
    return 0; // preserve existing order
  });

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  // Discard modal — renders as overlay on top of any view
  const discardModalEl = discardTarget ? (
    <DiscardModal
      transformer={discardTarget}
      onConfirm={handleDiscard}
      onCancel={() => setDiscardTarget(null)}
      isLoading={discardLoading}
    />
  ) : null;

  // ── Generating overlay ──
  if (generating) {
    return (
      <>
        {discardModalEl}
        <div className="min-h-screen page-container px-4 sm:px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <GeneratingOverlay step={generatingStep} />
          </div>
        </div>
      </>
    );
  }

  // ── Preview / Detail ──
  if ((view === "preview" || view === "detail") && (activeTransformer || activeSuite)) {
    // Suite preview
    if (activeSuite && !activeTransformer) {
      return (
        <>
          {discardModalEl}
          <div className="min-h-screen page-container px-4 sm:px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <SuitePreview
              suite={activeSuite}
              onBack={() => {
                setView("list");
                setActiveSuite(null);
              }}
              onOpenTransformer={(t) => {
                setActiveTransformer(t);
              }}
              onApplyAll={async () => {
                try {
                  setApplyLoading(true);
                  for (const t of activeSuite.transformers) {
                    await transformersAPI.apply(t._id);
                  }
                  setActiveSuite(null);
                  setView("list");
                  fetchTransformers();
                } catch (err) {
                  setError(err.message || "Failed to apply suite");
                } finally {
                  setApplyLoading(false);
                }
              }}
              applyLoading={applyLoading}
              onArchive={handleArchive}
              error={error}
            />
          </div>
        </div>
        </>
      );
    }
    // When studio is open, render it exclusively — no page content behind it
    if (studioTransformer) {
      return (
        <>
          {discardModalEl}
          <RefinementStudio
          transformer={studioTransformer}
          onClose={handleStudioClose}
          onApply={handleStudioApply}
          onUpdate={handleStudioUpdate}
          userAvatar={user?.avatar}
        />
        </>
      );
    }
    return (
      <>
        {discardModalEl}
        <div className="h-[calc(100dvh-3.5rem)] page-container overflow-hidden">
        <div className="max-w-5xl mx-auto h-full">
          <TransformerDetail
            transformer={activeTransformer}
            onBack={() => {
              if (activeSuite) {
                // Return to suite preview
                setActiveTransformer(null);
              } else {
                setView("list");
                setActiveTransformer(null);
              }
            }}
            onApply={handleApply}
            applyLoading={applyLoading}
            onArchive={handleArchive}
            onEditHabit={handleEditHabit}
            onRemoveHabit={handleRemoveHabit}
            onOpenStudio={handleOpenStudio}
            onPersonalize={handlePersonalize}
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
            onBack={() => {
              setView("list");
              setClarification(null);
            }}
            error={error}
            clarification={clarification}
            clarifyLoading={clarifyLoading}
            onClarificationSubmit={handleClarificationSubmit}
            onSkipClarification={handleSkipClarification}
            onUpdateAnswer={updateClarificationAnswer}
            goalAnalysis={clarification?.goalAnalysis}
          />
        </div>
      </div>
    );
  }

  // ── List (default) ──
  return (
    <>
      {discardModalEl}
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
          <div className="space-y-6">
            {/* Suite groups */}
            {suiteGroups.map((suite) => (
              <div key={suite.suiteId} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-spartan font-semibold text-purple-400 uppercase tracking-wider">
                    Suite
                  </span>
                  <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                    · {suite.suiteName}
                  </span>
                  <div className="flex-1 h-px bg-purple-500/10" />
                  <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                    {suite.transformers.length} linked
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-3 border-l-2 border-purple-500/20">
                  {suite.transformers.map((t, i) => (
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
              </div>
            ))}

            {/* Standalone transformers */}
            {sortedStandalone.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedStandalone.map((t, i) => (
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
        )}
      </div>
    </div>
    </>
  );
};

export default TransformersPage;
