import React, { useState, useRef } from "react";
import AnimatedModal from "./AnimatedModal";
import { 
  CheckIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import HabitIcon from "../shared/HabitIcon";

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

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div
        ref={modalRef}
        className="grp bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="grp-display text-xl font-bold text-[var(--ink)]">
            Adopt "{habit.name}"
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-[9px] hover:bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            onClick={onClose}
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[var(--bg-2)] border border-[var(--line)] rounded-[12px] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg border"
                style={{ backgroundColor: (habit.color || '#a78bfa') + '1f', borderColor: (habit.color || '#a78bfa') + '55' }}
              >
                <HabitIcon icon={habit.icon || 'Target'} size={18} />
              </div>
              <div>
                <h3 className="grp-display font-bold text-[var(--ink)]">
                  {habit.name}
                </h3>
                <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mt-0.5">
                  {habit.category} • {habit.defaultTarget?.value || 1} {habit.defaultTarget?.unit || 'times'}
                </p>
              </div>
            </div>
            {habit.description && (
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                {habit.description}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {habit.isRequired && (
              <div className="flex items-start gap-2 p-3 bg-[var(--ember)]/10 border border-[var(--ember)]/30 rounded-[12px]">
                <ExclamationTriangleIcon className="w-4 h-4 text-[var(--ember)] mt-0.5 flex-shrink-0" />
                <div className="text-xs text-[var(--ink-2)] leading-relaxed">
                  This is a required habit for all group members. Your participation helps the team's overall success.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="grp-btn grp-btn--sm flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="grp-btn grp-btn--signal grp-btn--sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                "Adopting…"
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
    </AnimatedModal>
  );
};

export default HabitAdoptModal;
