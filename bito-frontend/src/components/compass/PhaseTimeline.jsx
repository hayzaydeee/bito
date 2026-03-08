import { CheckCircledIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import CATEGORY_META from "../../data/categoryMeta";
import { springs, phaseNodeVariants } from "./compassMotion";

/**
 * PhaseTimeline — horizontal phase progression indicator.
 * Shows Foundation → Building → Mastery (or custom phases from compass data).
 * Switches to vertical on mobile. Animated nodes and connectors.
 */
const DEFAULT_PHASES = [
  { name: "Foundation", description: "Build core habits" },
  { name: "Building", description: "Increase consistency" },
  { name: "Mastery", description: "Long-term integration" },
];

const PhaseTimeline = ({ compass }) => {
  const sys = compass.system || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const phases =
    sys.phases && sys.phases.length > 0
      ? sys.phases
      : DEFAULT_PHASES;

  // Determine which phase is active
  const progress = compass.progress || {};
  const activeIndex = progress.currentPhaseIndex ?? (
    phases.some((p) => p.status === "active" || p.status === "current")
      ? phases.findIndex((p) => p.status === "active" || p.status === "current")
      : compass.status === "active"
      ? 0
      : compass.status === "completed"
      ? phases.length
      : -1
  );
  const effectiveActive = activeIndex;
  const completedSet = new Set(
    (progress.completedPhases || []).map((cp) => cp.phaseIndex)
  );

  return (
    <motion.div
      className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.soft, delay: 0.1 }}
    >
      <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
        Phases
      </h3>

      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start gap-0">
        {phases.map((phase, i) => {
          const isCompleted = completedSet.has(i) || i < effectiveActive;
          const isActive = i === effectiveActive;

          return (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              {/* Connector line — animated fill */}
              {i > 0 && (
                <div className="absolute top-3.5 right-1/2 w-full h-0.5 -translate-y-1/2 bg-[var(--color-surface-hover)]">
                  <motion.div
                    className="h-full origin-left"
                    style={{ background: catMeta.accent }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted || isActive ? 1 : 0 }}
                    transition={{ ...springs.soft, delay: i * 0.12 }}
                  />
                </div>
              )}

              {/* Circle node */}
              <motion.div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-spartan font-bold ${
                  isCompleted
                    ? "text-white"
                    : isActive
                    ? "text-white"
                    : "text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)]"
                }`}
                style={{
                  backgroundColor: isCompleted || isActive ? catMeta.accent : undefined,
                  boxShadow: isActive ? `0 0 0 4px ${catMeta.accent}25` : undefined,
                }}
                variants={phaseNodeVariants}
                initial="initial"
                animate="animate"
                custom={i}
              >
                {isCompleted ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...springs.bouncy, delay: i * 0.12 + 0.1 }}
                  >
                    <CheckCircledIcon className="w-4 h-4" />
                  </motion.span>
                ) : (
                  i + 1
                )}
              </motion.div>

              {/* Active pulse ring */}
              {isActive && (
                <motion.div
                  className="absolute top-0 z-[5] w-8 h-8 rounded-full"
                  style={{ border: `2px solid ${catMeta.accent}` }}
                  animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              {/* Label */}
              <motion.p
                className={`mt-2 text-sm font-spartan font-semibold text-center ${
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.2 }}
              >
                {phase.name}
              </motion.p>
              {phase.description && (
                <p className="mt-1 text-xs font-spartan text-[var(--color-text-secondary)] text-center max-w-[160px]">
                  {phase.description}
                </p>
              )}
              {phase.durationDays && (
                <p className="mt-1 text-xs font-spartan text-[var(--color-text-secondary)] font-medium">
                  {phase.durationDays} days
                </p>
              )}
              {!phase.durationDays && phase.duration && (
                <p className="mt-1 text-xs font-spartan text-[var(--color-text-secondary)] font-medium">
                  {phase.duration}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="sm:hidden space-y-0">
        {phases.map((phase, i) => {
          const isCompleted = completedSet.has(i) || i < effectiveActive;
          const isActive = i === effectiveActive;

          return (
            <motion.div
              key={i}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.soft, delay: i * 0.08 }}
            >
              {/* Vertical track */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-spartan font-bold ${
                    isCompleted || isActive
                      ? "text-white"
                      : "text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)]"
                  }`}
                  style={{
                    backgroundColor: isCompleted || isActive ? catMeta.accent : undefined,
                    boxShadow: isActive ? `0 0 0 3px ${catMeta.accent}25` : undefined,
                  }}
                  variants={phaseNodeVariants}
                  initial="initial"
                  animate="animate"
                  custom={i}
                >
                  {isCompleted ? (
                    <CheckCircledIcon className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </motion.div>
                {i < phases.length - 1 && (
                  <div className="w-0.5 min-h-[24px] mt-1 mb-1 bg-[var(--color-surface-hover)] relative overflow-hidden">
                    <motion.div
                      className="absolute inset-x-0 top-0 h-full origin-top"
                      style={{ background: catMeta.accent }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: isCompleted ? 1 : 0 }}
                      transition={{ ...springs.soft, delay: i * 0.12 + 0.15 }}
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="pb-3 pt-0.5">
                <p
                  className={`text-sm font-spartan font-semibold ${
                    isActive
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {phase.name}
                  {isActive && (
                    <span
                      className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                      style={{
                        color: catMeta.accent,
                        backgroundColor: `${catMeta.accent}15`,
                      }}
                    >
                      Current
                    </span>
                  )}
                </p>
                {phase.description && (
                  <p className="text-xs font-spartan text-[var(--color-text-secondary)] mt-0.5">
                    {phase.description}
                  </p>
                )}
                {(phase.durationDays || phase.duration) && (
                  <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5">
                    {phase.durationDays ? `${phase.durationDays} days` : phase.duration}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PhaseTimeline;
