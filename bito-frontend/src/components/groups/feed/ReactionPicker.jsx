import { useState, useRef, useEffect } from "react";
import {
  Heart,
  ThumbsUp,
  Fire,
  Lightning,
  Star,
  Smiley,
  Plus,
} from "@phosphor-icons/react";

/**
 * Maps Phosphor reaction icon names to reaction type strings
 * used by the backend (groupsAPI.addReaction / removeReaction).
 */
const REACTIONS = [
  { Icon: ThumbsUp,  type: "like",      label: "Like" },
  { Icon: Fire,      type: "fire",      label: "Fire" },
  { Icon: Lightning, type: "celebrate", label: "Celebrate" },
  { Icon: Star,      type: "star",      label: "Star" },
  { Icon: Smiley,    type: "smiley",    label: "Smiley" },
];

/**
 * ReactionPicker
 *
 * Displays a heart reaction count by default.
 * A "+" button opens a popover row of additional reactions.
 *
 * Props:
 *   reactions  — { [type]: count } for this activity item
 *   myReaction — type string of the current user's reaction, or null
 *   onReact    — (type: string) => void  — called when any reaction selected/toggled
 */
const ReactionPicker = ({ reactions = {}, myReaction = null, onReact }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const heartCount = reactions["heart"] || 0;
  const hasHeart = myReaction === "heart";

  return (
    <div ref={ref} className="flex items-center gap-1 relative">
      {/* Heart — always visible */}
      <button
        onClick={() => onReact("heart")}
        className={`flex items-center gap-1 h-6 px-2 rounded-full text-xs font-spartan transition-all ${
          hasHeart
            ? "bg-rose-500/15 text-rose-500 border border-rose-500/25"
            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] border border-[var(--color-border-primary)]/20 hover:border-rose-500/30 hover:text-rose-400"
        }`}
      >
        <Heart size={11} weight={hasHeart ? "fill" : "regular"} />
        {heartCount > 0 && <span>{heartCount}</span>}
      </button>

      {/* Show existing non-heart reactions */}
      {REACTIONS.filter(({ type }) => (reactions[type] || 0) > 0).map((rxn) => {
        const RIcon = rxn.Icon;
        const count = reactions[rxn.type];
        const mine = myReaction === rxn.type;
        return (
          <button
            key={rxn.type}
            onClick={() => onReact(rxn.type)}
            aria-label={rxn.label}
            className={`flex items-center gap-1 h-6 px-2 rounded-full text-xs font-spartan transition-all border ${
              mine
                ? "bg-[var(--color-brand-600)]/15 text-[var(--color-brand-500)] border-[var(--color-brand-500)]/25"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] border-[var(--color-border-primary)]/20 hover:text-[var(--color-text-primary)]"
            }`}
          >
            <RIcon size={11} weight={mine ? "fill" : "regular"} />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}

      {/* + picker trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]/40 transition-colors"
          aria-label="More reactions"
        >
          <Plus size={10} weight="bold" />
        </button>

        {open && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 p-1.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/30 shadow-lg shadow-black/20 z-50">
              {REACTIONS.map((rxn) => {
                const PIcon = rxn.Icon;
                return (
                <button
                key={rxn.type}
                onClick={() => {
                  onReact(rxn.type);
                  setOpen(false);
                }}
                aria-label={rxn.label}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--color-surface-hover)] ${
                  myReaction === rxn.type
                    ? "text-[var(--color-brand-500)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                <PIcon size={14} weight={myReaction === rxn.type ? "fill" : "regular"} />
              </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactionPicker;
