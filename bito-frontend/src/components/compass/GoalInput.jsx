import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, ArrowRightIcon, Link2Icon } from "@radix-ui/react-icons";
import { SUGGESTED_GOALS } from "../../data/categoryMeta";
import { springs } from "./compassMotion";

/**
 * GoalInput — the "create compass" threshold, rebuilt in the DRILL editorial
 * language: a left-aligned canvas (mono kicker → giant Fraunces question), the
 * goal field as a signal-ticked ledger card with a std-meter fill + mono count,
 * a "Forge my system" CTA, and starter goals as mono-arrow chips. The
 * clarification phase becomes a numbered (№) intake.
 * Preserves auto-resize, the character meter, and the two-step clarify flow.
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

  // Character meter
  const charPercent = Math.min((goalText.length / CHAR_LIMIT) * 100, 100);
  const charColor =
    goalText.length > CHAR_LIMIT
      ? "var(--rose)"
      : goalText.length > CHAR_WARN
      ? "var(--ember)"
      : "var(--signal)";

  // Step indicator (1: write, 2: clarify)
  const currentStep = hasClarification ? 2 : 1;

  return (
    <motion.div
      className="std max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
    >
      {/* Top bar — back + indexed step readout */}
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="std-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-3 std-mono text-[11px] uppercase tracking-[0.14em]">
          <span className={currentStep === 1 ? "text-[var(--ink)]" : "text-[var(--ink-3)]"}>
            01 Describe
          </span>
          <span className="text-[var(--line-3)]">—</span>
          <span className={currentStep === 2 ? "text-[var(--ink)]" : "text-[var(--ink-3)]"}>
            02 Clarify
          </span>
        </div>
      </div>

      {/* Masthead */}
      <AnimatePresence mode="wait">
        <motion.div
          key={hasClarification ? "clarify" : "goal"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={springs.soft}
        >
          <p className="std-kicker mb-4" style={{ color: "var(--signal)" }}>
            {hasClarification ? "The Compass — Intake" : "The Compass — New System"}
          </p>
          <h1 className="std-display font-black leading-[0.95] text-[var(--ink)] text-[clamp(2rem,6vw,3.75rem)] max-w-[15ch]">
            {hasClarification ? "A few specifics." : "What are you working toward?"}
          </h1>
          <p className="text-[var(--ink-2)] mt-4 max-w-xl leading-relaxed">
            {hasClarification
              ? clarification.reasoning
              : "State the goal in your own words — the engine forges a habit system around it."}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-6 p-4 rounded-[var(--r-btn)] border border-[var(--rose)]/30 bg-[var(--rose)]/10 text-[var(--rose)] text-sm"
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
            className="mt-8 std-card p-4 space-y-2"
            style={{ borderColor: "color-mix(in srgb, var(--signal) 35%, var(--line-2))" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springs.soft}
          >
            <div className="flex items-center gap-2">
              <Link2Icon className="w-4 h-4 text-[var(--signal)]" />
              <span className="std-kicker" style={{ color: "var(--signal)" }}>
                Multiple goals detected
              </span>
            </div>
            {goalAnalysis.structureSummary && (
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                {goalAnalysis.structureSummary}
              </p>
            )}
            {goalAnalysis.capacityNote && (
              <p className="text-xs text-[var(--ink-3)] italic">
                {goalAnalysis.capacityNote}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase switch ── */}
      <AnimatePresence mode="wait">
        {hasClarification ? (
          <motion.div
            key="clarification"
            className="mt-10 space-y-5"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={springs.soft}
          >
            {clarification.questions.map((q, i) => (
              <motion.div
                key={i}
                className="std-card p-5 space-y-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.soft, delay: i * 0.08 }}
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="std-mono text-[12px] text-[var(--signal)] flex-shrink-0">
                    №{String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-semibold text-[var(--ink)] text-[15px] leading-snug">
                    {q.question}
                  </p>
                </div>
                {q.why && (
                  <p className="text-xs text-[var(--ink-3)] leading-relaxed pl-[2.4rem]">
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
                  className="w-full h-20 p-3 rounded-[var(--r-btn)] bg-[var(--bg-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] resize-none border border-[var(--line-2)] transition-colors"
                />
                {q.examples?.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {q.examples.map((ex, ei) => (
                      <button
                        key={ei}
                        onClick={() => onUpdateAnswer(i, ex)}
                        className="std-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-[var(--r-tag)] border border-[var(--line-2)] text-[var(--ink-3)] hover:text-[var(--ink-2)] hover:border-[var(--line-3)] transition-colors"
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
                className="std-btn std-btn--signal flex-1 h-14"
              >
                Generate my plan
                <ArrowRightIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSkipClarification}
                className="std-btn h-14 px-6"
              >
                Skip
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            className="mt-10 space-y-8"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={springs.soft}
          >
            {/* Goal field — editorial ledger card */}
            <div>
              <p className="std-kicker mb-3">Your goal</p>
              <div className="std-card relative overflow-hidden p-5 focus-within:border-[var(--line-3)] transition-colors">
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--signal)] opacity-70" />
                <textarea
                  ref={textareaRef}
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  onInput={autoResize}
                  placeholder="e.g., Run a 5K in 8 weeks without burning out"
                  className="w-full min-h-[120px] max-h-[320px] bg-transparent text-lg text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none resize-none leading-relaxed"
                  maxLength={CHAR_LIMIT}
                  autoFocus
                />
                {/* Character meter */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="std-meter flex-1">
                    <i
                      style={{
                        width: `${charPercent}%`,
                        background: charColor,
                        transition: "width .3s ease, background .2s ease",
                      }}
                    />
                  </div>
                  <span
                    className="std-mono text-[11px] flex-shrink-0 transition-colors duration-200"
                    style={{ color: charColor }}
                  >
                    {goalText.length.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Forge CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onGenerate}
              disabled={
                !goalText.trim() || goalText.trim().length < 5 || clarifyLoading
              }
              className="std-btn std-btn--signal w-full h-14 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clarifyLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Analyzing goal...
                </>
              ) : (
                <>
                  Forge my system
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Starter goals — horizontal scroll on mobile */}
            <div>
              <p className="std-kicker mb-3">Starter goals</p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap scrollbar-none">
                {SUGGESTED_GOALS.map((g, i) => (
                  <motion.button
                    key={g}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springs.soft, delay: 0.3 + i * 0.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setGoalText(g)}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-[var(--r-pill)] border border-[var(--line-2)] text-sm text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--signal)] transition-all whitespace-nowrap flex-shrink-0 sm:flex-shrink"
                  >
                    <span className="std-mono text-[10px] text-[var(--ink-3)] group-hover:text-[var(--signal)] transition-colors">
                      →
                    </span>
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
