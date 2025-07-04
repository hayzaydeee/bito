// Pure business logic functions for habit calculations
export const habitUtils = {
  // Date normalization
  normalizeDate: (date) => {
    if (typeof date === 'string' && date.includes('T')) {
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      // Use local time components to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return date;
  },

  // Day of week utilities (1=Monday, 7=Sunday)
  getDayOfWeek: (date) => {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 ? 7 : day; // Convert Sunday (0) to 7, keep Monday (1) as 1
  },

  // Check if a habit is scheduled for a specific date
  isHabitScheduledForDate: (habit, date) => {
    // Check schedule.days first (backend model), then fall back to frequency array (legacy)
    const scheduleDays = habit.schedule?.days || habit.frequency;
    
    if (!scheduleDays || scheduleDays.length === 0) {
      return true; // If no schedule set, assume daily
    }
    
    // Convert date to day of week (0=Sunday, 1=Monday, etc. to match backend)
    const dayOfWeek = new Date(date).getDay();
    return scheduleDays.includes(dayOfWeek);
  },

  // Get habits that should be shown for a specific date
  getHabitsForDate: (habits, date) => {
    return habits.filter(habit => 
      habit.isActive && habitUtils.isHabitScheduledForDate(habit, date)
    );
  },

  // Get habits that should be shown for today
  getTodaysHabits: (habits) => {
    return habitUtils.getHabitsForDate(habits, new Date());
  },
  
  // Week calculations
  getWeekStart: (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    
    // Use local time formatting to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    
    // Create a new date from the local date string to ensure consistent timezone handling
    return new Date(`${year}-${month}-${dayOfMonth}T00:00:00`);
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
    // Only count habits that are scheduled for this date
    const scheduledHabits = habitUtils.getHabitsForDate(habits, date);
    if (scheduledHabits.length === 0) return 100; // If no habits scheduled, 100% complete
    
    const completed = scheduledHabits.filter(habit => 
      completions.has(`${habitUtils.normalizeDate(date)}_${habit.id}`)
    ).length;
    
    return Math.round((completed / scheduledHabits.length) * 100);
  },

  // Enhanced streak calculation that respects scheduling
  calculateStreak: (habitId, habit, completions, endDate = new Date()) => {
    if (!habit) return 0;
    
    let streak = 0;
    const current = new Date(endDate);
    
    while (true) {
      const dateStr = habitUtils.normalizeDate(current);
      const completionId = `${dateStr}_${habitId}`;
      
      // Check if habit is scheduled for this day
      if (habitUtils.isHabitScheduledForDate(habit, current)) {
        // If scheduled, check if completed
        if (completions.has(completionId)) {
          streak++;
        } else {
          break; // Streak broken on a scheduled day
        }
      }
      // If not scheduled, continue to previous day without breaking streak
      
      current.setDate(current.getDate() - 1);
      
      // Prevent infinite loop - stop after checking 365 days
      if (streak > 365) break;
    }
    
    return streak;
  },

  // Calculate weekly progress based on scheduled days
  calculateWeeklyProgress: (habits, completions, weekStart) => {
    const weekDates = habitUtils.getWeekDates(weekStart);
    let totalScheduled = 0;
    let totalCompleted = 0;
    
    weekDates.forEach(({ date, dateObj }) => {
      const scheduledHabits = habitUtils.getHabitsForDate(habits, dateObj);
      totalScheduled += scheduledHabits.length;
      
      scheduledHabits.forEach(habit => {
        const completionId = `${date}_${habit._id}`;
        if (completions[habit._id] && completions[habit._id][date] && completions[habit._id][date].completed) {
          totalCompleted++;
        }
      });
    });
    
    return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 100;
  },
  
  getHabitStats: (habitId, habit, completions) => {
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
    
    // Calculate longest streak respecting scheduling
    let longestStreak = 0;
    let currentStreakCount = 0;
    let previousDate = null;
    
    habitCompletions.forEach(completion => {
      const currentDate = new Date(completion.date);
      
      // Check if this completion is on a scheduled day
      if (habitUtils.isHabitScheduledForDate(habit, currentDate)) {
        if (previousDate === null) {
          currentStreakCount = 1;
        } else {
          // Check if previous day was consecutive (accounting for non-scheduled days)
          const daysBetween = Math.floor((currentDate - previousDate) / (24 * 60 * 60 * 1000));
          let isConsecutive = true;
          
          // Check each day between to see if any scheduled days were missed
          for (let i = 1; i <= daysBetween; i++) {
            const checkDate = new Date(previousDate);
            checkDate.setDate(checkDate.getDate() + i);
            
            if (habitUtils.isHabitScheduledForDate(habit, checkDate)) {
              // Found a scheduled day that wasn't completed
              isConsecutive = false;
              break;
            }
          }
          
          if (isConsecutive) {
            currentStreakCount++;
          } else {
            currentStreakCount = 1;
          }
        }
        
        longestStreak = Math.max(longestStreak, currentStreakCount);
        previousDate = currentDate;
      }
    });
    
    return {
      totalCompletions: habitCompletions.length,
      currentStreak: habitUtils.calculateStreak(habitId, habit, completions),
      longestStreak,
      firstCompletion: habitCompletions[0].date,
      lastCompletion: habitCompletions[habitCompletions.length - 1].date
    };
  }
};
