import { ArrowLeftIcon, Link2Icon } from "@radix-ui/react-icons";
import { SUGGESTED_GOALS } from "../../data/categoryMeta";

/**
 * GoalInput — the "create transformer" screen.
 * Wider layout, larger textarea with glass treatment, suggested goal chips.
 * Supports a clarification round when the AI needs more context.
 * Shows multi-goal analysis when the AI detects compound goals.
 */
const GoalInput = ({
  goalText,
  setGoalText,
  onGenerate,
  onBack,
  error,
  clarification,
  clarifyLoading,
  onClarificationSubmit,
  onSkipClarification,
  onUpdateAnswer,
  goalAnalysis,
}) => {
  const hasClarification = clarification?.questions?.length > 0;
  const isMultiGoal = goalAnalysis?.goalType === "multi";

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </button>

      {/* Hero */}
      <div className="text-center py-4">
        <p className="text-6xl mb-4">🧠</p>
        <h2 className="text-2xl sm:text-3xl font-garamond font-bold text-[var(--color-text-primary)]">
          {hasClarification
            ? "A few things first..."
            : "What do you want to achieve?"}
        </h2>
        <p className="text-base text-[var(--color-text-secondary)] font-spartan mt-2 max-w-lg mx-auto">
          {hasClarification
            ? clarification.reasoning
            : "Describe your goal and AI will design a personalized habit system for you."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-spartan">
          {error}
        </div>
      )}

      {/* ── Multi-goal analysis banner ── */}
      {isMultiGoal && hasClarification && (
        <div className="glass-card-minimal rounded-2xl p-4 space-y-2 border border-purple-500/20">
          <div className="flex items-center gap-2">
            <Link2Icon className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-spartan font-semibold text-purple-400">
              Multiple Goals Detected
            </span>
          </div>
          {goalAnalysis.structureSummary && (
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
              {goalAnalysis.structureSummary}
            </p>
          )}
          {goalAnalysis.capacityNote && (
            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan italic">
              {goalAnalysis.capacityNote}
            </p>
          )}
        </div>
      )}

      {/* ── Clarification Questions ── */}
      {hasClarification ? (
        <div className="space-y-5">
          {clarification.questions.map((q, i) => (
            <div
              key={i}
              className="glass-card-minimal rounded-2xl p-5 space-y-3"
            >
              <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)]">
                {q.question}
              </p>
              {q.why && (
                <p className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                  {q.why}
                </p>
              )}
              <textarea
                value={clarification.answers[i] || ""}
                onChange={(e) => onUpdateAnswer(i, e.target.value)}
                placeholder={
                  q.examples?.length > 0
                    ? `e.g., ${q.examples[0]}`
                    : "Your answer..."
                }
                className="w-full h-20 p-3 rounded-xl bg-[var(--color-surface-elevated)] text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)]/40 resize-none border border-[var(--color-border-primary)]/10"
              />
              {q.examples?.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {q.examples.map((ex, ei) => (
                    <button
                      key={ei}
                      onClick={() => onUpdateAnswer(i, ex)}
                      className="text-xs font-spartan px-3 py-1 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]/10 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Submit answers or skip */}
          <div className="flex gap-3">
            <button
              onClick={onClarificationSubmit}
              className="flex-1 h-14 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-base font-spartan font-medium transition-all hover:shadow-lg hover:shadow-[var(--color-brand-600)]/20 active:scale-[0.99]"
            >
              Generate My Plan
            </button>
            <button
              onClick={onSkipClarification}
              className="h-14 px-6 bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-sm font-spartan font-medium transition-colors border border-[var(--color-border-primary)]/10"
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Textarea — glass-card-minimal treatment */}
          <div className="glass-card-minimal p-1">
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="e.g., I want to run a 5K in 8 weeks..."
              className="w-full h-40 p-5 rounded-xl bg-transparent text-base font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none resize-none"
              maxLength={3000}
              autoFocus
            />
            <div className="flex justify-between items-center px-4 pb-3">
              <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                {goalText.length}/3000
              </p>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={onGenerate}
            disabled={
              !goalText.trim() || goalText.trim().length < 5 || clarifyLoading
            }
            className="w-full h-14 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-base font-spartan font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--color-brand-600)]/20 active:scale-[0.99]"
          >
            {clarifyLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing your goal...
              </span>
            ) : (
              "Generate My Plan"
            )}
          </button>

          {/* Suggested goals */}
          <div>
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">
              Try a suggestion
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoalText(g)}
                  className="text-sm font-spartan px-4 py-2 rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/10 hover:border-[var(--color-border-primary)]/30 transition-all"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GoalInput;
