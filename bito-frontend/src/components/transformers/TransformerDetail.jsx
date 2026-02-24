import { useState } from "react";
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

/**
 * TransformerDetail — full detail / preview view for a single transformer.
 * Composes CategoryBanner, PhaseTimeline, and phase-grouped HabitCards.
 * Supports both phased and flat (legacy) habit layouts.
 */
const TransformerDetail = ({
  transformer,
  onBack,
  onApply,
  applyLoading,
  onArchive,
  onEditHabit,
  onRemoveHabit,
  onOpenStudio,
  error,
}) => {
  const t = transformer;
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
  const maxTurns = 5;
  const turnsRemaining = maxTurns - turnsUsed;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to transformers
      </button>

      {/* Category hero banner */}
      <CategoryBanner transformer={t} />

      {/* Phase timeline */}
      <PhaseTimeline transformer={t} />

      {error && (
        <p className="text-sm text-red-400 font-spartan">{error}</p>
      )}

      {/* ── Phase-grouped habits ── */}
      {isPhased ? (
        <div className="space-y-4">
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
              <div
                key={pi}
                className={`rounded-2xl border transition-all ${
                  isCurrent && !isPreview
                    ? "border-[var(--color-brand-500)]/30 bg-[var(--color-surface-elevated)]"
                    : "border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]"
                } ${isLocked && !isPreview ? "opacity-60" : ""}`}
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
                    {expanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    )}
                  </div>
                </button>

                {/* Phase description */}
                {expanded && phase.description && (
                  <p className="px-4 pb-2 text-xs font-spartan text-[var(--color-text-tertiary)]">
                    {phase.description}
                  </p>
                )}

                {/* Habits */}
                {expanded && (
                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {phaseHabits.map((h, hi) => (
                      <HabitCard
                        key={hi}
                        habit={h}
                        index={hi}
                        phaseIndex={pi}
                        isPreview={isPreview}
                        canRemove={totalHabits > 1}
                        onEdit={onEditHabit}
                        onRemove={onRemoveHabit}
                        accentColor={catMeta.accent}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Flat habits (legacy) ── */
        <div className="space-y-3">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {isPreview ? "Generated" : "Active"} Habits ({flatHabits.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flatHabits.map((h, i) => (
              <HabitCard
                key={i}
                habit={h}
                index={i}
                isPreview={isPreview}
                canRemove={flatHabits.length > 1}
                onEdit={onEditHabit}
                onRemove={onRemoveHabit}
                accentColor={catMeta.accent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Applied habits (active transformer) */}
      {t.status === "active" && t.appliedResources?.habitIds?.length > 0 && (
        <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
            Created Habits
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {t.appliedResources.habitIds.map((h) => (
              <div
                key={h._id || h}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-hover)]/50"
              >
                <span className="text-lg">{h.icon || "🎯"}</span>
                <span className="text-sm font-spartan text-[var(--color-text-primary)]">
                  {h.name || "Habit"}
                </span>
                {h.isActive === false && (
                  <span className="text-[10px] text-[var(--color-text-tertiary)] font-spartan">
                    (archived)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      {isPreview && (
        <div className="flex items-center gap-3 p-5 rounded-2xl glass-card-minimal">
          {/* Refine button */}
          {onOpenStudio && turnsRemaining > 0 && (
            <button
              onClick={() => onOpenStudio(t)}
              className="h-12 px-5 rounded-xl text-sm font-spartan font-medium border border-[var(--color-border-primary)]/30 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all flex items-center gap-2"
            >
              <ChatBubbleIcon className="w-4 h-4" />
              Refine
              <span className="text-xs text-[var(--color-text-tertiary)]">
                ({turnsRemaining} left)
              </span>
            </button>
          )}

          <button
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
          </button>
          <button
            onClick={() => onArchive(t._id)}
            className="h-12 px-6 rounded-xl text-sm font-spartan text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Discard
          </button>
        </div>
      )}

      {/* Generation metadata */}
      {t.generation?.model && (
        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan text-center pb-4">
          Generated by {t.generation.model} on{" "}
          {new Date(t.generation.generatedAt).toLocaleDateString()}
          {t.generation.tokenUsage?.input > 0 &&
            ` · ${
              t.generation.tokenUsage.input + t.generation.tokenUsage.output
            } tokens`}
          {turnsUsed > 0 && ` · ${turnsUsed} refinement${turnsUsed > 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  );
};

export default TransformerDetail;
