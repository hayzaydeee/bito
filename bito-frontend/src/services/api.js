// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: url,
        method: config.method,
        body: config.body
      });
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Request a magic link
  requestMagicLink: async (email) => {
    return apiRequest('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify a magic link token
  verifyMagicLink: async (token) => {
    return apiRequest('/api/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Get current user
  getMe: async () => {
    return apiRequest('/api/auth/me');
  },

  // Logout user
  logout: async () => {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  // Refresh token
  refreshToken: async () => {
    return apiRequest('/api/auth/refresh', {
      method: 'PUT',
    });
  },
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest('/api/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Complete profile setup (firstName, lastName, username)
  completeProfile: async (profileData) => {
    return apiRequest('/api/users/complete-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Check username availability
  checkUsername: async (username) => {
    return apiRequest(`/api/users/check-username/${encodeURIComponent(username)}`);
  },

  // Upload avatar image (multipart/form-data)
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/users/avatar/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  // Set avatar to a URL (e.g. DiceBear)
  setAvatar: async (avatarUrl) => {
    return apiRequest('/api/users/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatarUrl }),
    });
  },

  // Get user statistics
  getStats: async () => {
    return apiRequest('/api/users/stats');
  },

  // Export user data
  exportData: async () => {
    return apiRequest('/api/users/export-data', {
      method: 'POST',
    });
  },

  // Delete account
  deleteAccount: async (confirmData) => {
    return apiRequest('/api/users/account', {
      method: 'DELETE',
      body: JSON.stringify(confirmData),
    });
  },
};

// Habits API
export const habitsAPI = {
  // Get all habits
  getHabits: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/habits?${queryString}` : '/api/habits';
    
    return apiRequest(endpoint);
  },

  // Create new habit
  createHabit: async (habitData) => {
    return apiRequest('/api/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  },

  // Get specific habit
  getHabit: async (habitId) => {
    return apiRequest(`/api/habits/${habitId}`);
  },

  // Update habit
  updateHabit: async (habitId, habitData) => {
    return apiRequest(`/api/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  },

  // Delete habit
  deleteHabit: async (habitId) => {
    return apiRequest(`/api/habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  // Check/uncheck habit
  checkHabit: async (habitId, entryData) => {
    return apiRequest(`/api/habits/${habitId}/check`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  // Get habit entries
  getHabitEntries: async (habitId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `/api/habits/${habitId}/entries?${queryString}` 
      : `/api/habits/${habitId}/entries`;
    
    return apiRequest(endpoint);
  },

  // Get habit statistics
  getStats: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/habits/stats?${queryString}` : '/api/habits/stats';
    
    return apiRequest(endpoint);
  },

  // Archive/unarchive habit
  archiveHabit: async (habitId, archived = true) => {
    return apiRequest(`/api/habits/${habitId}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ archived }),
    });
  },
};

// Workspaces API
export const workspacesAPI = {
  // Get all workspaces for the current user
  getUserWorkspaces: async () => {
    return apiRequest('/api/workspaces');
  },
  
  // Get a specific workspace
  getWorkspace: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}`);
  },
  
  // Create a new workspace
  createWorkspace: async (workspaceData) => {
    return apiRequest('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    });
  },
  
  // Update a workspace
  updateWorkspace: async (workspaceId, workspaceData) => {
    return apiRequest(`/api/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(workspaceData),
    });
  },
  
  // Delete a workspace
  deleteWorkspace: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  },
  
  // Get workspace members
  getWorkspaceMembers: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members`);
  },
  
  // Leave a workspace (self-service member exit)
  leaveWorkspace: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/leave`, {
      method: 'POST',
    });
  },
  
  // Get workspace habits
  getWorkspaceHabits: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/habits`);
  },
};

// Groups API (mapped to workspace endpoints for now)
export const groupsAPI = {
  // Get all user groups
  getGroups: async () => {
    return apiRequest('/api/workspaces');
  },

  // Create new group
  createGroup: async (groupData) => {
    return apiRequest('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  // Get specific group
  getGroup: async (groupId) => {
    return apiRequest(`/api/workspaces/${groupId}`);
  },

  // Update group
  updateGroup: async (groupId, groupData) => {
    return apiRequest(`/api/workspaces/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  },

  // Delete group
  deleteGroup: async (groupId) => {
    return apiRequest(`/api/workspaces/${groupId}`, {
      method: 'DELETE',
    });
  },

  // Get group overview
  getGroupOverview: async (groupId) => {
    return apiRequest(`/api/workspaces/${groupId}/overview`);
  },

  // Get group habits
  getGroupHabits: async (groupId) => {
    try {
      // First try the specific workspace habits endpoint
      return apiRequest(`/api/workspaces/${groupId}/habits`);
    } catch (error) {
      console.error(`Error fetching habits via workspace endpoint for ${groupId}:`, error);
      
      // Fallback approach: Get all habits and filter by workspace
      try {
        const allHabitsResponse = await apiRequest('/api/habits?includeWorkspaceHabits=true');
        if (allHabitsResponse.success) {
          const workspaceHabits = allHabitsResponse.habits.filter(
            habit => habit.workspaceId === groupId
          );
          
          return {
            success: true,
            habits: workspaceHabits
          };
        }
        return { success: false, error: 'Failed to get habits' };
      } catch (secondError) {
        console.error(`Fallback also failed for ${groupId}:`, secondError);
        return { success: false, error: secondError.message };
      }
    }
  },

  // Get group activity
  getGroupActivity: async (groupId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `/api/workspaces/${groupId}/activity?${queryString}` 
      : `/api/workspaces/${groupId}/activity`;
    
    return apiRequest(endpoint);
  },

  // Invite member to group
  inviteMember: async (groupId, inviteData) => {
    return apiRequest(`/api/workspaces/${groupId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  },

  // Get group invitations
  getInvitations: async (groupId, status) => {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/workspaces/${groupId}/invitations${params}`);
  },

  // Get invitation details by token
  getInvitationByToken: async (token) => {
    return apiRequest(`/api/workspaces/invitations/${token}`);
  },

  // Accept invitation
  acceptInvitation: async (token) => {
    return apiRequest(`/api/workspaces/invitations/${token}/accept`, {
      method: 'POST',
    });
  },

  // Decline invitation
  declineInvitation: async (token) => {
    return apiRequest(`/api/workspaces/invitations/${token}/decline`, {
      method: 'POST',
    });
  },

  // Cancel invitation
  cancelInvitation: async (groupId, invitationId) => {
    return apiRequest(`/api/workspaces/${groupId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  // Update member role
  updateMemberRole: async (groupId, userId, roleData) => {
    return apiRequest(`/api/workspaces/${groupId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  },

  // Remove member from group
  removeMember: async (groupId, userId) => {
    return apiRequest(`/api/workspaces/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  // Get group habits
  getGroupHabits: async (groupId) => {
    try {
      // First try the specific workspace habits endpoint
      return apiRequest(`/api/workspaces/${groupId}/habits`);
    } catch (error) {
      console.error(`Error fetching habits via workspace endpoint for ${groupId}:`, error);
      
      // Fallback approach: Get all habits and filter by workspace
      try {
        const allHabitsResponse = await apiRequest('/api/habits?includeWorkspaceHabits=true');
        if (allHabitsResponse.success) {
          const workspaceHabits = allHabitsResponse.habits.filter(
            habit => habit.workspaceId === groupId
          );
          
          return {
            success: true,
            habits: workspaceHabits
          };
        }
        return { success: false, error: 'Failed to get habits' };
      } catch (secondError) {
        console.error(`Fallback also failed for ${groupId}:`, secondError);
        return { success: false, error: secondError.message };
      }
    }
  },

  // Create group habit
  createGroupHabit: async (groupId, habitData) => {
    return apiRequest(`/api/workspaces/${groupId}/habits`, {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  },

  // Update group habit
  updateGroupHabit: async (groupId, habitId, habitData) => {
    return apiRequest(`/api/workspaces/workspace-habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  },

  // Delete group habit
  deleteGroupHabit: async (groupId, habitId) => {
    return apiRequest(`/api/workspaces/workspace-habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  // Get member habits (user's adopted habits in workspace)
  getMemberHabits: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/member-habits`);
  },

  // Adopt workspace habit to personal dashboard
  adoptWorkspaceHabit: async (workspaceId, workspaceHabitId, settingsData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/habits/${workspaceHabitId}/adopt`, {
      method: 'POST',
      body: JSON.stringify(settingsData),
    });
  },

  // Update member habit settings
  updateMemberHabit: async (workspaceId, memberHabitId, updateData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/member-habits/${memberHabitId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Remove member habit
  removeMemberHabit: async (workspaceId, memberHabitId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/member-habits/${memberHabitId}`, {
      method: 'DELETE',
    });
  },

  // Dashboard sharing permissions
  getDashboardPermissions: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/dashboard-permissions`);
  },

  updateDashboardPermissions: async (workspaceId, permissionsData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/dashboard-permissions`, {
      method: 'PUT',
      body: JSON.stringify(permissionsData),
    });
  },

  // View member's dashboard (with permission)
  getMemberDashboard: async (workspaceId, memberId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members/${memberId}/dashboard`);
  },

  // Get shared habits (habits tracked by multiple members)
  getSharedHabits: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/shared-habits`);
  },

  // New Group Tracking API endpoints
  
  // Get group tracker data (all members' progress on shared habits)
  getGroupTrackers: async (workspaceId, dateRange) => {
    let endpoint = `/api/workspaces/${workspaceId}/group-trackers`;
    
    // Add date range parameters if provided
    if (dateRange) {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }
    
    // Get the data from the backend
    const response = await apiRequest(endpoint);
    
    // Process the data to extract completion information in a format suitable for charts
    if (response.success && response.trackers) {
      // Extract completion data from trackers - format matching the member dashboard entries
      const completionData = [];
      const entriesByHabit = {};
      
      // Process each tracker to extract completion information
      response.trackers.forEach(tracker => {
        
        if (tracker.entries && tracker.entries.length > 0) {
          // For completion data in chart-friendly format
          tracker.entries.forEach(entry => {
            if (entry.completed) {
              const completionEntry = {
                userId: tracker.userId,
                date: entry.date.split('T')[0], // Ensure date is in YYYY-MM-DD format
                habitId: tracker.habitId,
                habitName: tracker.habitName,
                completed: entry.completed,
                value: entry.value
              };
              
              completionData.push(completionEntry);
            }
          });
          
          // Also organize entries in the same format as member dashboards
          // This creates the same data structure used by member dashboard
          if (!entriesByHabit[tracker.habitId]) {
            entriesByHabit[tracker.habitId] = {};
          }
          
          tracker.entries.forEach(entry => {
            const dateKey = entry.date.split('T')[0];
            entriesByHabit[tracker.habitId][dateKey] = {
              ...entry,
              _id: entry._id || `${tracker.habitId}_${dateKey}`,
              habitId: tracker.habitId,
              date: dateKey
            };
          });
        }
      });
      
      // Add the processed completion data to the response
      response.completionData = completionData;
      response.entries = entriesByHabit; // Same format as member dashboard
    }
    
    return response;
  },

  // Get specific member's shared habit stats  
  getMemberStats: async (workspaceId, memberId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/member-stats/${memberId}`);
  },

  // Get overview stats for shared habits across workspace
  getSharedHabitsOverview: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/shared-habits-overview`);
  },

  // Get encouragements for a workspace (alias for encouragementAPI.getWorkspaceEncouragements)
  getEncouragements: async (workspaceId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/encouragements/workspace/${workspaceId}${queryString ? `?${queryString}` : ''}`);
  },

  // Get leaderboard data for a workspace
  getLeaderboard: async (workspaceId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/workspaces/${workspaceId}/leaderboard${queryString ? `?${queryString}` : ''}`);
  },



  // Member interaction endpoints
  
  // Send encouragement to a member about a specific habit
  sendEncouragement: async (workspaceId, memberId, habitId, data) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members/${memberId}/habits/${habitId}/encourage`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Celebrate a member's habit progress
  celebrateHabit: async (workspaceId, memberId, habitId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members/${memberId}/habits/${habitId}/celebrate`, {
      method: 'POST',
    });
  },

  // Report concern or send check-in about a member's habit
  reportConcern: async (workspaceId, memberId, habitId, data) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members/${memberId}/habits/${habitId}/check-in`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── Challenge API ──

  // List challenges for a workspace
  getChallenges: async (workspaceId, status = null) => {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/workspaces/${workspaceId}/challenges${params}`);
  },

  // Create a challenge
  createChallenge: async (workspaceId, challengeData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/challenges`, {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
  },

  // Get challenge details
  getChallenge: async (challengeId) => {
    return apiRequest(`/api/challenges/${challengeId}`);
  },

  // Update challenge (before start only)
  updateChallenge: async (challengeId, updateData) => {
    return apiRequest(`/api/challenges/${challengeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Cancel challenge
  cancelChallenge: async (challengeId) => {
    return apiRequest(`/api/challenges/${challengeId}`, {
      method: 'DELETE',
    });
  },

  // Join challenge
  joinChallenge: async (challengeId, linkedHabitIds = null) => {
    // Accept array (v2) or singular ID (v1 backward compat)
    const body = {};
    if (Array.isArray(linkedHabitIds) && linkedHabitIds.length) {
      body.linkedHabitIds = linkedHabitIds;
    } else if (linkedHabitIds && typeof linkedHabitIds === 'string') {
      body.linkedHabitId = linkedHabitIds;
    }
    return apiRequest(`/api/challenges/${challengeId}/join`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // AI-assisted habit suggestions for challenge join
  suggestHabitsForChallenge: async (challengeId) => {
    return apiRequest(`/api/challenges/${challengeId}/suggest-habits`, {
      method: 'POST',
    });
  },

  // Leave challenge
  leaveChallenge: async (challengeId) => {
    return apiRequest(`/api/challenges/${challengeId}/leave`, {
      method: 'POST',
    });
  },

  // Get challenge leaderboard
  getChallengeLeaderboard: async (challengeId) => {
    return apiRequest(`/api/challenges/${challengeId}/leaderboard`);
  },

  // ── Feed reactions ──

  // Add reaction to a feed event
  addReaction: async (eventId, type) => {
    return apiRequest(`/api/feed/${eventId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  // Remove reaction from a feed event
  removeReaction: async (eventId) => {
    return apiRequest(`/api/feed/${eventId}/reactions`, {
      method: 'DELETE',
    });
  },

  // ── Kudos ──

  // Send kudos to a workspace member
  sendKudos: async (workspaceId, targetUserId, message = null) => {
    return apiRequest(`/api/workspaces/${workspaceId}/kudos`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, message }),
    });
  },
};

// Encouragement API
export const encouragementAPI = {
  // Send encouragement
  sendEncouragement: async (encouragementData) => {
    return apiRequest('/api/encouragements', {
      method: 'POST',
      body: JSON.stringify(encouragementData),
    });
  },

  // Get received encouragements
  getReceivedEncouragements: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/encouragements/received${queryString ? `?${queryString}` : ''}`);
  },

  // Get sent encouragements
  getSentEncouragements: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/encouragements/sent${queryString ? `?${queryString}` : ''}`);
  },

  // Get workspace encouragements (activity feed)
  getWorkspaceEncouragements: async (workspaceId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/encouragements/workspace/${workspaceId}${queryString ? `?${queryString}` : ''}`);
  },

  // Mark encouragement as read
  markAsRead: async (encouragementId) => {
    return apiRequest(`/api/encouragements/${encouragementId}/read`, {
      method: 'PUT',
    });
  },

  // Respond to encouragement
  respondToEncouragement: async (encouragementId, responseMessage) => {
    return apiRequest(`/api/encouragements/${encouragementId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ message: responseMessage }),
    });
  },

  // Mark multiple encouragements as read
  markMultipleAsRead: async (encouragementIds) => {
    return apiRequest('/api/encouragements/mark-read', {
      method: 'PUT',
      body: JSON.stringify({ encouragementIds }),
    });
  },

  // Get encouragement statistics
  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/encouragements/stats${queryString ? `?${queryString}` : ''}`);
  },
};

// Test API
export const testAPI = {
  // Ping test
  ping: async () => {
    return apiRequest('/api/test/ping');
  },

  // Health check
  health: async () => {
    return fetch(`${API_BASE_URL}/health`).then(res => res.json());
  },
};

// OAuth URLs
export const oauthAPI = {
  getGoogleLoginUrl: () => `${API_BASE_URL}/api/auth/google`,
};

// Error handler
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('401')) {
    // Token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }
  
  if (error.message.includes('403')) {
    return 'Access denied. You do not have permission to perform this action.';
  }
  
  if (error.message.includes('404')) {
    return 'Resource not found.';
  }
  
  if (error.message.includes('429')) {
    return 'Too many requests. Please try again later.';
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

// Notifications API
export const notificationsAPI = {
  // Get notifications for user across all workspaces
  getNotifications: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `/api/users/notifications?${queryString}` 
      : `/api/users/notifications`;
    
    return apiRequest(endpoint);
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return apiRequest(`/api/users/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return apiRequest('/api/users/notifications/read-all', {
      method: 'PUT',
    });
  },

  // Get unread notification count
  getUnreadCount: async () => {
    return apiRequest('/api/users/notifications/unread-count');
  },
};

// Insights API (Phase 12 – AI Insights)
export const insightsAPI = {
  // Get AI-powered habit insights
  getInsights: async (forceRefresh = false) => {
    const endpoint = forceRefresh
      ? '/api/insights?refresh=true'
      : '/api/insights';
    return apiRequest(endpoint);
  },

  // Get comprehensive analytics report (sectioned)
  getAnalyticsReport: async (range = '30d', forceRefresh = false) => {
    const params = new URLSearchParams({ range });
    if (forceRefresh) params.append('refresh', 'true');
    return apiRequest(`/api/insights/analytics?${params.toString()}`);
  },

  // Dismiss a specific insight
  dismissInsight: async (insightType, habitId) => {
    return apiRequest('/api/insights/dismiss', {
      method: 'POST',
      body: JSON.stringify({ insightType, habitId }),
    });
  },
};

// ── Push Notifications API (Phase 16) ──────────────────────
export const pushAPI = {
  getVapidPublicKey: () => apiRequest('/api/notifications/vapid-public-key'),

  subscribe: (subscription, deviceLabel) =>
    apiRequest('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription, deviceLabel }),
    }),

  unsubscribe: (endpoint) =>
    apiRequest('/api/notifications/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),

  sendTest: () =>
    apiRequest('/api/notifications/test', { method: 'POST' }),

  getStatus: () => apiRequest('/api/notifications/status'),

  updatePreferences: (prefs) =>
    apiRequest('/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }),
};

// Verify habit counts for debug purposes
export const verifyHabitCounts = async () => {
  const groupsResponse = await apiRequest('/api/workspaces');
  if (!groupsResponse.success) return { success: false, error: 'Failed to fetch groups' };
  
  const results = [];
  
  for (const workspace of groupsResponse.workspaces) {
    try {
      // Get actual habits for this workspace
      const habitsResponse = await apiRequest(`/api/workspaces/${workspace._id}/habits`);
      
      results.push({
        workspaceId: workspace._id,
        workspaceName: workspace.name,
        reportedCount: workspace.habitCount || 0,
        actualCount: habitsResponse.success ? habitsResponse.habits.length : 'error',
        match: workspace.habitCount === (habitsResponse.success ? habitsResponse.habits.length : 0)
      });
    } catch (err) {
      results.push({
        workspaceId: workspace._id,
        workspaceName: workspace.name,
        reportedCount: workspace.habitCount || 0,
        actualCount: 'error',
        error: err.message
      });
    }
  }
  
  return { success: true, results };
};

// Default API client for general use
const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiRequest(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  patch: (endpoint, data) => apiRequest(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  put: (endpoint, data) => apiRequest(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  })
};

// ── Transformers API ──
export const transformersAPI = {
  // Generate a transformer from goal text
  generate: async (goalText) => {
    return apiRequest('/api/transformers/generate', {
      method: 'POST',
      body: JSON.stringify({ goalText }),
    });
  },

  // List user's transformers
  list: async (status = null) => {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/transformers${params}`);
  },

  // Get transformer details
  get: async (id) => {
    return apiRequest(`/api/transformers/${id}`);
  },

  // Update transformer (edit preview before applying)
  update: async (id, system) => {
    return apiRequest(`/api/transformers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ system }),
    });
  },

  // Apply transformer — creates real habits
  apply: async (id) => {
    return apiRequest(`/api/transformers/${id}/apply`, {
      method: 'POST',
    });
  },

  // Advance to next phase
  advancePhase: async (id) => {
    return apiRequest(`/api/transformers/${id}/advance-phase`, {
      method: 'POST',
    });
  },

  // Get progress data (per-phase completion)
  progress: async (id) => {
    return apiRequest(`/api/transformers/${id}/progress`);
  },

  // Send a refinement message — returns patches + assistant reply
  refine: async (id, message) => {
    return apiRequest(`/api/transformers/${id}/refine`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Archive (soft delete) a transformer
  archive: async (id) => {
    return apiRequest(`/api/transformers/${id}`, {
      method: 'DELETE',
    });
  },
};

export default api;
