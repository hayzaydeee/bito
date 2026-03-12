/**
 * AnimatedModal — Drop-in replacement for the createPortal + CSS modal pattern.
 *
 * Features:
 * - Spring-based enter animation (scale + fade)
 * - Proper exit animation via AnimatePresence (no more instant unmount)
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap friendly (renders in a portal)
 * - Respects prefers-reduced-motion
 *
 * Usage:
 *   <AnimatedModal isOpen={isOpen} onClose={handleClose} title="Edit Habit">
 *     <YourModalContent />
 *   </AnimatedModal>
 */
import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { modalVariants, backdropVariants } from "../../utils/motion";
import useMotionSafe from "../../hooks/useMotionSafe";

const AnimatedModal = ({
  isOpen,
  onClose,
  children,
  className = "",
  overlayClassName = "",
  /** Set false to prevent backdrop click closing */
  closeOnBackdrop = true,
  /** Set false to prevent Escape closing */
  closeOnEscape = true,
  /** Max-width class, default max-w-lg */
  maxWidth = "max-w-lg",
}) => {
  const { getVariants } = useMotionSafe();

  const handleEscape = useCallback(
    (e) => {
      if (closeOnEscape && e.key === "Escape") onClose?.();
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          variants={getVariants(backdropVariants)}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={handleBackdropClick}
        >
          <motion.div
            key="modal-panel"
            variants={getVariants(modalVariants)}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative w-full ${maxWidth} rounded-2xl shadow-xl overflow-hidden ${className}`}
            style={{ backgroundColor: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AnimatedModal;
