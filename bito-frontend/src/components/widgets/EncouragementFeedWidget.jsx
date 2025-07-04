import React from 'react';
import { 
  HeartIcon,
  EnterIcon,
  PersonIcon,
  ClockIcon
} from '@radix-ui/react-icons';

const EncouragementFeedWidget = ({ 
  encouragements,
  onSendEncouragement,
  className = "",
  ...props 
}) => {
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

  return (
    <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
            <HeartIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
            Team Encouragements
          </h3>
        </div>
        <button
          onClick={onSendEncouragement}
          className="px-3 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-medium text-sm transition-all duration-200"
        >
          Send
        </button>
      </div>

      {!encouragements || encouragements.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-3">
            <HeartIcon className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No encouragements yet
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
            Be the first to encourage a team member!
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {encouragements.slice(0, 5).map((encouragement) => {
            const typeInfo = getEncouragementTypeInfo(encouragement.type);
            
            return (
              <div
                key={encouragement._id}
                className="p-3 rounded-xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)]"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold font-dmSerif text-xs">
                      {encouragement.fromUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-semibold text-[var(--color-text-primary)] font-outfit">
                          {encouragement.fromUser.name}
                        </span>
                        <span className="text-[var(--color-text-secondary)]">→</span>
                        <span className="font-semibold text-[var(--color-text-primary)] font-outfit">
                          {encouragement.toUser.name}
                        </span>
                        <span className="text-sm">{encouragement.reaction}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium bg-${typeInfo.color}-100 dark:bg-${typeInfo.color}-900/30 text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400`}>
                          {typeInfo.icon}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] font-outfit">
                          <ClockIcon className="w-3 h-3" />
                          {formatTimeAgo(encouragement.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm text-[var(--color-text-primary)] font-outfit leading-relaxed mb-2">
                  {encouragement.message}
                </p>

                {/* Response */}
                {encouragement.response?.message && (
                  <div className="p-2 rounded-lg bg-[var(--color-surface-hover)] border-l-2 border-[var(--color-brand-500)]">
                    <div className="flex items-center gap-1 mb-1">
                      <EnterIcon className="w-3 h-3 text-[var(--color-brand-500)]" />
                      <span className="text-xs font-medium text-[var(--color-text-primary)] font-outfit">
                        {encouragement.toUser.name} responded:
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                      {encouragement.response.message}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          
          {encouragements.length > 5 && (
            <div className="text-center pt-2">
              <button className="text-sm text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] font-outfit font-medium">
                View {encouragements.length - 5} more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EncouragementFeedWidget;
