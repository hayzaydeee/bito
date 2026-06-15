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
  <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-10 pb-7 sm:pb-8 border-b border-[var(--line-2)]">
    <div className="std-rise min-w-0" style={{ animationDelay: "40ms" }}>
      {kicker && <p className="std-kicker mb-3">{kicker}</p>}
      <h1 className="std-display font-black leading-[0.9] text-[var(--ink)] text-[clamp(2.25rem,8vw,4.5rem)]">
        {title}
      </h1>
      {stats && (
        <p className="std-mono text-[12px] text-[var(--ink-3)] mt-4 tracking-wide">
          {stats}
        </p>
      )}
    </div>

    {actions && (
      <div className="flex items-center gap-2 flex-shrink-0 std-rise" style={{ animationDelay: "120ms" }}>
        {actions}
      </div>
    )}
  </div>
);

export default FeatureHeader;
