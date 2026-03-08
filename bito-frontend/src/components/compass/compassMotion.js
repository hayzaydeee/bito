/**
 * compassMotion.js — shared Framer Motion variants, springs, and transitions
 * for all compass components. Central source of truth for animation config.
 */

// ── Spring presets ──
export const springs = {
  /** Snappy UI interactions (buttons, toggles) */
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  /** Soft content entry (cards, panels) */
  soft: { type: "spring", stiffness: 200, damping: 26, mass: 0.8 },
  /** Gentle float (overlays, modals) */
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
  /** Bouncy delight moments */
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
  /** Slow settle — compass needle, large hero elements */
  settle: { type: "spring", stiffness: 25, damping: 6, mass: 1.2 },
};

// ── Page transitions ──
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { ...springs.soft, staggerChildren: 0.06 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

// ── Card variants (list grid) ──
export const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.soft, delay: i * 0.04 },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  hover: { y: -2, transition: springs.snappy },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

// ── Section fade-up (headers, stat pills, section content) ──
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: springs.soft },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ── Stagger container ──
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

// ── Scale-fade for modals / overlays ──
export const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springs.soft },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
};

// ── Backdrop ──
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ── Slide from right (artifact panel, detail slide) ──
export const slideRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springs.soft },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

// ── Collapse / expand (accordion phases) ──
export const collapseVariants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" },
  expanded: {
    height: "auto",
    opacity: 1,
    overflow: "hidden",
    transition: { height: springs.soft, opacity: { duration: 0.25, delay: 0.05 } },
  },
};

// ── Progress bar fill ──
export const progressFill = (widthPercent) => ({
  initial: { width: 0 },
  animate: { width: `${widthPercent}%`, transition: { duration: 0.8, ease: "easeOut", delay: 0.3 } },
});

// ── Step reveal (generating overlay) ──
export const stepVariants = {
  inactive: { opacity: 0.4, x: -8, scale: 0.97 },
  active: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springs.soft,
  },
  completed: {
    opacity: 0.7,
    x: 0,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

// ── Skeleton shimmer (used in CSS, referenced here for completeness) ──
export const skeletonPulse = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

// ── Phase timeline node pop-in ──
export const phaseNodeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: (i) => ({
    scale: 1,
    opacity: 1,
    transition: { ...springs.bouncy, delay: 0.15 + i * 0.1 },
  }),
};

// ── Habit card stagger within a phase ──
export const habitCardVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.soft, delay: i * 0.05 },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};
