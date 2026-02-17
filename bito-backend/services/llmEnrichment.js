/**
 * Optional LLM Enrichment Layer (Layer 2)
 *
 * When an OpenAI-compatible API key is configured via the OPENAI_API_KEY
 * env var, this module enriches the rule-based insights with natural
 * language summaries and open-ended pattern discovery.
 *
 * Uses the official `openai` npm package (already installed).
 * If the key is absent or the call fails, it falls back gracefully
 * and returns the original insights untouched.
 */

const OpenAIModule = require('openai');
// openai v5 may export the class as .default in CommonJS
const OpenAI = OpenAIModule.default || OpenAIModule.OpenAI || OpenAIModule;
const { buildSystemPrompt, getTemperature, DEFAULT_PERSONALITY } = require('../prompts/buildSystemPrompt');

/** Midnight-normalised date string YYYY-MM-DD */
const toDateKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

/**
 * Check whether LLM enrichment is available.
 */
function isLLMAvailable() {
  return !!process.env.OPENAI_API_KEY;
}

/** Lazily-created client singleton */
let _client = null;
function getClient() {
  if (!_client && isLLMAvailable()) {
    try {
      _client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
      });
      console.log('[Insights] OpenAI client initialized successfully');
    } catch (err) {
      console.warn('[Insights] Failed to create OpenAI client:', err.message);
      return null;
    }
  }
  return _client;
}

/**
 * Build a compact data summary for the LLM prompt
 * (keeps token usage low).
 */
function buildDataSummary(habits, entries, journalEntries) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Week start (Monday)
  const getWeekStart = (d) => {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = dt.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    dt.setUTCDate(dt.getUTCDate() - diff);
    return dt;
  };

  const weekStart = getWeekStart(today);

  // Compute per-habit stats directly from the entries array (ground truth)
  const habitSummaries = habits.filter(h => h.frequency !== 'weekly').map(h => {
    const hEntries = entries.filter(e => String(e.habitId) === String(h._id));
    const completed = hEntries.filter(e => e.completed).length;
    const total = hEntries.length;
    return {
      name: h.name,
      category: h.category,
      type: 'daily',
      entriesInPeriod: total,
      completedInPeriod: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : null,
      noData: total === 0,
    };
  });

  // Weekly habit summaries — different metrics
  const weeklyHabitSummaries = habits.filter(h => h.frequency === 'weekly').map(h => {
    const target = h.weeklyTarget || 3;
    const thisWeekEntries = entries.filter(e =>
      String(e.habitId) === String(h._id) &&
      e.completed &&
      new Date(e.date) >= weekStart &&
      new Date(e.date) <= today
    );
    const completedThisWeek = thisWeekEntries.length;

    // Classify pacing within the week
    const dayOfWeek = today.getDay(); // 0=Sun
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0
    const daysElapsed = dayIndex + 1;
    const expectedPace = Math.round((target / 7) * daysElapsed * 10) / 10;
    let pacing = 'on-track';
    if (completedThisWeek >= target) pacing = 'met';
    else if (completedThisWeek >= expectedPace) pacing = 'ahead';
    else if (completedThisWeek < expectedPace - 1) pacing = 'behind';

    // Streak from stats
    const weeklyStreak = h.stats?.currentStreak || 0;

    return {
      name: h.name,
      category: h.category,
      type: 'weekly',
      weeklyTarget: target,
      completedThisWeek,
      remaining: Math.max(0, target - completedThisWeek),
      met: completedThisWeek >= target,
      pacing,
      weeklyStreak,
    };
  });

  const last7 = new Date();
  last7.setDate(last7.getDate() - 7);

  const recentEntries = entries.filter(e => new Date(e.date) >= last7);
  const recentJournals = journalEntries.filter(j => new Date(j.date) >= last7);

  // ── Per-day breakdown so the LLM knows exactly what happened ──
  const dayMap = {};
  for (const entry of recentEntries) {
    const dateKey = toDateKey(entry.date);
    if (!dayMap[dateKey]) dayMap[dateKey] = { completed: [], missed: [] };
    const habit = habits.find(h => String(h._id) === String(entry.habitId));
    const name = habit?.name || 'Unknown';
    if (entry.completed) {
      dayMap[dateKey].completed.push(name);
    } else {
      dayMap[dateKey].missed.push(name);
    }
  }

  const dailyBreakdown = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const daysTracked = Object.keys(dayMap).length;
  const totalCompleted = recentEntries.filter(e => e.completed).length;
  const totalEntries = recentEntries.length;

  const completionThisWeek = totalEntries > 0
    ? Math.round((totalCompleted / totalEntries) * 100)
    : null;

  const avgMood = recentJournals.length > 0
    ? (recentJournals.reduce((s, j) => s + (j.mood || 0), 0) / recentJournals.filter(j => j.mood).length || null)
    : null;

  return {
    habits: habitSummaries,
    weeklyHabits: weeklyHabitSummaries,
    totalHabits: habits.length,
    totalDailyHabits: habitSummaries.length,
    totalWeeklyHabits: weeklyHabitSummaries.length,
    habitsTracked: habitSummaries.filter(h => !h.noData).length,
    thisWeek: {
      daysTracked,
      completionRate: completionThisWeek,
      entriesLogged: totalEntries,
      completedCount: totalCompleted,
      journalDays: recentJournals.length,
      avgMood: avgMood ? parseFloat(avgMood.toFixed(1)) : null,
    },
    dailyBreakdown,
  };
}

/**
 * Call OpenAI chat completions to generate
 * an enriched summary and additional insights.
 *
 * @param {Object[]} ruleInsights  - the Layer 1 insights
 * @param {Object}   dataSummary   - compact user data snapshot
 * @param {Object}   [personality] - user's AI personality config
 * @param {string}   [feature]     - base prompt key to use
 * @returns {Promise<Object|null>} { summary, additionalInsights[] } or null on failure
 */
async function callLLM(ruleInsights, dataSummary, personality = DEFAULT_PERSONALITY, feature = 'insight-enrichment') {
  const client = getClient();
  if (!client) return null;

  const model = process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';

  const systemPrompt = buildSystemPrompt(personality, feature);
  const temperature = getTemperature(personality);

  const userMessage = JSON.stringify({
    ruleInsights: ruleInsights.map(i => ({ title: i.title, body: i.body })),
    data: dataSummary,
  });

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: 300,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) return null;

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[Insights] LLM call failed:', err.message, err.status || '', err.code || '');
    return null;
  }
}

/**
 * Enrich rule-based insights with LLM-generated summary + extras.
 *
 * @param {Object[]} ruleInsights   - Layer 1 insights array
 * @param {Object[]} habits         - user's habits (lean)
 * @param {Object[]} entries        - recent habit entries (lean)
 * @param {Object[]} journalEntries - recent journal entries (lean)
 * @param {Object}   [personality]  - user's AI personality config
 * @param {string}   [feature]      - base prompt key (default: 'insight-enrichment')
 * @returns {Promise<Object>} { insights[], summary? }
 */
async function enrichWithLLM(ruleInsights, habits, entries, journalEntries, personality, feature = 'insight-enrichment') {
  if (!isLLMAvailable()) {
    console.log('[Insights] LLM not available (no OPENAI_API_KEY)');
    return { insights: ruleInsights, summary: null, llmUsed: false };
  }

  console.log('[Insights] Attempting LLM enrichment...');
  const dataSummary = buildDataSummary(habits, entries, journalEntries);
  const result = await callLLM(ruleInsights, dataSummary, personality || DEFAULT_PERSONALITY, feature);

  if (!result) {
    console.log('[Insights] LLM returned no result, falling back to rule-based only');
    return { insights: ruleInsights, summary: null, llmUsed: false };
  }

  console.log('[Insights] LLM enrichment succeeded, summary:', result.summary?.substring(0, 50));


  // Merge additional LLM insights (lower priority, tagged as ai-generated)
  const enrichedInsights = [...ruleInsights];

  if (result.additionalInsights && Array.isArray(result.additionalInsights)) {
    for (const ai of result.additionalInsights.slice(0, 2)) {
      enrichedInsights.push({
        type: 'llm_insight',
        title: ai.title || 'AI Insight',
        body: ai.body || '',
        priority: 3,
        icon: ai.icon || '✨',
        category: ai.category || 'insight',
        source: 'ai',
      });
    }
  }

  return {
    insights: enrichedInsights,
    summary: result.summary || null,
    llmUsed: true,
  };
}

module.exports = { enrichWithLLM, isLLMAvailable };
