import { useState } from "react";
import { Rows, List } from "@phosphor-icons/react";

const STORAGE_KEY = "bito-feed-density";

/** Returns the persisted feed density. */
export function getStoredDensity() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "compact" ? "compact" : "cozy";
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

/**
 * FeedDensityToggle
 *
 * Props:
 *   density  — 'cozy' | 'compact'
 *   onChange — (v: string) => void
 */
const FeedDensityToggle = ({ density, onChange }) => (
  <div className="flex items-center gap-0.5 bg-[var(--color-surface-elevated)] rounded-lg p-0.5 border border-[var(--color-border-primary)]/20">
    <button
      onClick={() => onChange("cozy")}
      className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-spartan font-medium transition-colors ${
        density === "cozy"
          ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
          : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      }`}
    >
      <Rows size={12} />
      Cozy
    </button>
    <button
      onClick={() => onChange("compact")}
      className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-spartan font-medium transition-colors ${
        density === "compact"
          ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
          : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      }`}
    >
      <List size={12} />
      Compact
    </button>
  </div>
);

export default FeedDensityToggle;
