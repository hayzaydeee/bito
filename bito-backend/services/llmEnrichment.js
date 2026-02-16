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
  const habitSummaries = habits.map(h => ({
    name: h.name,
    category: h.category,
    streak: h.stats?.currentStreak || 0,
    longestStreak: h.stats?.longestStreak || 0,
    completionRate: h.stats?.completionRate || 0,
    totalChecks: h.stats?.totalChecks || 0,
  }));

  const last7 = new Date();
  last7.setDate(last7.getDate() - 7);

  const recentEntries = entries.filter(e => new Date(e.date) >= last7);
  const recentJournals = journalEntries.filter(j => new Date(j.date) >= last7);

  const completionThisWeek = recentEntries.length > 0
    ? Math.round((recentEntries.filter(e => e.completed).length / recentEntries.length) * 100)
    : null;

  const avgMood = recentJournals.length > 0
    ? (recentJournals.reduce((s, j) => s + (j.mood || 0), 0) / recentJournals.filter(j => j.mood).length || null)
    : null;

  return {
    habits: habitSummaries,
    thisWeek: {
      completionRate: completionThisWeek,
      entriesLogged: recentEntries.length,
      journalDays: recentJournals.length,
      avgMood: avgMood ? parseFloat(avgMood.toFixed(1)) : null,
    },
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
