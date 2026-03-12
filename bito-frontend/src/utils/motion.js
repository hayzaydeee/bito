/**
 * motion.js — Global Framer Motion variants, springs, and transitions.
 * Central source of truth for all animation config across the app.
 *
 * Promoted from components/compass/compassMotion.js and extended
 * with app-wide patterns (modals, lists, toasts, wizards, etc.).
 */

// ─────────────────────────────────────────────
// Spring presets
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Page-level transitions
// ─────────────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...springs.soft, staggerChildren: 0.06 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

// ─────────────────────────────────────────────
// Section / element fade-up
// ─────────────────────────────────────────────
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: springs.soft },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────
// Stagger containers
// ─────────────────────────────────────────────
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerContainerFast = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

// ─────────────────────────────────────────────
// Card variants (generic list / grid items)
// ─────────────────────────────────────────────
export const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.soft, delay: i * 0.04 },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  hover: { y: -2, transition: springs.snappy },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

/** Lighter-weight list item variant for smaller items (rows, pills) */
export const listItemVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.soft, delay: i * 0.05 },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────
// Modal / overlay
// ─────────────────────────────────────────────
export const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springs.soft },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
};

export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────
// Slide panels (drawers, sidesheets)
// ─────────────────────────────────────────────
export const slideRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springs.soft },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const slideLeft = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springs.soft },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const slideUp = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springs.soft },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// ─────────────────────────────────────────────
// Collapse / expand (accordions)
// ─────────────────────────────────────────────
export const collapseVariants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" },
  expanded: {
    height: "auto",
    opacity: 1,
    overflow: "hidden",
    transition: {
      height: springs.soft,
      opacity: { duration: 0.25, delay: 0.05 },
    },
  },
};

// ─────────────────────────────────────────────
// Toast notifications
// ─────────────────────────────────────────────
export const toastVariants = {
  initial: { opacity: 0, x: 80, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    x: 80,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// ─────────────────────────────────────────────
// Tab content crossfade
// ─────────────────────────────────────────────
export const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────
// Wizard step transitions (direction-aware)
// ─────────────────────────────────────────────
const WIZARD_OFFSET = 60;
export const wizardStepVariants = {
  enter: (direction = 1) => ({
    x: direction > 0 ? WIZARD_OFFSET : -WIZARD_OFFSET,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: springs.soft,
  },
  exit: (direction = 1) => ({
    x: direction > 0 ? -WIZARD_OFFSET : WIZARD_OFFSET,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  }),
};

// ─────────────────────────────────────────────
// Checkbox / check mark
// ─────────────────────────────────────────────
export const checkboxVariants = {
  unchecked: { pathLength: 0, opacity: 0 },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { ...springs.snappy, duration: 0.35 }, opacity: { duration: 0.1 } },
  },
};

export const checkboxBounce = {
  initial: { scale: 1 },
  checked: {
    scale: [1, 1.25, 0.95, 1],
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// ─────────────────────────────────────────────
// Celebration (streak milestones)
// ─────────────────────────────────────────────
export const celebrationVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

export const confettiParticle = (angle, distance) => ({
  initial: { x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 },
  animate: {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 20,
    scale: [0, 1.4, 0.8],
    opacity: [1, 1, 0],
    rotate: Math.random() * 360,
    transition: { duration: 0.8, ease: "easeOut" },
  },
});

// ─────────────────────────────────────────────
// Counter / number roll
// ─────────────────────────────────────────────
export const counterSpring = { stiffness: 100, damping: 20, mass: 0.5 };

// ─────────────────────────────────────────────
// Skeleton → Content crossfade
// ─────────────────────────────────────────────
export const skeletonExitVariants = {
  initial: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

export const contentEnterVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...springs.soft, delay: 0.05 },
  },
};

// ─────────────────────────────────────────────
// Scroll-reveal (viewport-triggered)
// ─────────────────────────────────────────────
export const scrollRevealVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scrollRevealLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scrollRevealRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scrollRevealScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─────────────────────────────────────────────
// Progress bar fill
// ─────────────────────────────────────────────
export const progressFill = (widthPercent) => ({
  initial: { width: 0 },
  animate: {
    width: `${widthPercent}%`,
    transition: { duration: 0.8, ease: "easeOut", delay: 0.3 },
  },
});

// ─────────────────────────────────────────────
// Skeleton shimmer
// ─────────────────────────────────────────────
export const skeletonPulse = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

// ─────────────────────────────────────────────
// Notification dropdown
// ─────────────────────────────────────────────
export const dropdownVariants = {
  initial: { opacity: 0, scale: 0.95, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springs.snappy },
  exit: { opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────
// Button micro-interaction defaults
// ─────────────────────────────────────────────
export const buttonTap = { scale: 0.97 };
export const buttonHover = { scale: 1.02 };

// ─────────────────────────────────────────────
// Reduced-motion static fallback
// All animating props snap to their final state.
// ─────────────────────────────────────────────
export const reducedMotionTransition = { duration: 0 };
