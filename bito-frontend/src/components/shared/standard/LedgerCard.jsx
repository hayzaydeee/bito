import { ArrowRight } from "@phosphor-icons/react";

/**
 * LedgerCard — the shared DRILL entity card (index card / ledger row).
 * A consistent frame (top accent stripe, icon tile, ledger index №, serif
 * title, mono meta) with optional `children` (richer body) and `footer` slots,
 * so Groups, Compass, and other entity grids share one card language.
 *
 * Rendered as a div[role=button] so it can host nested action buttons
 * (e.g. archive). Works inside either a `.grp` or `.std` scope.
 *
 * Props:
 *   index     — 0-based position; rendered as a zero-padded ledger number
 *   accent    — accent color (hex) for the top stripe + active left border
 *   active    — draws the left accent border when true
 *   icon      — node: the icon tile (caller styles it with the accent)
 *   title     — entity name (serif display)
 *   meta      — node: mono stat line under the title
 *   topAction — optional node placed left of the index (e.g. hover archive btn)
 *   children  — optional richer body (meters, chips) above the footer
 *   footer    — optional node: footer row (left content); an arrow box is appended
 *   onClick   — () => void
 *   minHeight — px (default 176)
 */
const LedgerCard = ({
  index,
  accent,
  active = false,
  icon,
  title,
  meta,
  topAction,
  children,
  footer,
  onClick,
  minHeight = 176,
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    }}
    className="group std-card std-card-hover relative w-full text-left overflow-hidden p-5 flex flex-col cursor-pointer"
    style={{ minHeight, ...(active && accent ? { borderLeft: `3px solid ${accent}` } : {}) }}
  >
    {/* top accent stripe */}
    {accent && (
      <span
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: accent }}
      />
    )}

    {/* top row: icon tile + (action) + ledger index */}
    <div className="flex items-start justify-between gap-3">
      {icon}
      <div className="flex items-center gap-2 flex-shrink-0 pt-1">
        {topAction}
        {index != null && (
          <span className="std-mono text-[11px] text-[var(--ink-3)] tracking-widest">
            №{String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>
    </div>

    {/* name + meta (pushed toward the bottom) */}
    <div className="mt-auto pt-5">
      <h3 className="std-display text-[22px] font-bold text-[var(--ink)] leading-tight truncate">
        {title}
      </h3>
      {meta && <div className="mt-1.5">{meta}</div>}
    </div>

    {/* richer body slot */}
    {children}

    {/* footer */}
    {footer !== undefined && (
      <>
        <hr className="std-rule my-4" />
        <div className="flex items-center gap-2">
          {footer}
          <span className="ml-auto flex items-center justify-center w-8 h-8 rounded-[var(--r-pill)] border border-[var(--line-2)] text-[var(--ink-3)] group-hover:bg-[var(--signal)] group-hover:border-[var(--signal)] group-hover:text-[var(--signal-ink)] transition-colors flex-shrink-0">
            <ArrowRight size={14} weight="bold" />
          </span>
        </div>
      </>
    )}
  </div>
);

export default LedgerCard;
