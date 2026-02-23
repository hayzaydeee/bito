import { CrossCircledIcon } from "@radix-ui/react-icons";
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
  const habitCount = sys.habits?.length || t.habitCount || 0;
  const isFeatured = t.status === "active" || t.status === "preview";

  // Calculate rough phase progress (if phases exist)
  const phases = sys.phases || [];
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const progressPct =
    phases.length > 0
      ? Math.round((completedPhases / phases.length) * 100)
      : t.status === "completed"
      ? 100
      : t.status === "active"
      ? 33
      : 0;

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
        style={{ background: `linear-gradient(to right, ${catMeta.accent}25, ${catMeta.accent}08)` }}
      />

      {/* Main content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Top row: icon + name + status */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">{sys.icon || "🎯"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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

        {/* Bottom strip: progress ring, habit chips, category */}
        <div
          className="flex items-center gap-3.5 px-5 py-3 -mx-5 -mb-5 mt-3 rounded-b-2xl border-t border-[var(--color-border-primary)]/10"
          style={{ backgroundColor: `${catMeta.accent}06` }}
        >
          {/* Progress ring */}
          <ProgressRing
            value={progressPct}
            size={40}
            stroke={3.5}
            color={catMeta.ring}
          />

          {/* Habit preview chips */}
          <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
            {sys.habits?.slice(0, 3).map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs font-spartan text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2.5 py-1 rounded-lg truncate max-w-[130px]"
                title={h.name}
              >
                <span className="text-sm">{h.icon}</span>
                <span className="truncate">{h.name}</span>
              </span>
            ))}
            {habitCount > 3 && (
              <span className="text-xs font-spartan font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] px-2 py-1 rounded-lg">
                +{habitCount - 3}
              </span>
            )}
          </div>

          {/* Category label */}
          <span className="text-xs font-spartan text-[var(--color-text-tertiary)] flex-shrink-0 flex items-center gap-1">
            <span className="text-sm">{catMeta.icon}</span>
            <span className="hidden sm:inline">{catMeta.label}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransformerCard;
