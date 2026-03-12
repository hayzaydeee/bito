/**
 * ProgressRing — reusable SVG circular progress indicator.
 * Extracted from StatPills for shared use across Compass, Groups, etc.
 */
import { motion } from "framer-motion";
import { springs } from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";

const ProgressRing = ({
  value = 0,
  size = 52,
  stroke = 4,
  color = "var(--color-brand-500)",
  trackColor = "var(--color-surface-hover)",
  className = "",
}) => {
  const { shouldAnimate } = useMotionSafe();
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circ - (pct / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      className={`flex-shrink-0 -rotate-90 ${className}`}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke={trackColor}
      />
      {/* Fill */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: offset }}
        initial={shouldAnimate ? { strokeDashoffset: circ } : { strokeDashoffset: offset }}
        transition={shouldAnimate ? { ...springs.soft, duration: 0.8 } : { duration: 0 }}
      />
    </svg>
  );
};

export default ProgressRing;
