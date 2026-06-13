/**
 * Form primitives — shared across all modals in the app.
 *
 * Exports:
 *   FormModal   — AnimatedModal wrapper with consistent shell
 *   FormTabs    — underline tab bar
 *   FormField   — label + input/textarea/select + error
 *   FormRow     — horizontal layout for side-by-side fields
 *   ColorPicker — color swatch grid
 *   DayPicker   — weekday toggle buttons
 *   ToggleRow   — label + description + toggle switch
 *   FormActions — cancel / submit footer
 */

import { X } from "@phosphor-icons/react";
import AnimatedModal from "./AnimatedModal";

/* ─── Constants ─────────────────────────────────────────────────── */

/** Shared input class — single source of truth */
export const INPUT_CLS =
  "w-full h-11 px-4 rounded-xl bg-[var(--color-surface-elevated)]/60 border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:border-[var(--color-brand-500)]/60 transition-colors";

export const SELECT_CLS =
  "w-full h-11 px-4 rounded-xl bg-[var(--color-surface-elevated)]/60 border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-500)]/60 transition-colors appearance-none";

export const TEXTAREA_CLS =
  "w-full px-4 py-3 rounded-xl bg-[var(--color-surface-elevated)]/60 border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:border-[var(--color-brand-500)]/60 transition-colors resize-none";

export const LABEL_CLS =
  "block text-xs font-spartan font-medium text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wide";

/* ─── FormModal ──────────────────────────────────────────────────── */

/**
 * Consistent modal shell.
 *
 * Props:
 *   isOpen, onClose, maxWidth — passed to AnimatedModal
 *   title    — string
 *   icon     — JSX (Phosphor icon, sized 18px)
 *   children — modal body content
 */
export const FormModal = ({ isOpen, onClose, maxWidth = "max-w-md", title, icon, children }) => (
  <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth}>
    <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/20 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="w-9 h-9 rounded-xl bg-[var(--color-brand-600)]/15 flex items-center justify-center flex-shrink-0">
              {icon}
            </span>
          )}
          <h2 className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors flex-shrink-0"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="px-6 pb-6 overflow-y-auto flex-1">
        {children}
      </div>
    </div>
  </AnimatedModal>
);

/* ─── FormTabs ───────────────────────────────────────────────────── */

/**
 * Underline tab strip.
 *
 * Props:
 *   tabs   — [{ id: string, label: string }]
 *   active — current tab id
 *   onChange — (id) => void
 */
export const FormTabs = ({ tabs, active, onChange }) => (
  <div className="flex border-b border-[var(--color-border-primary)]/15 mb-5 -mx-6 px-6">
    {tabs.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className={`px-4 h-10 text-sm font-spartan font-medium transition-all border-b-2 -mb-px ${
          active === id
            ? "text-[var(--color-brand-400)] border-[var(--color-brand-500)]"
            : "text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

/* ─── FormField ──────────────────────────────────────────────────── */

/**
 * Label + control + error message.
 *
 * Props:
 *   label    — string
 *   hint     — optional string below label
 *   error    — optional string (shown in red below control)
 *   required — boolean
 *   children — the input/select/textarea element
 */
export const FormField = ({ label, hint, error, required, children }) => (
  <div className="space-y-1.5">
    <label className={LABEL_CLS}>
      {label}
      {required && <span className="text-[var(--color-brand-400)] ml-0.5">*</span>}
    </label>
    {hint && (
      <p className="text-xs font-spartan text-[var(--color-text-tertiary)] -mt-1 mb-1">{hint}</p>
    )}
    {children}
    {error && (
      <p className="text-xs font-spartan text-red-400">{error}</p>
    )}
  </div>
);

/* ─── FormRow ────────────────────────────────────────────────────── */

/** Side-by-side fields. Children should be FormField instances. */
export const FormRow = ({ children }) => (
  <div className="grid grid-cols-2 gap-3">{children}</div>
);

/* ─── ColorPicker ────────────────────────────────────────────────── */

export const COLOR_OPTIONS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16", "#f97316",
];

/**
 * Props:
 *   value    — currently selected hex
 *   onChange — (hex) => void
 *   colors   — optional override array of hex strings
 */
export const ColorPicker = ({ value, onChange, colors = COLOR_OPTIONS }) => (
  <div className="flex flex-wrap gap-2">
    {colors.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        aria-label={color}
        className="w-8 h-8 rounded-lg transition-all flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        {value === color && (
          <svg className="w-3.5 h-3.5 text-white drop-shadow" viewBox="0 0 12 12" fill="currentColor">
            <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7z" />
          </svg>
        )}
      </button>
    ))}
  </div>
);

/* ─── DayPicker ──────────────────────────────────────────────────── */

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Props:
 *   selected  — number[] of selected day indices (0 = Sun)
 *   onChange  — (days: number[]) => void
 */
export const DayPicker = ({ selected, onChange }) => {
  const toggle = (day) => {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day].sort((a, b) => a - b);
    onChange(next);
  };

  return (
    <div className="flex gap-1">
      {DAY_LABELS.map((label, i) => {
        const active = selected.includes(i);
        return (
          <button
            key={i}
            type="button"
            title={DAY_FULL[i]}
            onClick={() => toggle(i)}
            className={`flex-1 h-9 rounded-lg text-xs font-spartan font-medium transition-colors ${
              active
                ? "bg-[var(--color-brand-600)] text-white"
                : "bg-[var(--color-surface-elevated)]/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-primary)]/15"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

/* ─── ToggleRow ──────────────────────────────────────────────────── */

/**
 * A label + optional description on the left, toggle switch on the right.
 *
 * Props:
 *   id          — unique html id
 *   label       — string
 *   description — optional string
 *   checked     — boolean
 *   onChange    — (checked: boolean) => void
 *   disabled    — boolean
 */
export const ToggleRow = ({ id, label, description, checked, onChange, disabled = false }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-spartan font-medium text-[var(--color-text-primary)] cursor-pointer">
        {label}
      </label>
      {description && (
        <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5">{description}</p>
      )}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
        checked ? "bg-[var(--color-brand-600)]" : "bg-[var(--color-surface-hover)]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ height: "22px" }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
        style={{ width: "18px", height: "18px" }}
      />
    </button>
  </div>
);

/* ─── FormActions ────────────────────────────────────────────────── */

/**
 * Sticky footer with Cancel + Submit.
 *
 * Props:
 *   onCancel      — () => void
 *   submitLabel   — string (default "Save")
 *   loading       — boolean
 *   disabled      — boolean
 *   destructive   — extra button on the left (optional): { label, onClick, loading }
 */
export const FormActions = ({
  onCancel,
  submitLabel = "Save",
  loading = false,
  disabled = false,
  destructive,
}) => (
  <div className="flex items-center gap-3 pt-5 mt-2 border-t border-[var(--color-border-primary)]/10">
    {destructive && (
      <button
        type="button"
        onClick={destructive.onClick}
        disabled={destructive.loading}
        className="h-10 px-4 rounded-xl text-xs font-spartan font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-40 mr-auto"
      >
        {destructive.loading ? "…" : destructive.label}
      </button>
    )}
    <button
      type="button"
      onClick={onCancel}
      className="btn btn-ghost btn-sm h-10 px-4 rounded-xl font-spartan text-sm flex-1"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={disabled || loading}
      className="btn btn-primary btn-sm h-10 px-6 rounded-xl font-spartan text-sm flex-1 disabled:opacity-40 disabled:pointer-events-none"
    >
      {loading ? "Saving…" : submitLabel}
    </button>
  </div>
);
