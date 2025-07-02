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
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email,
        password: userData.password,
      }),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
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

  // Change password
  changePassword: async (passwordData) => {
    return apiRequest('/api/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
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
  // Get all user workspaces
  getWorkspaces: async () => {
    return apiRequest('/api/workspaces');
  },

  // Create new workspace
  createWorkspace: async (workspaceData) => {
    return apiRequest('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    });
  },

  // Get specific workspace
  getWorkspace: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}`);
  },

  // Update workspace
  updateWorkspace: async (workspaceId, workspaceData) => {
    return apiRequest(`/api/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(workspaceData),
    });
  },

  // Delete workspace
  deleteWorkspace: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  },

  // Get workspace overview
  getWorkspaceOverview: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/overview`);
  },

  // Get workspace activity
  getWorkspaceActivity: async (workspaceId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `/api/workspaces/${workspaceId}/activity?${queryString}` 
      : `/api/workspaces/${workspaceId}/activity`;
    
    return apiRequest(endpoint);
  },

  // Invite member to workspace
  inviteMember: async (workspaceId, inviteData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  },

  // Get workspace invitations
  getInvitations: async (workspaceId, status) => {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/workspaces/${workspaceId}/invitations${params}`);
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
  cancelInvitation: async (workspaceId, invitationId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  // Update member role
  updateMemberRole: async (workspaceId, userId, roleData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  },

  // Remove member from workspace
  removeMember: async (workspaceId, userId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  // Get workspace habits
  getWorkspaceHabits: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/habits`);
  },

  // Create workspace habit
  createWorkspaceHabit: async (workspaceId, habitData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/habits`, {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
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
    return apiRequest(`/api/workspaces/${groupId}/habits`);
  },

  // Create group habit
  createGroupHabit: async (groupId, habitData) => {
    return apiRequest(`/api/workspaces/${groupId}/habits`, {
      method: 'POST',
      body: JSON.stringify(habitData),
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
  getGroupTrackers: async (workspaceId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/group-trackers`);
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

  // Get challenges for a workspace
  getChallenges: async (workspaceId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/workspaces/${workspaceId}/challenges${queryString ? `?${queryString}` : ''}`);
  },

  // Create a new challenge
  createChallenge: async (workspaceId, challengeData) => {
    return apiRequest(`/api/workspaces/${workspaceId}/challenges`, {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
  },

  // Join a challenge
  joinChallenge: async (workspaceId, challengeId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/challenges/${challengeId}/join`, {
      method: 'POST',
    });
  },

  // Leave a challenge
  leaveChallenge: async (workspaceId, challengeId) => {
    return apiRequest(`/api/workspaces/${workspaceId}/challenges/${challengeId}/leave`, {
      method: 'DELETE',
    });
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
  getGithubLoginUrl: () => `${API_BASE_URL}/api/auth/github`,
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
