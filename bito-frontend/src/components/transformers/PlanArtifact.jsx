import { Cross2Icon } from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";
import PhaseTimeline from "./PhaseTimeline";
import HabitCard from "./HabitCard";

/**
 * PlanArtifact — slide-in side panel showing the current transformer plan.
 * Displays plan header, phase timeline, phase-grouped habits (compact).
 * Claude-style artifact panel that opens alongside the chat.
 */
const PlanArtifact = ({ transformer, onClose }) => {
  const sys = transformer.system || {};
  const phases = sys.phases || [];
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;

  return (
    <div className="flex flex-col h-full">
      {/* Artifact header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--color-border-primary)]/20 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{sys.icon || "🎯"}</span>
          <span className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
            {sys.name || "Untitled Plan"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors flex-shrink-0"
        >
          <Cross2Icon className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Description */}
        {sys.description && (
          <p className="text-xs font-spartan text-[var(--color-text-tertiary)]">
            {sys.description}
          </p>
        )}

        {/* Phase timeline */}
        <PhaseTimeline transformer={transformer} />

        {/* Phase groups */}
        {phases.length > 0 ? (
          <div className="space-y-3">
            {phases.map((phase, pi) => (
              <div
                key={pi}
                className="rounded-xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]"
              >
                <div className="flex items-center gap-2.5 p-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-spartan font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: catMeta.accent }}
                  >
                    {pi + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)]">
                      {phase.name}
                    </span>
                    {phase.durationDays && (
                      <span className="ml-1.5 text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                        · {phase.durationDays}d
                      </span>
                    )}
                  </div>
                </div>
                {phase.description && (
                  <p className="px-3 pb-1.5 text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                    {phase.description}
                  </p>
                )}
                <div className="px-3 pb-3 grid grid-cols-1 gap-1.5">
                  {(phase.habits || []).map((h, hi) => (
                    <HabitCard
                      key={hi}
                      habit={h}
                      index={hi}
                      phaseIndex={pi}
                      isPreview={false}
                      accentColor={catMeta.accent}
                      compact
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Legacy flat habits */
          <div className="grid grid-cols-1 gap-1.5">
            {(sys.habits || []).map((h, i) => (
              <HabitCard
                key={i}
                habit={h}
                index={i}
                isPreview={false}
                accentColor={catMeta.accent}
                compact
              />
            ))}
          </div>
        )}

        {/* Duration summary */}
        {sys.estimatedDuration && (
          <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] text-center pt-1">
            Estimated: {sys.estimatedDuration.value} {sys.estimatedDuration.unit}
          </p>
        )}
      </div>
    </div>
  );
};

export default PlanArtifact;
