/**
 * ProgressRing — reusable SVG circular progress indicator.
 * Extracted from StatPills for shared use across Transformers, Groups, etc.
 */
const ProgressRing = ({
  value = 0,
  size = 52,
  stroke = 4,
  color = "var(--color-brand-500)",
  trackColor = "var(--color-surface-hover)",
  className = "",
}) => {
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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

export default ProgressRing;
