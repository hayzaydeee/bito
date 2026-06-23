import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon, Cross2Icon } from "@radix-ui/react-icons";
import { springs } from "./compassMotion";

/**
 * DraftResumeBanner — appears at the top of the compass list when one or more
 * compasses are in `status: 'preview'` (generated but not yet applied).
 *
 * Props:
 *   previewCompasses — array of compass objects with status === 'preview'
 *   onResume(compass) — called with the compass to open (or suite lead)
 *   suiteGroups — array of suite group objects { suiteId, compasses[] }
 *
 * Behavior:
 * - Single plan: shows plan name, "Continue →" opens CompassDetail.
 * - Suite: shows suite name + member count, "Continue →" opens SuitePreview
 *   via onResume({ _suiteGroup: true, ...suiteGroup }).
 * - Multiple unrelated plans: shows count, "Continue →" opens the first.
 * - Session-dismissible: hidden after × until page reload (state is ephemeral).
 */
const DraftResumeBanner = ({ previewCompasses = [], onResume, suiteGroups = [] }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || previewCompasses.length === 0) return null;

  // Determine what to resume
  // Prefer a suite if any preview compass belongs to one
  const suiteWithPreviews = suiteGroups.find((sg) =>
    sg.compasses.some((c) => c.status === "preview")
  );

  const standalonePreview = !suiteWithPreviews
    ? previewCompasses[0]
    : null;

  const multipleStandalone =
    !suiteWithPreviews && previewCompasses.length > 1;

  // Copy
  let headline, sub;
  if (suiteWithPreviews) {
    const count = suiteWithPreviews.compasses.filter(c => c.status === "preview").length;
    headline = `A suite of ${count} plans is waiting`;
    sub = suiteWithPreviews.suiteName
      ? `"${suiteWithPreviews.suiteName}" — forge it into habits when you're ready.`
      : "Review and apply your linked plans when you're ready.";
  } else if (multipleStandalone) {
    headline = `${previewCompasses.length} plans awaiting your review`;
    sub = "Each plan is ready to be forged into habits.";
  } else {
    headline = `"${standalonePreview?.system?.name || "Your plan"}" is waiting`;
    sub = "Forge it into habits when you're ready.";
  }

  const handleResume = () => {
    if (suiteWithPreviews) {
      onResume({ _suiteGroup: true, ...suiteWithPreviews });
    } else {
      onResume(standalonePreview);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={springs.soft}
        className="std-card relative overflow-hidden p-4 flex items-center gap-4"
        style={{
          borderColor: "color-mix(in srgb, var(--signal) 30%, var(--line-2))",
          background: "color-mix(in srgb, var(--signal) 5%, var(--bg-2))",
        }}
      >
        {/* Signal left stripe */}
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: "var(--signal)" }}
        />

        {/* Pulsing dot */}
        <span className="relative flex-shrink-0 w-2 h-2 ml-1">
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-60"
            style={{ background: "var(--signal)" }}
          />
          <span
            className="relative w-2 h-2 rounded-full block"
            style={{ background: "var(--signal)" }}
          />
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--ink)] leading-snug truncate">
            {headline}
          </p>
          <p className="std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mt-0.5 truncate">
            {sub}
          </p>
        </div>

        {/* Continue CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleResume}
          className="flex-shrink-0 flex items-center gap-1.5 std-mono text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-[var(--r-btn)] border transition-colors"
          style={{
            borderColor: "var(--signal)",
            color: "var(--signal)",
          }}
        >
          Continue
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </motion.button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss for now"
          className="flex-shrink-0 p-1.5 rounded-md text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-3)] transition-colors"
        >
          <Cross2Icon className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default DraftResumeBanner;
