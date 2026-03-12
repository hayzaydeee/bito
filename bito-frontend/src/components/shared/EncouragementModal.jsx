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
        toUserId: targetUser._id,
        groupId,
        habitId,
        type,
        message: message.trim(),
        reaction
      };

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
      <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-primary)] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-dmSerif gradient-text">
                  Send Encouragement
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  To {targetUser.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[var(--color-surface-hover)] flex items-center justify-center transition-colors"
            >
              <CrossCircledIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Encouragement Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-3">
              Encouragement Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {encouragementTypes.map((typeOption) => (
                <button
                  key={typeOption.value}
                  type="button"
                  onClick={() => setType(typeOption.value)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    type === typeOption.value
                      ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 text-[var(--color-brand-600)]'
                      : 'border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 text-[var(--color-text-secondary)]'
                  }`}
                >
                  <div className="text-lg mb-1">{typeOption.icon}</div>
                  <div className="font-outfit">{typeOption.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reaction */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-3">
              Reaction
            </label>
            <div className="flex gap-2 flex-wrap">
              {reactionOptions.map((reactionOption) => (
                <button
                  key={reactionOption}
                  type="button"
                  onClick={() => setReaction(reactionOption)}
                  className={`w-10 h-10 rounded-lg border text-lg transition-all ${
                    reaction === reactionOption
                      ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10'
                      : 'border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40'
                  }`}
                >
                  {reactionOption}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Messages */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-3">
              Quick Messages
            </label>
            <div className="space-y-2">
              {quickMessages.map((quickMsg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickMessage(quickMsg)}
                  className="w-full text-left p-3 rounded-lg border border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 text-sm text-[var(--color-text-secondary)] font-outfit transition-all hover:bg-[var(--color-surface-hover)]"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-3">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your encouragement message..."
              rows={4}
              maxLength={500}
              className="w-full p-4 rounded-xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] font-outfit focus:border-[var(--color-brand-500)] focus:outline-none resize-none"
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                {message.length}/500 characters
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 font-outfit">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-[var(--color-border-primary)]/20 text-[var(--color-text-secondary)] font-outfit font-medium hover:bg-[var(--color-surface-hover)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white font-outfit font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <PaperPlaneIcon className="w-4 h-4" />
                  Send Encouragement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
};

export default EncouragementModal;
