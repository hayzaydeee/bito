/**
 * FeedFilters
 *
 * Props:
 *   active   — current filter id: 'all' | 'streaks' | 'kudos' | 'members'
 *   onChange — (id: string) => void
 */

const FILTERS = [
  { id: "all",     label: "All" },
  { id: "streaks", label: "Streaks" },
  { id: "kudos",   label: "Kudos" },
  { id: "members", label: "Members" },
];

/**
 * Returns the comma-separated `types` param value for a given filter id.
 * Pass as `?types=...` to groupsAPI.getGroupActivity().
 */
export function filterToTypes(filterId) {
  const map = {
    all:     null,
    streaks: "streak_milestone",
    kudos:   "kudos",
    members: "member_joined,member_left",
  };
  return map[filterId] ?? null;
}

const FeedFilters = ({ active, onChange }) => (
  <div className="flex items-center gap-2">
    {FILTERS.map(({ id, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`h-8 px-4 rounded-full text-[13px] font-spartan font-medium transition-colors border ${
          active === id
            ? "bg-[var(--color-brand-600)] text-white border-transparent shadow-sm shadow-[var(--color-brand-600)]/20"
            : "bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]/40 hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-primary)]/60"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

export default FeedFilters;
