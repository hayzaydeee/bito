/**
 * AnimatedPage — Wraps page content with consistent enter/exit transitions.
 *
 * Usage:
 *   <AnimatedPage>
 *     <YourPageContent />
 *   </AnimatedPage>
 *
 * Respects prefers-reduced-motion via useMotionSafe.
 */
import React from "react";
import { motion } from "framer-motion";
import { pageVariants } from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";

const AnimatedPage = ({ children, className = "", ...props }) => {
  const { getVariants } = useMotionSafe();

  return (
    <motion.div
      variants={getVariants(pageVariants)}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-full relative ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
