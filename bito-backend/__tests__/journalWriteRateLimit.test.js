const express = require('express');
const request = require('supertest');

const mockJournalEntry = {
  isNew: false,
  updateContent: jest.fn().mockResolvedValue(undefined),
  populate: jest.fn().mockResolvedValue(undefined),
  save: jest.fn().mockResolvedValue(undefined),
  extractPlainText: jest.fn().mockReturnValue('extracted'),
};

const mockJournalV2Entry = {
  populate: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../middleware/auth', () => ({
  authenticateJWT: (req, _res, next) => {
    req.user = { id: 'test-user', _id: 'test-user' };
    next();
  },
}));

jest.mock('../models/JournalEntry', () => ({
  findOrCreateDaily: jest.fn().mockResolvedValue(mockJournalEntry),
}));

jest.mock('../models/JournalEntryV2', () => ({
  createMicro: jest.fn().mockResolvedValue(mockJournalV2Entry),
  extractPlainText: jest.fn().mockReturnValue('extracted'),
}));

describe('Journal write rate limiting', () => {
  test('throttles repeated POST /api/journal/:date writes', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/journal', require('../routes/journal'));

    let lastResponse;
    for (let i = 0; i < 21; i += 1) {
      lastResponse = await request(app)
        .post('/api/journal/2026-03-21')
        .send({ plainTextContent: `entry-${i}` });
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body).toEqual(expect.objectContaining({
      success: false,
      error: 'Too many requests. Please try again later.',
    }));
  });

  test('throttles repeated POST /api/journal-v2/micro/:date writes', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/journal-v2', require('../routes/journalV2'));

    let lastResponse;
    for (let i = 0; i < 21; i += 1) {
      lastResponse = await request(app)
        .post('/api/journal-v2/micro/2026-03-21')
        .send({ text: `micro-${i}` });
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body).toEqual(expect.objectContaining({
      success: false,
      error: 'Too many requests. Please try again later.',
    }));
  });
});
