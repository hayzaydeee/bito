import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import "./ModalAnimation.css";
import { 
  CheckIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";

const HabitAdoptModal = ({ 
  isOpen, 
  onClose, 
  habit,
  onAdopt
}) => {
  const modalRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAdopt();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !habit) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto z-10 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-dmSerif font-bold text-[var(--color-text-primary)]">
            Adopt "{habit.name}"
          </div>
          <button 
            className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
            onClick={onClose}
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: habit.color || '#4f46e5' }}
              >
                {habit.icon || '🎯'}
              </div>
              <div>
                <h3 className="font-medium text-[var(--color-text-primary)] font-outfit">
                  {habit.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  {habit.category} • Target: {habit.defaultTarget?.value || 1} {habit.defaultTarget?.unit || 'times'}
                </p>
              </div>
            </div>
            {habit.description && (
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                {habit.description}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {habit.isRequired && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-300 font-outfit">
                  This is a required habit for all group members. Your participation helps the team's overall success.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 font-outfit text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white transition-all duration-200 font-outfit text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                "Adopting..."
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Adopt Habit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default HabitAdoptModal;
