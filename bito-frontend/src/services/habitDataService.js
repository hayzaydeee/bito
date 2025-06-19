/**
 * Habit Data Service
 * Provides robust habit completion data with filtering capabilities
 */

// Return empty initial data - will be populated via CSV import
const getEmptyInitialData = () => {
  return {
    habits: [],
    completions: {}
  };
};

// Date utility functions
export const dateUtils = {
  // Get the start of a week (Monday)
  getWeekStart: (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  // Get week number within a month (1-4+)
  getWeekOfMonth: (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstWeekStart = dateUtils.getWeekStart(firstDay);
    const currentWeekStart = dateUtils.getWeekStart(date);
    
    const weeksDiff = Math.ceil((currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, weeksDiff + 1);
  },
  // Get all weeks in a month
  getWeeksInMonth: (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = dateUtils.getWeekStart(firstDay);
    let weekNumber = 1;
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      // Format dates as DD/MM
      const formatShortDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
      };
      
      const startStr = formatShortDate(currentWeekStart);
      const endStr = formatShortDate(weekEnd);
      
      weeks.push({
        number: weekNumber,
        start: new Date(currentWeekStart),
        end: weekEnd,
        label: `Week ${weekNumber} (${startStr} - ${endStr})`
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }
    
    return weeks;
  },

  // Format date as YYYY-MM-DD
  formatDate: (date) => {
    return date.toISOString().split('T')[0];
  },
  // Get date range for different filter types
  getDateRange: (filterType, filterValue, selectedMonth = null) => {
    const today = new Date();
    
    switch (filterType) {
      case 'week': {
        if (selectedMonth) {
          // Use the selected month instead of current month
          const year = today.getFullYear();
          const weeksInMonth = dateUtils.getWeeksInMonth(year, selectedMonth - 1); // Convert to 0-based
          const selectedWeekInfo = weeksInMonth.find(w => w.number === filterValue);
          
          if (selectedWeekInfo) {
            return { start: selectedWeekInfo.start, end: selectedWeekInfo.end };
          } else {
            // Fallback to first week if selected week doesn't exist
            return weeksInMonth.length > 0 ? 
              { start: weeksInMonth[0].start, end: weeksInMonth[0].end } :
              { start: today, end: today };
          }
        } else {
          // Original logic for current month
          const currentWeekStart = dateUtils.getWeekStart(today);
          const weekOffset = (filterValue - dateUtils.getWeekOfMonth(today)) * 7;
          const targetWeekStart = new Date(currentWeekStart);
          targetWeekStart.setDate(currentWeekStart.getDate() + weekOffset);
          
          const weekEnd = new Date(targetWeekStart);
          weekEnd.setDate(targetWeekStart.getDate() + 6);
          
          return { start: targetWeekStart, end: weekEnd };
        }
      }
      
      case 'month': {
        const monthStart = new Date(today.getFullYear(), filterValue - 1, 1);
        const monthEnd = new Date(today.getFullYear(), filterValue, 0);
        return { start: monthStart, end: monthEnd };
      }
      
      case 'continuous': {
        // All available data (90 days back)
        const start = new Date(today);
        start.setDate(today.getDate() - 89);
        return { start, end: today };
      }
      
      default:
        return { start: dateUtils.getWeekStart(today), end: today };
    }
  }
};

// Filter functions
export const filterData = {
  // Get completions for a specific date range
  getCompletionsInRange: (completions, habits, start, end) => {
    const filtered = {};
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = dateUtils.formatDate(current);
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
      
      habits.forEach(habit => {
        const dateKey = `${dateStr}-${habit.id}`;
        const dayKey = `${dayName}-${habit.id}`;
        
        if (completions[dateKey] || completions[dayKey]) {
          filtered[dateKey] = true;
          filtered[dayKey] = true; // Maintain compatibility
        }
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return filtered;
  },  // Get daily completion counts for chart data
  getDailyCompletions: (completions, habits, start, end, mode = 'week') => {
    const dailyData = [];
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = dateUtils.formatDate(current);
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
      const shortDay = current.toLocaleDateString('en-US', { weekday: 'short' });
      
      const completedCount = habits.filter(habit => {
        const dateKey = `${dateStr}-${habit.id}`;
        const dayKey = `${dayName}-${habit.id}`;
        return completions[dateKey] || completions[dayKey];
      }).length;
      
      // Format label based on mode
      let label = shortDay;
      if (mode === 'month') {
        // For monthly view, show day number (1, 2, 3, etc.)
        label = current.getDate().toString();
      } else if (mode === 'continuous') {
        // For continuous mode, show date every 7 days
        const dayOfYear = Math.floor((current - new Date(current.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        label = dayOfYear % 7 === 1 ? `${current.getDate()}/${current.getMonth() + 1}` : '';
      }
      
      dailyData.push({
        name: label,
        fullName: `${dayName}, ${current.toLocaleDateString()}`,
        date: dateStr,
        value: completedCount,
        total: habits.length,
        mode: mode
      });
      
      current.setDate(current.getDate() + 1);
    }
      return dailyData;
  }
};

// Filter state management
const FILTER_STORAGE_KEY = 'habitTracker_filters';

export const filterState = {
  // Default filter state
  getDefaultFilters: () => ({
    chartMode: 'week', // week, month, continuous
    chartPeriod: dateUtils.getWeekOfMonth(new Date()), // week number or month number
    chartSelectedMonth: new Date().getMonth() + 1, // shared month for both weekly and monthly modes
    databasePeriod: dateUtils.getWeekOfMonth(new Date()), // week number (always weekly)
    databaseSelectedMonth: new Date().getMonth() + 1, // month for database week selection
  }),

  // Load filters from localStorage
  loadFilters: () => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        return { ...filterState.getDefaultFilters(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
    return filterState.getDefaultFilters();
  },

  // Save filters to localStorage
  saveFilters: (filters) => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }
};

// Main data service
export const habitDataService = {
  // Initialize with empty data - use CSV import to populate
  initialize: () => {
    return getEmptyInitialData();
  },  // Get filtered data based on current filters
  getFilteredData: (habits, completions, filters) => {
    const { chartMode, chartPeriod, chartSelectedMonth, databasePeriod, databaseSelectedMonth } = filters;
    
    // Get date range for chart
    let chartRange;
    if (chartMode === 'week') {
      chartRange = dateUtils.getDateRange(chartMode, chartPeriod, chartSelectedMonth);
    } else if (chartMode === 'month') {
      chartRange = dateUtils.getDateRange(chartMode, chartSelectedMonth, null);
    } else {
      // continuous mode
      chartRange = dateUtils.getDateRange(chartMode, chartPeriod, null);
    }
    const chartData = filterData.getDailyCompletions(completions, habits, chartRange.start, chartRange.end, chartMode);
    
    // Get date range for database (always weekly)
    const dbRange = dateUtils.getDateRange('week', databasePeriod, databaseSelectedMonth);
    const dbCompletions = filterData.getCompletionsInRange(completions, habits, dbRange.start, dbRange.end);
    
    return {
      chartData,
      databaseCompletions: dbCompletions,
      chartRange,
      databaseRange: dbRange,
      chartMode,
      databaseMode: 'week' // Always weekly for database
    };
  },// Get available filter options for a specific month
  getFilterOptions: (selectedMonth = null) => {
    const today = new Date();
    const currentMonth = selectedMonth ? selectedMonth - 1 : today.getMonth(); // Convert to 0-based
    const currentYear = today.getFullYear();
    
    // Get weeks in specified month
    const weeksInMonth = dateUtils.getWeeksInMonth(currentYear, currentMonth);
    
    return {
      chartModes: [
        { value: 'week', label: 'Weekly View' },
        { value: 'month', label: 'Monthly View' },
        { value: 'continuous', label: 'All Time' }
      ],
      weeks: weeksInMonth.map(week => ({
        value: week.number,
        label: week.label,
        dateRange: `${week.start.toLocaleDateString()} - ${week.end.toLocaleDateString()}`
      })),
      months: [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
      ]
    };
  },

  // Get weeks for a specific month
  getWeeksForMonth: (year, month) => {
    const weeksInMonth = dateUtils.getWeeksInMonth(year, month - 1); // month is 1-based, getWeeksInMonth expects 0-based
    return weeksInMonth.map(week => ({
      value: week.number,
      label: week.label,
      dateRange: `${week.start.toLocaleDateString()} - ${week.end.toLocaleDateString()}`
    }));
  }
};

export default habitDataService;
