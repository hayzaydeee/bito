import { Sun, ArrowsClockwise, Lightning } from "@phosphor-icons/react";

const MODES = [
  {
    id: "supportive",
    label: "Supportive",
    Icon: Sun,
    description: "The gentlest mode. Encouragement-first, no pressure.",
    details: {
      "Feed events": "Completions only",
      "Missed days": "Hidden from everyone",
      "Nudges": "1 per sender per recipient per day",
      "Leaderboard": "Anonymous, opt-in",
    },
  },
  {
    id: "accountable",
    label: "Accountable",
    Icon: ArrowsClockwise,
    description: "The default. Honest visibility without public shaming.",
    details: {
      "Feed events": "Completions, milestones, streak-at-risk",
      "Missed days": "Visible on your member dashboard only",
      "Nudges": "1 per sender per recipient per day",
      "Leaderboard": "Named, members can opt out",
    },
  },
  {
    id: "sharp",
    label: "Sharp",
    Icon: Lightning,
    description: "Maximum accountability. All data is public.",
    details: {
      "Feed events": "All events including missed days",
      "Missed days": "Public in feed and leaderboard",
      "Nudges": "Unlimited",
      "Leaderboard": "Mandatory, fully named",
    },
  },
];

/**
 * IntensitySelector
 *
 * Props:
 *   value     — 'supportive' | 'accountable' | 'sharp'
 *   onChange  — (value: string) => void
 *   readOnly  — boolean (show details without controls)
 */
const IntensitySelector = ({ value = "accountable", onChange, readOnly = false }) => {
  const selected = MODES.find((m) => m.id === value) || MODES[1];
  const SelectedIcon = selected.Icon;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] mb-1">
          Group intensity
        </p>
        <p className="text-xs font-spartan text-[var(--color-text-tertiary)]">
          Controls how much pressure this group applies. Changed by admins, applied to everyone.
        </p>
      </div>

      {/* Segmented control */}
      {!readOnly && (
        <div className="flex gap-2">
          {MODES.map((mode) => {
            const ModeIcon = mode.Icon;
            return (
            <button
              key={mode.id}
              onClick={() => onChange?.(mode.id)}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-spartan font-medium border transition-all ${
                value === mode.id
                  ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 hover:text-[var(--color-text-primary)]"
              }`}
            >
              <ModeIcon size={14} weight="duotone" />
              {mode.label}
            </button>
            );
          })}
        </div>
      )}

      {/* Read-only active display */}
      {readOnly && (
        <div className="flex items-center gap-2 text-sm font-spartan font-medium text-[var(--color-text-primary)]">
          <SelectedIcon size={16} weight="duotone" className="text-[var(--color-brand-500)]" />
          {selected.label}
        </div>
      )}

      {/* Description */}
      <p className="text-xs font-spartan text-[var(--color-text-secondary)]">
        {selected.description}
      </p>

      {/* Details grid */}
      <div className="rounded-xl border border-[var(--color-border-primary)]/15 bg-[var(--color-surface-hover)] overflow-hidden">
        {Object.entries(selected.details).map(([key, val], i) => (
          <div
            key={key}
            className={`flex items-start justify-between gap-4 px-4 py-3 ${
              i > 0 ? "border-t border-[var(--color-border-primary)]/10" : ""
            }`}
          >
            <span className="text-xs font-spartan text-[var(--color-text-tertiary)] flex-shrink-0">
              {key}
            </span>
            <span className="text-xs font-spartan font-medium text-[var(--color-text-primary)] text-right">
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntensitySelector;
