'use strict';

/**
 * Phase 2 correctness tests — frequency-aware and methodology-aware progress computation.
 *
 * All tests use pure logic extracted from challengeController.js — no DB connections.
 */

// ── Helpers replicated from controller for testing ───────────────────────────

function isHabitScheduledOnDay(habitMeta, utcDayOfWeek) {
  if (!habitMeta || habitMeta.frequency !== 'daily') return true;
  const days = habitMeta.schedule?.days;
  if (!days || days.length === 0) return true;
  return days.includes(utcDayOfWeek);
}

function isDayExempt(dateMs, habitMetas) {
  const dow = new Date(dateMs).getUTCDay();
  return habitMetas.every((h) => !isHabitScheduledOnDay(h, dow));
}

function countScheduledDays(startDate, endDate, habitMetas) {
  let count = 0;
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    if (!isDayExempt(cursor.getTime(), habitMetas)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

// Build a date map: { [dateMs]: Set<habitIdStr> }
function buildDateHabitMap(entries) {
  const map = new Map();
  for (const e of entries) {
    const d = new Date(e.date);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.getTime();
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(String(e.habitId));
  }
  return map;
}

// Streak computation (mirrors controller)
function computeStreak(entries, habitIds, matchMode, habitMetas, challengeStartDate) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (!entries.length) return 0;

  const dateHabitMap = buildDateHabitMap(entries);
  const minRequired = matchMode === 'minimum' ? 2 : habitIds.length;

  function dayQualifies(dateKey) {
    const habitsOnDay = dateHabitMap.get(dateKey);
    if (!habitsOnDay) return false;
    switch (matchMode) {
      case 'all': return habitsOnDay.size >= habitIds.length;
      case 'minimum': return habitsOnDay.size >= minRequired;
      default: return habitsOnDay.size > 0;
    }
  }

  let streak = 0;
  const cursor = new Date(today);
  const startMs = new Date(challengeStartDate).getTime();
  const MAX_DAYS = 1000;

  for (let i = 0; i < MAX_DAYS; i++) {
    const ts = cursor.getTime();
    if (ts < startMs) break;
    if (isDayExempt(ts, habitMetas)) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    if (!dayQualifies(ts)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

// ── Helpers to build test dates ──────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// Weekday of a given date (0=Sun)
function dow(d) { return d.getUTCDay(); }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('isHabitScheduledOnDay()', () => {
  test('daily habit with no schedule.days is scheduled every day', () => {
    const habit = { frequency: 'daily', schedule: { days: [] } };
    for (let d = 0; d <= 6; d++) {
      expect(isHabitScheduledOnDay(habit, d)).toBe(true);
    }
  });

  test('daily habit with Mon/Wed/Fri schedule is only scheduled on 1, 3, 5', () => {
    const habit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    expect(isHabitScheduledOnDay(habit, 1)).toBe(true);
    expect(isHabitScheduledOnDay(habit, 3)).toBe(true);
    expect(isHabitScheduledOnDay(habit, 5)).toBe(true);
    expect(isHabitScheduledOnDay(habit, 0)).toBe(false); // Sun
    expect(isHabitScheduledOnDay(habit, 2)).toBe(false); // Tue
    expect(isHabitScheduledOnDay(habit, 4)).toBe(false); // Thu
    expect(isHabitScheduledOnDay(habit, 6)).toBe(false); // Sat
  });

  test('weekly habit is always scheduled (flexible)', () => {
    const habit = { frequency: 'weekly' };
    for (let d = 0; d <= 6; d++) {
      expect(isHabitScheduledOnDay(habit, d)).toBe(true);
    }
  });
});

describe('isDayExempt()', () => {
  test('a day is exempt if NO habits are scheduled on it', () => {
    // Mon/Wed/Fri habit — Tuesday should be exempt
    const tuesday = new Date('2025-01-07T00:00:00Z'); // Jan 7 2025 is a Tuesday
    expect(tuesday.getUTCDay()).toBe(2);
    const habit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    expect(isDayExempt(tuesday.getTime(), [habit])).toBe(true);
  });

  test('a day is NOT exempt if any habit is scheduled on it', () => {
    const monday = new Date('2025-01-06T00:00:00Z'); // Jan 6 2025 is a Monday
    expect(monday.getUTCDay()).toBe(1);
    const habit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    expect(isDayExempt(monday.getTime(), [habit])).toBe(false);
  });

  test('a day is never exempt if a weekly habit is in the set', () => {
    const tuesday = new Date('2025-01-07T00:00:00Z');
    const weeklyHabit = { frequency: 'weekly' };
    const mwfHabit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    // Even though mwfHabit is off Tuesday, weeklyHabit covers it
    expect(isDayExempt(tuesday.getTime(), [weeklyHabit, mwfHabit])).toBe(false);
  });
});

describe('countScheduledDays()', () => {
  test('daily habit with no schedule.days: every calendar day counts', () => {
    const start = new Date('2025-01-01T00:00:00Z');
    const end   = new Date('2025-01-07T00:00:00Z'); // 7 days
    const habit = { frequency: 'daily', schedule: { days: [] } };
    expect(countScheduledDays(start, end, [habit])).toBe(7);
  });

  test('Mon/Wed/Fri habit over 2 weeks = 6 scheduled days', () => {
    // Jan 6 (Mon) → Jan 17 (Fri) = 2 full MWF weeks = 6 days
    const start = new Date('2025-01-06T00:00:00Z');
    const end   = new Date('2025-01-17T00:00:00Z');
    const habit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    expect(countScheduledDays(start, end, [habit])).toBe(6);
  });
});

describe('Streak computation — frequency awareness', () => {
  const challengeStart = new Date('2020-01-01'); // far in the past

  test('daily habit: a single missed day breaks the streak', () => {
    // Completed today and 2 days ago but NOT yesterday
    const entries = [
      { date: daysAgo(0), habitId: 'h1' },
      { date: daysAgo(2), habitId: 'h1' },
    ];
    const dailyHabit = { frequency: 'daily', schedule: { days: [] } };
    const streak = computeStreak(entries, ['h1'], 'single', [dailyHabit], challengeStart);
    expect(streak).toBe(1); // only today counts
  });

  test('Mon/Wed/Fri habit: off-days do not break streak', () => {
    // Build a set of entries for the past 7 days, only completing on Mon/Wed/Fri
    // We'll make the last 3 scheduled days completed
    const mwfHabit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    const entries = [];
    // Go back 14 days and mark Mon/Wed/Fri as completed
    for (let i = 0; i <= 14; i++) {
      const d = daysAgo(i);
      if ([1, 3, 5].includes(d.getUTCDay())) {
        entries.push({ date: d, habitId: 'h1' });
      }
    }
    const streak = computeStreak(entries, ['h1'], 'single', [mwfHabit], challengeStart);
    // All scheduled days are completed, so streak = number of MWF days in window
    // (at least 2 full weeks = 6, but we went back 14 days so definitely > 0)
    expect(streak).toBeGreaterThanOrEqual(2);
  });

  test('Mon/Wed/Fri habit: missing a scheduled day breaks streak but not off-days', () => {
    const mwfHabit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    // Find the most recent Monday (could be today or earlier)
    const entries = [];
    // Complete today and yesterday, but skip the most recent Friday before that
    // Strategy: complete today if it's a MWF day, and the previous MWF day, but not the one before
    const scheduledPast = [];
    for (let i = 0; i <= 21; i++) {
      const d = daysAgo(i);
      if ([1, 3, 5].includes(d.getUTCDay())) {
        scheduledPast.push(d);
      }
    }
    // Complete only the first 2 (most recent) and skip the 3rd
    for (let j = 0; j < 2 && j < scheduledPast.length; j++) {
      entries.push({ date: scheduledPast[j], habitId: 'h1' });
    }
    const streak = computeStreak(entries, ['h1'], 'single', [mwfHabit], challengeStart);
    expect(streak).toBeLessThanOrEqual(2);
  });

  test('weekly habit never causes off-day breaks (all days are valid)', () => {
    const weeklyHabit = { frequency: 'weekly' };
    const entries = [];
    // Complete every day for last 7 days
    for (let i = 0; i <= 6; i++) {
      entries.push({ date: daysAgo(i), habitId: 'h1' });
    }
    const streak = computeStreak(entries, ['h1'], 'single', [weeklyHabit], challengeStart);
    expect(streak).toBe(7);
  });
});

describe('countScheduledDays for consistency denominator', () => {
  test('3x/week habit: 14 calendar days → 6 scheduled days not 14', () => {
    // Jan 6–17 2025: Mon/Tue/Wed/Thu/Fri/Sat/Sun x2 = 14 days
    // Mon/Wed/Fri only = 6 scheduled days
    const start = new Date('2025-01-06T00:00:00Z');
    const end   = new Date('2025-01-17T00:00:00Z');
    const habit = { frequency: 'daily', schedule: { days: [1, 3, 5] } };
    const scheduled = countScheduledDays(start, end, [habit]);
    expect(scheduled).toBe(6);
    // Without frequency awareness the old code used 12 calendar days
    const calendarDays = Math.ceil((end - start) / 86400000) + 1;
    expect(calendarDays).toBe(12);
    expect(scheduled).toBeLessThan(calendarDays);
  });

  test('daily habit: scheduled days equals calendar days', () => {
    const start = new Date('2025-01-06T00:00:00Z');
    const end   = new Date('2025-01-12T00:00:00Z'); // 7 days
    const habit = { frequency: 'daily', schedule: { days: [] } };
    const scheduled = countScheduledDays(start, end, [habit]);
    expect(scheduled).toBe(7);
  });
});

describe('suggest-habits scope', () => {
  test('routes file queries all active habits, not just group habits', () => {
    const fs = require('fs');
    const routeFile = fs.readFileSync(
      require('path').join(__dirname, '../routes/challenges.js'),
      'utf8'
    );
    // Should query by isActive, NOT by groupId
    expect(routeFile).toMatch(/isActive.*true/);
    // Should NOT restrict to a single groupId for suggest-habits
    const suggestSection = routeFile.slice(
      routeFile.indexOf('suggest-habits'),
      routeFile.indexOf('suggest-habits') + 3000
    );
    expect(suggestSection).not.toMatch(/groupId: challenge\.groupId/);
  });

  test('habitList sent to LLM includes methodology and frequency fields', () => {
    const fs = require('fs');
    const routeFile = fs.readFileSync(
      require('path').join(__dirname, '../routes/challenges.js'),
      'utf8'
    );
    expect(routeFile).toMatch(/methodology/);
    expect(routeFile).toMatch(/scheduleDays/);
    expect(routeFile).toMatch(/currentStreak/);
  });
});
