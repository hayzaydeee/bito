import { useMemo, useCallback } from 'react';
import { useWeekStartDay } from './useUserPreferences';

/**
 * Hook that provides week-aware utility functions
 * Automatically updates when user's week start preference changes
 */
export const useWeekUtils = () => {
  const [weekStartDay] = useWeekStartDay();

  // Memoized utility functions that respect user's week start preference
  const weekUtils = useMemo(() => {
    
    /**
     * Get week start date based on user preference
     */
    const getWeekStart = (date) => {
      const d = new Date(date);
      const currentDay = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Calculate days to subtract to get to the desired week start
      const daysToSubtract = (currentDay - weekStartDay + 7) % 7;
      
      d.setDate(d.getDate() - daysToSubtract);
      
      // Use local time formatting to avoid timezone issues
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(d.getDate()).padStart(2, '0');
      
      // Create a new date from the local date string to ensure consistent timezone handling
      return new Date(`${year}-${month}-${dayOfMonth}T00:00:00`);
    };

    /**
     * Get week dates starting from user's preferred day
     */
    const getWeekDates = (startDate) => {
      const dates = [];
      const current = new Date(startDate);
      
      for (let i = 0; i < 7; i++) {
        // Create date string in YYYY-MM-DD format using local time
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Use the same date object for day name calculation
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDay = current.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Check if this is today by comparing date strings
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        
        dates.push({
          date: dateStr,
          day: dayName,  // For compatibility with existing code
          dayName: dayName,
          shortDay: shortDay,
          isToday: isToday,
          dateObj: new Date(current)
        });
        
        // Move to next day
        current.setDate(current.getDate() + 1);
      }
      
      return dates;
    };

    /**
     * Generate date range between two dates
     */
    const generateDateRange = (startDate, endDate = null) => {
      const dates = [];
      const current = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(current);
      
      if (!endDate) {
        // If no end date, generate a week
        end.setDate(current.getDate() + 6);
      }
      
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDay = current.toLocaleDateString('en-US', { weekday: 'short' });
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        
        dates.push({
          date: dateStr,
          day: dayName,  // For compatibility with existing code
          dayName: dayName,
          shortDay: shortDay,
          isToday: isToday,
          dateObj: new Date(current)
        });
        
        current.setDate(current.getDate() + 1);
      }
      
      return dates;
    };

    /**
     * Normalize date to YYYY-MM-DD format using LOCAL time (no timezone conversion)
     */
    const normalizeDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    /**
     * Check if date is today using consistent local time format
     */
    const isToday = (date) => {
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
    };

    /**
     * Get current week dates based on user preference
     */
    const getCurrentWeek = () => {
      const today = new Date();
      const weekStart = getWeekStart(today);
      return getWeekDates(weekStart);
    };

    /**
     * Get day names in user's preferred order
     */
    const getDayNamesInOrder = (format = 'long') => {
      const allDays = format === 'short' 
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Reorder based on week start
      const orderedDays = [];
      for (let i = 0; i < 7; i++) {
        orderedDays.push(allDays[(weekStartDay + i) % 7]);
      }
      
      return orderedDays;
    };

    return {
      getWeekStart,
      getWeekDates,
      generateDateRange,
      normalizeDate,
      isToday,
      getCurrentWeek,
      getDayNamesInOrder,
      weekStartDay
    };
  }, [weekStartDay]);

  return weekUtils;
};

/**
 * Hook for components that only need the current week
 */
export const useCurrentWeek = () => {
  const weekUtils = useWeekUtils();
  
  const currentWeek = useMemo(() => {
    return weekUtils.getCurrentWeek();
  }, [weekUtils]);
  
  return {
    currentWeek,
    weekUtils
  };
};

/**
 * Hook for getting week dates with custom date range
 */
export const useWeekDates = (startDate, endDate = null) => {
  const weekUtils = useWeekUtils();
  
  const weekDates = useMemo(() => {
    if (!startDate) {
      return weekUtils.getCurrentWeek();
    }
    
    if (endDate) {
      return weekUtils.generateDateRange(startDate, endDate);
    } else {
      return weekUtils.getWeekDates(startDate);
    }
  }, [weekUtils, startDate, endDate]);
  
  return {
    weekDates,
    weekUtils
  };
};
