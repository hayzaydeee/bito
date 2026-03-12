/**
 * ScrollReveal — Viewport-triggered entrance animation.
 *
 * Replaces the CSS IntersectionObserver + class-toggle pattern
 * from LandingPage with Framer Motion's useInView.
 *
 * Usage:
 *   <ScrollReveal>content fades up on scroll</ScrollReveal>
 *   <ScrollReveal direction="left" delay={0.1}>slides from left</ScrollReveal>
 *   <ScrollReveal direction="scale">scales in</ScrollReveal>
 */
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  scrollRevealVariants,
  scrollRevealLeft,
  scrollRevealRight,
  scrollRevealScale,
} from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";

const directionMap = {
  up: scrollRevealVariants,
  left: scrollRevealLeft,
  right: scrollRevealRight,
  scale: scrollRevealScale,
};

const ScrollReveal = ({
  children,
  direction = "up",
  delay = 0,
  threshold = 0.15,
  once = true,
  className = "",
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const { getVariants, shouldAnimate } = useMotionSafe();

  const baseVariants = directionMap[direction] || scrollRevealVariants;

  // Inject custom delay into the visible state
  const variants = delay
    ? {
        ...baseVariants,
        visible: {
          ...baseVariants.visible,
          transition: {
            ...baseVariants.visible.transition,
            delay,
          },
        },
      }
    : baseVariants;

  return (
    <motion.div
      ref={ref}
      variants={getVariants(variants)}
      initial="hidden"
      animate={isInView || !shouldAnimate ? "visible" : "hidden"}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
