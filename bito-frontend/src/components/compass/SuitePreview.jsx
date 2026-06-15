import { ArrowLeftIcon, RocketIcon, LinkBreak2Icon } from "@radix-ui/react-icons";
import CATEGORY_META from "../../data/categoryMeta";
import HabitIcon from "../shared/HabitIcon";

/**
 * SuitePreview — overview of a multi-goal compass suite.
 * Shows all linked compasses in a suite with their phases and habits, with an
 * "Apply All" action and per-compass drill-down. DRILL re-skin: std-card
 * editorial header (kicker + serif title + mono stat readout) and
 * accent-striped, hover-lit compass cards.
 */
const SuitePreview = ({
  suite,
  onBack,
  onOpencompass,
  onApplyAll,
  applyLoading,
  onArchive,
  error,
}) => {
  const { suiteName, compasses = [] } = suite || {};

  const totalHabits = compasses.reduce((sum, t) => {
    const phases = t.system?.phases || [];
    return (
      sum +
      phases.reduce((ps, p) => ps + (p.habits?.length || 0), 0) +
      (t.system?.habits?.length || 0)
    );
  }, 0);

  const totalPhases = compasses.reduce(
    (sum, t) => sum + (t.system?.phases?.length || 0),
    0
  );

  return (
    <div className="std max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="std-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to list
      </button>

      {/* Suite header */}
      <div className="std-card p-6">
        <p className="std-kicker mb-3" style={{ color: "var(--signal)" }}>
          The Compass — Suite
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="std-display text-[28px] font-black text-[var(--ink)] leading-none">
              Goal Suite
            </h2>
            <p className="text-sm text-[var(--ink-2)] mt-2">{suiteName}</p>
          </div>
          <span
            className="std-tag"
            style={{ color: "var(--signal)", borderColor: "var(--signal)" }}
          >
            {compasses.length} compasses
          </span>
        </div>
        <hr className="std-rule my-4" />
        <div className="std-mono flex items-center gap-3 text-[11px] uppercase tracking-wider text-[var(--ink-3)] flex-wrap">
          <span className="flex items-center gap-1.5">
            <LinkBreak2Icon className="w-3 h-3" />
            {compasses.length} linked
          </span>
          <span className="text-[var(--line-3)]">·</span>
          <span>{totalPhases} phases</span>
          <span className="text-[var(--line-3)]">·</span>
          <span>{totalHabits} habits</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[var(--r-btn)] border border-[var(--rose)]/30 bg-[var(--rose)]/10 text-[var(--rose)] text-sm">
          {error}
        </div>
      )}

      {/* compass cards */}
      <div className="space-y-3">
        {compasses.map((t, i) => {
          const sys = t.system || {};
          const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
          const phases = sys.phases || [];
          const habitCount = phases.reduce(
            (sum, p) => sum + (p.habits?.length || 0),
            0
          );

          return (
            <div
              key={t._id}
              onClick={() => onOpencompass(t)}
              className="std-card std-card-hover relative overflow-hidden p-5 cursor-pointer stagger-fade-in group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Category accent stripe */}
              <span
                className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ background: catMeta.accent }}
              />

              <div className="flex items-start gap-3 pt-1">
                <span className="flex-shrink-0 mt-0.5">
                  <HabitIcon icon={sys.icon || "Target"} size={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="std-display text-[17px] font-bold text-[var(--ink)]">
                      {sys.name || "Untitled"}
                    </h3>
                    <span className="std-tag">Preview</span>
                    <span className="std-mono text-[10px] text-[var(--ink-3)]">
                      №{String(i + 1).padStart(2, "0")} in suite
                    </span>
                  </div>
                  {sys.description && (
                    <p className="text-sm text-[var(--ink-2)] mt-1 line-clamp-2 leading-relaxed">
                      {sys.description}
                    </p>
                  )}

                  {/* Mini phase/habit summary */}
                  <div className="std-mono flex items-center gap-3 mt-3 text-[10.5px] text-[var(--ink-3)]">
                    <span>{phases.length} phases</span>
                    <span>{habitCount} habits</span>
                    {sys.estimatedDuration && (
                      <span>
                        ~{sys.estimatedDuration.value} {sys.estimatedDuration.unit}
                      </span>
                    )}
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore →
                    </span>
                  </div>

                  {/* First 4 habit chips */}
                  {phases.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                      {phases
                        .flatMap((p) => p.habits || [])
                        .slice(0, 4)
                        .map((h, hi) => (
                          <span
                            key={hi}
                            className="inline-flex items-center gap-1 text-[10px] text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--line)] px-2 py-0.5 rounded-[var(--r-tag)] truncate max-w-[100px]"
                          >
                            <span className="text-xs">{h.icon}</span>
                            <span className="truncate">{h.name}</span>
                          </span>
                        ))}
                      {habitCount > 4 && (
                        <span className="std-mono text-[10px] text-[var(--ink-3)]">
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
          className="std-btn std-btn--signal flex-1 h-14 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {applyLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <RocketIcon className="w-4 h-4" />
              Apply all {compasses.length}
            </>
          )}
        </button>
        <button onClick={onBack} className="std-btn h-14 px-6">
          Back
        </button>
      </div>

      {/* Caveat */}
      <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)] text-center">
        Click each compass to preview, refine, or apply individually.
      </p>
    </div>
  );
};

export default SuitePreview;
