/**
 * SplitText — Word-by-word staggered entrance animation.
 *
 * Splits a string into individual word spans, each animated from
 * opacity:0 + y:20 → opacity:1 + y:0 with a configurable stagger.
 * Triggers once when the container enters the viewport.
 *
 * Usage:
 *   <SplitText
 *     text="Your habits are the infrastructure of who you're becoming."
 *     className="text-4xl font-garamond"
 *     stagger={0.07}
 *   />
 */
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import useMotionSafe from "../../hooks/useMotionSafe";

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SplitText({
  text,
  className = "",
  style = {},
  stagger = 0.07,
  duration = 0.6,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionSafe = useMotionSafe();

  const words = text.split(" ");

  return (
    <span ref={ref} className={className} style={{ display: "block", ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          initial="hidden"
          animate={isInView && motionSafe ? "visible" : "hidden"}
          transition={{
            duration,
            delay: i * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
