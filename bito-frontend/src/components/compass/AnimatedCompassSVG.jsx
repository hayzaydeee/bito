import { motion, useReducedMotion } from "framer-motion";

/**
 * AnimatedCompassSVG — hand-built SVG compass rose with animated needle.
 * The needle performs an underdamped spring "settling" animation on mount,
 * swinging before pointing north. Fully themeable via CSS variables.
 *
 * @param {number} size — pixel diameter (default 160)
 */
const AnimatedCompassSVG = ({ size = 160 }) => {
  const prefersReduced = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.35;
  const tickR = size * 0.39;
  const needleLen = size * 0.28;
  const needleWidth = size * 0.04;

  const cardinals = [
    { label: "N", angle: -90, bold: true },
    { label: "E", angle: 0 },
    { label: "S", angle: 90 },
    { label: "W", angle: 180 },
  ];

  // Minor tick marks at 30° intervals (excluding cardinal positions)
  const minorTicks = [];
  for (let deg = 0; deg < 360; deg += 30) {
    if (deg % 90 !== 0) minorTicks.push(deg);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Compass illustration"
      className="flex-shrink-0"
    >
      {/* Outer ring */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        strokeWidth={1.5}
        stroke="var(--color-text-tertiary)"
        strokeOpacity={0.25}
        initial={prefersReduced ? {} : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Inner decorative ring */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill="none"
        strokeWidth={0.75}
        stroke="var(--color-text-tertiary)"
        strokeOpacity={0.12}
        strokeDasharray="3 4"
      />

      {/* Minor tick marks */}
      {minorTicks.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * (outerR - 4);
        const y1 = cy + Math.sin(rad) * (outerR - 4);
        const x2 = cx + Math.cos(rad) * (outerR + 1);
        const y2 = cy + Math.sin(rad) * (outerR + 1);
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-text-tertiary)"
            strokeOpacity={0.15}
            strokeWidth={0.75}
          />
        );
      })}

      {/* Cardinal labels */}
      {cardinals.map(({ label, angle, bold }, i) => {
        const rad = (angle * Math.PI) / 180;
        const tx = cx + Math.cos(rad) * tickR;
        const ty = cy + Math.sin(rad) * tickR;
        return (
          <motion.text
            key={label}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="central"
            fill={bold ? "var(--color-brand-500)" : "var(--color-text-tertiary)"}
            fillOpacity={bold ? 1 : 0.5}
            fontSize={bold ? size * 0.09 : size * 0.065}
            fontWeight={bold ? 700 : 500}
            fontFamily="var(--font-spartan, 'League Spartan', sans-serif)"
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: "easeOut" }}
          >
            {label}
          </motion.text>
        );
      })}

      {/* Center dot */}
      <circle
        cx={cx}
        cy={cy}
        r={size * 0.025}
        fill="var(--color-text-tertiary)"
        fillOpacity={0.3}
      />

      {/* Needle — N (brand color) */}
      <motion.g
        style={{ originX: `${cx}px`, originY: `${cy}px` }}
        initial={prefersReduced ? { rotate: 0 } : { rotate: -60 }}
        animate={{ rotate: 0 }}
        transition={
          prefersReduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 25, damping: 6, mass: 1.2 }
        }
      >
        {/* North half — brand color */}
        <polygon
          points={`${cx},${cy - needleLen} ${cx - needleWidth},${cy} ${cx + needleWidth},${cy}`}
          fill="var(--color-brand-500)"
          fillOpacity={0.9}
        />
        {/* South half — muted */}
        <polygon
          points={`${cx},${cy + needleLen * 0.55} ${cx - needleWidth},${cy} ${cx + needleWidth},${cy}`}
          fill="var(--color-text-tertiary)"
          fillOpacity={0.25}
        />
        {/* Center pin */}
        <circle cx={cx} cy={cy} r={size * 0.03} fill="var(--color-brand-500)" />
      </motion.g>
    </svg>
  );
};

export default AnimatedCompassSVG;
