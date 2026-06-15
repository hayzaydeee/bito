/**
 * StandardEmptyState — shared DRILL empty state (kicker + serif title +
 * copy + ambient accent glow + CTA slot). Used across entity-list pages.
 *
 * Props:
 *   kicker, title, description — copy
 *   icon        — optional node (rendered in the accent color by the caller)
 *   glow        — 'signal' | 'ember' (ambient blob color)
 *   actions     — optional node (buttons)
 *   children    — optional extra content (e.g. suggestion pills)
 */
const StandardEmptyState = ({ kicker, title, description, icon, glow = "signal", actions, children }) => (
  <div className="std-rise max-w-xl mx-auto py-14 sm:py-16 std-card relative overflow-hidden" style={{ animationDelay: "160ms" }}>
    <div
      className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none"
      style={{ background: `color-mix(in srgb, var(--${glow}) 12%, transparent)` }}
    />
    <div className="px-6 sm:px-8 py-2 text-center relative">
      {icon && <div className="mb-6 flex justify-center">{icon}</div>}
      {kicker && <p className="std-kicker mb-3">{kicker}</p>}
      <h2 className="std-display text-3xl font-bold text-[var(--ink)] mb-3">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--ink-2)] max-w-sm mx-auto mb-8 leading-relaxed">{description}</p>
      )}
      {actions && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">{actions}</div>
      )}
      {children}
    </div>
  </div>
);

export default StandardEmptyState;
