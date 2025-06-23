import { useMemo } from 'react';
import { useHabits } from '../contexts/HabitContext';

// Custom hook for generating chart data from habit data
export const useChartData = (chartType = 'completion', dateRange = null) => {
  const { habits, entries, stats } = useHabits();

  const chartData = useMemo(() => {
    if (!habits.length) return [];

    const today = new Date();
    const weekStart = getWeekStart(today);
    
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
  }, [habits, entries, chartType, dateRange]);

  return chartData;
};

// Helper function to get week start (Monday)
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Generate daily completion chart data
const generateCompletionChart = (habits, entries, startDate, endDate) => {
  const data = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
    
    let completedCount = 0;
    
    habits.forEach(habit => {
      const habitEntries = entries[habit._id];
      if (habitEntries && habitEntries[dateStr]) {
        completedCount++;
      }
    });

    const completionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

    data.push({
      name: dayName,
      date: dateStr,
      completed: completedCount,
      total: habits.length,
      completionRate,
      value: completionRate, // For compatibility with existing chart components
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
};

// Generate streak chart data
const generateStreakChart = (habits, entries) => {
  return habits.map(habit => {
    const habitEntries = entries[habit._id] || {};
    const streak = calculateStreak(habitEntries);
    
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
    let totalPossible = habits.length * 7;
    
    const current = new Date(weekStartDate);
    while (current <= weekEndDate) {
      const dateStr = current.toISOString().split('T')[0];
      
      habits.forEach(habit => {
        const habitEntries = entries[habit._id];
        if (habitEntries && habitEntries[dateStr]) {
          totalCompletions++;
        }
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    
    data.push({
      name: `Week ${4 - week}`,
      value: completionRate,
      completed: totalCompletions,
      total: totalPossible,
      startDate: weekStartDate.toISOString().split('T')[0],
      endDate: weekEndDate.toISOString().split('T')[0],
    });
  }
  
  return data;
};

// Generate habit distribution pie chart
const generateHabitDistributionChart = (habits, entries, startDate, endDate) => {
  const habitStats = habits.map(habit => {
    const habitEntries = entries[habit._id] || {};
    let completedDays = 0;
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      if (habitEntries[dateStr]) {
        completedDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return {
      name: habit.name.length > 20 ? habit.name.substring(0, 20) + '...' : habit.name,
      value: completedDays,
      color: habit.color || getRandomColor(),
      habit: habit.name,
    };
  });

  // Filter out habits with no completions and sort by value
  return habitStats
    .filter(stat => stat.value > 0)
    .sort((a, b) => b.value - a.value);
};

// Calculate current streak for a habit
const calculateStreak = (habitEntries) => {
  const dates = Object.keys(habitEntries).sort((a, b) => new Date(b) - new Date(a));
  const today = new Date().toISOString().split('T')[0];
  
  let streak = 0;
  let currentDate = today;
  
  for (let i = 0; i <= 30; i++) { // Check up to 30 days back
    if (habitEntries[currentDate]) {
      streak++;
    } else {
      break;
    }
    
    // Go back one day
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    currentDate = date.toISOString().split('T')[0];
  }
  
  return streak;
};

// Generate random colors for habits without colors
const getRandomColor = () => {
  const colors = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#3b82f6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
