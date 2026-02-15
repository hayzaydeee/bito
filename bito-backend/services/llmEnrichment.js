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

const OpenAI = require('openai');

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
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
    });
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
 * @returns {Promise<Object|null>} { summary, additionalInsights[] } or null on failure
 */
async function callLLM(ruleInsights, dataSummary) {
  const client = getClient();
  if (!client) return null;

  const model = process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';

  const systemPrompt = `You are a friendly, concise habit coach. You receive a user's habit data and rule-based insights. Your job:
1. Write a short (2-3 sentence) natural-language summary of their current state — warm, encouraging, specific.
2. If you spot any additional patterns not already covered by the rule-based insights, return up to 2 extra insights.

Respond ONLY with valid JSON:
{
  "summary": "...",
  "additionalInsights": [
    { "title": "...", "body": "...", "icon": "emoji", "category": "insight" }
  ]
}

Keep it brief and actionable. No fluff.`;

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
      temperature: 0.7,
      max_tokens: 300,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) return null;

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('LLM enrichment error:', err.message);
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
 * @returns {Promise<Object>} { insights[], summary? }
 */
async function enrichWithLLM(ruleInsights, habits, entries, journalEntries) {
  if (!isLLMAvailable()) {
    return { insights: ruleInsights, summary: null, llmUsed: false };
  }

  const dataSummary = buildDataSummary(habits, entries, journalEntries);
  const result = await callLLM(ruleInsights, dataSummary);

  if (!result) {
    return { insights: ruleInsights, summary: null, llmUsed: false };
  }

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
