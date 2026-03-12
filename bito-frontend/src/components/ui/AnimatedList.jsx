/**
 * AnimatedList — Stagger container for list / grid children.
 *
 * Wraps children in a motion.div with stagger orchestration.
 * Each direct child should use cardVariants or listItemVariants
 * for coordinated entrance.
 *
 * Usage:
 *   <AnimatedList className="grid grid-cols-3 gap-4">
 *     {items.map((item, i) => (
 *       <motion.div key={item.id} variants={cardVariants} custom={i}>
 *         <Card item={item} />
 *       </motion.div>
 *     ))}
 *   </AnimatedList>
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer } from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";

const AnimatedList = ({
  children,
  className = "",
  withPresence = false,
  stagger,
  ...props
}) => {
  const { getVariants } = useMotionSafe();

  const variants = stagger
    ? {
        animate: {
          transition: {
            staggerChildren: stagger,
            delayChildren: stagger * 1.5,
          },
        },
      }
    : staggerContainer;

  const list = (
    <motion.div
      variants={getVariants(variants)}
      initial="initial"
      animate="animate"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );

  if (withPresence) {
    return <AnimatePresence mode="popLayout">{list}</AnimatePresence>;
  }

  return list;
};

export default AnimatedList;
