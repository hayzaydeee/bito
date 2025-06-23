// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    return apiRequest('/auth/register', {
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
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Get current user
  getMe: async () => {
    return apiRequest('/auth/me');
  },

  // Logout user
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // Refresh token
  refreshToken: async () => {
    return apiRequest('/auth/refresh', {
      method: 'PUT',
    });
  },
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    return apiRequest('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // Get user statistics
  getStats: async () => {
    return apiRequest('/users/stats');
  },

  // Export user data
  exportData: async () => {
    return apiRequest('/users/export-data', {
      method: 'POST',
    });
  },

  // Delete account
  deleteAccount: async (confirmData) => {
    return apiRequest('/users/account', {
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
    const endpoint = queryString ? `/habits?${queryString}` : '/habits';
    
    return apiRequest(endpoint);
  },

  // Create new habit
  createHabit: async (habitData) => {
    return apiRequest('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  },

  // Get specific habit
  getHabit: async (habitId) => {
    return apiRequest(`/habits/${habitId}`);
  },

  // Update habit
  updateHabit: async (habitId, habitData) => {
    return apiRequest(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  },

  // Delete habit
  deleteHabit: async (habitId) => {
    return apiRequest(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  // Check/uncheck habit
  checkHabit: async (habitId, entryData) => {
    return apiRequest(`/habits/${habitId}/check`, {
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
      ? `/habits/${habitId}/entries?${queryString}` 
      : `/habits/${habitId}/entries`;
    
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
    const endpoint = queryString ? `/habits/stats?${queryString}` : '/habits/stats';
    
    return apiRequest(endpoint);
  },

  // Archive/unarchive habit
  archiveHabit: async (habitId, archived = true) => {
    return apiRequest(`/habits/${habitId}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ archived }),
    });
  },
};

// Test API
export const testAPI = {
  // Ping test
  ping: async () => {
    return apiRequest('/test/ping');
  },

  // Health check
  health: async () => {
    return fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(res => res.json());
  },
};

// OAuth URLs
export const oauthAPI = {
  getGoogleLoginUrl: () => `${API_BASE_URL}/auth/google`,
  getGithubLoginUrl: () => `${API_BASE_URL}/auth/github`,
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
