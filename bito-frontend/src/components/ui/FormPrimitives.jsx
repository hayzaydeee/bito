/**
 * Form primitives — shared by the group modals (GroupCreationModal,
 * GroupHabitModal). Styled to the DRILL groups aesthetic; the FormModal
 * shell carries the `.grp` class so the scoped tokens/fonts apply.
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
  "w-full h-11 px-4 rounded-[11px] bg-[var(--bg-2)] border border-[var(--line-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors";

export const SELECT_CLS =
  "w-full h-11 px-4 rounded-[11px] bg-[var(--bg-2)] border border-[var(--line-2)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] transition-colors appearance-none";

export const TEXTAREA_CLS =
  "w-full px-4 py-3 rounded-[11px] bg-[var(--bg-2)] border border-[var(--line-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors resize-none";

export const LABEL_CLS =
  "block grp-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-3)] mb-1.5";

/* ─── FormModal ──────────────────────────────────────────────────── */

export const FormModal = ({ isOpen, onClose, maxWidth = "max-w-md", title, icon, children }) => (
  <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth}>
    <div className="grp bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="w-9 h-9 rounded-[10px] bg-[var(--signal)]/15 flex items-center justify-center flex-shrink-0">
              {icon}
            </span>
          )}
          <h2 className="grp-display text-xl font-bold text-[var(--ink)]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-[9px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="px-6 pb-6 overflow-y-auto flex-1">{children}</div>
    </div>
  </AnimatedModal>
);

/* ─── FormTabs ───────────────────────────────────────────────────── */

export const FormTabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-6 border-b border-[var(--line-2)] mb-5 -mx-6 px-6">
    {tabs.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className={`grp-tab ${active === id ? "grp-tab--active" : ""}`}
        style={{ paddingTop: "10px", paddingBottom: "10px" }}
      >
        {label}
      </button>
    ))}
  </div>
);

/* ─── FormField ──────────────────────────────────────────────────── */

export const FormField = ({ label, hint, error, required, children }) => (
  <div className="space-y-1.5">
    <label className={LABEL_CLS}>
      {label}
      {required && <span className="text-[var(--signal)] ml-0.5">*</span>}
    </label>
    {hint && <p className="text-xs text-[var(--ink-3)] -mt-1 mb-1">{hint}</p>}
    {children}
    {error && <p className="grp-mono text-[11px] text-[var(--rose)]">{error}</p>}
  </div>
);

/* ─── FormRow ────────────────────────────────────────────────────── */

/** Side-by-side fields. Children should be FormField instances. */
export const FormRow = ({ children }) => (
  <div className="grid grid-cols-2 gap-3">{children}</div>
);

/* ─── ColorPicker ────────────────────────────────────────────────── */

export const COLOR_OPTIONS = [
  "#a78bfa", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16", "#f97316",
];

export const ColorPicker = ({ value, onChange, colors = COLOR_OPTIONS }) => (
  <div className="flex flex-wrap gap-2">
    {colors.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        aria-label={color}
        className={`w-8 h-8 rounded-[9px] transition-all flex items-center justify-center ${
          value === color ? "ring-2 ring-offset-2 ring-offset-[var(--surface)]" : ""
        }`}
        style={{ backgroundColor: color, "--tw-ring-color": color }}
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
            className={`flex-1 h-9 rounded-[9px] grp-mono text-[11px] font-bold transition-colors ${
              active
                ? "bg-[var(--signal)] text-[var(--signal-ink)]"
                : "bg-[var(--bg-2)] text-[var(--ink-3)] hover:text-[var(--ink)] border border-[var(--line-2)]"
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

export const ToggleRow = ({ id, label, description, checked, onChange, disabled = false }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--ink)] cursor-pointer">
        {label}
      </label>
      {description && <p className="text-xs text-[var(--ink-3)] mt-0.5">{description}</p>}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
        checked ? "bg-[var(--signal)]" : "bg-[var(--surface-2)] border border-[var(--line-2)]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ height: "22px" }}
    >
      <span
        className={`absolute top-0.5 left-0.5 rounded-full shadow-sm transition-transform ${
          checked ? "translate-x-[18px] bg-[var(--signal-ink)]" : "translate-x-0 bg-[var(--ink-2)]"
        }`}
        style={{ width: "18px", height: "18px" }}
      />
    </button>
  </div>
);

/* ─── FormActions ────────────────────────────────────────────────── */

export const FormActions = ({
  onCancel,
  submitLabel = "Save",
  loading = false,
  disabled = false,
  destructive,
}) => (
  <div className="flex items-center gap-3 pt-5 mt-2 border-t border-[var(--line-2)]">
    {destructive && (
      <button
        type="button"
        onClick={destructive.onClick}
        disabled={destructive.loading}
        className="grp-btn grp-btn--sm mr-auto text-[var(--rose)] border-[var(--rose)]/30 hover:bg-[var(--rose)]/10"
      >
        {destructive.loading ? "…" : destructive.label}
      </button>
    )}
    <button type="button" onClick={onCancel} className="grp-btn grp-btn--sm flex-1">
      Cancel
    </button>
    <button
      type="submit"
      disabled={disabled || loading}
      className="grp-btn grp-btn--signal grp-btn--sm flex-1 disabled:opacity-40 disabled:pointer-events-none"
    >
      {loading ? "Saving…" : submitLabel}
    </button>
  </div>
);
