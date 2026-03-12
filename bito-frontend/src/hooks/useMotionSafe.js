/**
 * useMotionSafe — Accessibility-aware animation hook.
 *
 * Wraps Framer Motion's useReducedMotion() and provides helpers
 * so every component can respect prefers-reduced-motion without
 * repeating boilerplate.
 *
 * Usage:
 *   const { shouldAnimate, getVariants } = useMotionSafe();
 *   <motion.div variants={getVariants(cardVariants)} ... />
 */
import { useReducedMotion } from "framer-motion";
import { reducedMotionTransition } from "../utils/motion";

export function useMotionSafe() {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = !prefersReduced;

  /**
   * If the user prefers reduced motion, return a "flat" variant
   * set where every state resolves to the animate/visible target
   * with duration: 0 (instant). Otherwise return the original.
   */
  function getVariants(variants) {
    if (shouldAnimate) return variants;

    // Build a reduced set: every key maps to the animate/visible/center
    // state values but with instant transition.
    const target =
      variants.animate ?? variants.visible ?? variants.center ?? {};
    const reduced = {};
    for (const key of Object.keys(variants)) {
      if (typeof variants[key] === "function") {
        reduced[key] = () => ({
          ...(typeof target === "function" ? target() : target),
          transition: reducedMotionTransition,
        });
      } else {
        reduced[key] = {
          ...(typeof target === "function" ? target() : target),
          transition: reducedMotionTransition,
        };
      }
    }
    return reduced;
  }

  return { shouldAnimate, prefersReduced, getVariants };
}

export default useMotionSafe;
