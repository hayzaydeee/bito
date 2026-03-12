/**
 * compassMotion.js — Compass-specific Framer Motion variants.
 *
 * Shared / generic variants (springs, pageVariants, cardVariants,
 * modalVariants, etc.) are now in utils/motion.js — re-exported
 * here for backward compatibility so existing compass imports
 * continue to work without changes.
 */

// ── Re-export everything from the global motion config ──
export {
  springs,
  pageVariants,
  cardVariants,
  fadeUp,
  staggerContainer,
  modalVariants,
  backdropVariants,
  slideRight,
  collapseVariants,
  progressFill,
  skeletonPulse,
} from "../../utils/motion";

// Local import for compass-specific variants that reference springs
import { springs } from "../../utils/motion";

// ── Step reveal (generating overlay) — compass-specific ──
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
