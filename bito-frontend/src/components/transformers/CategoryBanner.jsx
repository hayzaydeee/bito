import { useState } from "react";
import { Pencil1Icon, DrawingPinIcon, DrawingPinFilledIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import CATEGORY_META, { STATUS_THEME } from "../../data/categoryMeta";

/**
 * CategoryBanner — gradient hero header for transformer detail/preview views.
 * Shows category-colored background, icon, name, description, stats.
 * Supports personalization: custom icon, color, notes, pin.
 */
const CategoryBanner = ({ transformer, onPersonalize }) => {
  const sys = transformer.system || {};
  const p = transformer.personalization || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const sTheme = STATUS_THEME[transformer.status] || STATUS_THEME.preview;
  const habitCount = sys.habits?.length || 0;

  // Personalized overrides
  const displayIcon = p.icon || sys.icon || "🎯";
  const accentColor = p.color || catMeta.accent;

  // Inline notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(p.notes || "");

  const handleSaveNotes = () => {
    onPersonalize?.({ notes: notesText || null });
    setEditingNotes(false);
  };

  const handleTogglePin = () => {
    onPersonalize?.({ isPinned: !p.isPinned });
  };

  const handleIconClick = () => {
    const newIcon = prompt("Enter an emoji for this transformer:", displayIcon);
    if (newIcon && newIcon !== displayIcon) {
      onPersonalize?.({ icon: newIcon });
    }
  };

  const canPersonalize = !!onPersonalize;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border-primary)]/20 p-6 sm:p-8"
      style={{
        background: `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}04 50%, transparent 100%)`,
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-[0.06]"
        style={{ background: accentColor }}
      />

      {/* Pin button */}
      {canPersonalize && (
        <button
          onClick={handleTogglePin}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
            p.isPinned
              ? "text-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
          }`}
          title={p.isPinned ? "Unpin" : "Pin to top"}
        >
          {p.isPinned ? (
            <DrawingPinFilledIcon className="w-4 h-4" />
          ) : (
            <DrawingPinIcon className="w-4 h-4" />
          )}
        </button>
      )}

      <div className="relative flex items-start gap-4 sm:gap-5">
        {/* Large icon — clickable when personalizable */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 group relative ${
            canPersonalize ? "cursor-pointer" : ""
          }`}
          style={{ backgroundColor: `${accentColor}15` }}
          onClick={canPersonalize ? handleIconClick : undefined}
          title={canPersonalize ? "Click to change icon" : undefined}
        >
          {displayIcon}
          {canPersonalize && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Pencil1Icon className="w-5 h-5 text-white" />
            </div>
          )}
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
          style={{ backgroundColor: `${accentColor}06` }}
        >
          <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
            Your goal
          </p>
          <p className="text-sm sm:text-base font-spartan text-[var(--color-text-primary)] italic">
            &ldquo;{transformer.goal.text}&rdquo;
          </p>
        </div>
      )}

      {/* User notes — personalization */}
      {canPersonalize && (
        <div className="mt-3">
          {editingNotes ? (
            <div className="flex items-start gap-2">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add personal notes about this plan..."
                maxLength={500}
                rows={2}
                className="flex-1 text-sm font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-xl px-3 py-2 border border-[var(--color-border-primary)]/20 focus:outline-none focus:border-[var(--color-brand-500)]/50 resize-none placeholder:text-[var(--color-text-tertiary)]"
                autoFocus
              />
              <button
                onClick={handleSaveNotes}
                className="p-2 rounded-lg bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] hover:bg-[var(--color-brand-500)]/25 transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingNotes(false); setNotesText(p.notes || ""); }}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] transition-colors"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>
          ) : p.notes ? (
            <button
              onClick={() => setEditingNotes(true)}
              className="w-full text-left p-3 rounded-xl bg-[var(--color-surface-hover)]/50 hover:bg-[var(--color-surface-hover)] transition-colors group"
            >
              <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-0.5">
                Notes
              </p>
              <p className="text-sm font-spartan text-[var(--color-text-secondary)]">
                {p.notes}
              </p>
            </button>
          ) : (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors flex items-center gap-1.5"
            >
              <Pencil1Icon className="w-3 h-3" />
              Add notes
            </button>
          )}
        </div>
      )}

      {/* Notes display for non-editable views */}
      {!canPersonalize && p.notes && (
        <div className="mt-3 p-3 rounded-xl bg-[var(--color-surface-hover)]/50">
          <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-0.5">
            Notes
          </p>
          <p className="text-sm font-spartan text-[var(--color-text-secondary)]">
            {p.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryBanner;
