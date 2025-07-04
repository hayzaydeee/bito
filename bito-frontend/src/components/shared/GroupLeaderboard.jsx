import React, { useState, useEffect } from 'react';
import { groupsAPI } from '../../services/api';
import { 
  StarIcon,
  TargetIcon,
  ActivityLogIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircledIcon,
  MixIcon
} from '@radix-ui/react-icons';

const GroupLeaderboard = ({ workspaceId }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('completion'); // completion, streaks, consistency

  useEffect(() => {
    fetchLeaderboardData();
  }, [workspaceId, activeTab]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      // Get group tracker data and calculate leaderboard metrics
      const response = await groupsAPI.getGroupTrackers(workspaceId);
      const trackerData = response.data || [];
      
      // Calculate different leaderboard metrics
      const processedData = trackerData.map(memberData => {
        const { member, habits, stats } = memberData;
        
        // Calculate additional metrics
        const completionRate = stats.completionRate || 0;
        const currentStreak = stats.currentStreak || 0;
        const totalEntries = stats.totalEntries || 0;
        const activeHabits = habits.length;
        
        // Consistency metric (entries per active habit)
        const consistencyScore = activeHabits > 0 ? (totalEntries / activeHabits) : 0;
        
        // Weekly completion rate (mock calculation - would need actual weekly data)
        const weeklyCompletionRate = Math.min(completionRate + Math.random() * 10 - 5, 100);
        
        return {
          member,
          metrics: {
            completionRate,
            currentStreak,
            totalEntries,
            activeHabits,
            consistencyScore,
            weeklyCompletionRate
          }
        };
      });

      // Sort based on active tab
      let sortedData = [...processedData];
      switch (activeTab) {
        case 'completion':
          sortedData.sort((a, b) => b.metrics.completionRate - a.metrics.completionRate);
          break;
        case 'streaks':
          sortedData.sort((a, b) => b.metrics.currentStreak - a.metrics.currentStreak);
          break;
        case 'consistency':
          sortedData.sort((a, b) => b.metrics.consistencyScore - a.metrics.consistencyScore);
          break;
        default:
          break;
      }

      setLeaderboardData(sortedData);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrophyIcon = (position) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return '🏅';
  };

  const getPositionColor = (position) => {
    if (position === 0) return 'text-yellow-600 dark:text-yellow-400';
    if (position === 1) return 'text-gray-600 dark:text-gray-400';
    if (position === 2) return 'text-orange-600 dark:text-orange-400';
    return 'text-[var(--color-text-secondary)]';
  };

  const getMetricValue = (member, metricType) => {
    switch (metricType) {
      case 'completion':
        return `${Math.round(member.metrics.completionRate)}%`;
      case 'streaks':
        return `${member.metrics.currentStreak} days`;
      case 'consistency':
        return `${member.metrics.consistencyScore.toFixed(1)}`;
      default:
        return '-';
    }
  };

  const getMetricLabel = (metricType) => {
    switch (metricType) {
      case 'completion':
        return 'Completion Rate';
      case 'streaks':
        return 'Current Streak';
      case 'consistency':
        return 'Consistency Score';
      default:
        return '';
    }
  };

  const getTabIcon = (tabType) => {
    switch (tabType) {
      case 'completion':
        return CheckCircledIcon;
      case 'streaks':
        return ActivityLogIcon;
      case 'consistency':
        return TargetIcon;
      default:
        return StarIcon;
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto"></div>
          <p className="text-[var(--color-text-secondary)] font-outfit mt-4">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-8">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            Error Loading Leaderboard
          </h3>
          <p className="text-[var(--color-text-secondary)] font-outfit mb-4">{error}</p>
          <button
            onClick={fetchLeaderboardData}
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <StarIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
          Team Leaderboard
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-[var(--color-surface-primary)] rounded-xl">
        {[
          { key: 'completion', label: 'Completion' },
          { key: 'streaks', label: 'Streaks' },
          { key: 'consistency', label: 'Consistency' }
        ].map((tab) => {
          const TabIcon = getTabIcon(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-outfit font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-[var(--color-brand-500)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard */}
      {leaderboardData.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No leaderboard data yet
          </h3>
          <p className="text-[var(--color-text-secondary)] font-outfit">
            Members need to track habits to appear on the leaderboard
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboardData.map((memberData, index) => {
            const { member, metrics } = memberData;
            const position = index;
            
            return (
              <div
                key={member._id}
                className={`p-4 rounded-xl border transition-all ${
                  position < 3
                    ? 'border-[var(--color-brand-500)]/40 bg-[var(--color-brand-500)]/5'
                    : 'border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Position and Member Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${getPositionColor(position)}`}>
                        {getTrophyIcon(position)}
                      </div>
                      <div className={`text-lg font-bold font-dmSerif ${getPositionColor(position)}`}>
                        #{position + 1}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold font-dmSerif text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
                          {member.name}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                          {metrics.activeHabits} active habits
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Primary Metric */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                      {getMetricValue(memberData, activeTab)}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                      {getMetricLabel(activeTab)}
                    </p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)] font-dmSerif">
                        {Math.round(metrics.completionRate)}%
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                        Completion
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)] font-dmSerif">
                        {metrics.currentStreak}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                        Streak
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)] font-dmSerif">
                        {metrics.totalEntries}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                        Entries
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border-primary)]/20">
        <p className="text-xs text-[var(--color-text-tertiary)] font-outfit text-center">
          Leaderboard updates in real-time based on member activity
        </p>
      </div>
    </div>
  );
};

export default GroupLeaderboard;
