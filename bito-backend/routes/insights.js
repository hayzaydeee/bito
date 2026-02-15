const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { generateInsights } = require('../services/insightsEngine');
const { enrichWithLLM, isLLMAvailable } = require('../services/llmEnrichment');
const mongoose = require('mongoose');

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Simple in-memory per-user cache (TTL = 1 hour)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(userId) {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(userId);
    return null;
  }
  return entry.data;
}

function setCache(userId, data) {
  cache.set(userId, { data, ts: Date.now() });

  // Evict old entries if cache grows too large
  if (cache.size > 500) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < 100; i++) {
      cache.delete(oldest[i][0]);
    }
  }
}

// @route   GET /api/insights
// @desc    Get AI-powered habit insights for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const forceRefresh = req.query.refresh === 'true';

    // Check cache
    if (!forceRefresh) {
      const cached = getCached(userId);
      if (cached) {
        return res.json({
          success: true,
          data: { ...cached, cached: true },
        });
      }
    }

    // Layer 1: Rule-based insights
    const ruleInsights = await generateInsights(req.user._id);

    // Layer 2: Optional LLM enrichment
    const Habit = mongoose.model('Habit');
    const HabitEntry = mongoose.model('HabitEntry');
    const JournalEntry = mongoose.model('JournalEntry');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [habits, entries, journalEntries] = await Promise.all([
      Habit.find({ userId: req.user._id, isActive: true }).lean(),
      HabitEntry.find({ userId: req.user._id, date: { $gte: thirtyDaysAgo } }).lean(),
      JournalEntry.find({ userId: req.user._id, date: { $gte: thirtyDaysAgo } }).lean(),
    ]);

    const { insights, summary, llmUsed } = await enrichWithLLM(
      ruleInsights,
      habits,
      entries,
      journalEntries
    );

    const responseData = {
      insights,
      summary,
      llmUsed,
      llmAvailable: isLLMAvailable(),
      generatedAt: new Date().toISOString(),
    };

    // Cache the result
    setCache(userId, responseData);

    res.json({
      success: true,
      data: { ...responseData, cached: false },
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
    });
  }
});

// @route   POST /api/insights/dismiss
// @desc    Dismiss a specific insight (clear from cache)
// @access  Private
router.post('/dismiss', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { insightType, habitId } = req.body;

    if (!insightType) {
      return res.status(400).json({
        success: false,
        error: 'insightType is required',
      });
    }

    // Remove from cache to force regeneration on next fetch
    cache.delete(userId);

    res.json({
      success: true,
      message: 'Insight dismissed',
    });
  } catch (error) {
    console.error('Insight dismiss error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss insight',
    });
  }
});

module.exports = router;
