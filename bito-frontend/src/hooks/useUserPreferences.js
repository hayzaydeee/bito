import { useState, useEffect, useCallback } from 'react';
import userPreferencesService from '../services/userPreferencesService';

/**
 * React hook for managing user preferences
 * Provides reactive updates when preferences change
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(() => userPreferencesService.getAll());
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when preferences change
  useEffect(() => {
    const unsubscribe = userPreferencesService.addListener((key, value, allPrefs) => {
      setPreferences({ ...allPrefs });
    });

    // Initialize preferences
    setPreferences(userPreferencesService.getAll());

    return unsubscribe;
  }, []);

  // Get a specific preference
  const getPreference = useCallback((key) => {
    return userPreferencesService.get(key);
  }, []);

  // Set a preference with loading state
  const setPreference = useCallback(async (key, value) => {
    setIsLoading(true);
    try {
      userPreferencesService.set(key, value);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update multiple preferences
  const updatePreferences = useCallback(async (updates) => {
    setIsLoading(true);
    try {
      userPreferencesService.update(updates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync with backend data
  const syncWithBackend = useCallback((userProfileData) => {
    userPreferencesService.syncWithBackend(userProfileData);
  }, []);

  // Get week start day specifically
  const getWeekStartDay = useCallback(() => {
    return userPreferencesService.getWeekStartDay();
  }, []);

  // Set week start day specifically
  const setWeekStartDay = useCallback(async (day) => {
    setIsLoading(true);
    try {
      userPreferencesService.setWeekStartDay(day);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    preferences,
    isLoading,
    getPreference,
    setPreference,
    updatePreferences,
    syncWithBackend,
    getWeekStartDay,
    setWeekStartDay
  };
};

/**
 * Hook specifically for week start day preference
 */
export const useWeekStartDay = () => {
  const [weekStartDay, setWeekStartDay] = useState(() => {
    return userPreferencesService.getWeekStartDay();
  });

  useEffect(() => {
    const unsubscribe = userPreferencesService.addListener((key, value) => {
      if (key === 'weekStartsOn') {
        setWeekStartDay(value);
      }
    });

    // Initialize
    const current = userPreferencesService.getWeekStartDay();
    setWeekStartDay(current);

    return () => {
      unsubscribe();
    };
  }, []);

  const updateWeekStartDay = useCallback((day) => {
    userPreferencesService.setWeekStartDay(day);
  }, []);

  return [weekStartDay, updateWeekStartDay];
};
