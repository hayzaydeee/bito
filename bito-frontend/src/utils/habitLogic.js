// Pure business logic functions for habit calculations
export const habitUtils = {
  // Date normalization
  normalizeDate: (date) => {
    if (typeof date === 'string' && date.includes('T')) {
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  },
  
  // Week calculations
  getWeekStart: (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },
  
  getWeekDates: (startDate) => {
    const dates = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      dates.push({
        date: habitUtils.normalizeDate(current),
        dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
        shortDay: current.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: habitUtils.isToday(current),
        dateObj: new Date(current)
      });
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  },
  
  isToday: (date) => {
    const today = new Date();
    const compareDate = new Date(date);
    return habitUtils.normalizeDate(today) === habitUtils.normalizeDate(compareDate);
  },
  
  // Statistics calculations
  calculateDayCompletion: (habits, completions, date) => {
    if (habits.length === 0) return 0;
    
    const completed = habits.filter(habit => 
      completions.has(`${date}_${habit.id}`)
    ).length;
    
    return Math.round((completed / habits.length) * 100);
  },
  
  calculateStreak: (habitId, completions, endDate = new Date()) => {
    let streak = 0;
    const current = new Date(endDate);
    
    while (true) {
      const dateStr = habitUtils.normalizeDate(current);
      const completionId = `${dateStr}_${habitId}`;
      
      if (completions.has(completionId)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  },
  
  getHabitStats: (habitId, completions) => {
    const habitCompletions = Array.from(completions.values())
      .filter(c => c.habitId === habitId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (habitCompletions.length === 0) {
      return {
        totalCompletions: 0,
        currentStreak: 0,
        longestStreak: 0,
        firstCompletion: null,
        lastCompletion: null
      };
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let currentStreakCount = 0;
    let previousDate = null;
    
    habitCompletions.forEach(completion => {
      const currentDate = new Date(completion.date);
      
      if (previousDate === null || 
          (currentDate - previousDate) === 24 * 60 * 60 * 1000) {
        currentStreakCount++;
        longestStreak = Math.max(longestStreak, currentStreakCount);
      } else {
        currentStreakCount = 1;
      }
      
      previousDate = currentDate;
    });
    
    return {
      totalCompletions: habitCompletions.length,
      currentStreak: habitUtils.calculateStreak(habitId, completions),
      longestStreak,
      firstCompletion: habitCompletions[0].date,
      lastCompletion: habitCompletions[habitCompletions.length - 1].date
    };
  }
};
