import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { encouragementAPI } from '../../services/api';
import AnimatedModal from '../ui/AnimatedModal';
import { 
  ChatBubbleIcon,
  HeartIcon,
  PaperPlaneIcon,
  CrossCircledIcon,
  CheckCircledIcon
} from '@radix-ui/react-icons';

const EncouragementModal = ({ 
  isOpen, 
  onClose, 
  targetUser, 
  groupId, 
  habitId = null, 
  onEncouragementSent 
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general_support');
  const [reaction, setReaction] = useState('👏');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const encouragementTypes = [
    { value: 'general_support', label: 'General Support', icon: '💪' },
    { value: 'streak_celebration', label: 'Celebrate Streak', icon: '🔥' },
    { value: 'goal_achieved', label: 'Goal Achieved', icon: '🎉' },
    { value: 'comeback_support', label: 'Comeback Support', icon: '👊' },
    { value: 'milestone_reached', label: 'Milestone Reached', icon: '⭐' },
    { value: 'custom_message', label: 'Custom Message', icon: '💬' }
  ];

  const reactionOptions = ['👏', '🔥', '💪', '⭐', '🎉', '👊', '💯', '🚀'];

  const quickMessages = [
    "Keep up the great work! You're doing amazing! 💪",
    "Your consistency is inspiring! 🔥",
    "Every step counts - you've got this! 👏",
    "Your dedication is paying off! ⭐",
    "Proud of your progress! 🎉",
    "You're stronger than you think! 💯"
  ];

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setType(habitId ? 'goal_achieved' : 'general_support');
      setReaction('👏');
      setError(null);
    }
  }, [isOpen, habitId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const encouragementData = {
        toUserId: targetUser._id || targetUser.id, // Handle populated vs string IDs
        groupId,
        type,
        message: message.trim(),
        reaction
      };
      
      // Only attach habitId if it exists to avoid validation errors
      if (habitId) {
        encouragementData.habitId = habitId;
      }

      await encouragementAPI.sendEncouragement(encouragementData);
      
      if (onEncouragementSent) {
        onEncouragementSent();
      }
      
      onClose();
    } catch (err) {
      console.error('Error sending encouragement:', err);
      setError(err.message || 'Failed to send encouragement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickMessage = (quickMsg) => {
    setMessage(quickMsg);
  };

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
                  To {targetUser.name || targetUser.email || 'Group Member'}
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

        {/* Form Scrollable Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 journal-v2-content-scroll">
          <form id="encouragement-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Encouragement Type */}
            <div>
              <label className="std-kicker block mb-2 text-[var(--ink-2)]">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {encouragementTypes.map((typeOption) => {
                  const isActive = type === typeOption.value;
                  return (
                    <button
                      key={typeOption.value}
                      type="button"
                      onClick={() => setType(typeOption.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-[10px] border text-[13px] font-medium transition-all ${
                        isActive
                          ? 'border-[var(--signal)] bg-[var(--signal)]/5 text-[var(--signal)]'
                          : 'border-[var(--line-2)] hover:border-[var(--line-3)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <span className="text-base">{typeOption.icon}</span>
                      <span className="truncate">{typeOption.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reaction */}
            <div>
              <label className="std-kicker block mb-2 text-[var(--ink-2)]">Reaction</label>
              <div className="flex gap-2 flex-wrap">
                {reactionOptions.map((reactionOption) => {
                  const isActive = reaction === reactionOption;
                  return (
                    <button
                      key={reactionOption}
                      type="button"
                      onClick={() => setReaction(reactionOption)}
                      className={`w-10 h-10 rounded-[10px] border text-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'border-[var(--signal)] bg-[var(--signal)]/5'
                          : 'border-[var(--line-2)] hover:border-[var(--line-3)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      {reactionOption}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="std-kicker text-[var(--ink-2)]">Message</label>
                <span className="std-kicker text-[var(--ink-3)]">
                  {message.length}/500
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write an encouraging note..."
                rows={3}
                maxLength={500}
                className="grp-input w-full resize-none !rounded-[12px] !py-3"
                required
              />
              
              {/* Quick Messages - styled as pills */}
              <div className="mt-3 flex flex-wrap gap-2">
                {quickMessages.map((quickMsg, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleQuickMessage(quickMsg)}
                    className="px-2.5 py-1 rounded-full border border-[var(--line-2)] text-[11px] font-medium text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--line-3)] hover:bg-[var(--surface-2)] transition-all whitespace-nowrap"
                  >
                    {quickMsg}
                  </button>
                ))}
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="p-3 rounded-[10px] bg-[var(--rose)]/10 border border-[var(--rose)]/25">
                <p className="std-kicker !text-[11px] text-[var(--rose)]">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-[var(--line-2)] flex-shrink-0 bg-[var(--surface)]">
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="std-btn flex-1">
              Cancel
            </button>
            <button
              type="submit"
              form="encouragement-form"
              disabled={!message.trim() || isSubmitting}
              className="std-btn std-btn--signal flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <PaperPlaneIcon className="w-3.5 h-3.5" />
                  Send Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default EncouragementModal;
