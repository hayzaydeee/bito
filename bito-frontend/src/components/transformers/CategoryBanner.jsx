import CATEGORY_META, { STATUS_THEME } from "../../data/categoryMeta";

/**
 * CategoryBanner — gradient hero header for transformer detail/preview views.
 * Shows category-colored background, icon, name, description, stats.
 */
const CategoryBanner = ({ transformer }) => {
  const sys = transformer.system || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const sTheme = STATUS_THEME[transformer.status] || STATUS_THEME.preview;
  const habitCount = sys.habits?.length || 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border-primary)]/20 p-6 sm:p-8"
      style={{
        background: `linear-gradient(135deg, ${catMeta.accent}12 0%, ${catMeta.accent}04 50%, transparent 100%)`,
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-[0.06]"
        style={{ background: catMeta.accent }}
      />

      <div className="relative flex items-start gap-4 sm:gap-5">
        {/* Large icon */}
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0"
          style={{ backgroundColor: `${catMeta.accent}15` }}
        >
          {sys.icon || "🎯"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl sm:text-3xl font-garamond font-bold text-[var(--color-text-primary)]">
              {sys.name || "Untitled Transformer"}
            </h1>
            <span
              className={`text-xs font-spartan font-semibold px-3 py-1 rounded-lg ${sTheme.bg} ${sTheme.text}`}
            >
              {sTheme.label}
            </span>
          </div>

          {sys.description && (
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] font-spartan mt-1 max-w-2xl">
              {sys.description}
            </p>
          )}

          {/* Stat chips */}
          <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-text-tertiary)] font-spartan flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="text-base">{catMeta.icon}</span>
              {catMeta.label}
            </span>
            {sys.estimatedDuration?.value && (
              <span>
                {sys.estimatedDuration.value} {sys.estimatedDuration.unit}
              </span>
            )}
            <span>
              {habitCount} habit{habitCount !== 1 && "s"}
            </span>
          </div>
        </div>
      </div>

      {/* Goal quote */}
      {transformer.goal?.text && (
        <div
          className="mt-5 p-4 rounded-xl border border-[var(--color-border-primary)]/10"
          style={{ backgroundColor: `${catMeta.accent}06` }}
        >
          <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
            Your goal
          </p>
          <p className="text-sm sm:text-base font-spartan text-[var(--color-text-primary)] italic">
            &ldquo;{transformer.goal.text}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryBanner;
