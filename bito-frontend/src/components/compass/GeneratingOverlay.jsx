import { motion, AnimatePresence } from "framer-motion";
import { springs } from "./compassMotion";

/**
 * GeneratingOverlay — the "system being forged" moment.
 * Left: a forge console — a mono telemetry log that ticks through each stage
 * (with a blinking cursor on the active line) and a std-meter "FORGING — n%"
 * readout. Right (lg+): a live blueprint that assembles as a numbered ledger
 * — phase markers and habit rows drawing in as the engine nears completion.
 * Driven by the `step` index (0..STEPS.length-1).
 */
const STEPS = [
  { label: "Understanding the goal", skeleton: "goal" },
  { label: "Researching methods", skeleton: "research" },
  { label: "Designing the system", skeleton: "habits" },
  { label: "Polishing the plan", skeleton: "polish" },
];

const Cursor = () => (
  <motion.span
    className="text-[var(--signal)]"
    animate={{ opacity: [1, 0, 1] }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  >
    ▋
  </motion.span>
);

const GeneratingOverlay = ({ step = 0 }) => {
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <motion.div
      className="std max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-start py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Left: forge console ── */}
      <div>
        <p className="std-kicker mb-4" style={{ color: "var(--signal)" }}>
          The Compass — Forge
        </p>
        <h2 className="std-display font-black leading-[0.95] text-[var(--ink)] text-[clamp(1.75rem,4.5vw,2.75rem)] max-w-[14ch]">
          Forging your system.
        </h2>
        <p className="text-[var(--ink-2)] mt-3 max-w-md leading-relaxed">
          The engine is assembling a habit system from your goal — hold tight.
        </p>

        {/* Telemetry log */}
        <div className="mt-8 space-y-3 border-l border-[var(--line-2)] pl-5">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const mark = done ? "[✓]" : active ? "[▸]" : "[ ]";
            return (
              <motion.div
                key={i}
                className="flex items-center gap-3 std-mono text-[12px] uppercase tracking-[0.08em]"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: done || active ? 1 : 0.45, x: 0 }}
                transition={{ ...springs.soft, delay: i * 0.08 }}
              >
                <span
                  className="flex-shrink-0 w-7"
                  style={{
                    color: done
                      ? "var(--signal)"
                      : active
                      ? "var(--ink)"
                      : "var(--ink-3)",
                  }}
                >
                  {mark}
                </span>
                <span
                  className="flex-1"
                  style={{
                    color: done
                      ? "var(--ink-2)"
                      : active
                      ? "var(--ink)"
                      : "var(--ink-3)",
                  }}
                >
                  {s.label}
                </span>
                {active && <Cursor />}
                {done && (
                  <span className="text-[10px] text-[var(--ink-3)]">ok</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mt-8 space-y-2 max-w-md">
          <div className="std-meter">
            <motion.i
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between std-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            <span>Forging</span>
            <span style={{ color: "var(--signal)" }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* ── Right: live blueprint ── */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30 }}
            transition={springs.gentle}
          >
            <div className="std-card p-6 space-y-5">
              {/* Blueprint header */}
              <div className="flex items-center justify-between">
                <span className="std-kicker" style={{ color: "var(--signal)" }}>
                  Blueprint — Draft
                </span>
                <span className="std-mono text-[10px] text-[var(--ink-3)] tracking-widest">
                  №··
                </span>
              </div>
              <hr className="std-rule" />

              {/* Title block */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--r-tag)] compass-skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded compass-skeleton-shimmer" />
                  <div className="h-3 w-1/2 rounded compass-skeleton-shimmer" />
                </div>
              </div>

              {/* Phase markers */}
              <AnimatePresence>
                {step >= 2 && (
                  <motion.div
                    className="flex gap-3 pt-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.soft, delay: 0.2 }}
                  >
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="flex-1 space-y-1.5">
                        <span className="std-mono text-[9px] text-[var(--ink-3)]">
                          №{String(j + 1).padStart(2, "0")}
                        </span>
                        <div className="h-2 rounded-full compass-skeleton-shimmer" />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Habit rows — ledger entries drawing in */}
              <AnimatePresence>
                {step >= 2 && (
                  <motion.div
                    className="space-y-2.5 pt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {[0, 1, 2].map((j) => (
                      <motion.div
                        key={j}
                        className="flex items-center gap-3 rounded-[var(--r-tag)] border border-[var(--line)] p-3"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springs.soft, delay: 0.5 + j * 0.15 }}
                      >
                        <span className="std-mono text-[10px] text-[var(--ink-3)] flex-shrink-0">
                          №{String(j + 1).padStart(2, "0")}
                        </span>
                        <div className="w-6 h-6 rounded-md compass-skeleton-shimmer flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-2/3 rounded compass-skeleton-shimmer" />
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((d) => (
                              <div
                                key={d}
                                className="w-4 h-4 rounded-full compass-skeleton-shimmer"
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action bar */}
              <AnimatePresence>
                {step >= 3 && (
                  <motion.div
                    className="flex gap-2 pt-3 border-t border-[var(--line)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="h-10 flex-1 rounded-[var(--r-btn)] compass-skeleton-shimmer" />
                    <div className="h-10 w-24 rounded-[var(--r-btn)] compass-skeleton-shimmer" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GeneratingOverlay;
