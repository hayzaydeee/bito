const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { generateInsights } = require('../services/insightsEngine');
const { enrichWithLLM, isLLMAvailable } = require('../services/llmEnrichment');
const { buildSystemPrompt, getTemperature, DEFAULT_PERSONALITY } = require('../prompts/buildSystemPrompt');
const { getUserInsightTier } = require('../utils/insightTier');
const { generateKickstartInsights } = require('../services/kickstartService');
const Habit = require('../models/Habit');
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

    // Determine data-maturity tier
    const tierInfo = await getUserInsightTier(req.user._id);

    // ── Seedling: serve kickstart insights, no LLM ──
    if (tierInfo.tier === 'seedling') {
      const User = mongoose.model('User');
      const user = await User.findById(req.user._id).select('kickstartInsights onboardingData aiPersonality').lean();
      let kickstart = user?.kickstartInsights;

      // Lazy backfill: existing users who onboarded before this feature
      if (!kickstart) {
        try {
          const habits = await Habit.find({ userId: req.user._id, isActive: true })
            .select('name icon category')
            .lean();
          kickstart = await generateKickstartInsights({ user, habits });
          // Persist so we only generate once
          await User.updateOne(
            { _id: req.user._id },
            { $set: { kickstartInsights: kickstart } }
          );
        } catch (err) {
          console.error('[Insights] Kickstart backfill failed:', err.message);
          // Continue with null — will use generic fallback below
        }
      }

      const insights = (kickstart?.insights || []).map(k => ({
        type: 'kickstart',
        title: k.title,
        body: k.body,
        icon: k.icon || '✨',
        category: 'kickstart',
        source: 'kickstart',
        priority: 1,
      }));

      return res.json({
        success: true,
        data: {
          insights,
          summary: kickstart?.summary || 'Start tracking your habits to unlock AI-powered insights.',
          llmUsed: false,
          llmAvailable: isLLMAvailable(),
          generatedAt: kickstart?.generatedAt || new Date().toISOString(),
          tier: tierInfo.tier,
          entryCount: tierInfo.entryCount,
          thresholds: tierInfo.thresholds,
          cached: false,
        },
      });
    }

    // Check cache (sprouting + growing)
    if (!forceRefresh) {
      const cached = getCached(userId);
      if (cached) {
        return res.json({
          success: true,
          data: { ...cached, cached: true, tier: tierInfo.tier, entryCount: tierInfo.entryCount, thresholds: tierInfo.thresholds },
        });
      }
    }

    // Layer 1: Rule-based insights
    const ruleInsights = await generateInsights(req.user._id);

    // Layer 2: LLM enrichment
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

    // Sprouting tier uses constrained early-insight prompt
    const llmFeature = tierInfo.tier === 'sprouting' ? 'early-insight' : 'insight-enrichment';

    const { insights, summary, llmUsed } = await enrichWithLLM(
      ruleInsights,
      habits,
      entries,
      journalEntries,
      req.user.aiPersonality,
      llmFeature
    );

    const responseData = {
      insights,
      summary,
      llmUsed,
      llmAvailable: isLLMAvailable(),
      generatedAt: new Date().toISOString(),
      tier: tierInfo.tier,
      entryCount: tierInfo.entryCount,
      thresholds: tierInfo.thresholds,
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

// @route   GET /api/insights/analytics
// @desc    Comprehensive AI analytics report (sectioned)
// @access  Private
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const range = req.query.range || '30d';
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = `${userId}_analytics_${range}`;

    // Determine data-maturity tier
    const tierInfo = await getUserInsightTier(req.user._id);

    // Seedling: no analytics — not enough data
    if (tierInfo.tier === 'seedling') {
      return res.json({
        success: true,
        data: {
          sections: null,
          ruleInsights: [],
          range,
          rangeDays: 0,
          llmUsed: false,
          generatedAt: new Date().toISOString(),
          tier: tierInfo.tier,
          entryCount: tierInfo.entryCount,
          thresholds: tierInfo.thresholds,
          cached: false,
        },
      });
    }

    // Check cache (sprouting + growing)
    if (!forceRefresh) {
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json({ success: true, data: { ...cached, cached: true, tier: tierInfo.tier, entryCount: tierInfo.entryCount, thresholds: tierInfo.thresholds } });
      }
    }

    // Determine date range
    const rangeDays = range === 'all' ? 365 : parseInt(range) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);

    const Habit = mongoose.model('Habit');
    const HabitEntry = mongoose.model('HabitEntry');
    const JournalEntry = mongoose.model('JournalEntry');

    const [habits, entries, journalEntries] = await Promise.all([
      Habit.find({ userId: req.user._id, isActive: true }).lean(),
      HabitEntry.find({ userId: req.user._id, date: { $gte: startDate } }).lean(),
      JournalEntry.find({ userId: req.user._id, date: { $gte: startDate } }).lean(),
    ]);

    // Layer 1: rule-based insights (reuse engine)
    const ruleInsights = await generateInsights(req.user._id);

    // Build rich data package for LLM
    const analyticsData = buildAnalyticsData(habits, entries, journalEntries, rangeDays);

    // Layer 2: LLM-powered sectioned analysis
    const personality = req.user.aiPersonality || DEFAULT_PERSONALITY;
    const sections = await generateAnalyticsReport(ruleInsights, analyticsData, rangeDays, personality);

    const responseData = {
      sections,
      ruleInsights,
      range,
      rangeDays,
      llmUsed: sections._llmUsed || false,
      generatedAt: new Date().toISOString(),
      tier: tierInfo.tier,
      entryCount: tierInfo.entryCount,
      thresholds: tierInfo.thresholds,
    };
    delete sections._llmUsed;

    setCache(cacheKey, responseData);

    res.json({ success: true, data: { ...responseData, cached: false } });
  } catch (error) {
    console.error('Analytics insights error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate analytics report' });
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

// Clear cached insights for a specific user (e.g. after personality change)
function clearUserCache(userId) {
  cache.delete(String(userId));
}

module.exports = router;
module.exports.clearUserCache = clearUserCache;

// ─── Analytics helpers ─────────────────────────────────────────────────

/**
 * Build comprehensive data snapshot for the analytics LLM prompt.
 */
function buildAnalyticsData(habits, entries, journalEntries, rangeDays) {
  const toDateKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Per-habit stats
  const habitStats = habits.map(h => {
    const hEntries = entries.filter(e => String(e.habitId) === String(h._id));
    const completed = hEntries.filter(e => e.completed).length;
    const total = hEntries.length;
    return {
      name: h.name,
      category: h.category || 'uncategorized',
      currentStreak: h.stats?.currentStreak || 0,
      longestStreak: h.stats?.longestStreak || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalInRange: total,
      completedInRange: completed,
    };
  });

  // Day-of-week breakdown
  const dayBuckets = Array.from({ length: 7 }, () => ({ completed: 0, total: 0 }));
  for (const e of entries) {
    const dow = new Date(e.date).getDay();
    dayBuckets[dow].total++;
    if (e.completed) dayBuckets[dow].completed++;
  }
  const dayOfWeek = dayBuckets.map((b, i) => ({
    day: DAY_NAMES[i],
    completionRate: b.total > 0 ? Math.round((b.completed / b.total) * 100) : null,
    total: b.total,
  }));

  // Weekly trend (up to 8 weeks)
  const weeklyTrend = [];
  const today = new Date();
  for (let w = 0; w < Math.min(8, Math.ceil(rangeDays / 7)); w++) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });
    const done = weekEntries.filter(e => e.completed).length;
    const total = weekEntries.length;

    weeklyTrend.push({
      week: w === 0 ? 'this week' : w === 1 ? 'last week' : `${w} weeks ago`,
      completionRate: total > 0 ? Math.round((done / total) * 100) : null,
      completed: done,
      total,
    });
  }

  // Mood data
  const moodData = journalEntries
    .filter(j => j.mood)
    .map(j => ({ date: toDateKey(j.date), mood: j.mood }));

  // Time-of-day distribution
  const timeOfDay = { morning: 0, afternoon: 0, evening: 0 };
  for (const e of entries.filter(e => e.completedAt)) {
    const h = new Date(e.completedAt).getHours();
    if (h < 12) timeOfDay.morning++;
    else if (h < 17) timeOfDay.afternoon++;
    else timeOfDay.evening++;
  }

  // Category breakdown
  const categories = {};
  for (const h of habitStats) {
    if (!categories[h.category]) categories[h.category] = { count: 0, avgRate: 0, habits: [] };
    categories[h.category].count++;
    categories[h.category].avgRate += h.completionRate;
    categories[h.category].habits.push(h.name);
  }
  for (const cat of Object.values(categories)) {
    cat.avgRate = Math.round(cat.avgRate / cat.count);
  }

  // Overall stats
  const totalCompleted = entries.filter(e => e.completed).length;
  const totalEntries = entries.length;
  const overallRate = totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;

  return {
    rangeDays,
    overallCompletionRate: overallRate,
    totalHabits: habits.length,
    totalCompletions: totalCompleted,
    totalEntries,
    journalEntries: journalEntries.length,
    habitStats,
    dayOfWeek,
    weeklyTrend,
    moodData: moodData.slice(-14), // last 14 mood points
    timeOfDay,
    categories,
  };
}

/**
 * Generate the sectioned analytics report via LLM.
 * Falls back to rule-based-only sections if LLM unavailable.
 */
async function generateAnalyticsReport(ruleInsights, analyticsData, rangeDays, personality = DEFAULT_PERSONALITY) {
  const llmAvailable = isLLMAvailable();

  if (!llmAvailable) {
    console.log('[Analytics] LLM not available — returning rule-based sections only');
    return buildFallbackSections(ruleInsights, analyticsData);
  }

  const OpenAIModule = require('openai');
  const OpenAI = OpenAIModule.default || OpenAIModule.OpenAI || OpenAIModule;

  let client;
  try {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
    });
  } catch (err) {
    console.warn('[Analytics] Failed to create OpenAI client:', err.message);
    return buildFallbackSections(ruleInsights, analyticsData);
  }

  const model = process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';

  const systemPrompt = buildSystemPrompt(personality, 'analytics-report');
  const temperature = getTemperature(personality);

  const userMessage = JSON.stringify({
    ruleInsights: ruleInsights.slice(0, 6).map(i => ({ title: i.title, type: i.type, category: i.category })),
    data: analyticsData,
  });

  try {
    console.log('[Analytics] Calling LLM for sectioned report...');
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: 800,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) {
      console.warn('[Analytics] LLM returned empty response');
      return buildFallbackSections(ruleInsights, analyticsData);
    }

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    parsed._llmUsed = true;
    console.log('[Analytics] LLM report generated successfully');
    return parsed;
  } catch (err) {
    console.warn('[Analytics] LLM call failed:', err.message);
    return buildFallbackSections(ruleInsights, analyticsData);
  }
}

/**
 * Build sections from rule-based insights when LLM is unavailable.
 */
function buildFallbackSections(ruleInsights, data) {
  const categorize = (cats) => ruleInsights.filter(i => cats.includes(i.category));

  const patterns = categorize(['pattern']).map(i => ({
    title: i.title, body: i.body, icon: i.icon, sentiment: 'neutral',
  }));

  const trends = categorize(['trend']).map(i => ({
    title: i.title, body: i.body, icon: i.icon,
    direction: i.type.includes('up') ? 'up' : i.type.includes('down') ? 'down' : 'stable',
  }));

  const recommendations = categorize(['nudge', 'suggestion']).map(i => ({
    title: i.title, body: i.body, icon: i.icon, priority: i.priority === 1 ? 'high' : 'medium',
  }));

  const correlations = categorize(['insight']).map(i => ({
    title: i.title, body: i.body, icon: i.icon,
  }));

  const celebrations = categorize(['celebration', 'motivation']).map(i => ({
    title: i.title, body: i.body, icon: i.icon, sentiment: 'positive',
  }));

  // Build a basic summary
  const summary = data.overallCompletionRate > 0
    ? `Over the last ${data.rangeDays} days, you've maintained a ${data.overallCompletionRate}% completion rate across ${data.totalHabits} active habits with ${data.totalCompletions} total completions.`
    : 'Start tracking your habits to see insights here.';

  return {
    summary,
    patterns: [...celebrations.slice(0, 2), ...patterns.slice(0, 2)],
    trends,
    correlations,
    recommendations: recommendations.slice(0, 3),
    _llmUsed: false,
  };
}
