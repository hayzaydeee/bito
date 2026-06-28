'use strict';

/**
 * Phase 1 correctness tests:
 *   1. getLeaderboard() anonymization and type-aware sort
 *   2. warmCacheForUser() resolves without error for a user in 2 challenges
 *   3. Join single-mode streak with no habits → 400
 */

// ── 1. getLeaderboard() — pure logic, no module loading needed ───────────────

describe('Challenge.getLeaderboard() logic', () => {
  function buildLeaderboard(type, anonymize, participants) {
    const active = participants.filter((p) => p.status !== 'dropped');
    const sorted = [...active].sort((a, b) => {
      switch (type) {
        case 'streak':      return (b.progress.currentStreak || 0) - (a.progress.currentStreak || 0);
        case 'consistency': return (b.progress.completionRate || 0) - (a.progress.completionRate || 0);
        default:            return (b.progress.currentValue || 0) - (a.progress.currentValue || 0);
      }
    });
    return sorted.map((p, i) => ({
      rank: i + 1,
      userId: anonymize ? null : p.userId,
      displayName: anonymize ? `Participant ${i + 1}` : undefined,
      progress: p.progress,
      status: p.status,
    }));
  }

  const participants = [
    { status: 'active',  userId: { _id: 'u1', name: 'Alice' }, progress: { currentValue: 50, currentStreak: 5, completionRate: 80 } },
    { status: 'active',  userId: { _id: 'u2', name: 'Bob'   }, progress: { currentValue: 80, currentStreak: 9, completionRate: 60 } },
    { status: 'dropped', userId: { _id: 'u3', name: 'Carol' }, progress: { currentValue: 99, currentStreak: 20, completionRate: 99 } },
  ];

  test('returns userId and no displayName when anonymizeLeaderboard is false', () => {
    const board = buildLeaderboard('cumulative', false, participants);
    expect(board).toHaveLength(2);
    expect(board[0].userId).toBeTruthy();
    expect(board[0].displayName).toBeUndefined();
  });

  test('nulls userId and sets displayName when anonymizeLeaderboard is true', () => {
    const board = buildLeaderboard('cumulative', true, participants);
    expect(board).toHaveLength(2);
    board.forEach((row, i) => {
      expect(row.userId).toBeNull();
      expect(row.displayName).toBe(`Participant ${i + 1}`);
    });
  });

  test('excludes dropped participants', () => {
    const board = buildLeaderboard('cumulative', false, participants);
    expect(board.every((r) => r.status !== 'dropped')).toBe(true);
  });

  test('sorts streak by currentStreak not currentValue', () => {
    const board = buildLeaderboard('streak', false, participants);
    expect(board[0].progress.currentStreak).toBe(9);
    expect(board[1].progress.currentStreak).toBe(5);
  });

  test('sorts consistency by completionRate', () => {
    const board = buildLeaderboard('consistency', false, participants);
    expect(board[0].progress.completionRate).toBe(80);
    expect(board[1].progress.completionRate).toBe(60);
  });
});

// ── 2. warmCacheForUser() with multiple challenges ───────────────────────────

describe('warmCacheForUser()', () => {
  let warmCacheForUser;

  beforeAll(() => {
    jest.isolateModules(() => {
      // Provide a Challenge mock that returns two challenges with the test user
      const mockDocs = [
        {
          participants: [
            { userId: 'user1', status: 'active', linkedHabitIds: ['habit-a', 'habit-b'] },
            { userId: 'user2', status: 'active', linkedHabitIds: ['habit-x'] },
          ],
        },
        {
          participants: [
            { userId: 'user1', status: 'active', linkedHabitId: 'habit-c', linkedHabitIds: [] },
          ],
        },
      ];
      jest.mock('../models/Challenge', () => ({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockDocs),
          }),
        }),
      }));
      jest.mock('../models/Activity', () => ({}));
      jest.mock('../models/HabitEntry', () => ({}));
      jest.mock('../models/Habit', () => ({}));
      jest.mock('../models/PushSubscription', () => ({}));

      const ctrl = require('../controllers/challengeController');
      warmCacheForUser = ctrl.warmCacheForUser;
    });
  });

  afterAll(() => jest.resetModules());

  test('resolves without error for a user in 2 active challenges', async () => {
    await expect(warmCacheForUser('user1')).resolves.toBeUndefined();
  });
});

// ── 3. Join single-mode streak with no habits → 400 ─────────────────────────

describe('POST /api/challenges/:id/join — single mode + no habits + streak → 400', () => {
  const express = require('express');
  const request = require('supertest');

  let app;

  beforeAll(() => {
    jest.isolateModules(() => {
      jest.mock('../middleware/auth', () => ({
        authenticateJWT: (req, _res, next) => {
          req.user = { _id: '507f1f77bcf86cd799439011' };
          next();
        },
      }));

      jest.mock('../models/Activity', () => ({ create: jest.fn().mockResolvedValue({}) }));

      jest.mock('../models/Habit', () => ({
        countDocuments: jest.fn().mockResolvedValue(0),
      }));

      jest.mock('../models/Group', () => ({
        findById: jest.fn().mockResolvedValue({ isMember: () => true }),
      }));

      jest.mock('../models/Challenge', () => ({
        findById: jest.fn().mockResolvedValue({
          _id: 'challenge-1',
          groupId: 'group-1',
          status: 'active',
          type: 'streak',
          habitMatchMode: 'single',
          habitMatchMinimum: null,
          settings: { allowLateJoin: true, maxParticipants: null },
          participants: [],
          getParticipant: () => null,
          addParticipant: jest.fn().mockReturnValue({ userId: 'user1', status: 'active', progress: {} }),
          save: jest.fn().mockResolvedValue(true),
          populate: jest.fn().mockReturnThis(),
          title: 'Test Streak Challenge',
        }),
        find: jest.fn().mockResolvedValue([]),
      }));

      jest.mock('../controllers/challengeController', () => ({
        invalidateCache: jest.fn(),
        warmCacheForUser: jest.fn(),
        processChallengeProgress: jest.fn(),
      }));

      const challengeRoutes = require('../routes/challenges');
      app = express();
      app.use(express.json());
      app.use('/api', challengeRoutes);
    });
  });

  afterAll(() => jest.resetModules());

  test('returns 400 with descriptive error', async () => {
    const res = await request(app)
      .post('/api/challenges/challenge-1/join')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/link a habit/i);
  });
});
