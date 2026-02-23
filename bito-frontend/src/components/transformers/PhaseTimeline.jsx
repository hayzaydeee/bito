import { CheckCircledIcon } from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";

/**
 * PhaseTimeline — horizontal phase progression indicator.
 * Shows Foundation → Building → Mastery (or custom phases from transformer data).
 * Switches to vertical on mobile.
 */
const DEFAULT_PHASES = [
  { name: "Foundation", description: "Build core habits" },
  { name: "Building", description: "Increase consistency" },
  { name: "Mastery", description: "Long-term integration" },
];

const PhaseTimeline = ({ transformer }) => {
  const sys = transformer.system || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const phases =
    sys.phases && sys.phases.length > 0
      ? sys.phases
      : DEFAULT_PHASES;

  // Determine which phase is active
  const activeIndex = phases.findIndex(
    (p) => p.status === "active" || p.status === "current"
  );
  const effectiveActive =
    activeIndex >= 0
      ? activeIndex
      : transformer.status === "active"
      ? 0
      : transformer.status === "completed"
      ? phases.length
      : -1;

  return (
    <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
      <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
        Phases
      </h3>

      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start gap-0">
        {phases.map((phase, i) => {
          const isCompleted = i < effectiveActive || phase.status === "completed";
          const isActive = i === effectiveActive;
          const isFuture = !isCompleted && !isActive;

          return (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className="absolute top-3.5 right-1/2 w-full h-0.5 -translate-y-1/2"
                  style={{
                    background: isCompleted || isActive
                      ? catMeta.accent
                      : "var(--color-surface-hover)",
                  }}
                />
              )}

              {/* Circle */}
              <div
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-spartan font-bold transition-all ${
                  isCompleted
                    ? "text-white"
                    : isActive
                    ? "text-white ring-4 ring-opacity-20"
                    : "text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)]"
                }`}
                style={{
                  backgroundColor: isCompleted || isActive ? catMeta.accent : undefined,
                  ringColor: isActive ? `${catMeta.accent}30` : undefined,
                  boxShadow: isActive ? `0 0 0 4px ${catMeta.accent}20` : undefined,
                }}
              >
                {isCompleted ? (
                  <CheckCircledIcon className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>

              {/* Label */}
              <p
                className={`mt-2 text-xs font-spartan font-semibold text-center ${
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : isCompleted
                    ? "text-[var(--color-text-secondary)]"
                    : "text-[var(--color-text-tertiary)]"
                }`}
              >
                {phase.name}
              </p>
              {phase.description && (
                <p className="mt-0.5 text-[10px] font-spartan text-[var(--color-text-tertiary)] text-center max-w-[120px]">
                  {phase.description}
                </p>
              )}
              {phase.duration && (
                <p className="mt-0.5 text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                  {phase.duration}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="sm:hidden space-y-4">
        {phases.map((phase, i) => {
          const isCompleted = i < effectiveActive || phase.status === "completed";
          const isActive = i === effectiveActive;

          return (
            <div key={i} className="flex items-start gap-3">
              {/* Vertical track */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-spartan font-bold ${
                    isCompleted || isActive
                      ? "text-white"
                      : "text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)]"
                  }`}
                  style={{
                    backgroundColor: isCompleted || isActive ? catMeta.accent : undefined,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircledIcon className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < phases.length - 1 && (
                  <div
                    className="w-0.5 flex-1 min-h-[16px] mt-1"
                    style={{
                      background: isCompleted ? catMeta.accent : "var(--color-surface-hover)",
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-1">
                <p
                  className={`text-sm font-spartan font-semibold ${
                    isActive
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {phase.name}
                </p>
                {phase.description && (
                  <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5">
                    {phase.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseTimeline;
