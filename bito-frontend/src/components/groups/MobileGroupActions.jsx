import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { PlusIcon } from "@radix-ui/react-icons";
import { UserPlus, QrCode } from "@phosphor-icons/react";

const drawerVariants = {
  initial: { y: "100%", opacity: 0.5 },
  animate: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", damping: 25, stiffness: 300 } 
  },
  exit: { 
    y: "100%", 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const MobileGroupActions = ({
  isOpen,
  onClose,
  onCreateGroup,
  onJoinGroup,
  onOpenJoinModal
}) => {
  const [inviteCode, setInviteCode] = useState("");

  const handleEscape = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setInviteCode(""); // reset on open
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      onJoinGroup(inviteCode.trim());
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-group-actions-backdrop"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 sm:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          onClick={handleBackdropClick}
        >
          <motion.div
            key="mobile-group-actions-panel"
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full bg-[var(--surface)] border-t border-[var(--line-2)] sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden pb-8 pt-4 px-6 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-[var(--line-2)] rounded-full mx-auto mb-2" />

            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display text-[var(--ink)]">Group Actions</h2>
              <p className="text-sm text-[var(--ink-3)] font-spartan">Join an existing group or create a new one.</p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-[var(--ink-3)] flex items-center justify-between">
                <span>Join by Code or QR</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Paste invite code..."
                  value={inviteCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                    setInviteCode(val);
                    // Automatically try to join when standard code lengths are reached
                    if (val.length === 6 || val.length === 10) {
                      onJoinGroup(val);
                    }
                  }}
                  className="flex-1 bg-transparent border border-[var(--line)] rounded-xl px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--signal)] font-mono text-sm uppercase tracking-widest text-center"
                />
                <button 
                  type="button"
                  onClick={() => { onClose(); onOpenJoinModal?.("scan"); }}
                  className="flex items-center justify-center w-12 h-12 bg-[var(--surface-2)] text-[var(--signal)] rounded-xl hover:bg-[var(--surface-3)] transition-colors flex-shrink-0"
                  aria-label="Scan QR Code"
                >
                  <QrCode size={20} weight="bold" />
                </button>
              </div>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[var(--line-2)]"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-mono uppercase text-[var(--ink-4)]">or</span>
              <div className="flex-grow border-t border-[var(--line-2)]"></div>
            </div>

            <button 
              onClick={() => { onClose(); onCreateGroup(); }} 
              className="grp-btn grp-btn--signal w-full justify-center py-3.5 text-base"
            >
              <PlusIcon className="w-5 h-5" />
              Create New Group
            </button>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MobileGroupActions;
