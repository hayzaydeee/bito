import { CheckCircledIcon } from "@radix-ui/react-icons";

/**
 * GeneratingOverlay — full-screen animated progress stepper shown during
 * transformer generation. Glass card backdrop, enlarged steps.
 */
const STEPS = [
  { label: "Understanding your goal...", icon: "🎯" },
  { label: "Researching best practices...", icon: "📖" },
  { label: "Designing your habit system...", icon: "⚙️" },
  { label: "Polishing your plan...", icon: "✨" },
];

const GeneratingOverlay = ({ step = 0 }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="glass-card p-8 sm:p-10 max-w-md w-full text-center">
        {/* Brain icon */}
        <div className="text-6xl mb-6 animate-pulse">🧠</div>

        <h2 className="text-xl sm:text-2xl font-garamond font-bold text-[var(--color-text-primary)] mb-6">
          Generating Your Plan
        </h2>

        {/* Steps */}
        <div className="space-y-4 text-left max-w-xs mx-auto">
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;

            return (
              <div
                key={i}
                className={`flex items-center gap-4 transition-all duration-300 ${
                  isActive ? "scale-[1.02]" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                    isCompleted
                      ? "bg-green-500/20 text-green-400"
                      : isActive
                      ? "bg-[var(--color-brand-600)]/20 text-[var(--color-brand-400)] animate-pulse"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircledIcon className="w-4 h-4" />
                  ) : (
                    s.icon
                  )}
                </div>
                <span
                  className={`text-sm font-spartan transition-colors duration-300 ${
                    isActive
                      ? "text-[var(--color-text-primary)] font-medium"
                      : isCompleted
                      ? "text-[var(--color-text-secondary)]"
                      : "text-[var(--color-text-tertiary)]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subtle progress bar */}
        <div className="mt-8 h-1 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-brand-500)] transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneratingOverlay;
