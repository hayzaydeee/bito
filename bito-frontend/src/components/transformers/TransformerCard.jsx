import { CrossCircledIcon, RocketIcon, DrawingPinFilledIcon } from "@radix-ui/react-icons";
import CATEGORY_META, { STATUS_THEME } from "../../data/categoryMeta";
import ProgressRing from "../shared/ProgressRing";

/**
 * TransformerCard — rich grid card for the transformers list view.
 * Features: category gradient stripe, progress ring, habit preview chips,
 * glass treatment for active/preview items.
 */
const TransformerCard = ({ transformer, index = 0, onOpen, onArchive, archiveLoading }) => {
  const t = transformer;
  const sys = t.system || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const sTheme = STATUS_THEME[t.status] || STATUS_THEME.preview;
  const isFeatured = t.status === "active" || t.status === "preview";
  const pers = t.personalization || {};
  const displayIcon = pers.icon || sys.icon || "🎯";
  const accentColor = pers.color || catMeta.accent;

  // Phase-aware counts and progress
  const phases = sys.phases || [];
  const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);
  const progress = t.progress || {};
  const habitCount = isPhased
    ? phases.reduce((sum, p) => sum + (p.habits?.length || 0), 0)
    : sys.habits?.length || t.habitCount || 0;

  // Real progress from progress field, fallback to computed
  const progressPct =
    progress.overallCompletion != null
      ? progress.overallCompletion
      : t.status === "completed"
      ? 100
      : t.status === "active" && isPhased
      ? Math.round(((progress.completedPhases?.length || 0) / phases.length) * 100)
      : t.status === "active"
      ? 33
      : 0;

  // Collect first 3 habits for preview chips (from phases or flat)
  const previewHabits = isPhased
    ? phases.flatMap((p) => p.habits || []).slice(0, 3)
    : (sys.habits || []).slice(0, 3);

  // Current phase info
  const currentPhase = isPhased ? phases[progress.currentPhaseIndex ?? 0] : null;

  return (
    <div
      onClick={() => onOpen(t)}
      className={`relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 min-h-[160px] flex flex-col group ${
        isFeatured
          ? "glass-card-minimal hover:shadow-lg hover:shadow-[var(--color-brand-500)]/5"
          : "bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 hover:shadow-md"
      } stagger-fade-in`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Category gradient stripe */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${catMeta.gradient}`}
        style={{ background: `linear-gradient(to right, ${accentColor}25, ${accentColor}08)` }}
      />

      {/* Main content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Top row: icon + name + status */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">{displayIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {pers.isPinned && (
                <DrawingPinFilledIcon className="w-3.5 h-3.5 text-[var(--color-brand-500)] flex-shrink-0" />
              )}
              <h3 className="text-base font-garamond font-bold text-[var(--color-text-primary)] truncate">
                {sys.name || "Untitled"}
              </h3>
              <span
                className={`text-[10px] font-spartan font-semibold px-2 py-0.5 rounded-md ${sTheme.bg} ${sTheme.text}`}
              >
                {sTheme.label}
              </span>
            </div>
            {sys.description && (
              <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-1 line-clamp-2">
                {sys.description}
              </p>
            )}
            {/* Current phase badge for active transformers */}
            {t.status === "active" && currentPhase && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <RocketIcon className="w-3 h-3 text-[var(--color-brand-500)]" />
                <span className="text-[10px] font-spartan font-medium text-[var(--color-brand-500)]">
                  Phase {(progress.currentPhaseIndex ?? 0) + 1}: {currentPhase.name}
                </span>
              </div>
            )}
          </div>

          {/* Archive button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(t._id);
            }}
            disabled={archiveLoading === t._id}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-50"
            title="Archive"
          >
            <CrossCircledIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Phase indicator pills (for phased transformers) */}
        {isPhased && phases.length > 1 && (
          <div className="flex items-center gap-1 mb-3">
            {phases.map((_, pi) => {
              const isDone = progress.completedPhases?.some((cp) => cp.phaseIndex === pi);
              const isCurr = pi === (progress.currentPhaseIndex ?? 0);
              return (
                <div
                  key={pi}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    isDone
                      ? ""
                      : isCurr
                      ? "opacity-60"
                      : "bg-[var(--color-surface-hover)]"
                  }`}
                  style={{
                    backgroundColor: isDone || isCurr ? catMeta.accent : undefined,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Bottom row: progress ring, habit chips, category */}
        <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-primary)]/10">
          <ProgressRing
            value={progressPct}
            size={32}
            stroke={3}
            color={catMeta.ring}
          />

          {/* Habit preview chips */}
          <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
            {previewHabits.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] font-spartan text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-md truncate max-w-[100px]"
                title={h.name}
              >
                <span className="text-xs">{h.icon}</span>
                <span className="truncate">{h.name}</span>
              </span>
            ))}
            {habitCount > 3 && (
              <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                +{habitCount - 3}
              </span>
            )}
          </div>

          {/* Category label */}
          <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] flex-shrink-0 hidden sm:inline">
            {catMeta.icon} {catMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransformerCard;
