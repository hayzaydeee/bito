import { useState, useEffect, useRef } from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { AXES } from "../../data/personalityOptions";

/* ================================================================
   PersonalityQuiz — example-driven personality axis selector.
   
   Four questions, one per axis. Each shows concrete output
   examples so the user picks the voice that *sounds* right.
   ================================================================ */

export default function PersonalityQuiz({
  currentPersonality = {},
  onSave,
  onReset,
  saving = false,
}) {
  const [selections, setSelections] = useState({
    tone: currentPersonality.tone || "warm",
    focus: currentPersonality.focus || "balanced",
    verbosity: currentPersonality.verbosity || "concise",
    accountability: currentPersonality.accountability || "gentle",
  });

  // Sync state when currentPersonality arrives asynchronously (profile fetch completes
  // after the component mounts with an empty object, causing stale defaults).
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && currentPersonality.tone) {
      setSelections({
        tone: currentPersonality.tone || "warm",
        focus: currentPersonality.focus || "balanced",
        verbosity: currentPersonality.verbosity || "concise",
        accountability: currentPersonality.accountability || "gentle",
      });
      initialized.current = true;
    }
  }, [currentPersonality]);

  const hasChanges =
    selections.tone !== (currentPersonality.tone || "warm") ||
    selections.focus !== (currentPersonality.focus || "balanced") ||
    selections.verbosity !== (currentPersonality.verbosity || "concise") ||
    selections.accountability !== (currentPersonality.accountability || "gentle");

  const handleSelect = (axis, value) => {
    setSelections((prev) => ({ ...prev, [axis]: value }));
  };

  return (
    <div className="space-y-6">
      {AXES.map((axis) => (
        <div key={axis.key}>
          <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)] mb-3">
            {axis.title}
          </p>
          <div className="space-y-2">
            {axis.options.map((opt) => {
              const isSelected = selections[axis.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(axis.key, opt.value)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
                    isSelected
                      ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/5"
                      : "border-[var(--color-border-primary)]/30 bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-primary)]/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-[var(--color-text-secondary)]">
                      <opt.Icon size={16} weight="duotone" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <CheckIcon className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
                        )}
                      </div>
                      <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-1 italic leading-relaxed">
                        {opt.example}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => onSave(selections)}
          disabled={!hasChanges || saving}
          className={`h-9 px-5 rounded-xl text-sm font-spartan font-medium transition-colors ${
            hasChanges && !saving
              ? "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {onReset && (
          <button
            onClick={onReset}
            className="h-9 px-4 rounded-xl text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Reset to defaults
          </button>
        )}
      </div>
    </div>
  );
}
