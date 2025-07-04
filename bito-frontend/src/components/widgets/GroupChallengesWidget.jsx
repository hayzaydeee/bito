import React from 'react';
import { 
  TargetIcon,
  CalendarIcon,
  StarIcon,
  CheckCircledIcon,
  PersonIcon
} from '@radix-ui/react-icons';

const GroupChallengesWidget = ({ 
  challenges,
  onCreateChallenge,
  className = "",
  ...props 
}) => {
  const getChallengeStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'upcoming': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
            Group Challenges
          </h3>
        </div>
        <button
          onClick={onCreateChallenge}
          className="px-3 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-medium text-sm transition-all duration-200"
        >
          Create
        </button>
      </div>

      {!challenges || challenges.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-3">
            <TargetIcon className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No challenges yet
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
            Create the first team challenge!
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {challenges.filter(challenge => challenge && challenge._id).slice(0, 4).map((challenge, index) => (
            <div
              key={challenge._id || `challenge-${index}`}
              className="p-4 rounded-xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif mb-1">
                    {challenge.title || 'Untitled Challenge'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getChallengeStatusColor(challenge.status)}`}>
                      {challenge.status || 'pending'}
                    </span>
                    {challenge.startDate && challenge.endDate && (
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] font-outfit">
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                      </div>
                    )}
                  </div>
                </div>
                
                {challenge.prize && (
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs font-medium text-[var(--color-text-primary)] font-outfit">
                      {challenge.prize}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {challenge.description && (
                <p className="text-xs text-[var(--color-text-secondary)] font-outfit mb-3 line-clamp-2">
                  {challenge.description}
                </p>
              )}

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit">
                    Progress
                  </span>
                  <span className="text-xs font-bold text-[var(--color-text-primary)] font-outfit">
                    {challenge.currentProgress || 0}/{challenge.targetValue || 100}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((challenge.currentProgress || 0) / (challenge.targetValue || 100)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <PersonIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit">
                    {challenge.participants?.length || 0} participants
                  </span>
                </div>
                
                {challenge.winner && (
                  <div className="flex items-center gap-1">
                    <CheckCircledIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 font-outfit">
                      {challenge.winner}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {challenges.length > 4 && (
            <div className="text-center pt-2">
              <button className="text-sm text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] font-outfit font-medium">
                View {challenges.length - 4} more challenges
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupChallengesWidget;
