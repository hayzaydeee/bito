import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, Link2Icon } from "@radix-ui/react-icons";
import { SUGGESTED_GOALS } from "../../data/categoryMeta";
import { springs, fadeUp } from "./compassMotion";

/**
 * GoalInput — the "create compass" screen.
 * Auto-resizing textarea, animated step transitions, horizontal scroll pills,
 * character counter ring, clarification Q&A with motion.
 */

const CHAR_LIMIT = 3000;
const CHAR_WARN = 2700;

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
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight, 120), 320) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [goalText, autoResize]);

  // Character counter ring
  const charPercent = Math.min((goalText.length / CHAR_LIMIT) * 100, 100);
  const charColor = goalText.length > CHAR_WARN
    ? "var(--color-text-warning, #f59e0b)"
    : goalText.length > CHAR_LIMIT
    ? "#ef4444"
    : "var(--color-brand-500)";

  // Step indicator (1: write, 2: clarify)
  const currentStep = hasClarification ? 2 : 1;

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
    >
      {/* Back + Step indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? "bg-[var(--color-brand-500)] scale-125"
                    : step < currentStep
                    ? "bg-[var(--color-brand-500)]/50"
                    : "bg-[var(--color-surface-hover)]"
                }`}
              />
              {step < 2 && (
                <div
                  className={`w-6 h-0.5 rounded-full transition-colors duration-300 ${
                    step < currentStep
                      ? "bg-[var(--color-brand-500)]/40"
                      : "bg-[var(--color-surface-hover)]"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-[10px] font-spartan text-[var(--color-text-tertiary)]">
            {currentStep === 1 ? "Describe" : "Clarify"}
          </span>
        </div>
      </div>

      {/* Hero */}
      <AnimatePresence mode="wait">
        <motion.div
          key={hasClarification ? "clarify" : "goal"}
          className="text-center py-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={springs.soft}
        >
          <motion.p
            className="text-6xl mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={springs.bouncy}
          >
            {hasClarification ? "🤔" : "🧠"}
          </motion.p>
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
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-spartan"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Multi-goal analysis banner ── */}
      <AnimatePresence>
        {isMultiGoal && hasClarification && (
          <motion.div
            className="glass-card-minimal rounded-2xl p-4 space-y-2 border border-purple-500/20"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springs.soft}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Clarification Questions ── */}
      <AnimatePresence mode="wait">
        {hasClarification ? (
          <motion.div
            key="clarification"
            className="space-y-5"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={springs.soft}
          >
            {clarification.questions.map((q, i) => (
              <motion.div
                key={i}
                className="glass-card-minimal rounded-2xl p-5 space-y-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.soft, delay: i * 0.08 }}
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
              </motion.div>
            ))}

            {/* Submit / skip */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.soft, delay: clarification.questions.length * 0.08 }}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClarificationSubmit}
                className="flex-1 h-14 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-base font-spartan font-medium transition-all hover:shadow-lg hover:shadow-[var(--color-brand-600)]/20"
              >
                Generate My Plan
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSkipClarification}
                className="h-14 px-6 bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-sm font-spartan font-medium transition-colors border border-[var(--color-border-primary)]/10"
              >
                Skip
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            className="space-y-6"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={springs.soft}
          >
            {/* Textarea — glass-card-minimal with auto-resize */}
            <div className="glass-card-minimal rounded-2xl p-1 focus-within:ring-1 focus-within:ring-[var(--color-brand-500)]/20 transition-shadow">
              <textarea
                ref={textareaRef}
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                onInput={autoResize}
                placeholder="e.g., I want to run a 5K in 8 weeks..."
                className="w-full min-h-[120px] max-h-[320px] p-5 rounded-xl bg-transparent text-base font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none resize-none"
                maxLength={CHAR_LIMIT}
                autoFocus
              />
              {/* Character counter */}
              <div className="flex justify-between items-center px-4 pb-3">
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                  Be as descriptive as you like
                </p>
                <div className="flex items-center gap-2">
                  {/* Mini ring */}
                  <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
                    <circle cx="8" cy="8" r="6" fill="none" stroke="var(--color-surface-hover)" strokeWidth="2" />
                    <circle
                      cx="8" cy="8" r="6" fill="none" stroke={charColor} strokeWidth="2"
                      strokeDasharray={`${(charPercent / 100) * 37.7} 37.7`}
                      strokeLinecap="round"
                      transform="rotate(-90 8 8)"
                      className="transition-all duration-300"
                    />
                  </svg>
                  <span
                    className="text-xs font-spartan transition-colors duration-200"
                    style={{ color: charColor }}
                  >
                    {goalText.length.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Generate button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onGenerate}
              disabled={
                !goalText.trim() || goalText.trim().length < 5 || clarifyLoading
              }
              className="w-full h-14 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-base font-spartan font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--color-brand-600)]/20"
            >
              {clarifyLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing your goal...
                </span>
              ) : (
                "Generate My Plan"
              )}
            </motion.button>

            {/* Suggested goals — horizontal scroll on mobile */}
            <div>
              <p className="text-xs font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">
                Try a suggestion
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap scrollbar-none">
                {SUGGESTED_GOALS.map((g, i) => (
                  <motion.button
                    key={g}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springs.soft, delay: 0.3 + i * 0.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setGoalText(g)}
                    className="text-sm font-spartan px-4 py-2 rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/10 hover:border-[var(--color-border-primary)]/30 transition-all whitespace-nowrap flex-shrink-0 sm:flex-shrink"
                  >
                    {g}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GoalInput;
