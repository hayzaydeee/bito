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
  <div className="flex items-center gap-0.5 bg-[var(--color-surface-elevated)] rounded-lg p-0.5 border border-[var(--color-border-primary)]/20">
    {OPTIONS.map(({ id, label, Icon }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-spartan font-medium transition-colors ${
          density === id
            ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        }`}
      >
        <Icon size={12} />
        {label}
      </button>
    ))}
  </div>
);

export default FeedDensityToggle;
