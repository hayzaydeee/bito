import { motion, useReducedMotion } from "framer-motion";
import { PlusIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { SUGGESTED_GOALS } from "../../data/categoryMeta";
import AnimatedCompassSVG from "./AnimatedCompassSVG";

/**
 * CompassEmptyState — rich empty state for the compass list view.
 * Features an animated SVG compass, breathing background glow,
 * interactive goal suggestion pills, and a prominent CTA.
 */
const CompassEmptyState = ({ onCreateNew, onGoalSelect }) => {
  const prefersReduced = useReducedMotion();

  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.07, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const pillVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 25 },
    },
  };

  return (
    <motion.div
      className="relative max-w-lg mx-auto pt-8 sm:pt-16 pb-12 text-center"
      variants={containerVariants}
      initial={prefersReduced ? "show" : "hidden"}
      animate="show"
    >
      {/* Background glow */}
      <div className="compass-empty-aurora absolute inset-0 -top-20 pointer-events-none" />

      {/* Compass illustration */}
      <motion.div className="relative z-10 mb-6 inline-block" variants={itemVariants}>
        <AnimatedCompassSVG size={144} />
      </motion.div>

      {/* Heading */}
      <motion.h2
        className="relative z-10 text-2xl sm:text-3xl font-garamond font-bold text-[var(--color-text-primary)] mb-2"
        variants={itemVariants}
      >
        Find your direction
      </motion.h2>

      {/* Description */}
      <motion.p
        className="relative z-10 text-sm sm:text-base text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto mb-8 leading-relaxed"
        variants={itemVariants}
      >
        Describe a goal and AI will map out a phased habit system to get you
        there — step by step.
      </motion.p>

      {/* Goal suggestion pills */}
      <motion.div className="relative z-10 mb-8" variants={itemVariants}>
        <p className="text-xs font-spartan font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">
          Try a goal
        </p>
        <div className="flex flex-wrap justify-center gap-2 px-2">
          {SUGGESTED_GOALS.map((goal, i) => (
            <motion.button
              key={i}
              variants={pillVariants}
              whileHover={prefersReduced ? {} : { scale: 1.04, y: -1 }}
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
              onClick={() => onGoalSelect?.(goal)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-spartan text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/15 hover:border-[var(--color-brand-500)]/30 hover:text-[var(--color-text-primary)] hover:bg-[var(--color-brand-500)]/5 transition-colors cursor-pointer"
            >
              <span className="truncate">{goal}</span>
              <ArrowRightIcon className="w-3 h-3 flex-shrink-0 opacity-0 -ml-1 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div className="relative z-10" variants={itemVariants}>
        <motion.button
          whileHover={prefersReduced ? {} : { scale: 1.03 }}
          whileTap={prefersReduced ? {} : { scale: 0.97 }}
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-sm font-spartan font-semibold text-white transition-all shadow-lg shadow-[var(--color-brand-600)]/20 hover:shadow-xl hover:shadow-[var(--color-brand-600)]/30"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))",
          }}
        >
          <PlusIcon className="w-4 h-4" />
          Create your first compass
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default CompassEmptyState;
