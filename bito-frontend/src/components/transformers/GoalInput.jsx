import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { SUGGESTED_GOALS } from "../../data/categoryMeta";

/**
 * GoalInput — the "create transformer" screen.
 * Wider layout, larger textarea with glass treatment, suggested goal chips.
 */
const GoalInput = ({ goalText, setGoalText, onGenerate, onBack, error }) => {
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
          What do you want to achieve?
        </h2>
        <p className="text-base text-[var(--color-text-secondary)] font-spartan mt-2 max-w-lg mx-auto">
          Describe your goal and AI will design a personalized habit system for
          you.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-spartan">
          {error}
        </div>
      )}

      {/* Textarea — glass-card-minimal treatment */}
      <div className="glass-card-minimal p-1">
        <textarea
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="e.g., I want to run a 5K in 8 weeks..."
          className="w-full h-40 p-5 rounded-xl bg-transparent text-base font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none resize-none"
          maxLength={1000}
          autoFocus
        />
        <div className="flex justify-between items-center px-4 pb-3">
          <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
            {goalText.length}/1000
          </p>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={!goalText.trim() || goalText.trim().length < 5}
        className="w-full h-14 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-base font-spartan font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--color-brand-600)]/20 active:scale-[0.99]"
      >
        Generate My Plan
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
    </div>
  );
};

export default GoalInput;
