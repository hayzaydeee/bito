import React from 'react';
import AnimatedModal from '../ui/AnimatedModal';
import { HeartIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import EncouragementForm from './EncouragementForm';

const EncouragementModal = ({ 
  isOpen, 
  onClose, 
  targetUser, 
  groupId, 
  habitId = null, 
  onEncouragementSent 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="grp bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--line-2)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[var(--rose)]/10 border border-[var(--rose)]/20 flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-[var(--rose)]" />
              </div>
              <div>
                <h2 className="std-display text-xl font-bold text-[var(--ink)]">
                  Send Encouragement
                </h2>
                <p className="std-kicker mt-0.5 text-[var(--ink-3)]">
                  To {targetUser?.name ? targetUser.name.split(" ")[0] : (targetUser?.email || 'Group Member')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[9px] hover:bg-[var(--surface-2)] flex items-center justify-center transition-colors text-[var(--ink-3)] hover:text-[var(--ink)] border border-transparent hover:border-[var(--line-2)]"
            >
              <CrossCircledIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <EncouragementForm 
          targetUser={targetUser}
          groupId={groupId}
          habitId={habitId}
          onCancel={onClose}
          onSuccess={() => {
            if (onEncouragementSent) onEncouragementSent();
            onClose();
          }}
        />
      </div>
    </AnimatedModal>
  );
};

export default EncouragementModal;
