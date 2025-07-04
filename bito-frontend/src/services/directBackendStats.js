// Enhanced backend integration strategy
// This approach modifies the existing API calls to request more specific computed metrics

export class DirectBackendStatsProvider {
  constructor(groupId) {
    this.groupId = groupId;
  }

  // Get enhanced team stats with computed metrics
  async getEnhancedTeamStats(dateRange = null) {
    try {
      // Use existing overview endpoint but with enhanced parameters
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      params.append('includeComputedStats', 'true');
      params.append('includeActiveMembers', 'true');
      params.append('includeTrends', 'true');
      
      const response = await fetch(`/api/workspaces/${this.groupId}/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch team stats');
      
      const data = await response.json();
      return this.processEnhancedStats(data);
      
    } catch (error) {
      console.error('Error fetching enhanced team stats:', error);
      return this.getDefaultStats();
    }
  }

  // Get leaderboard with enhanced member data
  async getEnhancedLeaderboard(dateRange = null, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      params.append('limit', limit.toString());
      params.append('includeUserDetails', 'true');
      params.append('includeHabitBreakdown', 'true');
      
      const response = await fetch(`/api/workspaces/${this.groupId}/leaderboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      
      const data = await response.json();
      return this.processEnhancedLeaderboard(data);
      
    } catch (error) {
      console.error('Error fetching enhanced leaderboard:', error);
      return [];
    }
  }

  processEnhancedStats(data) {
    const overview = data.overview || data;
    const teamStats = overview.teamStats || overview.enhancedStats || {};
    
    return {
      // Primary metrics for Team Stats widget
      completionRate: teamStats.completionRate || this.calculateFallbackCompletionRate(overview),
      activeMembers: teamStats.activeMembers || this.calculateActiveMembers(overview),
      totalStreaks: teamStats.totalStreaks || this.calculateTotalStreaks(overview),
      teamScore: teamStats.teamScore || teamStats.totalCompletions || this.calculateTeamScore(overview),
      
      // Additional computed metrics
      trends: teamStats.trends || this.calculateTrends(overview),
      memberBreakdown: teamStats.memberBreakdown || {},
      periodComparison: teamStats.periodComparison || null,
      
      // Metadata
      lastUpdated: teamStats.lastUpdated || new Date().toISOString(),
      dateRange: teamStats.dateRange || null,
      memberCount: overview.workspace?.memberCount || 0
    };
  }

  processEnhancedLeaderboard(data) {
    const leaderboard = data.leaderboard || data || [];
    
    return leaderboard.map((entry, index) => ({
      userId: entry.userId || entry.user?.id,
      name: this.extractUserName(entry),
      position: index + 1,
      score: entry.score || 0,
      completionRate: entry.completionRate || 0,
      completions: entry.completedDays || entry.totalCompletions || 0,
      currentStreak: entry.currentStreak || 0,
      longestStreak: entry.longestStreak || 0,
      totalHabits: entry.totalHabits || 0,
      
      // Enhanced fields if backend provides them
      habitBreakdown: entry.habitBreakdown || null,
      recentActivity: entry.recentActivity || null,
      trendDirection: entry.trendDirection || 'stable'
    }));
  }

  // Fallback calculations if backend doesn't provide enhanced data
  calculateFallbackCompletionRate(overview) {
    const memberProgress = overview.memberProgress || [];
    if (memberProgress.length === 0) return 0;
    
    const totalRate = memberProgress.reduce((sum, member) => {
      return sum + (member.completionRate || 0);
    }, 0);
    
    return Math.round(totalRate / memberProgress.length);
  }

  calculateActiveMembers(overview) {
    const memberProgress = overview.memberProgress || [];
    const leaderboard = overview.leaderboard || [];
    const recentActivity = overview.recentActivity || [];
    
    const activeUserIds = new Set();
    
    // From member progress
    memberProgress.forEach(member => {
      if (member.totalCompletions > 0 || member.currentStreaks > 0) {
        activeUserIds.add(member.userId);
      }
    });
    
    // From leaderboard
    leaderboard.forEach(member => {
      if (member.totalHabits > 0) {
        activeUserIds.add(member.userId);
      }
    });
    
    // From recent activity
    recentActivity.forEach(activity => {
      const userId = activity.userId?._id || activity.userId;
      if (userId) activeUserIds.add(userId);
    });
    
    return activeUserIds.size;
  }

  calculateTotalStreaks(overview) {
    const memberProgress = overview.memberProgress || [];
    return memberProgress.reduce((sum, member) => {
      return sum + (member.currentStreaks || 0);
    }, 0);
  }

  calculateTeamScore(overview) {
    const memberProgress = overview.memberProgress || [];
    const recentActivity = overview.recentActivity || [];
    
    // From member progress
    const progressCompletions = memberProgress.reduce((sum, member) => {
      return sum + (member.totalCompletions || 0);
    }, 0);
    
    // From recent activity
    const activityCompletions = recentActivity.filter(activity => 
      activity.type === 'habit_completed'
    ).length;
    
    return Math.max(progressCompletions, activityCompletions);
  }

  calculateTrends(overview) {
    const recentActivity = overview.recentActivity || [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const todayActivity = recentActivity.filter(activity => 
      new Date(activity.createdAt) > oneDayAgo
    );
    
    return {
      dailyCompletions: todayActivity.filter(a => a.type === 'habit_completed').length,
      dailyActivity: todayActivity.length,
      recentTrend: this.calculateRecentTrend(recentActivity)
    };
  }

  calculateRecentTrend(activities) {
    if (activities.length < 2) return 'stable';
    
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    
    const recentCompletions = activities.filter(a => 
      a.type === 'habit_completed' && new Date(a.createdAt) > threeDaysAgo
    ).length;
    
    const previousCompletions = activities.filter(a => 
      a.type === 'habit_completed' && 
      new Date(a.createdAt) > sixDaysAgo && 
      new Date(a.createdAt) <= threeDaysAgo
    ).length;
    
    if (recentCompletions > previousCompletions) return 'up';
    if (recentCompletions < previousCompletions) return 'down';
    return 'stable';
  }

  extractUserName(entry) {
    const user = entry.user || {};
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.name || user.email || 'Unknown User';
  }

  getDefaultStats() {
    return {
      completionRate: 0,
      activeMembers: 0,
      totalStreaks: 0,
      teamScore: 0,
      trends: {
        dailyCompletions: 0,
        dailyActivity: 0,
        recentTrend: 'stable'
      },
      memberBreakdown: {},
      periodComparison: null,
      lastUpdated: new Date().toISOString(),
      dateRange: null,
      memberCount: 0
    };
  }
}

// Simple integration function for widgets
export const createDirectBackendProvider = (groupId) => {
  return new DirectBackendStatsProvider(groupId);
};

// Utility functions for widget integration
export const useDirectBackendStats = (groupId, dateRange = null) => {
  const [provider] = useState(() => createDirectBackendProvider(groupId));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [teamStats, leaderboard] = await Promise.all([
          provider.getEnhancedTeamStats(dateRange),
          provider.getEnhancedLeaderboard(dateRange, 10)
        ]);
        
        if (!mounted) return;
        
        setStats({ teamStats, leaderboard });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to fetch stats');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [provider, dateRange]);

  return { stats, loading, error };
};
