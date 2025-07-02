import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { encouragementAPI } from '../../services/api';
import { 
  HeartIcon,
  ChatBubbleIcon,
  ClockIcon,
  PersonIcon,
  CheckCircledIcon,
  EnterIcon
} from '@radix-ui/react-icons';

const EncouragementFeed = ({ workspaceId, limit = 20 }) => {
  const { user } = useAuth();
  const [encouragements, setEncouragements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchEncouragements();
  }, [workspaceId]);

  const fetchEncouragements = async () => {
    try {
      setLoading(true);
      const response = await encouragementAPI.getWorkspaceEncouragements(workspaceId, { limit });
      setEncouragements(response.data || []);
    } catch (err) {
      console.error('Error fetching encouragements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (encouragementId) => {
    try {
      await encouragementAPI.markAsRead(encouragementId);
      setEncouragements(prev => 
        prev.map(enc => 
          enc._id === encouragementId 
            ? { ...enc, isRead: true, readAt: new Date() }
            : enc
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSubmitResponse = async (encouragementId) => {
    if (!responseMessage.trim() || isSubmittingResponse) return;

    try {
      setIsSubmittingResponse(true);
      const response = await encouragementAPI.respondToEncouragement(encouragementId, responseMessage.trim());
      
      setEncouragements(prev => 
        prev.map(enc => 
          enc._id === encouragementId 
            ? { ...enc, response: response.data.response }
            : enc
        )
      );
      
      setRespondingTo(null);
      setResponseMessage('');
    } catch (err) {
      console.error('Error submitting response:', err);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const getEncouragementTypeInfo = (type) => {
    const typeMap = {
      general_support: { label: 'Support', color: 'blue', icon: '💪' },
      streak_celebration: { label: 'Streak', color: 'orange', icon: '🔥' },
      goal_achieved: { label: 'Goal', color: 'green', icon: '🎉' },
      comeback_support: { label: 'Comeback', color: 'purple', icon: '👊' },
      milestone_reached: { label: 'Milestone', color: 'yellow', icon: '⭐' },
      custom_message: { label: 'Message', color: 'gray', icon: '💬' }
    };
    return typeMap[type] || typeMap.general_support;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto"></div>
          <p className="text-[var(--color-text-secondary)] font-outfit mt-4">Loading encouragements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-8">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            Error Loading Encouragements
          </h3>
          <p className="text-[var(--color-text-secondary)] font-outfit mb-4">{error}</p>
          <button
            onClick={fetchEncouragements}
            className="px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-medium transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
          <HeartIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
          Team Encouragements
        </h2>
      </div>

      {encouragements.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
            <HeartIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No encouragements yet
          </h3>
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Be the first to send encouragement to a team member!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {encouragements.map((encouragement) => {
            const typeInfo = getEncouragementTypeInfo(encouragement.type);
            const isRecipient = encouragement.toUser._id === user.userId;
            const isSender = encouragement.fromUser._id === user.userId;
            
            return (
              <div
                key={encouragement._id}
                className={`p-4 rounded-xl border transition-all ${
                  isRecipient && !encouragement.isRead
                    ? 'border-[var(--color-brand-500)]/40 bg-[var(--color-brand-500)]/5'
                    : 'border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold font-dmSerif">
                      {encouragement.fromUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--color-text-primary)] font-outfit">
                          {encouragement.fromUser.name}
                        </span>
                        <span className="text-[var(--color-text-secondary)] font-outfit">→</span>
                        <span className="font-semibold text-[var(--color-text-primary)] font-outfit">
                          {encouragement.toUser.name}
                        </span>
                        <span className="text-lg">{encouragement.reaction}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-${typeInfo.color}-100 dark:bg-${typeInfo.color}-900/30 text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400`}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] font-outfit">
                          <ClockIcon className="w-3 h-3" />
                          {formatTimeAgo(encouragement.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mark as read button for recipients */}
                  {isRecipient && !encouragement.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(encouragement._id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-brand-500)] text-white text-xs font-medium font-outfit hover:bg-[var(--color-brand-600)] transition-all"
                    >
                      <CheckCircledIcon className="w-3 h-3" />
                      Mark Read
                    </button>
                  )}
                </div>

                {/* Message */}
                <div className="mb-3">
                  <p className="text-[var(--color-text-primary)] font-outfit leading-relaxed">
                    {encouragement.message}
                  </p>
                  {encouragement.habit && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                        About habit:
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-secondary)] px-2 py-1 rounded-lg bg-[var(--color-surface-hover)] font-outfit">
                        {encouragement.habit.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Response Section */}
                {encouragement.response?.message && (
                  <div className="mt-3 p-3 rounded-lg bg-[var(--color-surface-hover)] border-l-4 border-[var(--color-brand-500)]">
                    <div className="flex items-center gap-2 mb-2">
                      <EnterIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                        {encouragement.toUser.name} responded:
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                      {encouragement.response.message}
                    </p>
                  </div>
                )}

                {/* Response Input */}
                {isRecipient && !encouragement.response?.message && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]/20">
                    {respondingTo === encouragement._id ? (
                      <div className="space-y-3">
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Write your response..."
                          rows={2}
                          maxLength={300}
                          className="w-full p-3 rounded-lg border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] font-outfit focus:border-[var(--color-brand-500)] focus:outline-none resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                            {responseMessage.length}/300
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseMessage('');
                              }}
                              className="px-3 py-1 text-sm text-[var(--color-text-secondary)] font-outfit hover:text-[var(--color-text-primary)] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitResponse(encouragement._id)}
                              disabled={!responseMessage.trim() || isSubmittingResponse}
                              className="px-3 py-1 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white text-sm font-outfit font-medium transition-all disabled:opacity-50"
                            >
                              {isSubmittingResponse ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                'Reply'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(encouragement._id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-primary)]/20 text-[var(--color-text-secondary)] font-outfit text-sm hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-500)] transition-all"
                      >
                        <EnterIcon className="w-4 h-4" />
                        Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EncouragementFeed;
