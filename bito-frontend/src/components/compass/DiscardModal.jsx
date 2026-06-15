import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
 *   - Keep habits (just archive the compass)        → signal
 *   - Archive habits (cascade archive)              → ember (caution)
 *   - Delete habits + entries (destructive)         → rose
 *
 * DRILL re-skin: std-card dialog, serif title, mono meta, semantic accents.
 * Accessible: Escape to close, Enter to confirm.
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
      color: "text-[var(--signal)]",
      bgColor: "bg-[var(--signal)]/10",
      borderColor: "border-[var(--signal)]/40",
    },
    {
      key: "cascade",
      title: "Archive habits too",
      description: `Archive the compass and all ${habitCount} linked habits. You can unarchive them later.`,
      icon: ArchiveIcon,
      color: "text-[var(--ember)]",
      bgColor: "bg-[var(--ember)]/10",
      borderColor: "border-[var(--ember)]/40",
    },
    {
      key: "delete_habits",
      title: "Delete everything",
      description: `Permanently delete all ${habitCount} habits and their tracking data. This cannot be undone.`,
      icon: TrashIcon,
      color: "text-[var(--rose)]",
      bgColor: "bg-[var(--rose)]/10",
      borderColor: "border-[var(--rose)]/40",
    },
  ];

  return (
    <div className="std fixed inset-0 z-50 flex items-center justify-center p-4">
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
        className="relative w-full max-w-md std-card shadow-2xl"
        style={{ background: "var(--bg-2)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-modal-title"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line-2)]">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-[var(--r-tag)] bg-[var(--rose)]/10 flex items-center justify-center"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={springs.bouncy}
            >
              <ExclamationTriangleIcon className="w-5 h-5 text-[var(--rose)]" />
            </motion.div>
            <div>
              <h2
                id="discard-modal-title"
                className="std-display text-base font-bold text-[var(--ink)]"
              >
                Discard compass
              </h2>
              <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                {sys.icon} {sys.name || "Untitled"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 rounded-[var(--r-tag)] hover:bg-[var(--surface-2)] text-[var(--ink-3)] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-[var(--ink-2)] mb-4">
            This compass has {habitCount} active habit{habitCount !== 1 ? "s" : ""}. What should happen to them?
          </p>

          {options.map((opt, i) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.key;
            return (
              <motion.button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className={`w-full text-left p-4 rounded-[var(--r-card)] border-2 transition-all ${
                  isSelected
                    ? `${opt.borderColor} ${opt.bgColor}`
                    : "border-[var(--line-2)] hover:border-[var(--line-3)]"
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.snappy, delay: i * 0.06 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-[var(--r-tag)] flex items-center justify-center flex-shrink-0 ${
                      isSelected ? opt.bgColor : "bg-[var(--surface-2)]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? opt.color : "text-[var(--ink-3)]"}`} />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isSelected ? "text-[var(--ink)]" : "text-[var(--ink-2)]"
                      }`}
                    >
                      {opt.title}
                    </p>
                    <p className="text-xs text-[var(--ink-3)] mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-5 border-t border-[var(--line-2)]">
          <motion.button
            onClick={onCancel}
            disabled={isLoading}
            className="std-btn flex-1 h-11 disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={() => onConfirm(selected)}
            disabled={isLoading}
            className="std-btn std-btn--signal flex-1 h-11 disabled:opacity-50"
            style={
              selected === "delete_habits"
                ? { background: "var(--rose)", borderColor: "var(--rose)", color: "#fff" }
                : undefined
            }
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? "Discarding..." : selected === "delete_habits" ? "Delete & discard" : "Discard"}
          </motion.button>
        </div>

        {/* Keyboard hint */}
        <p className="std-mono text-center text-[10px] text-[var(--ink-3)] pb-3">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-2)]">Esc</kbd> cancel ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-2)]">Enter</kbd> confirm
        </p>
      </motion.div>
    </div>
  );
};

export default DiscardModal;
