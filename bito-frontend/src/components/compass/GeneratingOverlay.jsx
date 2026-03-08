import { motion, AnimatePresence } from "framer-motion";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { springs, stepVariants } from "./compassMotion";

/**
 * GeneratingOverlay — progressive plan skeleton shown during compass generation.
 * Steps reveal with motion, and a skeleton blueprint of the plan fades in
 * as the AI gets closer to finishing.
 */
const STEPS = [
  { label: "Understanding your goal...", icon: "🎯", skeleton: "goal" },
  { label: "Researching best practices...", icon: "📖", skeleton: "research" },
  { label: "Designing your habit system...", icon: "⚙️", skeleton: "habits" },
  { label: "Polishing your plan...", icon: "✨", skeleton: "polish" },
];

const GeneratingOverlay = ({ step = 0 }) => {
  return (
    <motion.div
      className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12 min-h-[60vh] py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left — Steps */}
      <div className="glass-card-minimal p-8 sm:p-10 max-w-sm w-full text-center lg:text-left">
        {/* Brain icon with pulse ring */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <motion.div
            className="absolute inset-0 rounded-full bg-[var(--color-brand-500)]/10"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-5xl relative z-10">🧠</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-garamond font-bold text-[var(--color-text-primary)] mb-6">
          Generating Your Plan
        </h2>

        {/* Steps */}
        <div className="space-y-4 text-left max-w-xs mx-auto lg:mx-0">
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            const state = isCompleted
              ? "completed"
              : isActive
              ? "active"
              : "inactive";

            return (
              <motion.div
                key={i}
                className="flex items-center gap-4"
                variants={stepVariants}
                initial="inactive"
                animate={state}
              >
                <motion.div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors duration-500 ${
                    isCompleted
                      ? "bg-green-500/20 text-green-400"
                      : isActive
                      ? "bg-[var(--color-brand-600)]/20 text-[var(--color-brand-400)]"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                  }`}
                  animate={
                    isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }
                  }
                  transition={
                    isActive
                      ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                      : {}
                  }
                >
                  {isCompleted ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={springs.bouncy}
                    >
                      <CheckCircledIcon className="w-4 h-4" />
                    </motion.span>
                  ) : (
                    s.icon
                  )}
                </motion.div>
                <span
                  className={`text-sm font-spartan transition-colors duration-300 ${
                    isActive
                      ? "text-[var(--color-text-primary)] font-medium"
                      : isCompleted
                      ? "text-[var(--color-text-secondary)]"
                      : "text-[var(--color-text-tertiary)]"
                  }`}
                >
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8 h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)]"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Right — Progressive plan skeleton */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            className="hidden lg:block w-full max-w-sm"
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30 }}
            transition={springs.gentle}
          >
            <div className="glass-card-minimal rounded-2xl p-6 space-y-5">
              {/* Blueprint header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl compass-skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded compass-skeleton-shimmer" />
                  <div className="h-3 w-1/2 rounded compass-skeleton-shimmer" />
                </div>
              </div>

              {/* Phase timeline skeleton */}
              <AnimatePresence>
                {step >= 2 && (
                  <motion.div
                    className="flex gap-2 pt-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.soft, delay: 0.2 }}
                  >
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="flex-1 space-y-1.5">
                        <div className="h-2 rounded-full compass-skeleton-shimmer" />
                        <div className="h-2.5 w-2/3 rounded compass-skeleton-shimmer" />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Habit card skeletons */}
              <AnimatePresence>
                {step >= 2 && (
                  <motion.div
                    className="space-y-3 pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {[0, 1, 2].map((j) => (
                      <motion.div
                        key={j}
                        className="rounded-xl border border-[var(--color-border-primary)]/10 p-3 space-y-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springs.soft, delay: 0.5 + j * 0.15 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg compass-skeleton-shimmer" />
                          <div className="h-3.5 w-2/3 rounded compass-skeleton-shimmer" />
                        </div>
                        <div className="h-2.5 w-full rounded compass-skeleton-shimmer" />
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((d) => (
                            <div
                              key={d}
                              className="w-5 h-5 rounded-full compass-skeleton-shimmer"
                            />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action bar skeleton */}
              <AnimatePresence>
                {step >= 3 && (
                  <motion.div
                    className="flex gap-2 pt-3 border-t border-[var(--color-border-primary)]/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="h-10 flex-1 rounded-xl compass-skeleton-shimmer" />
                    <div className="h-10 w-24 rounded-xl compass-skeleton-shimmer" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GeneratingOverlay;
