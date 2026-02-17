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

  // Check if a habit is a weekly-target habit
  isWeeklyHabit: (habit) => {
    return habit?.frequency === 'weekly';
  },

  // Get Monday 00:00 and Sunday 23:59 bounds for a given date
  getWeekBounds: (date, weekStartDay = null) => {
    const start = habitUtils.getWeekStart(date, weekStartDay);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  },

  // Get weekly progress for a weekly habit within a Mon-Sun window
  getWeeklyProgress: (habit, entries, weekStartDate = null) => {
    if (!habitUtils.isWeeklyHabit(habit)) {
      return { completed: 0, target: 0, met: false, remaining: 0, isWeekly: false };
    }
    const target = habit.weeklyTarget || 3;
    const { start, end } = habitUtils.getWeekBounds(weekStartDate || new Date());
    const startStr = habitUtils.normalizeDate(start);
    const endStr = habitUtils.normalizeDate(end);

    // Count completed entries for this habit in the week range
    const habitEntries = entries[habit._id] || {};
    let completed = 0;
    const completedDays = [];
    Object.keys(habitEntries).forEach(dateStr => {
      if (dateStr >= startStr && dateStr <= endStr && habitEntries[dateStr]?.completed) {
        completed++;
        completedDays.push(dateStr);
      }
    });

    return {
      completed,
      target,
      met: completed >= target,
      remaining: Math.max(0, target - completed),
      completedDays,
      isWeekly: true
    };
  },

  // Check if a habit is scheduled for a specific date
  isHabitScheduledForDate: (habit, date) => {
    // Weekly habits are always "scheduled" — they can be completed any day
    if (habitUtils.isWeeklyHabit(habit)) {
      return true;
    }
    // Check schedule.days first (backend model), then fall back to frequency array (legacy)
    const scheduleDays = habit.schedule?.days || habit.frequency;
    
    if (!scheduleDays || !Array.isArray(scheduleDays) || scheduleDays.length === 0) {
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

  // Get only daily (non-weekly) habits for today
  getTodaysDailyHabits: (habits) => {
    return habitUtils.getTodaysHabits(habits).filter(h => !habitUtils.isWeeklyHabit(h));
  },

  // Get weekly habits (always shown, regardless of day)
  getWeeklyHabits: (habits) => {
    return habits.filter(h => h.isActive && habitUtils.isWeeklyHabit(h));
  },
  
  // Week calculations with configurable start day
  getWeekStart: (date, weekStartDay = null) => {
    const d = new Date(date);
    const currentDay = d.getDay();
    
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
    const daysToSubtract = (currentDay - startDay + 7) % 7;
    d.setDate(d.getDate() - daysToSubtract);
    
    // Use local time formatting to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    
    // Create a new date from the local date string to ensure consistent timezone handling
    return new Date(`${year}-${month}-${dayOfMonth}T00:00:00`);
  },
  
  getWeekDates: (startDate, weekStartDay = null) => {
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
    
    // Weekly habits: streak = consecutive weeks target met
    if (habitUtils.isWeeklyHabit(habit)) {
      return habitUtils.calculateWeeklyStreak(habitId, habit, completions, endDate);
    }

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

  // Weekly streak: consecutive weeks where completions >= weeklyTarget
  calculateWeeklyStreak: (habitId, habit, completions, endDate = new Date()) => {
    const target = habit.weeklyTarget || 3;
    let streak = 0;
    const currentWeekStart = habitUtils.getWeekStart(endDate);
    const cursor = new Date(currentWeekStart);

    // Helper: count completions in a Mon-Sun week
    const countWeekCompletions = (weekStartDate) => {
      let count = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStartDate);
        day.setDate(day.getDate() + d);
        const dateStr = habitUtils.normalizeDate(day);
        const key = `${dateStr}_${habitId}`;
        if (completions.has(key)) {
          const entry = completions.get(key);
          if (entry && (entry.completed || entry === true)) count++;
        }
      }
      return count;
    };

    // Check current week
    const currentCount = countWeekCompletions(cursor);
    if (currentCount >= target) {
      streak = 1;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      // Current week not met yet, check previous weeks
      cursor.setDate(cursor.getDate() - 7);
    }

    // Walk backward through previous weeks (max ~2 years)
    for (let i = 0; i < 104; i++) {
      const count = countWeekCompletions(cursor);
      if (count >= target) {
        streak++;
        cursor.setDate(cursor.getDate() - 7);
      } else {
        break;
      }
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
  // ── Month / Year navigation helpers ──

  /** First day of the month as Date */
  getMonthStart: (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },

  /** 6×7 calendar grid padded with prev/next month days.
   *  Returns array of 42 cell objects. */
  getMonthCalendarGrid: (date, weekStartDay = null) => {
    let startDay = weekStartDay;
    if (startDay === null) {
      try {
        const userPreferencesService = require('../services/userPreferencesService').default;
        startDay = userPreferencesService.getWeekStartDay();
      } catch { startDay = 1; }
    }

    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // How many padding days from previous month?
    const firstDow = firstOfMonth.getDay(); // 0=Sun
    const padBefore = (firstDow - startDay + 7) % 7;

    const cells = [];
    const cursor = new Date(firstOfMonth);
    cursor.setDate(cursor.getDate() - padBefore);

    const totalCells = Math.max(35, padBefore + daysInMonth <= 35 ? 35 : 42);

    for (let i = 0; i < totalCells; i++) {
      cells.push({
        date: habitUtils.normalizeDate(cursor),
        dateObj: new Date(cursor),
        isCurrentMonth: cursor.getMonth() === month,
        isToday: habitUtils.isToday(cursor),
        day: cursor.getDate(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  },

  /** Returns 12 month summary objects for a given year */
  getYearMonths: (year) => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0);
      months.push({
        month: m,
        label: start.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: start.toLocaleDateString('en-US', { month: 'long' }),
        startDate: start,
        endDate: end,
        daysInMonth: end.getDate(),
      });
    }
    return months;
  },

  /** Get {start, end} Date pair for a given view + anchor date */
  getDateRangeForView: (view, anchorDate) => {
    const d = new Date(anchorDate);
    if (view === 'week') {
      const start = habitUtils.getWeekStart(d);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    }
    if (view === 'month') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { start, end };
    }
    // year
    const start = new Date(d.getFullYear(), 0, 1);
    const end = new Date(d.getFullYear(), 11, 31);
    return { start, end };
  },

  /** Shift anchor date by ±1 unit for the given view */
  navigateRange: (view, anchorDate, direction) => {
    const d = new Date(anchorDate);
    if (view === 'week') {
      d.setDate(d.getDate() + direction * 7);
    } else if (view === 'month') {
      d.setMonth(d.getMonth() + direction);
    } else {
      d.setFullYear(d.getFullYear() + direction);
    }
    return d;
  },

  /** Human-readable label for the current range */
  getRangeLabel: (view, anchorDate) => {
    const d = new Date(anchorDate);
    if (view === 'week') {
      const { start, end } = habitUtils.getDateRangeForView('week', d);
      const opts = { month: 'short', day: 'numeric' };
      return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
    }
    if (view === 'month') {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return String(d.getFullYear());
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
