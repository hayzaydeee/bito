/**
 * SkeletonTransition — Crossfade between a skeleton loader and real content.
 *
 * Uses AnimatePresence mode="wait" so the skeleton fades out before
 * the content fades in. No more instant swap.
 *
 * Usage:
 *   <SkeletonTransition
 *     isLoading={isLoading}
 *     skeleton={<DashboardSkeleton />}
 *   >
 *     <DashboardContent />
 *   </SkeletonTransition>
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  skeletonExitVariants,
  contentEnterVariants,
} from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";

const SkeletonTransition = ({ isLoading, skeleton, children }) => {
  const { getVariants } = useMotionSafe();

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          variants={getVariants(skeletonExitVariants)}
          initial="initial"
          animate="initial"
          exit="exit"
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          variants={getVariants(contentEnterVariants)}
          initial="initial"
          animate="animate"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SkeletonTransition;
