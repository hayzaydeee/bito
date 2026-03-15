const weeklyReportService = require('../services/weeklyReportService');

describe('WeeklyReportService._buildHabitBreakdown', () => {
  test('uses weekly target as denominator (not total logged entries)', () => {
    const habits = [
      {
        _id: 'weekly-habit-1',
        name: 'Workout',
        frequency: 'weekly',
        weeklyTarget: 3,
        stats: { currentStreak: 2, longestStreak: 5 },
      },
    ];

    const entries = [
      { habitId: 'weekly-habit-1', completed: true },
      { habitId: 'weekly-habit-1', completed: false },
      { habitId: 'weekly-habit-1', completed: false },
      { habitId: 'weekly-habit-1', completed: false },
    ];

    const [result] = weeklyReportService._buildHabitBreakdown(habits, entries);
    expect(result.completed).toBe(1);
    expect(result.total).toBe(4);
    expect(result.completionTarget).toBe(3);
    expect(result.rate).toBe(33);
  });

  test('caps weekly completion rate at 100 when over target', () => {
    const habits = [
      {
        _id: 'weekly-habit-2',
        name: 'Reading',
        frequency: 'weekly',
        weeklyTarget: 2,
      },
    ];

    const entries = [
      { habitId: 'weekly-habit-2', completed: true },
      { habitId: 'weekly-habit-2', completed: true },
      { habitId: 'weekly-habit-2', completed: true },
    ];

    const [result] = weeklyReportService._buildHabitBreakdown(habits, entries);
    expect(result.completed).toBe(3);
    expect(result.completionTarget).toBe(2);
    expect(result.rate).toBe(100);
  });

  test('uses fixed 7-day denominator for daily habits even with no entries', () => {
    const habits = [
      {
        _id: 'daily-habit-1',
        name: 'Meditate',
        frequency: 'daily',
      },
    ];

    const entries = [];

    const [result] = weeklyReportService._buildHabitBreakdown(habits, entries);
    expect(result.completed).toBe(0);
    expect(result.total).toBe(0);
    expect(result.completionTarget).toBe(7);
    expect(result.rate).toBe(0);
  });

  test('daily rate is based on completions out of 7 days, not total logs', () => {
    const habits = [
      {
        _id: 'daily-habit-2',
        name: 'Walk',
        frequency: 'daily',
      },
    ];

    const entries = [
      { habitId: 'daily-habit-2', completed: true },
      { habitId: 'daily-habit-2', completed: true },
      { habitId: 'daily-habit-2', completed: false },
      { habitId: 'daily-habit-2', completed: false },
      { habitId: 'daily-habit-2', completed: false },
      { habitId: 'daily-habit-2', completed: false },
    ];

    const [result] = weeklyReportService._buildHabitBreakdown(habits, entries);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(6);
    expect(result.completionTarget).toBe(7);
    expect(result.rate).toBe(29);
  });
});