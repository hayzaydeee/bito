const express = require('express');
const request = require('supertest');

const mockAddReaction = jest.fn().mockResolvedValue(undefined);

jest.mock('../middleware/auth', () => ({
  authenticateJWT: (req, _res, next) => {
    req.user = { _id: 'user-1' };
    next();
  },
}));

jest.mock('../models/Activity', () => ({
  findById: jest.fn().mockResolvedValue({
    groupId: 'group-1',
    addReaction: mockAddReaction,
    reactions: [],
  }),
}));

jest.mock('../models/Group', () => ({
  findById: jest.fn().mockResolvedValue({
    isMember: () => true,
  }),
}));

jest.mock('../models/Challenge', () => ({}));
jest.mock('../models/Habit', () => ({}));
jest.mock('../controllers/challengeController', () => ({
  invalidateCache: jest.fn(),
}));

describe('Challenge route write throttling', () => {
  test('throttles repeated feed reaction writes', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', require('../routes/challenges'));

    let lastResponse;
    for (let i = 0; i < 21; i += 1) {
      lastResponse = await request(app)
        .post('/api/feed/event-1/reactions')
        .send({ type: 'like' });
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body).toEqual(expect.objectContaining({
      success: false,
      error: 'Too many requests. Please try again later.',
    }));
  });
});
