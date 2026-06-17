import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  ReloadIcon,
  ChevronDownIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";
import CategoryBanner from "./CategoryBanner";
import PhaseTimeline from "./PhaseTimeline";
import HabitCard from "./HabitCard";
import { springs, collapseVariants, habitCardVariants } from "./compassMotion";
import HabitIcon from "../shared/HabitIcon";

/**
 * CompassDetail — full detail / preview view for a single compass.
 * Standard ("DRILL") design system: editorial chrome (mono kickers, serif
 * phase names, std-card frames, signal action bar) wrapping the category hero
 * and phase timeline. Composes CategoryBanner, PhaseTimeline, and
 * phase-grouped HabitCards. Supports both phased and flat (legacy) layouts.
 * Enhanced with framer-motion phase reveal animations.
 */
const CompassDetail = ({
  compass,
  onBack,
  onApply,
  applyLoading,
  onArchive,
  onEditHabit,
  onRemoveHabit,
  onOpenStudio,
  onPersonalize,
  error,
}) => {
  const t = compass;
  const sys = t.system || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const isPreview = t.status === "preview" || t.status === "draft";

  const phases = sys.phases || [];
  const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);
  const flatHabits = sys.habits || [];

  // Track which phases are expanded (all open by default)
  const [expandedPhases, setExpandedPhases] = useState(
    () => new Set(phases.map((_, i) => i))
  );

  const togglePhase = (idx) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Total habit count (across all phases or flat)
  const totalHabits = isPhased
    ? phases.reduce((sum, p) => sum + (p.habits?.length || 0), 0)
    : flatHabits.length;

  // Refinement turns info
  const turnsUsed = Math.floor((t.refinements?.length || 0) / 2);
  const maxTurns = 20;
  const turnsRemaining = maxTurns - turnsUsed;
  const isActive = t.status === 'active';
  const canRefine = (isPreview || isActive) && turnsRemaining > 0;

  // Habits section header (kicker + serif count)
  const HabitsHeading = ({ count }) => (
    <div className="flex items-baseline gap-2.5">
      <p className="std-kicker">{isPreview ? "Generated" : "Active"} Habits</p>
      <span className="std-num text-[16px] text-[var(--signal)]">
        {String(count).padStart(2, "0")}
      </span>
    </div>
  );

  return (
    <div className="std flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 px-4 sm:px-6 pt-10 pb-6">
        {/* Back */}
        <motion.button
          onClick={onBack}
          className="std-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.soft}
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to compasses
        </motion.button>

        {/* Category hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.05 }}
        >
          <CategoryBanner compass={t} onPersonalize={onPersonalize} />
        </motion.div>

        {/* Phase timeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.1 }}
        >
          <PhaseTimeline compass={t} />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="text-[13px] text-[var(--rose)]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Phase-grouped habits ── */}
        {isPhased ? (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <HabitsHeading count={totalHabits} />

            {phases.map((phase, pi) => {
              const expanded = expandedPhases.has(pi);
              const phaseHabits = phase.habits || [];
              const progress = t.progress || {};
              const isCompleted = progress.completedPhases?.some(
                (cp) => cp.phaseIndex === pi
              );
              const isCurrent = pi === (progress.currentPhaseIndex ?? 0);
              const isLocked = pi > (progress.currentPhaseIndex ?? 0) && !isCompleted;

              return (
                <motion.div
                  key={pi}
                  className={`std-card overflow-hidden transition-colors ${
                    isLocked && !isPreview ? "opacity-60" : ""
                  }`}
                  style={
                    isCurrent && !isPreview
                      ? { borderLeft: `3px solid ${catMeta.accent}` }
                      : undefined
                  }
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: isLocked && !isPreview ? 0.6 : 1, y: 0 }}
                  transition={{ ...springs.soft, delay: 0.2 + pi * 0.06 }}
                >
                  {/* Phase header — collapsible */}
                  <button
                    onClick={() => togglePhase(pi)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-7 h-7 rounded-[var(--r-tag)] flex items-center justify-center std-mono text-[12px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: catMeta.accent }}
                      >
                        {isCompleted ? (
                          <CheckCircledIcon className="w-4 h-4" />
                        ) : (
                          pi + 1
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="std-display text-[15px] font-bold text-[var(--ink)]">
                          {phase.name || `Phase ${pi + 1}`}
                        </span>
                        {phase.durationDays && (
                          <span className="ml-2 std-mono text-[10.5px] text-[var(--ink-3)]">
                            · {phase.durationDays}d
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="std-mono text-[10.5px] text-[var(--ink-3)]">
                        {phaseHabits.length} habit{phaseHabits.length !== 1 && "s"}
                      </span>
                      <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="w-4 h-4 text-[var(--ink-3)]" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Phase description + habits — animated collapse */}
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        key="content"
                        variants={collapseVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                      >
                        {phase.description && (
                          <p className="px-4 pb-2 text-[13px] text-[var(--ink-3)] leading-relaxed">
                            {phase.description}
                          </p>
                        )}

                        {/* Contextual reasoning */}
                        {phase.reasoning && (
                          <div
                            className="mx-4 mb-3 p-3 rounded-[var(--r-tag)] border border-[var(--line)]"
                            style={{
                              background:
                                "color-mix(in srgb, var(--signal) 7%, transparent)",
                            }}
                          >
                            <p
                              className="std-kicker mb-1"
                              style={{ color: "var(--signal)" }}
                            >
                              Why this phase
                            </p>
                            <p className="text-[13px] text-[var(--ink-2)] leading-relaxed">
                              {phase.reasoning}
                            </p>
                          </div>
                        )}

                        {/* Habits */}
                        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {phaseHabits.map((h, hi) => (
                            <motion.div
                              key={hi}
                              variants={habitCardVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              custom={hi}
                            >
                              <HabitCard
                                habit={h}
                                index={hi}
                                phaseIndex={pi}
                                isPreview={isPreview}
                                canRemove={totalHabits > 1}
                                onEdit={onEditHabit}
                                onRemove={onRemoveHabit}
                                accentColor={catMeta.accent}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* ── Flat habits (legacy) ── */
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <HabitsHeading count={flatHabits.length} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flatHabits.map((h, i) => (
                <motion.div
                  key={i}
                  variants={habitCardVariants}
                  initial="initial"
                  animate="animate"
                  custom={i}
                >
                  <HabitCard
                    habit={h}
                    index={i}
                    isPreview={isPreview}
                    canRemove={flatHabits.length > 1}
                    onEdit={onEditHabit}
                    onRemove={onRemoveHabit}
                    accentColor={catMeta.accent}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Applied habits (active compass) */}
        {t.status === "active" && t.appliedResources?.habitIds?.length > 0 && (
          <motion.div
            className="std-card p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.soft, delay: 0.25 }}
          >
            <p className="std-kicker mb-4">Created Habits</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {t.appliedResources.habitIds.map((h, i) => (
                <motion.div
                  key={h._id || h}
                  className="flex items-center gap-3 p-3 rounded-[var(--r-tag)] border border-[var(--line)] bg-[var(--surface-2)]"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.soft, delay: 0.3 + i * 0.04 }}
                >
                  <HabitIcon icon={h.icon || "Target"} size={20} />
                  <span className="text-[13px] text-[var(--ink)] truncate">
                    {h.name || "Habit"}
                  </span>
                  {h.isActive === false && (
                    <span className="std-mono text-[10px] text-[var(--ink-3)] ml-auto">
                      archived
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Generation metadata */}
        {t.generation?.model && (
          <motion.p
            className="std-mono text-[11px] text-[var(--ink-3)] text-center pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Generated by {t.generation.model} on{" "}
            {new Date(t.generation.generatedAt).toLocaleDateString()}
            {t.generation.tokenUsage?.input > 0 &&
              ` · ${
                t.generation.tokenUsage.input + t.generation.tokenUsage.output
              } tokens`}
            {turnsUsed > 0 && ` · ${turnsUsed} refinement${turnsUsed > 1 ? "s" : ""}`}
          </motion.p>
        )}
      </div>{/* end scrollable content */}

      {/* Pinned action bar — preview mode */}
      {isPreview && (
        <motion.div
          className="flex-shrink-0 border-t border-[var(--line-2)] px-4 sm:px-6 pt-4 pb-12 sm:pb-12 bg-[var(--bg)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.soft, delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            {/* Refine button */}
            {canRefine && onOpenStudio && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenStudio(t)}
                className="std-btn"
              >
                <ChatBubbleIcon className="w-4 h-4" />
                Refine
                <span className="normal-case text-[var(--ink-3)]">
                  ({turnsRemaining} left)
                </span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onApply}
              disabled={applyLoading}
              className="std-btn std-btn--signal flex-1 disabled:opacity-50"
            >
              {applyLoading ? (
                <>
                  <ReloadIcon className="w-4 h-4 animate-spin" /> Applying...
                </>
              ) : (
                <>
                  <CheckCircledIcon className="w-4 h-4" /> Apply — Create{" "}
                  {totalHabits} Habits
                </>
              )}
            </motion.button>
            <button onClick={() => onArchive(t._id)} className="std-btn">
              Discard
            </button>
          </div>
        </motion.div>
      )}

      {/* Pinned action bar — active mode (living plan) */}
      {isActive && canRefine && (
        <motion.div
          className="flex-shrink-0 border-t border-[var(--line-2)] px-4 sm:px-6 pt-4 pb-12 sm:pb-12 bg-[var(--bg)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.soft, delay: 0.2 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenStudio?.(t)}
            className="std-btn w-full"
            style={{ borderColor: "var(--signal)" }}
          >
            <ChatBubbleIcon className="w-4 h-4" style={{ color: "var(--signal)" }} />
            Refine Living Plan
            <span className="normal-case text-[var(--ink-3)]">
              ({turnsRemaining} left)
            </span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default CompassDetail;
