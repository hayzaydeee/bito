import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import "./ModalAnimation.css";
import { 
  EnvelopeClosedIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";

const GroupInviteModal = ({ 
  isOpen, 
  onClose, 
  group,
  inviteForm,
  setInviteForm,
  onInvite
}) => {
  const modalRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onInvite();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInviteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

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
        <div className="space-y-5">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={onClose}
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
          
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
              <EnvelopeClosedIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-2xl font-dmSerif gradient-text mb-2">
              Invite Member
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Send an invitation to join {group?.name}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={inviteForm.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                placeholder="member@example.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                Role
              </label>
              <select
                name="role"
                value={inviteForm.role}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                name="message"
                value={inviteForm.message}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent resize-none"
                placeholder="Add a personal message to the invitation..."
              />
            </div>

            {/* Action buttons */}
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
                disabled={isSubmitting || !inviteForm.email}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white transition-all duration-200 font-outfit text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GroupInviteModal;
