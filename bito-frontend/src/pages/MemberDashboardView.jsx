import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  LockClosedIcon,
  PersonIcon,
  EyeOpenIcon
} from '@radix-ui/react-icons';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { habitUtils } from '../contexts/HabitContext';
import { ContextGridAdapter } from '../components/shared';
import { ChartFilterControls, DatabaseFilterControls } from '../components/ui/FilterControls';

// Same configuration as Dashboard component, but excluding Quick Actions
const AVAILABLE_WIDGET_TYPES = {
  "habits-overview": {
    title: "Habits Overview",
    icon: "📊",
    description: "Daily habit completion chart",
    defaultProps: { w: 12, h: 10 },
  },
  "habit-list": {
    title: "Habits List",
    icon: "📋",
    description: "View member's daily habits",
    defaultProps: { w: 4, h: 6 },
  },
};

const getDefaultLayouts = () => ({
  lg: [
    { i: "habits-overview", x: 0, y: 0, w: 12, h: 6, },
    { i: "habit-list", x: 0, y: 6, w: 12, h: 10, },
  ],
  md: [
    { i: "habits-overview", x: 0, y: 0, w: 12, h: 6, },
    { i: "habit-list", x: 0, y: 10, w: 12, h: 10,  },
  ],
  sm: [
    { i: "habits-overview", x: 0, y: 0, w: 12, h: 6,  },
    { i: "habit-list", x: 0, y: 12, w: 12, h: 10, },
  ],
  xs: [
    { i: "habits-overview", x: 0, y: 0, w: 4, h: 6, },
    { i: "habit-list", x: 0, y: 8, w: 4, h: 10, 
     },
  ],
  xxs: [
    { i: "habits-overview", x: 0, y: 0, w: 2, h: 6,  },
    { i: "habit-list", x: 0, y: 6, w: 2, h: 6,  },
  ],
});

const getDefaultActiveWidgets = () => [
  "habits-overview",
  "habit-list",
];


const MemberDashboardView = () => {
  const { groupId, memberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Same filter states as Dashboard component
  const [chartFilters, setChartFilters] = useState(() => {
    const getCurrentWeekNumber = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const monthStart = new Date(currentYear, currentMonth, 1);
      const firstWeekStart = habitUtils.getWeekStart(monthStart);
      const currentWeekStart = habitUtils.getWeekStart(today);

      const weekDiff = Math.floor(
        (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
      );

      return weekDiff + 1;
    };

    return {
      mode: "week",
      period: getCurrentWeekNumber(),
      selectedMonth: new Date().getMonth() + 1,
    };
  });

  const [databaseFilters, setDatabaseFilters] = useState(() => {
    const getCurrentWeekNumber = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const monthStart = new Date(currentYear, currentMonth, 1);
      const firstWeekStart = habitUtils.getWeekStart(monthStart);
      const currentWeekStart = habitUtils.getWeekStart(today);

      const weekDiff = Math.floor(
        (currentWeekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)
      );

      return weekDiff + 1;
    };

    return {
      period: getCurrentWeekNumber(),
      selectedMonth: new Date().getMonth() + 1,
    };
  });

  // Date range calculation (same as Dashboard)
  const getDateRangeFromFilters = useCallback((filterObj) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (filterObj.chartMode === "week") {
      const selectedMonth = filterObj.chartSelectedMonth - 1;
      const weekPeriod = filterObj.chartPeriod || 1;

      const monthStart = new Date(currentYear, selectedMonth, 1);
      const firstWeekStart = habitUtils.getWeekStart(monthStart);
      
      const weekStart = new Date(firstWeekStart);
      weekStart.setDate(firstWeekStart.getDate() + (weekPeriod - 1) * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return { start: weekStart, end: weekEnd };
    } else if (filterObj.chartMode === "month") {
      const selectedMonth = filterObj.chartSelectedMonth - 1;
      const startOfMonth = new Date(currentYear, selectedMonth, 1);
      const endOfMonth = new Date(currentYear, selectedMonth + 1, 0);
      return { start: startOfMonth, end: endOfMonth };
    } else {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 89);
      return { start: startDate, end: endDate };
    }
  }, []);

  // Calculate date ranges
  const chartDateRange = useMemo(() => {
    const filterObj = {
      chartMode: chartFilters.mode,
      chartPeriod: chartFilters.period,
      chartSelectedMonth: chartFilters.selectedMonth,
    };
    return getDateRangeFromFilters(filterObj);
  }, [chartFilters, getDateRangeFromFilters]);

  const databaseDateRange = useMemo(() => {
    const filterObj = {
      chartMode: "week",
      chartPeriod: databaseFilters.period,
      chartSelectedMonth: databaseFilters.selectedMonth,
    };
    return getDateRangeFromFilters(filterObj);
  }, [databaseFilters, getDateRangeFromFilters]);

  // Filter options
  const filterOptions = useMemo(() => {
    const getWeeksForMonth = (month) => {
      const year = new Date().getFullYear();
      const weeks = [];

      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      let currentWeekStart = habitUtils.getWeekStart(monthStart);
      let weekNumber = 1;

      while (currentWeekStart <= monthEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);

        const formatDate = (date) => {
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          return `${day}/${month}`;
        };

        const startStr = formatDate(currentWeekStart);
        const endStr = formatDate(weekEnd);

        weeks.push({
          value: weekNumber,
          label: `Week ${weekNumber} (${startStr} - ${endStr})`,
        });

        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNumber++;
      }

      return weeks;
    };

    const chartWeeks = getWeeksForMonth(chartFilters.selectedMonth);
    const databaseWeeks = getWeeksForMonth(databaseFilters.selectedMonth);

    return {
      chartModes: [
        { value: "week", label: "Weekly View" },
        { value: "month", label: "Monthly View" },
        { value: "continuous", label: "All Time" },
      ],
      weeks: chartWeeks,
      databaseWeeks,
      months: [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
      ],
    };
  }, [chartFilters.selectedMonth, databaseFilters.selectedMonth]);

  // Filter update handlers
  const updateChartFilter = useCallback((mode, period) => {
    // Handle mode and period updates correctly like in Dashboard component
    setChartFilters(prev => ({
      ...prev,
      mode: mode,
      period: period
    }));
  }, []);

  const updateChartMonth = useCallback((month) => {
    setChartFilters(prev => ({
      ...prev,
      selectedMonth: month,
      period: 1 // Reset period when month changes
    }));
  }, []);

  const updateDatabaseFilter = useCallback((period) => {
    // Only update the period in database filters, as it only supports week view
    setDatabaseFilters(prev => ({
      ...prev,
      period: period
    }));
  }, []);

  const updateDatabaseMonth = useCallback((month) => {
    setDatabaseFilters(prev => ({
      ...prev,
      selectedMonth: month,
      period: 1 // Reset period when month changes
    }));
  }, []);

  // Disabled handlers for read-only mode
  const handleToggleCompletion = () => {
    // Read-only mode: Cannot modify member habits
  };

  const handleAddHabit = () => {
    // Read-only mode: Cannot add habits for member
  };

  const handleDeleteHabit = () => {
    // Read-only mode: Cannot delete member habits
  };

  const handleEditHabit = () => {
    // Read-only mode: Cannot edit member habits
  };

  useEffect(() => {
    fetchMemberDashboard();
  }, [groupId, memberId]);

  const fetchMemberDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await groupsAPI.getMemberDashboard(groupId, memberId);
      
      if (response.success) {
        // Validate required data is present
        if (!response.member) {
          console.error('Member dashboard response is missing member data:', response);
          setError('Unable to load member information');
          setLoading(false);
          return;
        }
        
        // Ensure habits exists (even if empty)
        if (!response.habits) {
          console.warn('No habits in response, creating empty array');
          response.habits = [];
        }
        
        // Ensure entries exists (even if empty)
        if (!response.entries) {
          console.warn('No entries in response, creating empty object');
          response.entries = {};
        }
        
        // Continue with empty habits - we'll show the empty state UI
        
        // Process entries to ensure correct format for HabitGrid/context compatibility
        const processedEntries = {};
        if (typeof response.entries === 'object') {
          Object.keys(response.entries).forEach(habitId => {
            if (habitId && habitId !== "undefined" && habitId !== "null") {
              const habitEntries = response.entries[habitId];
              
              // Convert from array format (from API) to object format (for HabitGrid)
              if (Array.isArray(habitEntries)) {
                processedEntries[habitId] = {};
                habitEntries.forEach(entry => {
                  if (entry && entry.date) {
                    // Convert date to YYYY-MM-DD format if needed
                    const dateKey = typeof entry.date === 'string' 
                      ? entry.date.split('T')[0] 
                      : new Date(entry.date).toISOString().split('T')[0];
                    processedEntries[habitId][dateKey] = entry;
                  }
                });
              } else if (typeof habitEntries === 'object') {
                // Already in correct format
                processedEntries[habitId] = habitEntries;
              }
            }
          });
        }
        
        // Make sure habits have proper IDs and required properties - now directly from their personal collection
        const processedHabits = response.habits
          .filter(habit => habit && habit._id) // Filter out any invalid habits
          .map(habit => ({
            ...habit,
            _id: habit._id || habit.id, // Ensure _id is present
            name: habit.name || 'Unnamed habit', // Ensure name is present
            // Add any other required fields with defaults
            frequency: habit.frequency || { days: [] },
            category: habit.category || 'uncategorized',
            // Keep track if it's a workspace habit
            isGroupHabit: !!habit.workspaceId
          }));
        
        // Perform additional validation of habit-entry relationship
        const entriesWithNoMatchingHabit = Object.keys(processedEntries).filter(
          habitId => !processedHabits.some(h => h._id.toString() === habitId)
        );
        
        if (entriesWithNoMatchingHabit.length > 0) {
          console.warn('Entries found for habits that do not exist:', entriesWithNoMatchingHabit);
        }
        
        const habitsWithNoEntries = processedHabits
          .filter(h => !processedEntries[h._id.toString()])
          .map(h => h._id.toString());
        
        
        setMemberData({
          ...response,
          entries: processedEntries,
          habits: processedHabits
        });
      } else {
        setError(response.error || 'Failed to load member dashboard');
      }
      
    } catch (error) {
      console.error('Error fetching member dashboard:', error);
      setError(error.message || 'Failed to load member dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--color-surface-elevated)] rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>
            
            <div>
              <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-1">
                Error Loading Dashboard
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                Unable to load this member's dashboard
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
              <PersonIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
              Something Went Wrong
            </h3>
            <p className="text-[var(--color-text-secondary)] font-outfit mb-4">
              {error}
            </p>
            <div className="flex flex-col gap-3 items-center justify-center">
              <button
                onClick={() => fetchMemberDashboard()}
                className="px-6 py-3 bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-semibold hover:bg-[var(--color-brand-700)] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate(`/app/groups/${groupId}`)}
                className="px-6 py-3 bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border-primary)] rounded-xl font-outfit hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                Back to Group
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { member, habits, entries, workspace } = memberData;

  return (
    <div className="p-6 page-container space-y-8">
      {/* Header with member info - replaces WelcomeCard */}
      <div className="relative">
        <div className="bg-gradient-to-br from-[var(--color-brand-500)]/10 via-[var(--color-brand-600)]/5 to-transparent border border-[var(--color-border-primary)]/30 rounded-3xl p-8 overflow-hidden">
          <div className="flex items-center gap-6 mb-4">
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold text-xl">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-1">
                  {member.name}'s Dashboard
                </h1>
                <div className="flex items-center gap-2">
                  <EyeOpenIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                    Read-only mirror • Complete dashboard view
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Show empty state if no habits are found */}
      {habits && habits.length === 0 && (
        <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-10 border border-[var(--color-border-primary)]/20 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-4">
            <PersonIcon className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
            No Habits Yet
          </h3>
          <p className="text-[var(--color-text-secondary)] font-outfit max-w-lg mx-auto mb-6">
            {member.name} hasn't created any habits yet.
          </p>
          <ul className="text-left text-[var(--color-text-secondary)] max-w-lg mx-auto mb-6 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>They may still be setting up their personal dashboard</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>They haven't created any habits to track yet</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>Encourage them to get started with tracking their first habit!</span>
            </li>
          </ul>
          <button
            onClick={() => navigate(`/app/groups/${groupId}`)}
            className="px-6 py-2.5 bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-medium hover:bg-[var(--color-brand-700)] transition-colors"
          >
            Back to Group
          </button>
        </div>
      )}
      
      {/* Dashboard Grid Container - Only show when there are habits */}
      {habits && habits.length > 0 && (
        <div className="relative">
          <ContextGridAdapter
          mode="dashboard"
          
          // Override context data with member's data
          habits={habits || []}
          entries={entries || {}}
          isLoading={false}
          
          // Override handlers for read-only mode
          onToggleCompletion={handleToggleCompletion}
          onAddHabit={handleAddHabit}
          onDeleteHabit={handleDeleteHabit}
          onEditHabit={handleEditHabit}
          
          // Same filter props as Dashboard
          chartFilters={chartFilters}
          databaseFilters={databaseFilters}
          chartDateRange={chartDateRange}
          databaseDateRange={databaseDateRange}
          filterOptions={filterOptions}
          updateChartFilter={updateChartFilter}
          updateChartMonth={updateChartMonth}
          updateDatabaseFilter={updateDatabaseFilter}
          updateDatabaseMonth={updateDatabaseMonth}
          
          // Disabled UI handlers
          onShowEnhancedCsvImport={() => {/* Read-only mode: CSV import disabled */}}
          onShowLLMSettings={() => {/* Read-only mode: LLM settings disabled */}}
          
          // Filter components
          ChartFilterControls={ChartFilterControls}
          DatabaseFilterControls={DatabaseFilterControls}
          
          // Configuration
          availableWidgets={AVAILABLE_WIDGET_TYPES}
          defaultWidgets={getDefaultActiveWidgets()}
          defaultLayouts={getDefaultLayouts()}
          className="member-dashboard-grid"
          
          // Read-only mode flag
          readOnly={true}
        />
        </div>
      )}

      {/* Help Text - Only show when there are habits */}
      {habits && habits.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
            👁️ <strong>Viewing:</strong> This is a complete, read-only mirror of {member.name}'s personal dashboard. You can see all their habits and progress but cannot make changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default MemberDashboardView;
