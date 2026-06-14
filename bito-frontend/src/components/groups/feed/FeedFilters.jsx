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
  <div className="flex items-center gap-2 flex-wrap">
    {FILTERS.map(({ id, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`grp-mono text-[11px] font-bold uppercase tracking-[0.12em] h-8 px-3.5 rounded-[7px] border transition-colors ${
          active === id
            ? "bg-[var(--signal)] text-[var(--signal-ink)] border-[var(--signal)]"
            : "bg-transparent text-[var(--ink-3)] border-[var(--line-2)] hover:text-[var(--ink)] hover:border-[var(--line-3)]"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

export default FeedFilters;
