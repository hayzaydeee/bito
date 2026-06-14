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
const FeedDensityToggle = ({ density, onChange }) => (
  <div className="flex items-center gap-0.5 bg-[var(--bg-2)] rounded-[10px] p-1 border border-[var(--line-2)]">
    {OPTIONS.map(({ id, label, Icon }) => {
      const isActive = density === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] grp-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
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
);

export default FeedDensityToggle;
