/**
 * LLM Output Validation Layer
 *
 * Three tiers of defense for AI-generated insights:
 *
 * Tier 1 — Schema Validation: required fields and types (zero cost, post-generation)
 * Tier 2 — Ground Truth Anchoring: inject computed facts into user message (prevents errors at generation)
 * Tier 3 — Fact Checking: verify % claims in output against source data (zero cost, post-generation)
 * Tier 4 — LLM Critic: optional second call to correct violations (opt-in via ENABLE_LLM_VALIDATION=true)
 */

const { buildSystemPrompt } = require('../prompts/buildSystemPrompt');

// ─── Schema definitions per feature ────────────────────────────────────────

const SCHEMA_REQUIREMENTS = {
  'insight-enrichment': {
    required: ['summary', 'additionalInsights'],
    types: { summary: 'string', additionalInsights: 'array' },
  },
  'early-insight': {
    required: ['summary', 'additionalInsights'],
    types: { summary: 'string', additionalInsights: 'array' },
  },
  'analytics-report': {
    required: ['summary', 'patterns', 'trends', 'correlations', 'recommendations'],
    types: {
      summary: 'string',
      patterns: 'array',
      trends: 'array',
      correlations: 'array',
      recommendations: 'array',
    },
  },
  'early-analytics': {
    required: ['summary', 'patterns', 'trends', 'correlations', 'recommendations'],
    types: {
      summary: 'string',
      patterns: 'array',
      trends: 'array',
      correlations: 'array',
      recommendations: 'array',
    },
  },
};

// ─── Tier 1: Schema Validation ─────────────────────────────────────────────

/**
 * Validates parsed LLM JSON against the expected structure for a feature.
 *
 * @param {Object} parsed   - Parsed LLM response
 * @param {string} feature  - Feature key (e.g. 'insight-enrichment')
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLLMSchema(parsed, feature) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, errors: ['Response is not a plain object'] };
  }

  const schema = SCHEMA_REQUIREMENTS[feature];
  if (!schema) {
    // Unknown feature — pass through without blocking
    return { valid: true, errors: [] };
  }

  const errors = [];
  for (const field of schema.required) {
    if (!(field in parsed)) {
      errors.push(`Missing required field: "${field}"`);
      continue;
    }
    const expected = schema.types[field];
    const actual = Array.isArray(parsed[field]) ? 'array' : typeof parsed[field];
    if (actual !== expected) {
      errors.push(`Field "${field}" expected ${expected}, got ${actual}`);
      continue;
    }
    if (expected === 'string' && parsed[field].trim() === '') {
      errors.push(`Field "${field}" is an empty string`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Tier 2: Ground Truth Anchoring ────────────────────────────────────────

/**
 * Builds a factual anchor block computed from real data.
 * Spread the returned object into the user message JSON before calling the LLM
 * so the model has the correct numbers in context and cannot contradict them.
 *
 * Handles both buildDataSummary() output (habits[]) and buildAnalyticsData() output (habitStats[]).
 *
 * @param {Object} dataSummary - Output from buildDataSummary() or buildAnalyticsData()
 * @returns {{ groundTruth: Object }}
 */
function buildGroundTruthAnchors(dataSummary) {
  const habits = dataSummary.habits || dataSummary.habitStats || [];
  // Exclude habits with zero logged entries from average (noData = no entries at all)
  const habitsWithData = habits.filter(h => !h.noData && h.completionRate !== null);

  const avgCompletionRate = habitsWithData.length > 0
    ? Math.round(habitsWithData.reduce((s, h) => s + (h.completionRate || 0), 0) / habitsWithData.length)
    : null;

  const sorted = [...habitsWithData].sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0));
  const topHabit = sorted[0]
    ? { name: sorted[0].name, rate: sorted[0].completionRate }
    : null;
  const bottomHabit = sorted.length > 1
    ? { name: sorted[sorted.length - 1].name, rate: sorted[sorted.length - 1].completionRate }
    : null;

  // Habits tracked but with zero completions (distinct from habits never opened)
  const habitsWithNoCompletions = habits
    .filter(h => !h.noData && (h.completionRate === 0 || h.rate === 0))
    .map(h => h.name);

  return {
    groundTruth: {
      avgCompletionRate,
      habitsWithData: habitsWithData.length,
      habitsWithNoData: habits.length - habitsWithData.length,
      habitsWithNoCompletions,
      topHabit,
      bottomHabit,
      note: 'These numbers are computed from actual database records. Your response must not contradict them.',
    },
  };
}

// ─── Tier 3: Fact Checking ─────────────────────────────────────────────────

/**
 * Extracts percentage claims from LLM output text and verifies each against
 * the known rates in the source data (±5% tolerance for rounding).
 *
 * @param {Object} parsed       - Parsed LLM response (any shape)
 * @param {Object} dataSummary  - Data that was sent to the LLM
 * @returns {{ valid: boolean, violations: string[] }}
 */
function factCheckOutput(parsed, dataSummary) {
  const violations = [];

  // Build the set of all known valid rates from the source data
  const habits = dataSummary.habits || dataSummary.habitStats || [];
  const knownRates = new Set();
  for (const h of habits) {
    if (h.completionRate !== null && h.completionRate !== undefined) knownRates.add(h.completionRate);
    if (h.rate !== null && h.rate !== undefined) knownRates.add(h.rate);
  }
  if (dataSummary.thisWeek?.completionRate != null) knownRates.add(dataSummary.thisWeek.completionRate);
  if (dataSummary.overallCompletionRate != null) knownRates.add(dataSummary.overallCompletionRate);

  // Nothing to check against — skip
  if (knownRates.size === 0) return { valid: true, violations: [] };

  const strings = extractStrings(parsed);
  const percentagePattern = /\b(\d+)%/g;

  for (const str of strings) {
    let match;
    while ((match = percentagePattern.exec(str)) !== null) {
      const claimed = parseInt(match[1], 10);
      const isValid = [...knownRates].some(rate => Math.abs(rate - claimed) <= 5);
      if (!isValid) {
        violations.push(
          `Claimed "${claimed}%" not found in source data (known rates: ${[...knownRates].sort((a, b) => a - b).join(', ')})`
        );
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

/** Recursively extract all string values from an arbitrarily nested object. */
function extractStrings(obj) {
  if (typeof obj === 'string') return [obj];
  if (Array.isArray(obj)) return obj.flatMap(extractStrings);
  if (obj && typeof obj === 'object') return Object.values(obj).flatMap(extractStrings);
  return [];
}

// ─── Tier 4: LLM Critic ────────────────────────────────────────────────────

/**
 * Makes a second lightweight LLM call to correct specific factual violations.
 * Only fires when ENABLE_LLM_VALIDATION=true in environment.
 *
 * @param {Object}   parsed      - Original parsed response
 * @param {string[]} violations  - Violation strings from factCheckOutput
 * @param {Object}   dataSummary - Data that was sent to the LLM
 * @param {Object}   client      - OpenAI client instance
 * @returns {Promise<Object|null>} Corrected parsed response, or null if unavailable/failed
 */
async function correctWithLLM(parsed, violations, dataSummary, client) {
  if (!client) return null;
  if (process.env.ENABLE_LLM_VALIDATION !== 'true') return null;

  const model = process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';

  let systemPrompt;
  try {
    systemPrompt = buildSystemPrompt({}, 'validator');
  } catch {
    // Validator prompt not registered — skip silently
    return null;
  }

  const userMessage = JSON.stringify({
    original: parsed,
    violations,
    groundTruth: buildGroundTruthAnchors(dataSummary).groundTruth,
  });

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1, // low temperature for precision correction
      max_tokens: 300,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) return null;

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[Validator] LLM correction failed:', err.message);
    return null;
  }
}

module.exports = { validateLLMSchema, buildGroundTruthAnchors, factCheckOutput, correctWithLLM };
