/**
 * TransformerEngine — generates habit systems from goals using LLM.
 *
 * v1 scope: generate(goalText, userId) → preview data.
 * No MCP context enrichment, no phases, no adaptations.
 */

const OpenAIModule = require('openai');
const OpenAI = OpenAIModule.default || OpenAIModule.OpenAI || OpenAIModule;
const Habit = require('../models/Habit');

// ── Lazy-init OpenAI client (same pattern as llmEnrichment.js) ──
let _client = null;
function getClient() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
    });
  } catch (err) {
    console.warn('[TransformerEngine] Failed to create OpenAI client:', err.message);
    return null;
  }
  return _client;
}

function isAvailable() {
  return !!process.env.OPENAI_API_KEY;
}

const MODEL = process.env.TRANSFORMER_LLM_MODEL || process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';

// ── System prompt ──
const SYSTEM_PROMPT = `You are Bito's Transformer Engine — an expert life systems designer.

Your job: Given a user's goal, generate a complete habit tracking system that will help them achieve that goal.

You MUST output valid JSON matching the schema below — nothing else, no markdown fences.

Design Principles:
1. START SMALL: Begin with easy, achievable habits. Build difficulty gradually.
2. BE SPECIFIC: "Meditate 5 min" not "Meditate". Include concrete targets.
3. BE REALISTIC: Suggest sustainable habits, not heroic efforts.
4. HABIT SCIENCE: Apply principles from Atomic Habits (identity-based), Tiny Habits (anchor + behavior), and BJ Fogg (motivation wave).
5. INTERCONNECTED: Habits should support each other. A fitness transformer should include recovery and nutrition, not just exercise.
6. MEASURABLE: Every habit should have a clear success criteria.
7. 3-6 HABITS: Generate between 3 and 6 habits. More than 6 overwhelms. Fewer than 3 lacks coverage.

Output JSON schema:
{
  "name": "string — catchy name for this system, e.g. 'Marathon Ready Plan'",
  "description": "string — 1-2 sentence summary of what this system does",
  "icon": "string — single emoji that represents this goal",
  "category": "fitness | health_wellness | learning_skill | productivity | finance | event_prep | career | relationships | creative | custom",
  "estimatedDuration": { "value": number, "unit": "days | weeks | months" },
  "habits": [
    {
      "name": "string — concise habit name",
      "description": "string — why this habit matters for the goal",
      "methodology": "boolean | numeric | duration | rating",
      "frequency": {
        "type": "daily | weekly | specific_days",
        "days": ["mon","tue",...] or null,
        "timesPerWeek": number or null
      },
      "target": {
        "value": number or null,
        "unit": "string or null — minutes, pages, reps, glasses, etc."
      },
      "icon": "string — single emoji",
      "category": "health | productivity | learning | fitness | mindfulness | social | creative | other",
      "difficulty": "easy | medium | hard",
      "isRequired": true/false
    }
  ]
}

Rules:
- Output ONLY the JSON object. No explanation, no markdown.
- "boolean" methodology means simple done/not-done. Use when the habit is binary (e.g., "Read before bed").
- "numeric" means counting (e.g., 8 glasses of water). Set target.value and target.unit.
- "duration" means time-based (e.g., 30 minutes of exercise). Set target.value with unit "minutes" or "hours".
- "rating" means a 1-5 self-assessment (e.g., mood, energy). Rarely used.
- For "daily" frequency, omit days and timesPerWeek.
- For "weekly" frequency, set timesPerWeek.
- For "specific_days" frequency, set days array (lowercase 3-letter: mon, tue, wed, thu, fri, sat, sun).
- Always include at least one "easy" difficulty habit to build momentum.`;

/**
 * Parse a goal to extract intent, keywords, and optional target date.
 * Uses a quick LLM call.
 */
async function parseGoal(goalText) {
  const client = getClient();
  if (!client) {
    // Fallback: minimal parsing without LLM
    return {
      intent: 'custom',
      targetDate: null,
      constraints: [],
      keywords: goalText.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Extract structured goal data from the user input. Output ONLY valid JSON:
{
  "intent": "fitness | health_wellness | learning_skill | productivity | finance | event_prep | career | relationships | creative | custom",
  "targetDate": "ISO date string or null",
  "constraints": ["array of constraints mentioned"],
  "keywords": ["key entities/topics"]
}
No markdown fences, only JSON.`,
        },
        { role: 'user', content: goalText },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    return JSON.parse(text);
  } catch (err) {
    console.warn('[TransformerEngine] Goal parse failed, using fallback:', err.message);
    return {
      intent: 'custom',
      targetDate: null,
      constraints: [],
      keywords: goalText.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
    };
  }
}

/**
 * Generate a transformer system from a goal.
 * Returns the preview data (not yet saved to DB).
 */
async function generate(goalText, userId) {
  const client = getClient();
  if (!client) {
    throw new Error('AI generation is not available. Please try again later.');
  }

  // 1. Parse the goal
  const parsed = await parseGoal(goalText);

  // 2. Gather minimal context: user's existing habits
  let existingContext = '';
  try {
    const existingHabits = await Habit.find({ userId, isActive: true, isArchived: false })
      .select('name category frequency methodology')
      .lean();
    if (existingHabits.length > 0) {
      existingContext = `\n\nUser's existing habits (don't duplicate these):\n${existingHabits.map((h) => `- ${h.name} (${h.category}, ${h.frequency})`).join('\n')}`;
    }
  } catch {
    // Non-critical — proceed without context
  }

  // 3. Generate the system via LLM
  const userPrompt = `Goal: "${goalText}"${existingContext}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = response.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  // 4. Parse and validate
  let system;
  try {
    // Strip markdown fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    system = JSON.parse(cleaned);
  } catch (err) {
    console.error('[TransformerEngine] Failed to parse LLM response:', raw);
    throw new Error('AI returned an invalid response. Please try again.');
  }

  // 5. Validate structure
  if (!system.name || !Array.isArray(system.habits) || system.habits.length === 0) {
    throw new Error('AI generated an incomplete system. Please try again.');
  }

  // Clamp habits to 3-6
  if (system.habits.length > 6) {
    system.habits = system.habits.slice(0, 6);
  }

  // Ensure required fields have defaults
  system.icon = system.icon || '🎯';
  system.category = system.category || 'custom';
  system.estimatedDuration = system.estimatedDuration || { value: 4, unit: 'weeks' };
  for (const h of system.habits) {
    h.methodology = h.methodology || 'boolean';
    h.frequency = h.frequency || { type: 'daily' };
    h.icon = h.icon || '🎯';
    h.category = h.category || 'other';
    h.difficulty = h.difficulty || 'medium';
    h.isRequired = h.isRequired !== false;
  }

  // 6. Sanitize all LLM output to match Mongoose enums
  const safeParsed = sanitizeParsed(parsed);
  const safeSystem = sanitizeSystem(system);

  // 7. Return preview + metadata
  return {
    goal: { text: goalText, parsed: safeParsed },
    system: safeSystem,
    generation: {
      model: MODEL,
      generatedAt: new Date(),
      tokenUsage: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
    },
  };
}

// ── Enum sanitizers (match Mongoose schema enums) ──
const VALID_INTENTS = new Set([
  'fitness', 'health_wellness', 'learning_skill', 'productivity',
  'finance', 'event_prep', 'career', 'relationships', 'creative', 'custom',
]);
const VALID_SYSTEM_CATEGORIES = VALID_INTENTS; // same set
const VALID_HABIT_CATEGORIES = new Set([
  'health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social', 'creative', 'other',
]);
const VALID_METHODOLOGIES = new Set(['boolean', 'numeric', 'duration', 'rating']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const VALID_FREQ_TYPES = new Set(['daily', 'weekly', 'specific_days', 'custom']);

/**
 * Sanitize parsed goal data so values pass Mongoose enum validation.
 */
function sanitizeParsed(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { intent: 'custom', targetDate: null, constraints: [], keywords: [] };
  }

  // Intent must be in the enum
  if (!VALID_INTENTS.has(parsed.intent)) {
    parsed.intent = 'custom';
  }

  // targetDate must be a valid Date or null
  if (parsed.targetDate) {
    const d = new Date(parsed.targetDate);
    parsed.targetDate = isNaN(d.getTime()) ? null : d;
  } else {
    parsed.targetDate = null;
  }

  // constraints and keywords must be arrays of strings
  parsed.constraints = Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [];
  parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [];

  return parsed;
}

/**
 * Sanitize the generated system so all enum fields pass Mongoose validation.
 */
function sanitizeSystem(system) {
  if (!VALID_SYSTEM_CATEGORIES.has(system.category)) {
    system.category = 'custom';
  }
  if (system.estimatedDuration) {
    const validUnits = new Set(['days', 'weeks', 'months']);
    if (!validUnits.has(system.estimatedDuration.unit)) {
      system.estimatedDuration.unit = 'weeks';
    }
    if (typeof system.estimatedDuration.value !== 'number' || system.estimatedDuration.value <= 0) {
      system.estimatedDuration.value = 4;
    }
  }
  for (const h of system.habits) {
    if (!VALID_METHODOLOGIES.has(h.methodology)) h.methodology = 'boolean';
    if (!VALID_HABIT_CATEGORIES.has(h.category)) h.category = 'other';
    if (!VALID_DIFFICULTIES.has(h.difficulty)) h.difficulty = 'medium';
    if (h.frequency && !VALID_FREQ_TYPES.has(h.frequency.type)) h.frequency.type = 'daily';
    // Ensure name exists
    if (!h.name || typeof h.name !== 'string') h.name = 'Untitled Habit';
    // Clamp string lengths to match schema
    if (h.name.length > 100) h.name = h.name.slice(0, 100);
    if (h.description && h.description.length > 300) h.description = h.description.slice(0, 300);
  }
  // Clamp system string lengths
  if (system.name && system.name.length > 120) system.name = system.name.slice(0, 120);
  if (system.description && system.description.length > 500) system.description = system.description.slice(0, 500);
  return system;
}

module.exports = { generate, parseGoal, isAvailable };
