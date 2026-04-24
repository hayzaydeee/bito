import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  ReloadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";
import CategoryBanner from "./CategoryBanner";
import PhaseTimeline from "./PhaseTimeline";
import HabitCard from "./HabitCard";
import { springs, fadeUp, collapseVariants, habitCardVariants } from "./compassMotion";
import HabitIcon from "../shared/HabitIcon";

/**
 * CompassDetail — full detail / preview view for a single compass.
 * Composes CategoryBanner, PhaseTimeline, and phase-grouped HabitCards.
 * Supports both phased and flat (legacy) habit layouts.
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

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 px-4 sm:px-6 pt-10 pb-6">
        {/* Back */}
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.soft}
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to compasses
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
              className="text-sm text-red-400 font-spartan"
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
            <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              {isPreview ? "Generated" : "Active"} Habits ({totalHabits})
            </h3>

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
                  className={`rounded-2xl border transition-colors ${
                    isCurrent && !isPreview
                      ? "border-[var(--color-brand-500)]/30 bg-[var(--color-surface-elevated)]"
                      : "border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]"
                  } ${isLocked && !isPreview ? "opacity-60" : ""}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: isLocked && !isPreview ? 0.6 : 1, y: 0 }}
                  transition={{ ...springs.soft, delay: 0.2 + pi * 0.06 }}
                >
                  {/* Phase header — collapsible */}
                  <button
                    onClick={() => togglePhase(pi)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-spartan font-bold text-white"
                        style={{ backgroundColor: catMeta.accent }}
                      >
                        {isCompleted ? (
                          <CheckCircledIcon className="w-4 h-4" />
                        ) : (
                          pi + 1
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">
                          {phase.name || `Phase ${pi + 1}`}
                        </span>
                        {phase.durationDays && (
                          <span className="ml-2 text-xs font-spartan text-[var(--color-text-tertiary)]">
                            · {phase.durationDays} days
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                        {phaseHabits.length} habit{phaseHabits.length !== 1 && "s"}
                      </span>
                      <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDownIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
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
                          <p className="px-4 pb-2 text-xs font-spartan text-[var(--color-text-tertiary)]">
                            {phase.description}
                          </p>
                        )}

                        {/* Contextual reasoning */}
                        {phase.reasoning && (
                          <div className="mx-4 mb-3 p-3 rounded-xl bg-[var(--color-brand-500)]/5 border border-[var(--color-brand-500)]/10">
                            <p className="text-[10px] font-spartan text-[var(--color-brand-400)] uppercase tracking-wider mb-1">
                              Why this phase
                            </p>
                            <p className="text-xs font-spartan text-[var(--color-text-secondary)]">
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
            <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              {isPreview ? "Generated" : "Active"} Habits ({flatHabits.length})
            </h3>

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
            className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.soft, delay: 0.25 }}
          >
            <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
              Created Habits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {t.appliedResources.habitIds.map((h, i) => (
                <motion.div
                  key={h._id || h}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-hover)]/50"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.soft, delay: 0.3 + i * 0.04 }}
                >
                  <HabitIcon icon={h.icon || "Target"} size={20} />
                  <span className="text-sm font-spartan text-[var(--color-text-primary)]">
                    {h.name || "Habit"}
                  </span>
                  {h.isActive === false && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-spartan">
                      (archived)
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
            className="text-xs text-[var(--color-text-tertiary)] font-spartan text-center pb-4"
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
          className="flex-shrink-0 border-t border-[var(--color-border-primary)]/40 px-4 sm:px-6 py-4 bg-[var(--color-bg-primary)]"
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
                className="h-12 px-5 rounded-xl text-sm font-spartan font-medium border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all flex items-center gap-2"
              >
                <ChatBubbleIcon className="w-4 h-4" />
                Refine
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  ({turnsRemaining} left)
                </span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onApply}
              disabled={applyLoading}
              className="flex-1 h-12 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-brand-600)]/20"
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
            <button
              onClick={() => onArchive(t._id)}
              className="h-12 px-6 rounded-xl text-sm font-spartan text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Discard
            </button>
          </div>
        </motion.div>
      )}

      {/* Pinned action bar — active mode (living plan) */}
      {isActive && canRefine && (
        <motion.div
          className="flex-shrink-0 border-t border-[var(--color-border-primary)]/40 px-4 sm:px-6 py-4 bg-[var(--color-bg-primary)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.soft, delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenStudio?.(t)}
              className="flex-1 h-12 rounded-xl text-sm font-spartan font-medium border border-[var(--color-brand-500)]/30 text-[var(--color-text-primary)] hover:bg-[var(--color-brand-500)]/5 transition-all flex items-center justify-center gap-2"
            >
              <ChatBubbleIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
              Refine Living Plan
              <span className="text-xs text-[var(--color-text-tertiary)]">
                ({turnsRemaining} left)
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CompassDetail;