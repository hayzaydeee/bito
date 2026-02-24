import { useState, useCallback } from "react";
import {
  Cross2Icon,
  CheckCircledIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { transformersAPI } from "../../services/api";
import RefinementChat from "./RefinementChat";
import PlanArtifact from "./PlanArtifact";

/**
 * RefinementStudio — chat-first conversational refinement UI.
 * Chat is the primary surface. After each AI reply an inline artifact card
 * appears; clicking it toggles a slide-in panel showing the live plan preview
 * (Claude-style artifact pattern).
 */
const RefinementStudio = ({
  transformer: initialTransformer,
  onClose,
  onApply,
  onUpdate,
  userAvatar,
}) => {
  const [transformer, setTransformer] = useState(initialTransformer);
  const [isSending, setIsSending] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showArtifact, setShowArtifact] = useState(false);

  const sys = transformer.system || {};
  const phases = sys.phases || [];
  const turnsUsed = Math.floor((transformer.refinements?.length || 0) / 2);
  const turnsRemaining = 5 - turnsUsed;

  // Flatten all habits for count
  const totalHabits =
    phases.reduce((sum, p) => sum + (p.habits?.length || 0), 0) ||
    (sys.habits?.length || 0);

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

  const toggleArtifact = useCallback(() => {
    setShowArtifact((prev) => !prev);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--color-bg-primary)] animate-fade-in">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-[var(--color-border-primary)]/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <Cross2Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
          <div>
            <h2 className="text-sm font-spartan font-bold text-[var(--color-text-primary)] truncate max-w-[200px] sm:max-w-none">
              {sys.icon} {sys.name || "Untitled Plan"}
            </h2>
            <p className="text-xs font-spartan text-[var(--color-text-secondary)]">
              Refinement Studio · {turnsRemaining} turns left
            </p>
          </div>
        </div>

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
      </header>

      {error && (
        <div className="px-4 sm:px-6 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs font-spartan text-red-400">{error}</p>
        </div>
      )}

      {/* ── Main area: chat + artifact panel ── */}
      <div className="h-[calc(100dvh-3.5rem)] flex overflow-hidden">
        {/* Chat pane — always visible, expands/shrinks */}
        <div
          className={`flex flex-col h-full overflow-hidden transition-all duration-200 ease-in-out ${
            showArtifact ? "w-1/2 sm:w-[55%] border-r border-[var(--color-border-primary)]/40" : "w-full"
          }`}
        >
            <RefinementChat
              refinements={transformer.refinements || []}
              turnsRemaining={turnsRemaining}
              onSend={handleSend}
              isSending={isSending}
              planName={sys.name || "Untitled Plan"}
              planIcon={sys.icon || "🎯"}
              onToggleArtifact={toggleArtifact}
              isArtifactOpen={showArtifact}
              userAvatar={userAvatar}
            />
          </div>

        {/* Artifact panel — slides in from right */}
        <div
          className={`flex flex-col h-full bg-[var(--color-bg-primary)] transition-all duration-200 ease-in-out overflow-hidden ${
            showArtifact
              ? "w-1/2 sm:w-[45%] opacity-100"
              : "w-0 opacity-0"
          }`}
        >
          {showArtifact && (
            <PlanArtifact
              transformer={transformer}
              onClose={toggleArtifact}
            />
          )}
        </div>

        {/* Mobile artifact overlay */}
        {showArtifact && (
          <div className="sm:hidden fixed inset-0 z-[60] flex flex-col bg-[var(--color-bg-primary)] animate-fade-in">
            <PlanArtifact
              transformer={transformer}
              onClose={toggleArtifact}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RefinementStudio;
