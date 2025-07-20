import { useMemo } from 'react';
import { useHabits, habitUtils } from '../contexts/HabitContext';
import { habitUtils as scheduleUtils } from '../utils/habitLogic';
import { useWeekUtils } from '../hooks/useWeekUtils';

// Helper function to normalize dates to local time (consistent with HabitContext)
const normalizeDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Custom hook for generating chart data from habit data
export const useChartData = (chartType = 'completion', dateRange = null) => {
  const { habits, entries, stats } = useHabits();
  const weekUtils = useWeekUtils();

  const chartData = useMemo(() => {
    if (!habits.length) {
      return [];
    }

    const today = new Date();
    const weekStart = weekUtils.getWeekStart(today); // Use reactive week calculation!
    
    // Default to current week if no date range provided
    const startDate = dateRange?.start || weekStart;
    const endDate = dateRange?.end || new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    switch (chartType) {
      case 'completion':
        return generateCompletionChart(habits, entries, startDate, endDate);
      
      case 'streak':
        return generateStreakChart(habits, entries);
      
      case 'weekly':
        return generateWeeklyChart(habits, entries, startDate);
      
      case 'habit_distribution':
        return generateHabitDistributionChart(habits, entries, startDate, endDate);
      
      default:
        return generateCompletionChart(habits, entries, startDate, endDate);
    }
  }, [habits, entries, chartType, dateRange, weekUtils]);

  return chartData;
};

// Generate daily completion chart data
const generateCompletionChart = (habits, entries, startDate, endDate) => {
  const data = [];
  const current = new Date(startDate);

  // Calculate the span in days to determine label format
  const daySpan = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  while (current <= endDate) {
    const dateStr = normalizeDate(current);
    
    // Choose label format based on the span
    let name;
    if (daySpan <= 7) {
      // Week view: show day names
      name = current.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (daySpan <= 31) {
      // Month view: show date number only (1, 2, 3, etc.)
      const day = current.getDate();
      name = day.toString();
    } else {
      // All time/longer periods: show month/day format
      name = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Only count habits that are scheduled for this date
    const scheduledHabits = scheduleUtils.getHabitsForDate(habits, current);
    let completedCount = 0;
    
    scheduledHabits.forEach(habit => {
      const habitEntries = entries[habit._id];
      if (habitEntries && habitEntries[dateStr] && habitEntries[dateStr].completed) {
        completedCount++;
      }
    });

    const completionRate = scheduledHabits.length > 0 ? Math.round((completedCount / scheduledHabits.length) * 100) : 100;

    data.push({
      name,
      date: dateStr,
      completed: completedCount,
      total: scheduledHabits.length,
      completionRate,
      value: completedCount, // Show number of completed habits, not percentage
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
};

// Generate streak chart data
const generateStreakChart = (habits, entries) => {
  return habits.map(habit => {
    const habitEntries = entries[habit._id] || {};
    const streak = scheduleUtils.calculateStreak(habit._id, habit, new Set(
      Object.entries(habitEntries)
        .filter(([date, entry]) => entry.completed)
        .map(([date]) => `${date}_${habit._id}`)
    ));
    
    return {
      name: habit.name.length > 15 ? habit.name.substring(0, 15) + '...' : habit.name,
      value: streak,
      streak,
      color: habit.color || '#6366f1',
    };
  }).sort((a, b) => b.value - a.value);
};

// Generate weekly completion chart
const generateWeeklyChart = (habits, entries, weekStart) => {
  const data = [];
  
  // Get last 4 weeks
  for (let week = 3; week >= 0; week--) {
    const weekStartDate = new Date(weekStart);
    weekStartDate.setDate(weekStart.getDate() - (week * 7));
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    let totalCompletions = 0;
    let totalScheduled = 0;
    
    const current = new Date(weekStartDate);
    while (current <= weekEndDate) {
      const dateStr = normalizeDate(current);
      
      // Only count habits that are scheduled for this day
      const scheduledHabits = scheduleUtils.getHabitsForDate(habits, current);
      totalScheduled += scheduledHabits.length;
      
      scheduledHabits.forEach(habit => {
        const habitEntries = entries[habit._id];
        if (habitEntries && habitEntries[dateStr] && habitEntries[dateStr].completed) {
          totalCompletions++;
        }
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    const completionRate = totalScheduled > 0 ? Math.round((totalCompletions / totalScheduled) * 100) : 100;
    
    data.push({
      name: `Week ${4 - week}`,
      value: completionRate,
      completed: totalCompletions,
      total: totalScheduled,
      startDate: normalizeDate(weekStartDate),
      endDate: normalizeDate(weekEndDate),
    });
  }
  
  return data;
};

// Generate habit distribution pie chart
const generateHabitDistributionChart = (habits, entries, startDate, endDate) => {
  const habitStats = habits.map(habit => {
    const habitEntries = entries[habit._id] || {};
    let completedDays = 0;
    let scheduledDays = 0;
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = normalizeDate(current);
      
      // Only count days this habit is scheduled for
      if (scheduleUtils.isHabitScheduledForDate(habit, current)) {
        scheduledDays++;
        if (habitEntries[dateStr] && habitEntries[dateStr].completed) {
          completedDays++;
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return {
      name: habit.name.length > 20 ? habit.name.substring(0, 20) + '...' : habit.name,
      value: completedDays,
      scheduled: scheduledDays,
      completionRate: scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0,
      color: habit.color || getRandomColor(),
      habit: habit.name,
    };
  });

  // Filter out habits with no completions and sort by value
  return habitStats
    .filter(stat => stat.value > 0)
    .sort((a, b) => b.value - a.value);
};

// Generate random colors for habits without colors
const getRandomColor = () => {
  const colors = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#3b82f6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
