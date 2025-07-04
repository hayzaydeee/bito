// Team Stats Data Adapter
// Similar to member dashboard adapter pattern but for gr    }

    // Ca    // Calculate real completion rate
    const completionRate = this.calculateCompletionRate(trackerData, leaderboardData);
    
    // Count active members (members with recent activity or completions)
    const activeMembers = this.countActiveMembers(leaderboardData, trackerData, activityData);
    
    // Calculate total streaks across all members
    const totalStreaks = this.calculateTotalStreaks(leaderboardData, trackerData);
    
    // Calculate team performance score
    const teamScore = this.calculateTeamScore(leaderboardData, trackerData, activityData);atisticsics

import { groupsAPI } from './api';

export class TeamStatsAdapter {
  constructor(groupId) {
    this.groupId = groupId;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get comprehensive team statistics
  async getTeamStats(dateRange = null) {
    const cacheKey = `teamStats_${this.groupId}_${JSON.stringify(dateRange)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Fetch data from multiple endpoints in parallel
      const [overview, leaderboard, groupTrackers, activity] = await Promise.all([
        groupsAPI.getGroupOverview(this.groupId).catch(err => {
          console.error('TeamStatsAdapter: Error fetching overview:', err);
          return { success: false, error: err.message };
        }),
        groupsAPI.getLeaderboard(this.groupId, dateRange).catch(err => {
          console.error('TeamStatsAdapter: Error fetching leaderboard:', err);
          return { success: false, error: err.message };
        }),
        groupsAPI.getGroupTrackers(this.groupId, dateRange).catch(err => {
          console.error('TeamStatsAdapter: Error fetching group trackers:', err);
          return { success: false, error: err.message };
        }),
        groupsAPI.getGroupActivity(this.groupId, { limit: 50 }).catch(err => {
          console.error('TeamStatsAdapter: Error fetching activity:', err);
          return { success: false, error: err.message };
        })
      ]);

      // Process and aggregate the data
      const stats = this.processTeamStatistics({
        overview: overview.data || overview,
        leaderboard: leaderboard.data || leaderboard,
        groupTrackers: groupTrackers.data || groupTrackers,
        activity: activity.data || activity
      }, dateRange);

      // Cache the result
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;
    } catch (error) {
      console.error('TeamStatsAdapter: Error fetching team stats:', error);
      return this.getDefaultStats();
    }
  }

  // Process raw data into usable team statistics
  processTeamStatistics({ overview, leaderboard, groupTrackers, activity }, dateRange = null) {
    // Extract data from actual API response structures
    const leaderboardData = leaderboard?.leaderboard || [];
    const trackerData = groupTrackers?.trackers || [];
    let activityData = activity?.activities || activity?.activity || activity || [];
    const overviewData = overview?.overview || overview || {};

    // Filter activity data by date range if provided
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      activityData = activityData.filter(activity => {
        if (!activity.createdAt) return false;
        const activityDate = new Date(activity.createdAt);
        return activityDate >= startDate && activityDate <= endDate;
      });
      
    }

    // Calculate real completion rate
    const completionRate = this.calculateCompletionRate(trackerData, leaderboardData);

    
    // Count active members (members with recent activity or completions)
    const activeMembers = this.countActiveMembers(leaderboardData, trackerData, activityData);
    
    // Calculate team performance score
    const teamScore = this.calculateTeamScore(leaderboardData, trackerData, activityData);

    const result = {
      completionRate: Math.round(completionRate),
      activeMembers,
      totalStreaks,
      teamScore,
      trends: this.calculateTrends(activityData),
      lastUpdated: new Date().toISOString()
    };

    return result;
  }

  calculateCompletionRate(trackerData, leaderboardData) {
    if (leaderboardData.length === 0 && trackerData.length === 0) return 0;
    
    // Use leaderboard data if available (more accurate)
    if (leaderboardData.length > 0) {
      const rates = leaderboardData.map(member => member.completionRate || 0);
      
      const totalCompletionRate = leaderboardData.reduce((sum, member) => {
        return sum + (member.completionRate || 0);
      }, 0);
      const avgRate = totalCompletionRate / leaderboardData.length;
      return avgRate;
    }
    
    // Fall back to tracker data - use the stats.completionRate
    if (trackerData.length > 0) {
      const rates = trackerData.map(tracker => tracker.stats?.completionRate || 0);
      
      const totalCompletionRate = trackerData.reduce((sum, tracker) => {
        return sum + (tracker.stats?.completionRate || 0);
      }, 0);
      
      const avgRate = trackerData.length > 0 ? totalCompletionRate / trackerData.length : 0;
      return avgRate;
    }
    
    return 0;
  }

  countActiveMembers(leaderboardData, trackerData, activityData) {
    const activeUserIds = new Set();
    
    // Members with leaderboard entries
    leaderboardData.forEach(member => {
      if (member.totalHabits > 0 || member.completionRate > 0) {
        activeUserIds.add(member.userId || member.user?.id || member.user?._id);
      }
    });
    
    // Members with recent activity
    activityData.forEach(activity => {
      if (activity.userId || activity.user) {
        const userId = activity.userId?._id || activity.userId || activity.user?._id || activity.user;
        activeUserIds.add(userId);
      }
    });
    
    // Members with tracker data
    trackerData.forEach(tracker => {
      if (tracker.habits && tracker.habits.length > 0) {
        activeUserIds.add(tracker.member?._id || tracker.member?.id);
      }
    });
    
    return activeUserIds.size;
  }

  calculateTotalStreaks(leaderboardData, trackerData) {
    let totalStreaks = 0;
    
    // Sum from leaderboard data
    leaderboardData.forEach(member => {
      totalStreaks += member.currentStreak || 0;
    });
    
    // If no leaderboard data, use tracker data
    if (totalStreaks === 0 && trackerData.length > 0) {
      trackerData.forEach(tracker => {
        totalStreaks += tracker.stats?.activeStreaks || 0;
        // Also check individual habits if available
        if (tracker.habits) {
          tracker.habits.forEach(habit => {
            totalStreaks += habit.stats?.currentStreak || 0;
          });
        }
      });
    }
    
    return totalStreaks;
  }

  calculateTeamScore(leaderboardData, trackerData, activityData) {
    // Count total completions from various sources
    let totalCompletions = 0;
    
    // From leaderboard - using completedDays (most accurate)
    leaderboardData.forEach(member => {
      const completions = member.completedDays || 0;
      totalCompletions += completions;
    });

    
    // From tracker data if no leaderboard data
    if (totalCompletions === 0 && trackerData.length > 0) {
      trackerData.forEach(tracker => {
        if (tracker.habits) {
          tracker.habits.forEach(habit => {
            const habitCompletions = habit.stats?.completedDays || 0;
            totalCompletions += habitCompletions;
          });
        }
      });
    }
    
    // From recent activity (habit_completed events) as fallback
    if (totalCompletions === 0) {
      const recentCompletions = activityData.filter(activity => 
        activity.type === 'habit_completed'
      ).length;
      totalCompletions = recentCompletions;
    }
    

    return totalCompletions;
  }

  calculateTrends(activityData) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayActivity = activityData.filter(activity => 
      new Date(activity.createdAt) > oneDayAgo
    );
    
    const weekActivity = activityData.filter(activity => 
      new Date(activity.createdAt) > oneWeekAgo
    );
    
    return {
      dailyCompletions: todayActivity.filter(a => a.type === 'habit_completed').length,
      weeklyCompletions: weekActivity.filter(a => a.type === 'habit_completed').length,
      dailyActivity: todayActivity.length,
      weeklyActivity: weekActivity.length
    };
  }

  getDefaultStats() {
    return {
      completionRate: 0,
      activeMembers: 0,
      totalStreaks: 0,
      teamScore: 0,
      trends: {
        dailyCompletions: 0,
        weeklyCompletions: 0,
        dailyActivity: 0,
        weeklyActivity: 0
      },
      lastUpdated: new Date().toISOString()
    };
  }

  // Clear cache when needed
  clearCache() {
    console.log('TeamStatsAdapter: Clearing cache, had', this.cache.size, 'cached entries');
    this.cache.clear();
  }
}

// Leaderboard Data Adapter
export class LeaderboardAdapter {
  constructor(groupId) {
    this.groupId = groupId;
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  async getLeaderboardData(dateRange = null, limit = 10) {
    const cacheKey = `leaderboard_${this.groupId}_${JSON.stringify(dateRange)}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await groupsAPI.getLeaderboard(this.groupId, dateRange);
      
      const leaderboardData = response.leaderboard || response.data || response || [];
      
      const processedData = this.processLeaderboardData(leaderboardData, limit);
      
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });
      
      return processedData;
    } catch (error) {
      console.error('LeaderboardAdapter: Error fetching leaderboard:', error);
      return [];
    }
  }

  processLeaderboardData(rawData, limit) {
    const processed = rawData
      .slice(0, limit)
      .map((entry, index) => {
        const result = {
          userId: entry.userId || entry.user?.id,
          name: this.extractUserName(entry),
          completions: entry.completedDays || entry.totalCompletions || 0,
          score: entry.score || entry.completionRate || 0,
          completionRate: entry.completionRate || entry.score || 0,
          currentStreak: entry.currentStreak || 0,
          totalHabits: entry.totalHabits || 0,
          position: index + 1
        };
        
        return result;
      })
      .filter(entry => {
        const hasName = !!entry.name;
        return hasName;
      });
      
    return processed;
  }

  extractUserName(entry) {
    const user = entry.user || {};
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.name || user.email || null;
  }

  clearCache() {
    console.log('LeaderboardAdapter: Clearing cache, had', this.cache.size, 'cached entries');
    this.cache.clear();
  }
}
