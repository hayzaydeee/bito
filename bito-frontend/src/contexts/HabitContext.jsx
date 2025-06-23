import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { habitsAPI, handleAPIError } from '../services/api';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  habits: [],
  entries: {},
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
      const { habitId, date, completed, entry } = action.payload;
      const dateKey = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      return {
        ...state,
        entries: {
          ...state.entries,
          [habitId]: {
            ...state.entries[habitId],
            [dateKey]: completed ? entry : null,
          },
        },
        isLoading: false,
        error: null,
      };

    case actionTypes.FETCH_ENTRIES_SUCCESS:
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.payload.habitId]: action.payload.entries,
        },
      };

    case actionTypes.FETCH_STATS_SUCCESS:
      return {
        ...state,
        stats: action.payload,
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
const HabitContext = createContext();

// Habit provider component
export const HabitProvider = ({ children }) => {
  const [state, dispatch] = useReducer(habitReducer, initialState);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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
    dispatch({ type: actionTypes.TOGGLE_HABIT_START });

    try {
      const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      // Check if already completed for this date
      const existingEntry = state.entries[habitId]?.[dateString];
      const shouldComplete = value !== null ? value : !existingEntry;

      const response = await habitsAPI.checkHabit(habitId, {
        date: dateString,
        completed: shouldComplete,
        value: shouldComplete ? 1 : 0,
      });

      dispatch({
        type: actionTypes.TOGGLE_HABIT_SUCCESS,
        payload: {
          habitId,
          date: dateString,
          completed: shouldComplete,
          entry: shouldComplete ? response.data.entry : null,
        },
      });

      return { success: true, completed: shouldComplete };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      dispatch({
        type: actionTypes.TOGGLE_HABIT_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Fetch habit entries for a date range
  const fetchHabitEntries = async (habitId, startDate, endDate) => {
    try {
      const response = await habitsAPI.getHabitEntries(habitId, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
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

      return { success: true, entries: entriesMap };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  };

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
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};

// Utility functions for compatibility with existing code
export const habitUtils = {
  // Get week start date (Monday)
  getWeekStart: (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  // Get week dates
  getWeekDates: (startDate) => {
    const dates = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      dates.push({
        date: current.toISOString().split('T')[0],
        dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
        shortDay: current.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: current.toDateString() === new Date().toDateString(),
        dateObj: new Date(current)
      });
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  },

  // Normalize date to YYYY-MM-DD format
  normalizeDate: (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  // Check if date is today
  isToday: (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  },
};
