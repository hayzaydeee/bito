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

  const pill =
    "flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] grp-mono text-[11px] font-bold transition-colors border";

  return (
    <div ref={ref} className="flex items-center gap-1.5 relative">
      {/* Heart — always visible */}
      <button
        onClick={() => onReact("heart")}
        className={`${pill} ${
          hasHeart
            ? "bg-[var(--rose)]/15 text-[var(--rose)] border-[var(--rose)]/45"
            : "bg-[var(--surface)] text-[var(--ink-3)] border-[var(--line-2)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)]"
        }`}
      >
        <Heart size={12} weight={hasHeart ? "fill" : "regular"} />
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
            className={`${pill} ${
              mine
                ? "bg-[var(--signal)]/15 text-[var(--signal)] border-[var(--signal)]/45"
                : "bg-[var(--surface)] text-[var(--ink-3)] border-[var(--line-2)] hover:text-[var(--ink)]"
            }`}
          >
            <RIcon size={12} weight={mine ? "fill" : "regular"} />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}

      {/* + picker trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-[var(--surface)] border border-[var(--line-2)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--line-3)] transition-colors"
          aria-label="More reactions"
        >
          <Plus size={11} weight="bold" />
        </button>

        {open && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 p-1.5 rounded-[10px] bg-[var(--surface-2)] border border-[var(--line-3)] shadow-lg shadow-black/40 z-50">
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
                  className={`w-7 h-7 rounded-[7px] flex items-center justify-center transition-colors hover:bg-[var(--surface)] ${
                    myReaction === rxn.type
                      ? "text-[var(--signal)]"
                      : "text-[var(--ink-2)]"
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
