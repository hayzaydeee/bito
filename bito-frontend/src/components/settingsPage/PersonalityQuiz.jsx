import { useState } from "react";
import { CheckIcon } from "@radix-ui/react-icons";

/* ================================================================
   PersonalityQuiz — example-driven personality axis selector.
   
   Four questions, one per axis. Each shows concrete output
   examples so the user picks the voice that *sounds* right.
   ================================================================ */

const AXES = [
  {
    key: "tone",
    title: "How should Bito talk to you?",
    options: [
      {
        value: "warm",
        emoji: "☀️",
        label: "Warm",
        example: `"Honestly, your meditation streak is looking really solid — 34 days and counting."`,
      },
      {
        value: "direct",
        emoji: "🎯",
        label: "Direct",
        example: `"Meditation: 34-day streak. Reading: 14 days. Exercise held at 100%."`,
      },
      {
        value: "playful",
        emoji: "😄",
        label: "Playful",
        example: `"Your meditation habit is basically on autopilot at this point — 34 days without blinking."`,
      },
      {
        value: "neutral",
        emoji: "📊",
        label: "Neutral",
        example: `"Meditation completed daily for 34 consecutive days. All four habits maintained full completion."`,
      },
    ],
  },
  {
    key: "focus",
    title: "What should Bito lead with?",
    options: [
      {
        value: "wins",
        emoji: "🏆",
        label: "Wins first",
        example: `"You crushed it this week — every single habit, every single day. Your meditation streak just passed 30 days."`,
      },
      {
        value: "patterns",
        emoji: "🔍",
        label: "Patterns",
        example: `"Interesting — your exercise and reading completion track together. When one drops, so does the other."`,
      },
      {
        value: "actionable",
        emoji: "⚡",
        label: "Actions",
        example: `"Your phone habit is at 29%. Try moving your phone to another room before bed to break the morning reach."`,
      },
      {
        value: "balanced",
        emoji: "⚖️",
        label: "Balanced",
        example: `"Strong week overall. Reading streak held at 42 days, but phone-free mornings need attention at 2/7."`,
      },
    ],
  },
  {
    key: "verbosity",
    title: "How much detail do you want?",
    options: [
      {
        value: "concise",
        emoji: "💬",
        label: "Just the headlines",
        example: `"Reading streak at 42 days. Exercise alternating. Phone habit needs a new approach."`,
      },
      {
        value: "detailed",
        emoji: "📖",
        label: "Full context",
        example: `"Your reading streak hit 42 days — that's your longest active streak and it's been rock-solid. Exercise follows an every-other-day rhythm, which might actually work better than forcing daily. The phone habit at 2/7 suggests the current approach isn't clicking — worth experimenting with a different trigger."`,
      },
    ],
  },
  {
    key: "accountability",
    title: "When you miss a habit, how should Bito respond?",
    options: [
      {
        value: "gentle",
        emoji: "🤗",
        label: "Gentle",
        example: `"You had a tough few days with reading — but your meditation streak held strong."`,
      },
      {
        value: "honest",
        emoji: "📊",
        label: "Honest",
        example: `"Reading dropped to 2/7 this week, down from 5/7 last week."`,
      },
      {
        value: "tough",
        emoji: "🔥",
        label: "Tough",
        example: `"Reading fell off a cliff. Three weeks ago you were at 85%. What happened?"`,
      },
    ],
  },
];

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
                    <span className="text-base mt-0.5">{opt.emoji}</span>
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
