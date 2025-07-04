import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groupsAPI } from '../../services/api';
import { 
  TargetIcon,
  CalendarIcon,
  PersonIcon,
  CheckCircledIcon,
  ClockIcon,
  StarIcon,
  PlusIcon,
  CrossCircledIcon
} from '@radix-ui/react-icons';

const GroupChallenges = ({ workspaceId }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock challenges data - in real implementation, this would come from API
  const mockChallenges = [
    {
      _id: '1',
      title: '7-Day Consistency Challenge',
      description: 'Complete all your adopted habits for 7 consecutive days',
      type: 'streak',
      target: 7,
      duration: 7, // days
      participants: [
        { userId: 'user1', name: 'Alice Johnson', progress: 5 },
        { userId: 'user2', name: 'Bob Smith', progress: 7 },
        { userId: user.userId, name: user.name, progress: 3 }
      ],
      status: 'active',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      prize: '🏆 Consistency Champion',
      createdBy: 'user1'
    },
    {
      _id: '2',
      title: 'Team 100 Entries',
      description: 'Together, let\'s log 100 habit entries this week',
      type: 'collective',
      target: 100,
      currentProgress: 67,
      duration: 7,
      participants: [
        { userId: 'user1', name: 'Alice Johnson', progress: 23 },
        { userId: 'user2', name: 'Bob Smith', progress: 19 },
        { userId: user.userId, name: user.name, progress: 15 },
        { userId: 'user3', name: 'Carol Davis', progress: 10 }
      ],
      status: 'active',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      prize: '🎉 Team Spirit Award',
      createdBy: 'user2'
    },
    {
      _id: '3',
      title: 'Perfect Week',
      description: 'Achieve 100% completion rate for the week',
      type: 'completion',
      target: 100,
      duration: 7,
      participants: [
        { userId: 'user1', name: 'Alice Johnson', progress: 86 },
        { userId: user.userId, name: user.name, progress: 71 }
      ],
      status: 'completed',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      prize: '⭐ Perfectionist Badge',
      winner: 'user1',
      createdBy: user.userId
    }
  ];

  useEffect(() => {
    // In real implementation, fetch from API
    fetchChallenges();
  }, [workspaceId]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      // Mock API call
      setTimeout(() => {
        setChallenges(mockChallenges);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getChallengeTypeInfo = (type) => {
    const typeMap = {
      streak: { label: 'Streak Challenge', icon: '🔥', color: 'orange' },
      collective: { label: 'Team Challenge', icon: '🤝', color: 'blue' },
      completion: { label: 'Completion Challenge', icon: '🎯', color: 'green' },
      milestone: { label: 'Milestone Challenge', icon: '🏔️', color: 'purple' }
    };
    return typeMap[type] || typeMap.streak;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'completed':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'upcoming':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const formatTimeRemaining = (endDate) => {
    const now = new Date();
    const diff = endDate - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getProgressPercentage = (challenge) => {
    if (challenge.type === 'collective') {
      return Math.min((challenge.currentProgress / challenge.target) * 100, 100);
    }
    
    // For individual challenges, calculate average progress
    const totalProgress = challenge.participants.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = totalProgress / challenge.participants.length;
    return Math.min((avgProgress / challenge.target) * 100, 100);
  };

  const joinChallenge = (challengeId) => {
    // Mock join functionality
    setChallenges(prev => 
      prev.map(challenge => 
        challenge._id === challengeId
          ? {
              ...challenge,
              participants: [
                ...challenge.participants,
                { userId: user.userId, name: user.name, progress: 0 }
              ]
            }
          : challenge
      )
    );
  };

  const isUserParticipant = (challenge) => {
    return challenge.participants.some(p => p.userId === user.userId);
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto"></div>
          <p className="text-[var(--color-text-secondary)] font-outfit mt-4">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
            Group Challenges
          </h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-medium text-sm transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Create Challenge
        </button>
      </div>

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
            <TargetIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No challenges yet
          </h3>
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Create the first challenge to motivate your team!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const typeInfo = getChallengeTypeInfo(challenge.type);
            const isParticipant = isUserParticipant(challenge);
            const progressPercentage = getProgressPercentage(challenge);
            
            return (
              <div
                key={challenge._id}
                className="p-5 rounded-xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
              >
                {/* Challenge Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
                        {challenge.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(challenge.status)}`}>
                        {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] font-outfit mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)] font-outfit">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {challenge.status === 'active' ? formatTimeRemaining(challenge.endDate) : 'Completed'}
                      </div>
                      <div className="flex items-center gap-1">
                        <PersonIcon className="w-3 h-3" />
                        {challenge.participants.length} participants
                      </div>
                    </div>
                  </div>
                  
                  {challenge.status === 'active' && !isParticipant && (
                    <button
                      onClick={() => joinChallenge(challenge._id)}
                      className="px-3 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg font-outfit font-medium text-sm transition-all"
                    >
                      Join
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                      Progress
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)] font-outfit">
                      {challenge.type === 'collective' 
                        ? `${challenge.currentProgress}/${challenge.target}`
                        : `${Math.round(progressPercentage)}%`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Participants */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-3">
                    Participants
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {challenge.participants.slice(0, 4).map((participant) => (
                      <div key={participant.userId} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface-elevated)]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white text-xs font-bold">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-[var(--color-text-primary)] font-outfit">
                            {participant.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-secondary)] font-outfit">
                          {challenge.type === 'collective' ? participant.progress : `${participant.progress}/${challenge.target}`}
                        </span>
                      </div>
                    ))}
                    {challenge.participants.length > 4 && (
                      <div className="text-xs text-[var(--color-text-tertiary)] font-outfit p-2">
                        +{challenge.participants.length - 4} more participants
                      </div>
                    )}
                  </div>
                </div>

                {/* Prize/Reward */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-primary)]/20">
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                      {challenge.prize}
                    </span>
                  </div>
                  {challenge.winner && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">Winner:</span>
                      <span className="text-sm font-medium text-[var(--color-brand-600)] font-outfit">
                        {challenge.participants.find(p => p.userId === challenge.winner)?.name || 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupChallenges;
