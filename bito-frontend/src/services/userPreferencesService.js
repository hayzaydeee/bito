/**
 * User Preferences Service
 * Manages user preferences including week start day, with local storage caching and backend sync
 */

const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences'
};

// Default preferences
const DEFAULT_PREFERENCES = {
  weekStartsOn: 1, // Monday (0=Sunday, 1=Monday, etc.)
  timezone: 'UTC',
  theme: 'auto',
  emailNotifications: true
};

class UserPreferencesService {
  constructor() {
    this.preferences = null;
    this.listeners = new Set();
  }

  /**
   * Initialize preferences from localStorage or defaults
   */
  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } else {
        this.preferences = { ...DEFAULT_PREFERENCES };
      }
    } catch (error) {
      console.warn('Failed to load user preferences from localStorage:', error);
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Get a specific preference value
   */
  get(key) {
    if (!this.preferences) {
      this.init();
    }
    return this.preferences[key] ?? DEFAULT_PREFERENCES[key];
  }

  /**
   * Get all preferences
   */
  getAll() {
    if (!this.preferences) {
      this.init();
    }
    return { ...this.preferences };
  }

  /**
   * Set a preference value
   */
  set(key, value) {
    console.log('userPreferencesService.set called:', key, value);
    if (!this.preferences) {
      this.init();
    }
    
    this.preferences[key] = value;
    this.saveToStorage();
    console.log('userPreferencesService - notifying listeners for:', key, value);
    this.notifyListeners(key, value);
  }

  /**
   * Update multiple preferences at once
   */
  update(updates) {
    if (!this.preferences) {
      this.init();
    }
    
    Object.assign(this.preferences, updates);
    this.saveToStorage();
    
    // Notify listeners for each updated key
    Object.entries(updates).forEach(([key, value]) => {
      this.notifyListeners(key, value);
    });
  }

  /**
   * Get week start day (0=Sunday, 1=Monday, etc.)
   */
  getWeekStartDay() {
    return this.get('weekStartsOn');
  }

  /**
   * Set week start day
   */
  setWeekStartDay(day) {
    if (day < 0 || day > 6) {
      throw new Error('Week start day must be between 0 (Sunday) and 6 (Saturday)');
    }
    this.set('weekStartsOn', day);
  }

  /**
   * Sync preferences with backend user profile
   */
  syncWithBackend(userProfileData) {
    if (userProfileData?.preferences) {
      const backendPrefs = {
        weekStartsOn: userProfileData.preferences.weekStartsOn ?? DEFAULT_PREFERENCES.weekStartsOn,
        timezone: userProfileData.preferences.timezone ?? DEFAULT_PREFERENCES.timezone,
        theme: userProfileData.preferences.theme ?? DEFAULT_PREFERENCES.theme,
        emailNotifications: userProfileData.preferences.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications
      };
      
      this.update(backendPrefs);
    }
  }

  /**
   * Save preferences to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save user preferences to localStorage:', error);
    }
  }

  /**
   * Add a listener for preference changes
   */
  addListener(callback) {
    console.log('userPreferencesService - adding listener, total listeners:', this.listeners.length + 1);
    this.listeners.push(callback);
    return () => {
      console.log('userPreferencesService - removing listener');
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of a preference change
   */
  notifyListeners(key, value) {
    console.log('userPreferencesService - notifying', this.listeners.length, 'listeners for:', key, value);
    this.listeners.forEach((callback, index) => {
      try {
        console.log('userPreferencesService - calling listener', index);
        callback(key, value, this.preferences);
      } catch (error) {
        console.error('Error in preference change listener:', error);
      }
    });
  }

  /**
   * Reset preferences to defaults
   */
  reset() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.saveToStorage();
    this.notifyListeners('reset', null);
  }
}

// Create singleton instance
const userPreferencesService = new UserPreferencesService();

export default userPreferencesService;
export { STORAGE_KEYS, DEFAULT_PREFERENCES };
