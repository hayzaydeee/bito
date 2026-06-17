import { useState } from "react";
import { Rows, List, GitCommit } from "@phosphor-icons/react";

const STORAGE_KEY = "bito-feed-density";

/** Returns the persisted feed density. */
export function getStoredDensity() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "compact" || v === "timeline") return v;
    return "cozy";
  } catch {
    return "cozy";
  }
}

/**
 * Hook that exposes [density, setDensity] and persists to localStorage.
 */
export function useFeedDensity() {
  const [density, setDensityState] = useState(getStoredDensity);

  const setDensity = (v) => {
    setDensityState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  return [density, setDensity];
}

const OPTIONS = [
  { id: "cozy",     label: "Cozy",     Icon: Rows },
  { id: "compact",  label: "Compact",  Icon: List },
  { id: "timeline", label: "Timeline", Icon: GitCommit },
];

/**
 * FeedDensityToggle
 *
 * Props:
 *   density  — 'cozy' | 'compact' | 'timeline'
 *   onChange — (v: string) => void
 */
const FeedDensityToggle = ({ density, onChange }) => {
  const ActiveIcon = OPTIONS.find((o) => o.id === density)?.Icon || Rows;

  return (
    <>
      {/* Desktop view */}
      <div className="hidden sm:flex items-center gap-0.5 bg-[var(--bg-2)] rounded-[10px] p-1 border border-[var(--line-2)] flex-shrink-0">
        {OPTIONS.map(({ id, label, Icon }) => {
          const isActive = density === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] grp-mono text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[var(--surface-2)] text-[var(--ink)]"
                  : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"
              }`}
            >
              <Icon size={13} weight="bold" className={isActive ? "text-[var(--signal)]" : ""} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Mobile view */}
      <div className="sm:hidden relative flex-shrink-0">
        <select
          value={density}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-[var(--bg-2)] border border-[var(--line-2)] rounded-[10px] h-8 pl-8 pr-7 grp-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] outline-none focus:border-[var(--signal)]"
        >
          {OPTIONS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--signal)]">
          <ActiveIcon size={14} weight="bold" />
        </div>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink-3)]">
          <svg width="10" height="10" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </div>
      </div>
    </>
  );
};

export default FeedDensityToggle;
