import { ArrowLeftIcon, RocketIcon, LinkBreak2Icon } from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";

/**
 * SuitePreview — overview of a multi-goal transformer suite.
 * Shows all linked transformers in a suite with their phases and habits,
 * with an "Apply All" action and per-transformer drill-down.
 */
const SuitePreview = ({
  suite,
  onBack,
  onOpenTransformer,
  onApplyAll,
  applyLoading,
  onArchive,
  error,
}) => {
  const { suiteName, transformers = [] } = suite || {};

  const totalHabits = transformers.reduce((sum, t) => {
    const phases = t.system?.phases || [];
    return (
      sum +
      phases.reduce((ps, p) => ps + (p.habits?.length || 0), 0) +
      (t.system?.habits?.length || 0)
    );
  }, 0);

  const totalPhases = transformers.reduce(
    (sum, t) => sum + (t.system?.phases?.length || 0),
    0
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to list
      </button>

      {/* Suite header */}
      <div className="glass-card-minimal rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)]">
                Goal Suite
              </h2>
              <span className="text-[10px] font-spartan font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400">
                {transformers.length} Transformers
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-0.5">
              {suiteName}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs font-spartan text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-primary)]/10">
          <span>
            <LinkBreak2Icon className="w-3 h-3 inline mr-1" />
            {transformers.length} linked plans
          </span>
          <span>{totalPhases} total phases</span>
          <span>{totalHabits} total habits</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-spartan">
          {error}
        </div>
      )}

      {/* Transformer cards */}
      <div className="space-y-3">
        {transformers.map((t, i) => {
          const sys = t.system || {};
          const catMeta =
            CATEGORY_META[sys.category] || CATEGORY_META.custom;
          const phases = sys.phases || [];
          const habitCount = phases.reduce(
            (sum, p) => sum + (p.habits?.length || 0),
            0
          );

          return (
            <div
              key={t._id}
              onClick={() => onOpenTransformer(t)}
              className="glass-card-minimal rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:shadow-[var(--color-brand-500)]/5 transition-all stagger-fade-in group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Category stripe */}
              <div
                className="h-1 w-full rounded-full mb-4"
                style={{
                  background: `linear-gradient(to right, ${catMeta.accent}40, ${catMeta.accent}10)`,
                }}
              />

              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {sys.icon || "🎯"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-garamond font-bold text-[var(--color-text-primary)]">
                      {sys.name || "Untitled"}
                    </h3>
                    <span className="text-[10px] font-spartan font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">
                      Preview
                    </span>
                    <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                      #{i + 1} in suite
                    </span>
                  </div>
                  {sys.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-1 line-clamp-2">
                      {sys.description}
                    </p>
                  )}

                  {/* Mini phase/habit summary */}
                  <div className="flex items-center gap-3 mt-3 text-xs font-spartan text-[var(--color-text-tertiary)]">
                    <span>{phases.length} phases</span>
                    <span>{habitCount} habits</span>
                    {sys.estimatedDuration && (
                      <span>
                        ~{sys.estimatedDuration.value}{" "}
                        {sys.estimatedDuration.unit}
                      </span>
                    )}
                    <span className="ml-auto text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to explore →
                    </span>
                  </div>

                  {/* First 3 habit chips */}
                  {phases.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                      {phases
                        .flatMap((p) => p.habits || [])
                        .slice(0, 4)
                        .map((h, hi) => (
                          <span
                            key={hi}
                            className="inline-flex items-center gap-1 text-[10px] font-spartan text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-md truncate max-w-[100px]"
                          >
                            <span className="text-xs">{h.icon}</span>
                            <span className="truncate">{h.name}</span>
                          </span>
                        ))}
                      {habitCount > 4 && (
                        <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                          +{habitCount - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onApplyAll}
          disabled={applyLoading}
          className="flex-1 h-14 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-base font-spartan font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--color-brand-600)]/20 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {applyLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Applying...
            </span>
          ) : (
            <>
              <RocketIcon className="w-4 h-4" />
              Apply All {transformers.length} Transformers
            </>
          )}
        </button>
        <button
          onClick={onBack}
          className="h-14 px-6 bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-sm font-spartan font-medium transition-colors border border-[var(--color-border-primary)]/10"
        >
          Back
        </button>
      </div>

      {/* Caveat */}
      <p className="text-xs font-spartan text-[var(--color-text-tertiary)] text-center">
        You can click each transformer to preview, refine, or apply individually.
      </p>
    </div>
  );
};

export default SuitePreview;
