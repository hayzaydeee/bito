import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlusIcon, TargetIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { compassAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import CATEGORY_META from "../../data/categoryMeta";
import CompassCard from "./CompassCard";
import CompassDetail from "./CompassDetail";
import CompassEmptyState from "./CompassEmptyState";
import GoalInput from "./GoalInput";
import GeneratingOverlay from "./GeneratingOverlay";
import RefinementStudio from "./RefinementStudio";
import SuitePreview from "./SuitePreview";
import DiscardModal from "./DiscardModal";

/**
 * CompassPage — orchestrator component.
 * Manages view state machine (list → create → generating → preview/detail)
 * and delegates rendering to sub-components.
 */
const CompassPage = () => {
  const { user } = useAuth();

  // ── View state ──
  const [view, setView] = useState("list"); // "list" | "create" | "preview" | "detail"
  const [compasses, setcompasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create flow
  const [goalText, setGoalText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [clarification, setClarification] = useState(null); // { questions, reasoning, goalAnalysis }
  const [clarifyLoading, setClarifyLoading] = useState(false);

  // Preview / detail
  const [activecompass, setActivecompass] = useState(null);
  const [activeSuite, setActiveSuite] = useState(null); // { suiteId, suiteName, compasses[] }
  const [applyLoading, setApplyLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(null);

  // Refinement studio
  const [studiocompass, setStudiocompass] = useState(null);

  // Discard modal
  const [discardTarget, setDiscardTarget] = useState(null); // compass to discard
  const [discardLoading, setDiscardLoading] = useState(false);

  // ── Fetch ──
  const fetchcompasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await compassAPI.list();
      if (res.success) setcompasses(res.compasses || []);
    } catch {
      setError("Failed to load compasses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchcompasses();
  }, [fetchcompasses]);

  // ── Generate (two-step: clarify → generate) ──
  const handleGenerate = async () => {
    if (!goalText.trim() || goalText.trim().length < 5) return;

    // If already have clarification answers pending, go straight to generation
    // Otherwise, try the clarification round first
    if (!clarification) {
      try {
        setClarifyLoading(true);
        setError(null);
        const res = await compassAPI.clarify(goalText.trim());
        if (res.success && res.needsClarification && res.questions?.length > 0) {
          setClarification({
            questions: res.questions,
            reasoning: res.reasoning,
            goalAnalysis: res.goalAnalysis || null,
            parsedGoal: res._parsed || null,
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

      const res = await compassAPI.generate(
        goalText.trim(),
        clarificationAnswers?.length > 0 ? clarificationAnswers : null,
        clarification?.parsedGoal || null
      );
      clearInterval(stepTimer);

      if (res.success) {
        if (res.goalType === "multi" && Array.isArray(res.compasses)) {
          // Suite — show suite preview
          setActiveSuite({
            suiteId: res.suiteId,
            suiteName: res.suiteName,
            compasses: res.compasses,
          });
          setActivecompass(null);
          setView("preview");
        } else {
          // Single — existing flow
          setActivecompass(res.compass);
          setActiveSuite(null);
          setView("preview");
        }
        setGoalText("");
        setClarification(null);
        fetchcompasses();
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
    if (!activecompass) return;
    try {
      setApplyLoading(true);
      setError(null);
      const res = await compassAPI.apply(activecompass._id);
      if (res.success) {
        setActivecompass(res.compass);
        setView("list");
        fetchcompasses();
      } else {
        setError(res.error || "Failed to apply");
      }
    } catch (err) {
      setError(err.message || "Failed to apply compass");
    } finally {
      setApplyLoading(false);
    }
  };

  // ── Edit habit ──
  const handleEditHabit = async (index, updatedHabit) => {
    const updatedHabits = [...activecompass.system.habits];
    updatedHabits[index] = updatedHabit;

    try {
      const res = await compassAPI.update(activecompass._id, {
        habits: updatedHabits,
      });
      if (res.success) {
        setActivecompass(res.compass);
      }
    } catch {
      const updated = { ...activecompass };
      updated.system.habits = updatedHabits;
      setActivecompass(updated);
    }
  };

  // ── Remove habit ──
  const handleRemoveHabit = async (index) => {
    const updatedHabits = activecompass.system.habits.filter(
      (_, i) => i !== index
    );
    if (updatedHabits.length === 0) return;

    try {
      const res = await compassAPI.update(activecompass._id, {
        habits: updatedHabits,
      });
      if (res.success) {
        setActivecompass(res.compass);
      }
    } catch {
      const updated = { ...activecompass };
      updated.system.habits = updatedHabits;
      setActivecompass(updated);
    }
  };

  // ── Archive / Discard ──
  const handleArchive = async (id) => {
    // For active compasses with habits, show the discard modal
    const t = compasses.find((t) => t._id === id) || activecompass;
    if (t?.status === 'active' && t?.appliedResources?.habitIds?.length > 0) {
      setDiscardTarget(t);
      return;
    }
    // For non-active (preview/draft), simple archive
    try {
      setArchiveLoading(id);
      const res = await compassAPI.archive(id);
      if (res.success) {
        fetchcompasses();
        if (activecompass?._id === id) {
          setView("list");
          setActivecompass(null);
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
      const res = await compassAPI.discard(discardTarget._id, mode);
      if (res.success) {
        setDiscardTarget(null);
        fetchcompasses();
        if (activecompass?._id === discardTarget._id) {
          setView("list");
          setActivecompass(null);
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
      const res = await compassAPI.get(t._id);
      if (res.success) {
        setActivecompass(res.compass);
        setView(res.compass.status === "preview" ? "preview" : "detail");
      }
    } catch {
      setError("Failed to load compass");
    }
  };

  // ── Open refinement studio ──
  const handleOpenStudio = (t) => {
    setStudiocompass(t);
  };

  const handleStudioClose = () => {
    setStudiocompass(null);
  };

  const handleStudioUpdate = (updated) => {
    // Keep active compass and list in sync
    setActivecompass(updated);
    setcompasses((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  };

  const handleStudioApply = async (id) => {
    const res = await compassAPI.apply(id);
    if (res.success) {
      setStudiocompass(null);
      setActivecompass(res.compass);
      setView("list");
      fetchcompasses();
    } else {
      throw new Error(res.error || "Failed to apply");
    }
  };

  // ── Personalize compass ──
  const handlePersonalize = async (fields) => {
    if (!activecompass) return;
    try {
      const res = await compassAPI.personalize(activecompass._id, fields);
      if (res.success && res.compass) {
        setActivecompass(res.compass);
        setcompasses((prev) =>
          prev.map((t) => (t._id === res.compass._id ? res.compass : t))
        );
      }
    } catch {
      // Silently fail — personalization is non-critical
    }
  };

  // ── Derived stats ──
  const activeCount = compasses.filter((t) => t.status === "active").length;
  const totalHabits = compasses.reduce(
    (sum, t) => sum + (t.system?.habits?.length || t.habitCount || 0),
    0
  );

  // ── Group compasses: suite members together, standalone separate ──
  const { suiteGroups, standalonecompasses } = (() => {
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
    // Sort suites by newest first (by first compass's createdAt)
    const suiteList = Object.values(suites).sort(
      (a, b) =>
        new Date(b.compasses[0]?.createdAt) -
        new Date(a.compasses[0]?.createdAt)
    );
    // Sort members within each suite by suiteIndex
    suiteList.forEach((s) =>
      s.compasses.sort((a, b) => (a.suiteIndex ?? 0) - (b.suiteIndex ?? 0))
    );
    return { suiteGroups: suiteList, standalonecompasses: standalone };
  })();

  // Sort: pinned first, then by date
  const sortedStandalone = [...standalonecompasses].sort((a, b) => {
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
      compass={discardTarget}
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
  if ((view === "preview" || view === "detail") && (activecompass || activeSuite)) {
    // Suite preview
    if (activeSuite && !activecompass) {
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
              onOpencompass={(t) => {
                setActivecompass(t);
              }}
              onApplyAll={async () => {
                try {
                  setApplyLoading(true);
                  for (const t of activeSuite.compasses) {
                    await compassAPI.apply(t._id);
                  }
                  setActiveSuite(null);
                  setView("list");
                  fetchcompasses();
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
    if (studiocompass) {
      return (
        <>
          {discardModalEl}
          <RefinementStudio
          compass={studiocompass}
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
          <CompassDetail
            compass={activecompass}
            onBack={() => {
              if (activeSuite) {
                // Return to suite preview
                setActivecompass(null);
              } else {
                setView("list");
                setActivecompass(null);
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
      <div className="min-h-screen page-container px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header — stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-10">
          <div>
            <h1 className="text-3xl font-bold font-garamond text-[var(--color-text-primary)] mb-1">
              Compasses
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
              AI-powered habit systems from your goals
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setView("create");
              setError(null);
            }}
            className="flex items-center justify-center gap-2 h-11 w-full sm:w-auto px-5 text-white rounded-xl text-sm font-spartan font-medium transition-colors"
            style={{
              background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))",
            }}
          >
            <PlusIcon className="w-4 h-4" />
            New compass
          </motion.button>
        </div>

        {/* Stat pills — only when compasses exist */}
        {!loading && compasses.length > 0 && (
          <motion.div
            className="flex items-center gap-3 mb-6 flex-wrap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/15">
              <TargetIcon className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)]">
                {activeCount}
              </span>
              <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                active
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/15">
              <LightningBoltIcon className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
              <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)]">
                {totalHabits}
              </span>
              <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                habit{totalHabits !== 1 && "s"} tracking
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <p className="text-sm text-red-400 font-spartan mb-4">{error}</p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-2xl overflow-hidden border border-[var(--color-border-primary)]/10 min-h-[160px]"
              >
                {/* Stripe shimmer */}
                <div className="h-1.5 w-full compass-skeleton-shimmer" />
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  {/* Icon + text rows */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg compass-skeleton-shimmer flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded compass-skeleton-shimmer" />
                      <div className="h-3 w-full rounded compass-skeleton-shimmer" />
                    </div>
                  </div>
                  {/* Phase pills */}
                  <div className="flex gap-1 mt-auto pt-6">
                    <div className="h-1 flex-1 rounded-full compass-skeleton-shimmer" />
                    <div className="h-1 flex-1 rounded-full compass-skeleton-shimmer" />
                    <div className="h-1 flex-1 rounded-full compass-skeleton-shimmer" />
                  </div>
                  {/* Bottom row */}
                  <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-primary)]/10">
                    <div className="w-8 h-8 rounded-full compass-skeleton-shimmer" />
                    <div className="flex-1 flex gap-1.5">
                      <div className="h-5 w-16 rounded-md compass-skeleton-shimmer" />
                      <div className="h-5 w-20 rounded-md compass-skeleton-shimmer" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && compasses.length === 0 && (
          <CompassEmptyState
            onCreateNew={() => setView("create")}
            onGoalSelect={(goal) => {
              setGoalText(goal);
              setView("create");
            }}
          />
        )}

        {/* Compass grid */}
        {!loading && compasses.length > 0 && (
          <div className="space-y-6">
            {/* Suite groups */}
            {suiteGroups.map((suite) => (
              <div
                key={suite.suiteId}
                className="glass-card-minimal rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-spartan font-semibold text-purple-400 uppercase tracking-wider">
                    Suite
                  </span>
                  <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                    · {suite.suiteName}
                  </span>
                  <div className="flex-1" />
                  <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] bg-purple-500/10 px-2 py-0.5 rounded-md">
                    {suite.compasses.length} linked
                  </span>
                </div>
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suite.compasses.map((t, i) => (
                      <CompassCard
                        key={t._id}
                        compass={t}
                        index={i}
                        onOpen={openDetail}
                        onArchive={handleArchive}
                        archiveLoading={archiveLoading}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            ))}

            {/* Standalone compasses */}
            {sortedStandalone.length > 0 && (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedStandalone.map((t, i) => (
                    <CompassCard
                      key={t._id}
                      compass={t}
                      index={i}
                      onOpen={openDetail}
                      onArchive={handleArchive}
                      archiveLoading={archiveLoading}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default CompassPage;
