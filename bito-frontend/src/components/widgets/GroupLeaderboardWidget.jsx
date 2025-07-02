import React from 'react';
import { 
  StarIcon,
  PersonIcon,
  BarChartIcon
} from '@radix-ui/react-icons';

const GroupLeaderboardWidget = ({ 
  leaderboardData,
  className = "",
  ...props 
}) => {
  const getTrophyIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}`;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
            <StarIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
            Leaderboard
          </h3>
        </div>
        
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-3">
            <StarIcon className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No rankings available
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
            Complete more habits to generate rankings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
          <StarIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
          Leaderboard
        </h3>
      </div>

      <div className="space-y-3">
        {leaderboardData.filter(member => member && (member.memberId || member.id)).slice(0, 5).map((member, index) => {
          const position = index + 1;
          const isTopThree = position <= 3;
          
          return (
            <div
              key={member.memberId || member.id || `member-${index}`}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isTopThree 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800' 
                  : 'bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/20'
              }`}
            >
              {/* Position */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                isTopThree 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' 
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              }`}>
                {typeof getTrophyIcon(position) === 'string' && getTrophyIcon(position).includes('�') 
                  ? getTrophyIcon(position) 
                  : position
                }
              </div>

              {/* Member Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold font-dmSerif text-xs">
                    {(member.memberName || member.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] font-dmSerif">
                    {member.memberName || member.name || 'Unknown User'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] font-outfit">
                  <span>{member.completionRate}% completion</span>
                  <span>{member.currentStreak} day streak</span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className={`text-lg font-bold font-dmSerif ${getScoreColor(member.score)}`}>
                  {member.score}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                  score
                </p>
              </div>
            </div>
          );
        })}
        
        {leaderboardData.length > 5 && (
          <div className="text-center pt-2">
            <button className="text-sm text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] font-outfit font-medium">
              View full leaderboard ({leaderboardData.length} members)
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border-primary)]/20">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit mb-1">
              Top Score
            </p>
            <p className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif">
              {leaderboardData[0]?.score || 0}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit mb-1">
              Avg Score
            </p>
            <p className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif">
              {Math.round(leaderboardData.reduce((sum, m) => sum + m.score, 0) / leaderboardData.length) || 0}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit mb-1">
              Members
            </p>
            <p className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif">
              {leaderboardData.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupLeaderboardWidget;
