import React from 'react';
import { 
  PersonIcon,
  HeartIcon,
  DotsHorizontalIcon
} from '@radix-ui/react-icons';

const MemberProgressWidget = ({ 
  memberData,
  onMemberClick,
  onEncourageMember,
  className = "",
  ...props 
}) => {
  // Handle different data structures
  let displayMembers = [];
  if (Array.isArray(memberData)) {
    displayMembers = memberData;
  } else if (memberData && typeof memberData === 'object') {
    // If memberData is an object with a members array
    if (Array.isArray(memberData.members)) {
      displayMembers = memberData.members;
    } else if (Array.isArray(memberData.memberData)) {
      displayMembers = memberData.memberData;
    } else {
      // Convert object to array if it has member-like properties
      displayMembers = Object.values(memberData).filter(item => 
        item && typeof item === 'object' && (item.member || item.user || item._id)
      );
    }
  }

  if (!displayMembers || displayMembers.length === 0) {
    return (
      <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif mb-6">
          Member Progress
        </h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
            <PersonIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
          </div>
          <h4 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No member data available yet
          </h4>
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Members need to adopt shared habits to appear in group tracking
          </p>
        </div>
      </div>
    );
  }

  const getCompletionColor = (rate) => {
    if (rate >= 70) return 'text-green-600 dark:text-green-400';
    if (rate >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
          Member Progress
        </h3>
        <span className="text-sm text-[var(--color-text-secondary)] font-outfit">
          {displayMembers.length} members
        </span>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {displayMembers.slice(0, 6).map((member) => {
          const { member: memberInfo, stats } = member;
          
          return (
            <div 
              key={memberInfo._id}
              className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/20 rounded-xl p-4 hover:bg-[var(--color-surface-hover)] transition-all duration-200 group"
            >
              {/* Member Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold font-dmSerif text-sm">
                    {memberInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif">
                      {memberInfo.name}
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                      {member.habits.length} shared habits
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEncourageMember && onEncourageMember(memberInfo)}
                    className="w-8 h-8 rounded-lg bg-[var(--color-brand-500)]/10 hover:bg-[var(--color-brand-500)]/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="Send encouragement"
                  >
                    <HeartIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                  </button>
                  <button
                    onClick={() => onMemberClick && onMemberClick(memberInfo._id)}
                    className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-elevated)] flex items-center justify-center transition-all"
                  >
                    <DotsHorizontalIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit mb-1">
                    Completion
                  </p>
                  <p className={`text-sm font-bold font-dmSerif ${getCompletionColor(stats.completionRate)}`}>
                    {Math.round(stats.completionRate)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit mb-1">
                    Streak
                  </p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif">
                    {stats.currentStreak}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit mb-1">
                    Entries
                  </p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif">
                    {stats.totalEntries}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {memberData.length > 6 && (
          <div className="text-center pt-2">
            <button className="text-sm text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] font-outfit font-medium">
              View {memberData.length - 6} more members
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberProgressWidget;
