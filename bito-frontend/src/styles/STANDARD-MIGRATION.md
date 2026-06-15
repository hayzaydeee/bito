# Migrating a feature to the Standard design system

The app supports two design systems, selectable in Settings → Appearance:

- **Legacy** (default) — the original purple + EB Garamond / League Spartan look.
- **Standard** — the "DRILL" language: black/white + accent, Fraunces / Hanken Grotesk / Space Mono, mono uppercase labels, hairline grids, softer radii.

The axis is applied as `data-ds="legacy|standard"` on `<html>` by `ThemeContext`, orthogonal to the light/dark theme. Tokens + shared utilities live in `src/styles/standard-theme.css`.

## What you get for free

Every component already styled with `var(--color-*)` tokens (≈the whole app) adopts the Standard **palette and typography automatically** under `data-ds="standard"` — `standard-theme.css` remaps `--color-*`, `--font-garamond`, and `--font-spartan`. So an un-migrated screen still looks coherent (black/white + accent), just not yet in the full DRILL treatment.

## Full migration pattern (per feature)

To bring a feature fully into the Standard language (type + radii + structure), mirror what the Groups feature does:

1. **Wrap the page** in a standard surface: `className="std std-surface min-h-screen ..."` (gives the black/white gradient-grid backdrop; no-op visual under legacy because the grid is scoped to `[data-ds="standard"]`).
2. **Use the shared utilities** (defined for both `.std-*` and `.grp-*`):
   - `std-display` (Fraunces headings/numbers), `std-mono` (Space Mono), `std-kicker` (mono uppercase section labels), `std-num` (tabular display numbers).
   - `std-card` / `std-card-hover`, `std-btn` (+`--signal` / `--ember` / `--sm`), `std-tag`, `std-input`, `std-tab`, `std-meter`, `std-rule`, `std-rise`.
   - Tokens: `var(--ink|ink-2|ink-3)`, `var(--surface|surface-2)`, `var(--line|line-2|line-3)`, `var(--signal|ember|cobalt|rose)`, radii `var(--r-card|r-btn|r-tag|r-pill)`.
3. **Keep behavior/data identical** — only swap presentation.

If a feature should render **differently** per design system (like Groups, which keeps one component set themed both ways via `.grp`), define a `.grp`-style token-mapping in the feature's CSS: standard values come from the root `[data-ds="standard"]`; add a `[data-ds="legacy"] .yourscope { … var(--color-*) / var(--font-*) … }` block for the legacy re-skin. See `src/components/groups/groups-theme.css`.

## Reference files
- `src/styles/standard-theme.css` — tokens + utilities (source of truth).
- `src/components/groups/groups-theme.css` — legacy token-mapping example.
- `src/components/layout/standard/*` — floating nav shell built on these utilities.
- `src/contexts/ThemeContext.jsx` — the `designSystem` axis + `changeDesignSystem`.
