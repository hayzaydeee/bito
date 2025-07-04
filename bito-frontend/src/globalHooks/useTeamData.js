// Custom hooks for team-level data
// Similar to useHabitData but for group statistics

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TeamStatsAdapter, LeaderboardAdapter } from '../services/teamStatsAdapter';
import { groupsAPI } from '../services/api';

// Hook for team statistics
export const useTeamStats = (groupId, dateRange = null, refreshInterval = 300000) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Create adapter instance
  const adapter = useMemo(() => new TeamStatsAdapter(groupId), [groupId]);

  const fetchStats = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const teamStats = await adapter.getTeamStats(dateRange);
      setStats(teamStats);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching team stats:', err);
      setError(err.message || 'Failed to fetch team statistics');
    } finally {
      setLoading(false);
    }
  }, [adapter, dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    adapter.clearCache();
    fetchStats();
  }, [adapter, fetchStats]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

// Hook for leaderboard data
export const useLeaderboard = (groupId, options = {}) => {
  const {
    dateRange = null,
    limit = 10,
    refreshInterval = 120000 // 2 minutes
  } = options;

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Create adapter instance
  const adapter = useMemo(() => new LeaderboardAdapter(groupId), [groupId]);

  const fetchLeaderboard = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await adapter.getLeaderboardData(dateRange, limit);
      setLeaderboard(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [adapter, dateRange, limit]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    
    const interval = setInterval(fetchLeaderboard, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    adapter.clearCache();
    fetchLeaderboard();
  }, [adapter, fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

// Hook for real-time group activity
export const useGroupActivity = (groupId, options = {}) => {
  const {
    limit = 20,
    types = null,
    refreshInterval = 60000 // 1 minute
  } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchActivity = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await groupsAPI.getGroupActivity(groupId, { limit, types });
      const activityData = response.activities || response.data || response || [];
      
      setActivities(activityData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching group activity:', err);
      setError(err.message || 'Failed to fetch group activity');
    } finally {
      setLoading(false);
    }
  }, [groupId, limit, types]);

  // Initial fetch
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    
    const interval = setInterval(fetchActivity, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchActivity, refreshInterval]);

  return {
    activities,
    loading,
    error,
    lastUpdated,
    refresh: fetchActivity
  };
};

// Combined hook for all team data
export const useTeamData = (groupId, options = {}) => {
  const {
    dateRange = null,
    leaderboardLimit = 10,
    activityLimit = 20,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const teamStats = useTeamStats(groupId, dateRange, refreshInterval);
  const leaderboard = useLeaderboard(groupId, { 
    dateRange, 
    limit: leaderboardLimit,
    refreshInterval: Math.min(refreshInterval, 120000) // Leaderboard refreshes faster
  });
  const activity = useGroupActivity(groupId, { 
    limit: activityLimit,
    refreshInterval: Math.min(refreshInterval, 60000) // Activity refreshes fastest
  });

  // Combined loading state
  const loading = teamStats.loading || leaderboard.loading || activity.loading;
  
  // Combined error state
  const error = teamStats.error || leaderboard.error || activity.error;
  
  // Manual refresh all data
  const refreshAll = useCallback(() => {
    teamStats.refresh();
    leaderboard.refresh();
    activity.refresh();
  }, [teamStats.refresh, leaderboard.refresh, activity.refresh]);

  return {
    teamStats: teamStats.stats,
    leaderboard: leaderboard.leaderboard,
    activities: activity.activities,
    loading,
    error,
    lastUpdated: {
      teamStats: teamStats.lastUpdated,
      leaderboard: leaderboard.lastUpdated,
      activity: activity.lastUpdated
    },
    refresh: refreshAll
  };
};

// Hook for calculating team trends
export const useTeamTrends = (groupId, timeframe = '7d') => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchTrends = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get activity data for trend calculation
        const response = await groupsAPI.getGroupActivity(groupId, { 
          limit: 100 // More data for better trend analysis
        });
        
        const activityData = response.activities || response.data || response || [];
        
        if (!mounted) return;

        // Calculate trends based on timeframe
        const calculatedTrends = calculateTrendsFromActivity(activityData, timeframe);
        setTrends(calculatedTrends);
        
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching team trends:', err);
        setError(err.message || 'Failed to fetch team trends');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTrends();

    return () => {
      mounted = false;
    };
  }, [groupId, timeframe]);

  return { trends, loading, error };
};

// Helper function to calculate trends from activity data
function calculateTrendsFromActivity(activities, timeframe) {
  const now = new Date();
  const timeframes = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const timeframeMs = timeframes[timeframe] || timeframes['7d'];
  const cutoffDate = new Date(now.getTime() - timeframeMs);
  
  // Filter activities within timeframe
  const recentActivities = activities.filter(activity => 
    new Date(activity.createdAt) > cutoffDate
  );
  
  // Calculate various metrics
  const completions = recentActivities.filter(a => a.type === 'habit_completed');
  const streakMilestones = recentActivities.filter(a => a.type === 'streak_milestone');
  const newAdoptions = recentActivities.filter(a => a.type === 'habit_adopted');
  
  // Group by day for trend analysis
  const dailyStats = {};
  recentActivities.forEach(activity => {
    const day = new Date(activity.createdAt).toDateString();
    if (!dailyStats[day]) {
      dailyStats[day] = { completions: 0, activity: 0, streaks: 0 };
    }
    dailyStats[day].activity++;
    if (activity.type === 'habit_completed') dailyStats[day].completions++;
    if (activity.type === 'streak_milestone') dailyStats[day].streaks++;
  });
  
  const days = Object.keys(dailyStats).sort();
  const avgCompletionsPerDay = days.length > 0 
    ? days.reduce((sum, day) => sum + dailyStats[day].completions, 0) / days.length 
    : 0;
  
  return {
    totalCompletions: completions.length,
    totalStreakMilestones: streakMilestones.length,
    totalNewAdoptions: newAdoptions.length,
    avgCompletionsPerDay: Math.round(avgCompletionsPerDay * 10) / 10,
    activeDays: days.length,
    dailyBreakdown: dailyStats,
    timeframe,
    calculatedAt: new Date().toISOString()
  };
}
