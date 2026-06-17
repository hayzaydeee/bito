/**
 * FeatureHeader — the shared DRILL "feature home" masthead.
 * Editorial header used by entity-list pages (Groups home, Compass home, …)
 * so functionally-similar pages read as siblings.
 *
 * Works inside either a `.grp` or `.std` scope (tokens resolve from the ancestor).
 *
 * Props:
 *   kicker   — small mono uppercase label (string)
 *   title    — giant display title (string)
 *   stats    — optional node rendered as the mono stat readout line
 *   actions  — optional node (buttons) shown on the right
 */
const FeatureHeader = ({ kicker, title, stats, actions }) => (
  <div data-tour="feature-header" className="std-rise" style={{ animationDelay: "40ms" }}>
    <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
      <div className="min-w-0">
        {kicker && <p className="std-kicker text-[var(--signal)] mb-1.5">{kicker}</p>}
        <h1 className="std-display text-4xl sm:text-5xl font-bold text-[var(--ink)] leading-none">
          {title}
        </h1>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
    
    {stats && (
      <p className="std-mono text-[11px] text-[var(--ink-3)] mt-2 tracking-wider uppercase">
        {stats}
      </p>
    )}
  </div>
);

export default FeatureHeader;
