import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { habitsAPI, handleAPIError } from '../services/api';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  habits: [],
  entries: {},
  lastFetch: {}, // Track when entries were last fetched for each habit
  isLoading: true,
  error: null,
  stats: null,
};

// Action types
const actionTypes = {
  FETCH_HABITS_START: 'FETCH_HABITS_START',
  FETCH_HABITS_SUCCESS: 'FETCH_HABITS_SUCCESS',
  FETCH_HABITS_FAILURE: 'FETCH_HABITS_FAILURE',
  
  CREATE_HABIT_START: 'CREATE_HABIT_START',
  CREATE_HABIT_SUCCESS: 'CREATE_HABIT_SUCCESS',
  CREATE_HABIT_FAILURE: 'CREATE_HABIT_FAILURE',
  
  UPDATE_HABIT_SUCCESS: 'UPDATE_HABIT_SUCCESS',
  DELETE_HABIT_SUCCESS: 'DELETE_HABIT_SUCCESS',
  
  TOGGLE_HABIT_START: 'TOGGLE_HABIT_START',
  TOGGLE_HABIT_SUCCESS: 'TOGGLE_HABIT_SUCCESS',
  TOGGLE_HABIT_FAILURE: 'TOGGLE_HABIT_FAILURE',
  
  FETCH_ENTRIES_SUCCESS: 'FETCH_ENTRIES_SUCCESS',
  FETCH_STATS_SUCCESS: 'FETCH_STATS_SUCCESS',
  UPDATE_FETCH_CACHE: 'UPDATE_FETCH_CACHE',
  
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const habitReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.FETCH_HABITS_START:
    case actionTypes.CREATE_HABIT_START:
    case actionTypes.TOGGLE_HABIT_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case actionTypes.FETCH_HABITS_SUCCESS:
      return {
        ...state,
        habits: action.payload,
        isLoading: false,
        error: null,
      };

    case actionTypes.CREATE_HABIT_SUCCESS:
      return {
        ...state,
        habits: [...state.habits, action.payload],
        isLoading: false,
        error: null,
      };

    case actionTypes.UPDATE_HABIT_SUCCESS:
      return {
        ...state,
        habits: state.habits.map(habit =>
          habit._id === action.payload._id ? action.payload : habit
        ),
        error: null,
      };

    case actionTypes.DELETE_HABIT_SUCCESS:
      return {
        ...state,
        habits: state.habits.filter(habit => habit._id !== action.payload),
        error: null,
      };

    case actionTypes.TOGGLE_HABIT_SUCCESS:
      const { habitId, date, entry } = action.payload;
      
      return {
        ...state,
        entries: {
          ...state.entries,
          [habitId]: {
            ...state.entries[habitId],
            [date]: entry
          }
        }
      };

    case actionTypes.FETCH_ENTRIES_SUCCESS:
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.payload.habitId]: {
            ...state.entries[action.payload.habitId], // Preserve existing entries
            ...action.payload.entries, // Merge in new entries
          },
        },
        lastFetch: {
          ...state.lastFetch,
          [action.payload.habitId]: Date.now(),
        },
      };

    case actionTypes.FETCH_STATS_SUCCESS:
      return {
        ...state,
        stats: action.payload,
      };

    case actionTypes.UPDATE_FETCH_CACHE:
      return {
        ...state,
        lastFetch: {
          ...state.lastFetch,
          [action.payload.cacheKey]: action.payload.timestamp,
        },
      };

    case actionTypes.FETCH_HABITS_FAILURE:
    case actionTypes.CREATE_HABIT_FAILURE:
    case actionTypes.TOGGLE_HABIT_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const HabitContext = createContext(null);

// Habit provider component
export const HabitProvider = ({ children }) => {
  const [state, dispatch] = useReducer(habitReducer, initialState);
  
  // Safely get auth context - handle case where it might not be available yet
  let isAuthenticated = false;
  let authLoading = true;
  
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    authLoading = auth.isLoading;
  } catch (error) {
    // AuthContext not available yet, use defaults
    console.warn('AuthContext not available in HabitProvider:', error.message);
  }

  // Fetch all habits on mount, but only if authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchHabits();
    } else if (!isAuthenticated && !authLoading) {
      // Clear habits if user is not authenticated
      dispatch({ type: actionTypes.FETCH_HABITS_SUCCESS, payload: [] });
    }
  }, [isAuthenticated, authLoading]);

  // Fetch habits function
  const fetchHabits = async () => {
    dispatch({ type: actionTypes.FETCH_HABITS_START });

    try {
      const response = await habitsAPI.getHabits();
      dispatch({
        type: actionTypes.FETCH_HABITS_SUCCESS,
        payload: response.data.habits,
      });
    } catch (error) {
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.FETCH_HABITS_FAILURE,
        payload: errorMessage,
      });
    }
  };

  // Create habit function
  const createHabit = async (habitData) => {
    dispatch({ type: actionTypes.CREATE_HABIT_START });

    try {
      const response = await habitsAPI.createHabit(habitData);
      dispatch({
        type: actionTypes.CREATE_HABIT_SUCCESS,
        payload: response.data.habit,
      });
      return { success: true, habit: response.data.habit };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.CREATE_HABIT_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Update habit function
  const updateHabit = async (habitId, habitData) => {
    try {
      const response = await habitsAPI.updateHabit(habitId, habitData);
      dispatch({
        type: actionTypes.UPDATE_HABIT_SUCCESS,
        payload: response.data.habit,
      });
      return { success: true, habit: response.data.habit };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  };

  // Delete habit function
  const deleteHabit = async (habitId) => {
    try {
      await habitsAPI.deleteHabit(habitId);
      dispatch({
        type: actionTypes.DELETE_HABIT_SUCCESS,
        payload: habitId,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  };

  // Toggle habit completion function
  const toggleHabitCompletion = async (habitId, date, value = null) => {
    try {
      const dateKey = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      // Get current completion status
      const currentEntries = state.entries[habitId] || {};
      const currentEntry = currentEntries[dateKey];
      const isCurrentlyCompleted = currentEntry?.completed || false;

      // Call API to toggle
      const response = await habitsAPI.checkHabit(habitId, {
        date: dateKey,
        completed: !isCurrentlyCompleted,
        value: !isCurrentlyCompleted ? 1 : 0,
      });

      // Dispatch success action
      dispatch({
        type: actionTypes.TOGGLE_HABIT_SUCCESS,
        payload: {
          habitId,
          date: dateKey,
          entry: response.data.entry, // Always use the actual entry from API response
        },
      });
    } catch (error) {
      console.error('🎯 HabitContext: Error in toggleHabitCompletion', error);
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.TOGGLE_HABIT_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };
  // Fetch habit entries for a date range
  const fetchHabitEntries = useCallback(async (habitId, startDate, endDate) => {
    try {
      // Create cache key based on habit and date range
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const cacheKey = `${habitId}-${startDateStr}-${endDateStr}`;
      
      // Check if we recently fetched data for this specific date range (within last 30 seconds)
      const lastFetchTime = state.lastFetch[cacheKey];
      const now = Date.now();
      if (lastFetchTime && (now - lastFetchTime) < 30000) {
        // Skip fetch if we recently fetched this exact range
        return { success: true, entries: state.entries[habitId] || {} };
      }

      const response = await habitsAPI.getHabitEntries(habitId, {
        startDate: startDateStr,
        endDate: endDateStr,
      });

      // Transform entries into a date-indexed object
      const entriesMap = {};
      response.data.entries.forEach(entry => {
        const dateKey = entry.date.split('T')[0];
        entriesMap[dateKey] = entry;
      });

      dispatch({
        type: actionTypes.FETCH_ENTRIES_SUCCESS,
        payload: {
          habitId,
          entries: entriesMap,
        },
      });
      
      // Update cache for this specific range
      dispatch({
        type: 'UPDATE_FETCH_CACHE',
        payload: { cacheKey, timestamp: now }
      });

      return { success: true, entries: entriesMap };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  }, [state.lastFetch, state.entries]);

  // Fetch habit statistics
  const fetchStats = async (dateRange = {}) => {
    try {
      const response = await habitsAPI.getStats(dateRange);
      dispatch({
        type: actionTypes.FETCH_STATS_SUCCESS,
        payload: response.data.stats,
      });
      return { success: true, stats: response.data.stats };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  };

  // Archive/unarchive habit
  const archiveHabit = async (habitId, archived = true) => {
    try {
      const response = await habitsAPI.archiveHabit(habitId, archived);
      dispatch({
        type: actionTypes.UPDATE_HABIT_SUCCESS,
        payload: response.data.habit,
      });
      return { success: true, habit: response.data.habit };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Helper functions for workspace habits
  const isWorkspaceHabit = (habit) => habit.source === 'workspace';
  
  const getPersonalHabits = () => state.habits.filter(habit => habit.source === 'personal' || !habit.source);
  
  const getWorkspaceHabits = () => state.habits.filter(habit => habit.source === 'workspace');
  
  const getHabitsByWorkspace = (workspaceId) => 
    state.habits.filter(habit => habit.workspaceId === workspaceId);

  const value = {
    ...state,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    fetchHabitEntries,
    fetchStats,
    archiveHabit,
    clearError,
    // Workspace-specific helpers
    isWorkspaceHabit,
    getPersonalHabits,
    getWorkspaceHabits,
    getHabitsByWorkspace,
  };

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};

// Custom hook to use habit context
export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    console.error('HabitContext is null/undefined. Provider may not be wrapping this component.');
    throw new Error('useHabits must be used within a HabitProvider. Make sure the component is wrapped in <HabitProvider>.');
  }
  return context;
};

// Utility functions for compatibility with existing code
export const habitUtils = {
  // Get week start date with configurable start day
  getWeekStart: (date, weekStartDay = null) => {
    const d = new Date(date);
    
    const currentDay = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // If no weekStartDay provided, try to get from preferences service, default to Monday (1)
    let startDay = weekStartDay;
    if (startDay === null) {
      try {
        // Import lazily to avoid circular dependencies
        const userPreferencesService = require('../services/userPreferencesService').default;
        startDay = userPreferencesService.getWeekStartDay();
      } catch {
        startDay = 1; // Default to Monday
      }
    }
    
    // Calculate days to subtract to get to the desired week start
    let daysToSubtract = (currentDay - startDay + 7) % 7;
    
    d.setDate(d.getDate() - daysToSubtract);
    
    // Use local time formatting to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    
    // Create a new date from the local date string to ensure consistent timezone handling
    return new Date(`${year}-${month}-${dayOfMonth}T00:00:00`);
  },

  // Get week dates with configurable start day
  getWeekDates: (startDate, weekStartDay = null) => {
    const dates = [];
    
    // Start from the given date and ensure we're working with local dates
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      // Create date string in YYYY-MM-DD format using local time
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Use the same date object for day name calculation
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const shortDay = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Check if this is today by comparing date strings
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      
      dates.push({
        date: dateStr,
        dayName: dayName,
        shortDay: shortDay,
        isToday: isToday,
        dateObj: new Date(currentDate)
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  },

  // Normalize date to YYYY-MM-DD format using LOCAL time (no timezone conversion)
  normalizeDate: (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Check if date is today using consistent local time format
  isToday: (date) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const checkDateStr = typeof date === 'string' ? date : (() => {
      const d = new Date(date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayOfMonth}`;
    })();
    
    return checkDateStr === todayStr;
  },
};
