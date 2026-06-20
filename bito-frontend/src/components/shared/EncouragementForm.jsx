import React, { useState, useEffect } from 'react';
import { encouragementAPI } from '../../services/api';
import { PaperPlaneIcon } from '@radix-ui/react-icons';
import IconPicker from './IconPicker';

const EncouragementForm = ({ 
  targetUser, 
  groupId, 
  habitId = null, 
  onSuccess,
  onCancel
}) => {
  const [message, setMessage] = useState('');
  const [typeIcon, setTypeIcon] = useState('Fire'); // Replaces 'type' with an IconPicker
  const [reaction, setReaction] = useState('👏');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reactionOptions = ['👏', '🔥', '💪', '⭐', '🎉', '👊', '💯', '🚀'];

  const quickMessages = [
    "Keep up the great work! You're doing amazing! 💪",
    "Your consistency is inspiring! 🔥",
    "Proud of your progress! 🎉"
  ];

  useEffect(() => {
    setMessage('');
    setTypeIcon(habitId ? 'Target' : 'Fire');
    setReaction('👏');
    setError(null);
  }, [targetUser, habitId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const encouragementData = {
        toUserId: targetUser._id || targetUser.id,
        groupId,
        type: typeIcon, // using the icon name directly as the type/theme
        message: message.trim(),
        reaction
      };
      
      if (habitId) {
        encouragementData.habitId = habitId;
      }

      await encouragementAPI.sendEncouragement(encouragementData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error sending encouragement:', err);
      setError(err.message || 'Failed to send encouragement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--surface)]">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 journal-v2-content-scroll">
        <form id="encouragement-form" onSubmit={handleSubmit} className="space-y-6">
          
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

          {/* Type (Phosphor Icon Picker) */}
          <div>
            <IconPicker value={typeIcon} onChange={setTypeIcon} />
          </div>

          {/* Message Area */}
          <div className="flex flex-col flex-1">
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
              rows={4}
              maxLength={500}
              className="grp-input w-full resize-none !rounded-[12px] !py-3 flex-1 min-h-[100px]"
              required
            />
            
            {/* Quick Messages */}
            <div className="mt-3 flex flex-wrap gap-2">
              {quickMessages.map((quickMsg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMessage(quickMsg)}
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
          {onCancel && (
            <button type="button" onClick={onCancel} className="std-btn flex-1">
              Cancel
            </button>
          )}
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
  );
};

export default EncouragementForm;
