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
      <div className="grp bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[var(--line-2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[var(--rose)]/15 flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-[var(--rose)]" />
              </div>
              <div>
                <h2 className="grp-display text-xl font-bold text-[var(--ink)]">
                  Send Encouragement
                </h2>
                <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mt-0.5">
                  To {targetUser.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[9px] hover:bg-[var(--surface-2)] flex items-center justify-center transition-colors text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              <CrossCircledIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Encouragement Type */}
          <div>
            <label className="grp-kicker block mb-3">Encouragement Type</label>
            <div className="grid grid-cols-2 gap-2">
              {encouragementTypes.map((typeOption) => (
                <button
                  key={typeOption.value}
                  type="button"
                  onClick={() => setType(typeOption.value)}
                  className={`p-3 rounded-[10px] border text-sm font-medium transition-all ${
                    type === typeOption.value
                      ? 'border-[var(--signal)]/45 bg-[var(--signal)]/10 text-[var(--signal)]'
                      : 'border-[var(--line-2)] hover:border-[var(--line-3)] text-[var(--ink-2)]'
                  }`}
                >
                  <div className="text-lg mb-1">{typeOption.icon}</div>
                  <div>{typeOption.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reaction */}
          <div>
            <label className="grp-kicker block mb-3">Reaction</label>
            <div className="flex gap-2 flex-wrap">
              {reactionOptions.map((reactionOption) => (
                <button
                  key={reactionOption}
                  type="button"
                  onClick={() => setReaction(reactionOption)}
                  className={`w-10 h-10 rounded-[9px] border text-lg transition-all ${
                    reaction === reactionOption
                      ? 'border-[var(--signal)]/45 bg-[var(--signal)]/10'
                      : 'border-[var(--line-2)] hover:border-[var(--line-3)]'
                  }`}
                >
                  {reactionOption}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Messages */}
          <div>
            <label className="grp-kicker block mb-3">Quick Messages</label>
            <div className="space-y-2">
              {quickMessages.map((quickMsg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickMessage(quickMsg)}
                  className="w-full text-left p-3 rounded-[10px] border border-[var(--line-2)] hover:border-[var(--line-3)] text-sm text-[var(--ink-2)] transition-all hover:bg-[var(--surface-2)]"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="grp-kicker block mb-3">Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your encouragement message..."
              rows={4}
              maxLength={500}
              className="w-full p-4 rounded-[11px] border border-[var(--line-2)] bg-[var(--bg-2)] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:border-[var(--signal)] focus:outline-none resize-none transition-colors"
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider">
                {message.length}/500 characters
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-[10px] bg-[var(--rose)]/10 border border-[var(--rose)]/25">
              <p className="grp-mono text-[11px] text-[var(--rose)]">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="grp-btn flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="grp-btn grp-btn--signal flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
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
