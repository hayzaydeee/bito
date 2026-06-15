import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil1Icon, DrawingPinIcon, DrawingPinFilledIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import CATEGORY_META, { STATUS_THEME } from "../../data/categoryMeta";
import HabitIcon from "../shared/HabitIcon";
import { springs } from "./compassMotion";

/**
 * CategoryBanner — editorial hero header for compass detail/preview views.
 * Standard ("DRILL") language: std-card frame with a faint category-accent
 * wash, serif (std-display) name, mono status tag + stat readout, and
 * signal-tinted personalization (inline emoji input, notes, pin).
 * Phase-aware habit count.
 */
const CategoryBanner = ({ compass, onPersonalize }) => {
  const sys = compass.system || {};
  const p = compass.personalization || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const sTheme = STATUS_THEME[compass.status] || STATUS_THEME.preview;
  const isActiveStatus = compass.status === "active";

  // Phase-aware habit count
  const phases = sys.phases || [];
  const isPhased = phases.length > 0 && phases.some((ph) => ph.habits?.length > 0);
  const habitCount = isPhased
    ? phases.reduce((sum, ph) => sum + (ph.habits?.length || 0), 0)
    : (sys.habits?.length || 0);

  // Personalized overrides
  const displayIcon = p.icon || catMeta.icon;
  const accentColor = p.color || catMeta.accent;

  // Inline icon editing (replaces prompt())
  const [editingIcon, setEditingIcon] = useState(false);
  const [iconInput, setIconInput] = useState(displayIcon);
  const iconInputRef = useRef(null);

  // Inline notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(p.notes || "");

  const handleSaveNotes = () => {
    onPersonalize?.({ notes: notesText || null });
    setEditingNotes(false);
  };

  const handleTogglePin = () => {
    onPersonalize?.({ isPinned: !p.isPinned });
  };

  const handleIconClick = () => {
    if (!canPersonalize) return;
    setIconInput(displayIcon);
    setEditingIcon(true);
    // Focus the input after render
    setTimeout(() => iconInputRef.current?.focus(), 50);
  };

  const handleSaveIcon = () => {
    const trimmed = iconInput.trim();
    if (trimmed && trimmed !== displayIcon) {
      onPersonalize?.({ icon: trimmed });
    }
    setEditingIcon(false);
  };

  const handleCancelIcon = () => {
    setIconInput(displayIcon);
    setEditingIcon(false);
  };

  const canPersonalize = !!onPersonalize;

  return (
    <div
      className="std-card relative overflow-hidden p-6 sm:p-8"
      style={{
        background: `linear-gradient(135deg, ${accentColor}14 0%, transparent 55%), var(--surface)`,
      }}
    >
      {/* Decorative circle */}
      <motion.div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-[0.06]"
        style={{ background: accentColor }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={springs.gentle}
      />

      {/* Pin button */}
      {canPersonalize && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleTogglePin}
          className={`absolute top-4 right-4 p-2 rounded-[var(--r-tag)] transition-all ${
            p.isPinned
              ? "text-[var(--signal)] bg-[var(--signal)]/10"
              : "text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
          }`}
          title={p.isPinned ? "Unpin" : "Pin to top"}
        >
          {p.isPinned ? (
            <DrawingPinFilledIcon className="w-4 h-4" />
          ) : (
            <DrawingPinIcon className="w-4 h-4" />
          )}
        </motion.button>
      )}

      <div className="relative flex items-start gap-4 sm:gap-5">
        {/* Large icon — clickable with inline edit */}
        <div className="relative flex-shrink-0">
          <AnimatePresence mode="wait">
            {editingIcon ? (
              <motion.div
                key="edit"
                className="flex flex-col items-center gap-1.5"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={springs.snappy}
              >
                <input
                  ref={iconInputRef}
                  value={iconInput}
                  onChange={(e) => setIconInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveIcon();
                    if (e.key === "Escape") handleCancelIcon();
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-[var(--r-card)] text-3xl sm:text-4xl text-center border-2 border-[var(--signal)]/40 focus:outline-none focus:border-[var(--signal)]"
                  style={{ backgroundColor: `${accentColor}15` }}
                  maxLength={4}
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveIcon}
                    className="p-1 rounded-md bg-[var(--signal)]/15 text-[var(--signal)] hover:bg-[var(--signal)]/25 transition-colors"
                  >
                    <CheckIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancelIcon}
                    className="p-1 rounded-md hover:bg-[var(--surface-2)] text-[var(--ink-3)] transition-colors"
                  >
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="display"
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[var(--r-card)] flex items-center justify-center group relative ${
                  canPersonalize ? "cursor-pointer" : ""
                }`}
                style={{ backgroundColor: `${accentColor}15` }}
                onClick={handleIconClick}
                title={canPersonalize ? "Click to change icon" : undefined}
                whileHover={canPersonalize ? { scale: 1.05 } : {}}
                whileTap={canPersonalize ? { scale: 0.95 } : {}}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={springs.soft}
              >
                <HabitIcon icon={displayIcon} size={40} />
                {canPersonalize && (
                  <div className="absolute inset-0 rounded-[var(--r-card)] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Pencil1Icon className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="std-display text-[26px] sm:text-[32px] font-bold text-[var(--ink)] leading-tight">
              {sys.name || "Untitled compass"}
            </h1>
            <span
              className="std-tag"
              style={isActiveStatus ? { color: "var(--signal)", borderColor: "var(--signal)" } : undefined}
            >
              {sTheme.label}
            </span>
          </div>

          {sys.description && (
            <p className="text-sm sm:text-base text-[var(--ink-2)] mt-1 max-w-2xl leading-relaxed">
              {sys.description}
            </p>
          )}

          {/* Stat readout */}
          <div className="std-mono flex items-center gap-3 mt-3.5 text-[11px] uppercase tracking-wider text-[var(--ink-3)] flex-wrap">
            <span className="flex items-center gap-1.5">
              <HabitIcon icon={catMeta.icon} size={13} />
              {catMeta.label}
            </span>
            <span className="text-[var(--line-3)]">·</span>
            {sys.estimatedDuration?.value && (
              <>
                <span>
                  {sys.estimatedDuration.value} {sys.estimatedDuration.unit}
                </span>
                <span className="text-[var(--line-3)]">·</span>
              </>
            )}
            <span>
              {habitCount} habit{habitCount !== 1 && "s"}
            </span>
            {isPhased && (
              <>
                <span className="text-[var(--line-3)]">·</span>
                <span>
                  {phases.length} phase{phases.length !== 1 && "s"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Goal quote */}
      {compass.goal?.text && (
        <div className="mt-5 p-4 rounded-[var(--r-tag)] border border-[var(--line)] bg-[var(--surface-2)]">
          <p className="std-kicker mb-1.5">Your goal</p>
          <p className="std-display text-base sm:text-lg text-[var(--ink)] italic leading-snug">
            &ldquo;{compass.goal.text}&rdquo;
          </p>
        </div>
      )}

      {/* User notes — personalization */}
      {canPersonalize && (
        <div className="mt-3">
          <AnimatePresence mode="wait">
            {editingNotes ? (
              <motion.div
                key="edit-notes"
                className="flex items-start gap-2"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={springs.snappy}
              >
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setEditingNotes(false); setNotesText(p.notes || ""); }
                  }}
                  placeholder="Add personal notes about this plan..."
                  maxLength={500}
                  rows={2}
                  className="flex-1 text-sm bg-[var(--bg-2)] text-[var(--ink)] rounded-[var(--r-btn)] px-3 py-2 border border-[var(--line-2)] focus:outline-none focus:border-[var(--signal)] resize-none placeholder:text-[var(--ink-3)]"
                  autoFocus
                />
                <button
                  onClick={handleSaveNotes}
                  className="p-2 rounded-[var(--r-tag)] bg-[var(--signal)]/15 text-[var(--signal)] hover:bg-[var(--signal)]/25 transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingNotes(false); setNotesText(p.notes || ""); }}
                  className="p-2 rounded-[var(--r-tag)] hover:bg-[var(--surface-2)] text-[var(--ink-3)] transition-colors"
                >
                  <Cross2Icon className="w-4 h-4" />
                </button>
              </motion.div>
            ) : p.notes ? (
              <motion.button
                key="view-notes"
                onClick={() => setEditingNotes(true)}
                className="w-full text-left p-3 rounded-[var(--r-tag)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)] border border-[var(--line)] transition-colors group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="std-kicker mb-0.5">Notes</p>
                <p className="text-sm text-[var(--ink-2)]">{p.notes}</p>
              </motion.button>
            ) : (
              <motion.button
                key="add-notes"
                onClick={() => setEditingNotes(true)}
                className="std-mono text-[11px] uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink-2)] transition-colors flex items-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Pencil1Icon className="w-3 h-3" />
                Add notes
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Notes display for non-editable views */}
      {!canPersonalize && p.notes && (
        <div className="mt-3 p-3 rounded-[var(--r-tag)] bg-[var(--surface-2)] border border-[var(--line)]">
          <p className="std-kicker mb-0.5">Notes</p>
          <p className="text-sm text-[var(--ink-2)]">{p.notes}</p>
        </div>
      )}
    </div>
  );
};

export default CategoryBanner;
