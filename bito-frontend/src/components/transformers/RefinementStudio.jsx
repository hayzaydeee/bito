import { useState, useCallback } from "react";
import {
  Cross2Icon,
  CheckCircledIcon,
  ReloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { transformersAPI } from "../../services/api";
import RefinementChat from "./RefinementChat";
import PhaseTimeline from "./PhaseTimeline";
import HabitCard from "./HabitCard";
import CATEGORY_META from "../../data/categoryMeta";

/**
 * RefinementStudio — split-pane conversational refinement UI.
 * Left: chat panel. Right: live preview of current phases + habits.
 * Appears as a full-page overlay when opened.
 */
const RefinementStudio = ({
  transformer: initialTransformer,
  onClose,
  onApply,
  onUpdate,
}) => {
  const [transformer, setTransformer] = useState(initialTransformer);
  const [isSending, setIsSending] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true); // mobile toggle

  const sys = transformer.system || {};
  const phases = sys.phases || [];
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const turnsUsed = Math.floor((transformer.refinements?.length || 0) / 2);
  const turnsRemaining = 5 - turnsUsed;

  // Send refinement message
  const handleSend = useCallback(
    async (message) => {
      setIsSending(true);
      setError(null);
      try {
        const res = await transformersAPI.refine(transformer._id, message);
        if (res.success && res.transformer) {
          setTransformer(res.transformer);
          onUpdate?.(res.transformer);
        } else {
          setError(res.error || "Refinement failed");
        }
      } catch (err) {
        setError(err.message || "Failed to refine");
      } finally {
        setIsSending(false);
      }
    },
    [transformer._id, onUpdate]
  );

  // Apply from studio
  const handleApply = useCallback(async () => {
    setApplyLoading(true);
    setError(null);
    try {
      await onApply?.(transformer._id);
    } catch (err) {
      setError(err.message || "Failed to apply");
    } finally {
      setApplyLoading(false);
    }
  }, [transformer._id, onApply]);

  // Flatten all habits for count
  const totalHabits = phases.reduce(
    (sum, p) => sum + (p.habits?.length || 0),
    0
  ) || (sys.habits?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg-primary)] animate-fade-in">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-[var(--color-border-primary)]/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <Cross2Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
          <div>
            <h2 className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate max-w-[200px] sm:max-w-none">
              {sys.icon} {sys.name || "Untitled Plan"}
            </h2>
            <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
              Refinement Studio · {turnsRemaining} turns left
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile toggle */}
          <button
            onClick={() => setShowPreview((p) => !p)}
            className="sm:hidden h-8 px-3 rounded-lg text-xs font-spartan text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] flex items-center gap-1"
          >
            {showPreview ? (
              <>
                <ChevronLeftIcon className="w-3 h-3" /> Chat
              </>
            ) : (
              <>
                Preview <ChevronRightIcon className="w-3 h-3" />
              </>
            )}
          </button>

          <button
            onClick={handleApply}
            disabled={applyLoading}
            className="h-9 px-4 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-xs font-spartan font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {applyLoading ? (
              <>
                <ReloadIcon className="w-3.5 h-3.5 animate-spin" /> Applying...
              </>
            ) : (
              <>
                <CheckCircledIcon className="w-3.5 h-3.5" /> Apply ({totalHabits})
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="px-4 sm:px-6 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs font-spartan text-red-400">{error}</p>
        </div>
      )}

      {/* ── Split pane ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat panel — fixed height, input pinned to bottom */}
        <div
          className={`${
            showPreview ? "hidden sm:flex" : "flex"
          } flex-col w-full sm:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-[var(--color-border-primary)]/20 overflow-hidden`}
        >
          <RefinementChat
            refinements={transformer.refinements || []}
            turnsRemaining={turnsRemaining}
            onSend={handleSend}
            isSending={isSending}
          />
        </div>

        {/* Preview panel — scrollable */}
        <div
          className={`${
            showPreview ? "flex" : "hidden sm:flex"
          } flex-col flex-1 overflow-y-auto min-h-0`}
        >
          <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto w-full">
            {/* Plan header */}
            <div className="text-center space-y-1">
              <span className="text-3xl">{sys.icon || "🎯"}</span>
              <h3 className="text-lg font-spartan font-semibold text-[var(--color-text-primary)]">
                {sys.name || "Untitled Plan"}
              </h3>
              {sys.description && (
                <p className="text-xs font-spartan text-[var(--color-text-tertiary)] max-w-md mx-auto">
                  {sys.description}
                </p>
              )}
            </div>

            {/* Phase timeline */}
            <PhaseTimeline transformer={transformer} />

            {/* Phase groups */}
            {phases.length > 0 ? (
              <div className="space-y-4">
                {phases.map((phase, pi) => (
                  <div
                    key={pi}
                    className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-spartan font-bold text-white"
                        style={{ backgroundColor: catMeta.accent }}
                      >
                        {pi + 1}
                      </div>
                      <div>
                        <span className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">
                          {phase.name}
                        </span>
                        {phase.durationDays && (
                          <span className="ml-2 text-xs font-spartan text-[var(--color-text-tertiary)]">
                            · {phase.durationDays} days
                          </span>
                        )}
                      </div>
                    </div>
                    {phase.description && (
                      <p className="px-4 pb-2 text-xs font-spartan text-[var(--color-text-tertiary)]">
                        {phase.description}
                      </p>
                    )}
                    <div className="px-4 pb-4 grid grid-cols-1 gap-2">
                      {(phase.habits || []).map((h, hi) => (
                        <HabitCard
                          key={hi}
                          habit={h}
                          index={hi}
                          phaseIndex={pi}
                          isPreview={false}
                          accentColor={catMeta.accent}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Legacy flat habits */
              <div className="grid grid-cols-1 gap-2">
                {(sys.habits || []).map((h, i) => (
                  <HabitCard
                    key={i}
                    habit={h}
                    index={i}
                    isPreview={false}
                    accentColor={catMeta.accent}
                    compact
                  />
                ))}
              </div>
            )}

            {/* Duration summary */}
            {sys.estimatedDuration && (
              <p className="text-xs font-spartan text-[var(--color-text-tertiary)] text-center">
                Estimated: {sys.estimatedDuration.value} {sys.estimatedDuration.unit}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefinementStudio;
