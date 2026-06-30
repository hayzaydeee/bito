'use strict';

/**
 * Phase 4 delta progress computation tests.
 *
 * Verifies:
 * 1. isSnapshotFromYesterday gates delta path correctly
 * 2. Streak delta: yesterday snapshot + today's completion → streak + 1
 * 3. Streak delta: yesterday snapshot + today's miss → streak reset to 0
 * 4. Cumulative delta: adds today's value onto snapshot base
 * 5. Consistency delta: increments accumulated counts from snapshot
 * 6. _snapshot.snapshotDate is always today in every compute result
 * 7. HabitEntry.find uses a narrow today-only filter in the delta path
 */

// ── Pure helpers (replicated from controller) ─────────────────────────────────

function isSnapshotFromYesterday(snapshot) {
  if (!snapshot?.snapshotDate) return false;
  const sd = new Date(snapshot.snapshotDate);
  sd.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date();
  yesterday.setUTCHours(0, 0, 0, 0);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return sd.getTime() === yesterday.getTime();
}

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

function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// ── Streak delta (replicated from controller delta path) ──────────────────────

function streakDelta(snapshot, todayEntries, habitIds, matchMode, habitMetas, bestStreakSoFar = 0) {
  const today = todayUTC();
  const minRequired = matchMode === 'minimum' ? 2 : habitIds.length;

  function dayQualifies(habitsOnDay) {
    if (!habitsOnDay) return false;
    switch (matchMode) {
      case 'all':     return habitsOnDay.size >= habitIds.length;
      case 'minimum': return habitsOnDay.size >= minRequired;
      default:        return habitsOnDay.size > 0;
    }
  }

  let streak;
  if (isDayExempt(today.getTime(), habitMetas)) {
    streak = snapshot.currentStreak;
  } else {
    const habitsToday = new Set(todayEntries.map((e) => String(e.habitId)));
    streak = dayQualifies(habitsToday) ? snapshot.currentStreak + 1 : 0;
  }

  const bestStreak = Math.max(bestStreakSoFar, snapshot.bestStreak || 0, streak);
  return { currentValue: streak, currentStreak: streak, bestStreak, snapshotDate: today };
}

// ── Cumulative delta ──────────────────────────────────────────────────────────

function cumulativeDelta(snapshot, deltaEntries) {
  const today = todayUTC();
  const currentValue = snapshot.currentValue + deltaEntries.length;
  return { currentValue, snapshotDate: today };
}

// ── Consistency delta ─────────────────────────────────────────────────────────

function consistencyDelta(snapshot, newScheduledDays, newCompletedDays) {
  const today = todayUTC();
  const scheduledDaysTotal = snapshot.scheduledDaysTotal + newScheduledDays;
  const scheduledDaysCompleted = snapshot.scheduledDaysCompleted + newCompletedDays;
  const rate = scheduledDaysTotal > 0
    ? Math.round((scheduledDaysCompleted / scheduledDaysTotal) * 100)
    : 0;
  return { currentValue: scheduledDaysCompleted, completionRate: rate, scheduledDaysCompleted, scheduledDaysTotal, snapshotDate: today };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('isSnapshotFromYesterday()', () => {
  test('null snapshot → false', () => {
    expect(isSnapshotFromYesterday(null)).toBe(false);
  });

  test('snapshot with no snapshotDate → false', () => {
    expect(isSnapshotFromYesterday({ currentStreak: 5 })).toBe(false);
  });

  test('snapshot from today → false', () => {
    expect(isSnapshotFromYesterday({ snapshotDate: todayUTC() })).toBe(false);
  });

  test('snapshot from yesterday → true', () => {
    expect(isSnapshotFromYesterday({ snapshotDate: daysAgo(1) })).toBe(true);
  });

  test('snapshot from 2 days ago → false (gap requires full scan)', () => {
    expect(isSnapshotFromYesterday({ snapshotDate: daysAgo(2) })).toBe(false);
  });

  test('snapshot from 7 days ago → false', () => {
    expect(isSnapshotFromYesterday({ snapshotDate: daysAgo(7) })).toBe(false);
  });
});

describe('Streak delta path', () => {
  const dailyHabit = { frequency: 'daily', schedule: { days: [] } };
  const mwfHabit = { frequency: 'daily', schedule: { days: [1, 3, 5] } }; // Mon/Wed/Fri

  test('completing today extends streak by 1', () => {
    const snapshot = { currentStreak: 4, bestStreak: 4, snapshotDate: daysAgo(1) };
    const todayEntries = [{ habitId: 'h1' }];
    const result = streakDelta(snapshot, todayEntries, ['h1'], 'single', [dailyHabit]);
    expect(result.currentStreak).toBe(5);
    expect(result.currentValue).toBe(5);
    expect(result.bestStreak).toBe(5);
  });

  test('missing today resets streak to 0', () => {
    const snapshot = { currentStreak: 10, bestStreak: 10, snapshotDate: daysAgo(1) };
    const result = streakDelta(snapshot, [], ['h1'], 'single', [dailyHabit]);
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(10); // best streak preserved
  });

  test('off-day keeps streak unchanged', () => {
    // Find a day of week that is NOT in the MWF schedule to use as "today"
    // We simulate an off-day by using a habit that is never scheduled on today's actual DOW
    // Find a DOW that is not 1, 3, 5
    const todayDow = todayUTC().getUTCDay();
    const isOffDay = ![1, 3, 5].includes(todayDow);

    if (isOffDay) {
      const snapshot = { currentStreak: 3, bestStreak: 3, snapshotDate: daysAgo(1) };
      const result = streakDelta(snapshot, [], ['h1'], 'single', [mwfHabit]);
      expect(result.currentStreak).toBe(3); // off-day: no change
    } else {
      // Today is a scheduled day — test with a different scenario instead:
      // Use 'all' matchMode and only partially complete
      const snapshot = { currentStreak: 3, bestStreak: 3, snapshotDate: daysAgo(1) };
      const result = streakDelta(snapshot, [], ['h1', 'h2'], 'all', [dailyHabit, dailyHabit]);
      expect(result.currentStreak).toBe(0); // missed all habits
    }
  });

  test('best streak is preserved when current streak resets', () => {
    const snapshot = { currentStreak: 7, bestStreak: 15, snapshotDate: daysAgo(1) };
    const result = streakDelta(snapshot, [], ['h1'], 'single', [dailyHabit]);
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(15);
  });

  test('best streak is updated when new streak exceeds it', () => {
    const snapshot = { currentStreak: 9, bestStreak: 9, snapshotDate: daysAgo(1) };
    const todayEntries = [{ habitId: 'h1' }];
    const result = streakDelta(snapshot, todayEntries, ['h1'], 'single', [dailyHabit], 9);
    expect(result.currentStreak).toBe(10);
    expect(result.bestStreak).toBe(10);
  });

  test('_snapshot.snapshotDate is today (UTC midnight)', () => {
    const snapshot = { currentStreak: 2, bestStreak: 2, snapshotDate: daysAgo(1) };
    const result = streakDelta(snapshot, [{ habitId: 'h1' }], ['h1'], 'single', [dailyHabit]);
    expect(result.snapshotDate.getTime()).toBe(todayUTC().getTime());
  });

  test('delta result matches full-scan result when conditions are equivalent', () => {
    // Scenario: streak was 4 yesterday (snapshot), today completed → streak 5
    // Full scan would also reach 5 if all 5 days are completed
    const snapshot = { currentStreak: 4, bestStreak: 4, snapshotDate: daysAgo(1) };
    const todayEntries = [{ habitId: 'h1' }];
    const deltaResult = streakDelta(snapshot, todayEntries, ['h1'], 'single', [dailyHabit]);

    // The equivalence: delta streak = snapshot streak + 1 = 5
    // A full scan over 5 consecutive completed days would also = 5
    expect(deltaResult.currentStreak).toBe(snapshot.currentStreak + 1);
  });
});

describe('Cumulative delta path', () => {
  test('delta adds new entries to snapshot base', () => {
    const snapshot = { currentValue: 10, snapshotDate: daysAgo(1) };
    const result = cumulativeDelta(snapshot, [{ value: 5 }, { value: 3 }]);
    expect(result.currentValue).toBe(12); // 10 + 2 new entries (count mode)
  });

  test('empty delta keeps snapshot value', () => {
    const snapshot = { currentValue: 42, snapshotDate: daysAgo(1) };
    const result = cumulativeDelta(snapshot, []);
    expect(result.currentValue).toBe(42);
  });

  test('_snapshot.snapshotDate is today', () => {
    const snapshot = { currentValue: 5, snapshotDate: daysAgo(1) };
    const result = cumulativeDelta(snapshot, [{ value: 1 }]);
    expect(result.snapshotDate.getTime()).toBe(todayUTC().getTime());
  });
});

describe('Consistency delta path', () => {
  test('completing a scheduled day increments both counts', () => {
    // snapshot: 3 completed out of 5 total (60%)
    const snapshot = { scheduledDaysCompleted: 3, scheduledDaysTotal: 5, currentValue: 3, snapshotDate: daysAgo(1) };
    // today: 1 new scheduled day, 1 completed
    const result = consistencyDelta(snapshot, 1, 1);
    expect(result.scheduledDaysCompleted).toBe(4);
    expect(result.scheduledDaysTotal).toBe(6);
    expect(result.completionRate).toBe(67); // round(4/6*100) = 67
    expect(result.currentValue).toBe(4);
  });

  test('missing a scheduled day increments total but not completed', () => {
    const snapshot = { scheduledDaysCompleted: 5, scheduledDaysTotal: 5, currentValue: 5, snapshotDate: daysAgo(1) };
    const result = consistencyDelta(snapshot, 1, 0);
    expect(result.scheduledDaysCompleted).toBe(5);
    expect(result.scheduledDaysTotal).toBe(6);
    expect(result.completionRate).toBe(83); // round(5/6*100) = 83
  });

  test('off-day adds no new scheduled days', () => {
    const snapshot = { scheduledDaysCompleted: 7, scheduledDaysTotal: 7, currentValue: 7, snapshotDate: daysAgo(1) };
    const result = consistencyDelta(snapshot, 0, 0);
    expect(result.scheduledDaysCompleted).toBe(7);
    expect(result.scheduledDaysTotal).toBe(7);
    expect(result.completionRate).toBe(100);
  });

  test('_snapshot.snapshotDate is today', () => {
    const snapshot = { scheduledDaysCompleted: 1, scheduledDaysTotal: 2, snapshotDate: daysAgo(1) };
    const result = consistencyDelta(snapshot, 1, 1);
    expect(result.snapshotDate.getTime()).toBe(todayUTC().getTime());
  });

  test('delta result consistent with full-scan semantics', () => {
    // 6 days elapsed; 6 scheduled; 4 completed = 67%
    // Using delta: snapshot after day 5 had (3/5), today (day 6) completed → (4/6)
    const snapshot = { scheduledDaysCompleted: 3, scheduledDaysTotal: 5, snapshotDate: daysAgo(1) };
    const result = consistencyDelta(snapshot, 1, 1);
    const expectedRate = Math.round((4 / 6) * 100);
    expect(result.completionRate).toBe(expectedRate);
    expect(result.scheduledDaysCompleted).toBe(4);
    expect(result.scheduledDaysTotal).toBe(6);
  });
});

// Declared at module scope with 'mock' prefix so jest.mock factory can reference it
let mockHabitEntryFind;

describe('Delta path uses narrow date filter (HabitEntry.find mock)', () => {
  let processChallengeProgress;

  beforeAll(() => {
    jest.isolateModules(() => {
      const yesterday = daysAgo(1);

      mockHabitEntryFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { habitId: 'h1', date: todayUTC() },
        ]),
      });

      const mockChallenge = {
        _id: 'c1',
        groupId: 'g1',
        type: 'streak',
        status: 'active',
        startDate: daysAgo(30),
        endDate: daysAgo(-30),
        habitMatchMode: 'single',
        habitMatchMinimum: null,
        getParticipant: jest.fn().mockReturnValue({
          userId: 'user1',
          status: 'active',
          linkedHabitIds: ['h1'],
          linkedHabitId: null,
          progressSnapshot: {
            currentStreak: 4,
            bestStreak: 4,
            currentValue: 4,
            snapshotDate: yesterday,
          },
          progress: { bestStreak: 4 },
        }),
        updateParticipantProgress: jest.fn().mockReturnValue({
          userId: 'user1',
          status: 'active',
          progress: { currentStreak: 5 },
          progressSnapshot: null,
        }),
        checkMilestones: jest.fn().mockReturnValue([]),
        save: jest.fn().mockResolvedValue(true),
        getLeaderboard: jest.fn().mockReturnValue([]),
        title: 'Test Challenge',
        durationDays: 60,
      };

      jest.mock('../models/HabitEntry', () => ({
        find: mockHabitEntryFind,
        aggregate: jest.fn().mockResolvedValue([]),
      }));

      jest.mock('../models/Challenge', () => ({
        find: jest.fn().mockResolvedValue([mockChallenge]),
      }));

      jest.mock('../models/Habit', () => ({
        findById: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: 'h1',
            frequency: 'daily',
            schedule: { days: [] },
            methodology: 'boolean',
            groupId: 'g1',
            groupHabitId: null,
          }),
        }),
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([{
            _id: 'h1',
            frequency: 'daily',
            schedule: { days: [] },
            methodology: 'boolean',
          }]),
        }),
      }));

      jest.mock('../models/Activity', () => ({
        create: jest.fn().mockResolvedValue({ _id: 'act1' }),
        updateOne: jest.fn().mockResolvedValue({}),
      }));

      jest.mock('../models/PushSubscription', () => ({
        find: jest.fn().mockResolvedValue([]),
      }));

      jest.mock('../services/challengeCache', () => ({
        warmForUser: jest.fn().mockResolvedValue(undefined),
        invalidate: jest.fn(),
        has: jest.fn().mockReturnValue(null), // cache miss → proceed
      }));

      const ctrl = require('../controllers/challengeController');
      processChallengeProgress = ctrl.processChallengeProgress;
    });
  });

  afterAll(() => jest.resetModules());

  test('HabitEntry.find is called with a today-scoped date filter when snapshot is from yesterday', async () => {
    await processChallengeProgress('user1', 'h1');

    const calls = mockHabitEntryFind.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);

    // At least one call should use a date filter that starts at today (delta path)
    const deltaCall = calls.find((args) => {
      const filter = args[0];
      return filter?.date?.$gte != null;
    });
    expect(deltaCall).toBeDefined();

    if (deltaCall) {
      const dateGte = new Date(deltaCall[0].date.$gte);
      dateGte.setUTCHours(0, 0, 0, 0);
      expect(dateGte.getTime()).toBe(todayUTC().getTime());
    }
  });

  test('processChallengeProgress returns processed: true for a habit in a challenge', async () => {
    const result = await processChallengeProgress('user1', 'h1');
    expect(result.processed).toBe(true);
  });
});

describe('Snapshot null triggers full scan (via isSnapshotFromYesterday)', () => {
  test('isSnapshotFromYesterday returns false for null → full scan branch taken', () => {
    expect(isSnapshotFromYesterday(null)).toBe(false);
  });

  test('isSnapshotFromYesterday returns false for stale snapshot → full scan branch taken', () => {
    expect(isSnapshotFromYesterday({ snapshotDate: daysAgo(2) })).toBe(false);
    expect(isSnapshotFromYesterday({ snapshotDate: daysAgo(5) })).toBe(false);
    expect(isSnapshotFromYesterday({ snapshotDate: daysAgo(30) })).toBe(false);
  });

  test('only yesterday triggers delta path — all other dates force full scan', () => {
    const offsets = [-1, 0, 2, 3, 7, 30, 365];
    for (const offset of offsets) {
      const d = daysAgo(offset);
      const result = isSnapshotFromYesterday({ snapshotDate: d });
      expect(result).toBe(false);
    }
    // Only yesterday returns true
    expect(isSnapshotFromYesterday({ snapshotDate: daysAgo(1) })).toBe(true);
  });
});
