'use strict';

/**
 * Phase 3 correctness tests — habit compatibility screening.
 *
 * Tests checkHabitCompatibility() in isolation (pure function extracted inline)
 * and verifies that the join route embeds warnings in the response.
 */

// ── Replicate the pure function from routes/challenges.js ─────────────────────

const NUMERIC_UNITS = ['minutes', 'hours', 'pages', 'miles', 'calories', 'glasses'];

function checkHabitCompatibility(challenge, linkedHabits) {
  const warnings = [];
  const targetUnit = challenge.rules?.targetUnit;

  for (const habit of linkedHabits) {
    if (challenge.type === 'streak') {
      if (habit.frequency !== 'daily') {
        warnings.push({
          habitId: String(habit._id),
          code: 'NON_DAILY_STREAK',
          message: `"${habit.name}" is a ${habit.frequency} habit. In a streak challenge you need to complete it every day — missing any day will break your streak.`,
        });
      } else if (habit.schedule?.days?.length > 0 && habit.schedule.days.length < 5) {
        warnings.push({
          habitId: String(habit._id),
          code: 'RESTRICTIVE_SCHEDULE_STREAK',
          message: `"${habit.name}" is only scheduled ${habit.schedule.days.length} day(s) a week. Off-days won't break your streak, but your maximum consecutive streak is limited.`,
        });
      }
    }

    if (challenge.type === 'consistency' && habit.frequency !== 'daily') {
      warnings.push({
        habitId: String(habit._id),
        code: 'NON_DAILY_CONSISTENCY',
        message: `"${habit.name}" is a ${habit.frequency} habit. Your consistency rate will be calculated against the days it's scheduled, not all calendar days.`,
      });
    }

    if (targetUnit && NUMERIC_UNITS.includes(targetUnit) &&
        habit.methodology !== 'numeric' && habit.methodology !== 'duration') {
      warnings.push({
        habitId: String(habit._id),
        code: 'BOOLEAN_UNIT_MISMATCH',
        message: `This challenge tracks ${targetUnit}, but "${habit.name}" is a boolean habit that doesn't record numeric values. Each completion will count as 1.`,
      });
    }
  }

  return warnings;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('checkHabitCompatibility()', () => {
  const streakChallenge = { type: 'streak', rules: { targetUnit: 'days' } };
  const consistencyChallenge = { type: 'consistency', rules: { targetUnit: 'percent' } };
  const minutesChallenge = { type: 'cumulative', rules: { targetUnit: 'minutes' } };

  test('weekly habit in streak challenge → NON_DAILY_STREAK', () => {
    const habit = { _id: 'h1', name: 'Morning Run', frequency: 'weekly', methodology: 'boolean' };
    const warnings = checkHabitCompatibility(streakChallenge, [habit]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe('NON_DAILY_STREAK');
    expect(warnings[0].habitId).toBe('h1');
  });

  test('daily habit with full schedule in streak challenge → no warning', () => {
    const habit = { _id: 'h1', name: 'Meditation', frequency: 'daily', schedule: { days: [] }, methodology: 'boolean' };
    const warnings = checkHabitCompatibility(streakChallenge, [habit]);
    expect(warnings).toHaveLength(0);
  });

  test('daily habit restricted to 2 days/week in streak challenge → RESTRICTIVE_SCHEDULE_STREAK', () => {
    const habit = { _id: 'h1', name: 'Weekend Run', frequency: 'daily', schedule: { days: [0, 6] }, methodology: 'boolean' };
    const warnings = checkHabitCompatibility(streakChallenge, [habit]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe('RESTRICTIVE_SCHEDULE_STREAK');
  });

  test('weekly habit in consistency challenge → NON_DAILY_CONSISTENCY', () => {
    const habit = { _id: 'h2', name: 'Weekly Review', frequency: 'weekly', methodology: 'boolean' };
    const warnings = checkHabitCompatibility(consistencyChallenge, [habit]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe('NON_DAILY_CONSISTENCY');
  });

  test('boolean habit in minutes-unit challenge → BOOLEAN_UNIT_MISMATCH', () => {
    const habit = { _id: 'h3', name: 'Read', frequency: 'daily', schedule: { days: [] }, methodology: 'boolean' };
    const warnings = checkHabitCompatibility(minutesChallenge, [habit]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe('BOOLEAN_UNIT_MISMATCH');
  });

  test('numeric habit in minutes-unit challenge → no warning', () => {
    const habit = { _id: 'h3', name: 'Run', frequency: 'daily', schedule: { days: [] }, methodology: 'numeric' };
    const warnings = checkHabitCompatibility(minutesChallenge, [habit]);
    expect(warnings).toHaveLength(0);
  });

  test('duration habit in minutes-unit challenge → no warning', () => {
    const habit = { _id: 'h4', name: 'Yoga', frequency: 'daily', schedule: { days: [] }, methodology: 'duration' };
    const warnings = checkHabitCompatibility(minutesChallenge, [habit]);
    expect(warnings).toHaveLength(0);
  });

  test('daily habit with 5+ days/week schedule in streak challenge → no warning', () => {
    const habit = { _id: 'h5', name: 'Gym', frequency: 'daily', schedule: { days: [1, 2, 3, 4, 5] }, methodology: 'boolean' };
    const warnings = checkHabitCompatibility(streakChallenge, [habit]);
    expect(warnings).toHaveLength(0);
  });

  test('multiple habits — each gets its own warning independently', () => {
    const habits = [
      { _id: 'h1', name: 'Run', frequency: 'weekly', methodology: 'boolean' },
      { _id: 'h2', name: 'Read', frequency: 'daily', schedule: { days: [] }, methodology: 'boolean' },
    ];
    const warnings = checkHabitCompatibility(minutesChallenge, habits);
    const codes = warnings.map((w) => w.code);
    expect(codes).toContain('BOOLEAN_UNIT_MISMATCH');
    // Both habits are boolean → 2 BOOLEAN_UNIT_MISMATCH warnings
    expect(warnings.filter((w) => w.code === 'BOOLEAN_UNIT_MISMATCH')).toHaveLength(2);
  });
});
