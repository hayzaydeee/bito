import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cross2Icon,
  ExclamationTriangleIcon,
  ArchiveIcon,
  TrashIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { springs, modalVariants, backdropVariants } from "./compassMotion";

/**
 * DiscardModal — shown when discarding an active compass.
 * Lets user choose what happens to linked habits:
 *   - Keep habits (just archive the compass)
 *   - Archive habits (cascade archive)
 *   - Delete habits + entries (destructive)
 *
 * Accessible: Escape to close, Enter to confirm, focus trap.
 */
const DiscardModal = ({ compass, onConfirm, onCancel, isLoading = false }) => {
  const [selected, setSelected] = useState("keep_habits");

  const sys = compass?.system || {};

  // Phase-aware habit count
  const phases = sys.phases || [];
  const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);
  const habitCount =
    compass?.appliedResources?.habitIds?.length ||
    (isPhased
      ? phases.reduce((s, p) => s + (p.habits?.length || 0), 0)
      : sys.habits?.length || 0);

  // Keyboard handling
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      } else if (e.key === "Enter" && !isLoading) {
        onConfirm(selected);
      }
    },
    [onCancel, onConfirm, selected, isLoading]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const options = [
    {
      key: "keep_habits",
      title: "Keep my habits",
      description: `Archive this compass but keep all ${habitCount} habits active in your daily routine.`,
      icon: CheckCircledIcon,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      key: "cascade",
      title: "Archive habits too",
      description: `Archive the compass and all ${habitCount} linked habits. You can unarchive them later.`,
      icon: ArchiveIcon,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    {
      key: "delete_habits",
      title: "Delete everything",
      description: `Permanently delete all ${habitCount} habits and their tracking data. This cannot be undone.`,
      icon: TrashIcon,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)]/30 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-modal-title"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-primary)]/20">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={springs.bouncy}
            >
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            </motion.div>
            <div>
              <h2
                id="discard-modal-title"
                className="text-base font-spartan font-bold text-[var(--color-text-primary)]"
              >
                Discard compass
              </h2>
              <p className="text-xs font-spartan text-[var(--color-text-secondary)]">
                {sys.icon} {sys.name || "Untitled"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          <p className="text-sm font-spartan text-[var(--color-text-secondary)] mb-4">
            This compass has {habitCount} active habit{habitCount !== 1 ? "s" : ""}. What should happen to them?
          </p>

          {options.map((opt, i) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.key;
            return (
              <motion.button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${opt.borderColor} ${opt.bgColor}`
                    : "border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40"
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.snappy, delay: i * 0.06 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? opt.bgColor : "bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? opt.color : "text-[var(--color-text-tertiary)]"}`} />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-spartan font-semibold ${
                        isSelected ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {opt.title}
                    </p>
                    <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-5 border-t border-[var(--color-border-primary)]/20">
          <motion.button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl text-sm font-spartan font-medium border border-[var(--color-border-primary)]/30 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={() => onConfirm(selected)}
            disabled={isLoading}
            className={`flex-1 h-11 rounded-xl text-sm font-spartan font-medium text-white transition-all disabled:opacity-50 ${
              selected === "delete_habits"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)]"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? "Discarding..." : selected === "delete_habits" ? "Delete & Discard" : "Discard"}
          </motion.button>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-[10px] font-spartan text-[var(--color-text-tertiary)]/60 pb-3">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]">Esc</kbd> to cancel · <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]">Enter</kbd> to confirm
        </p>
      </motion.div>
    </div>
  );
};

export default DiscardModal;
