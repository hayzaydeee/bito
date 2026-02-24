/**
 * TransformerEngine — generates phased habit systems from goals using LLM.
 *
 * v2 scope: generate(goalText, userId) → phased preview data.
 *           refine(transformer, userMessage) → delta patches + assistant reply.
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

// ── System prompt — phased generation ──
const SYSTEM_PROMPT = `You are Bito's Transformer Engine — an expert life systems designer.

Your job: Given a user's goal, generate a complete PHASED habit tracking system that will help them achieve that goal progressively.

You MUST output valid JSON matching the schema below — nothing else, no markdown fences.

Design Principles:
1. START SMALL: Phase 1 should be easy, achievable habits to build momentum.
2. PROGRESSIVE: Each phase builds on the previous. Habits can repeat across phases with escalating targets (e.g., "Run 1 mile" → "Run 3 miles" → "Run 5K").
3. BE SPECIFIC: "Meditate 5 min" not "Meditate". Include concrete targets.
4. BE REALISTIC: Suggest sustainable habits, not heroic efforts.
5. HABIT SCIENCE: Apply principles from Atomic Habits (identity-based), Tiny Habits (anchor + behavior), and BJ Fogg (motivation wave).
6. INTERCONNECTED: Habits should support each other. A fitness transformer should include recovery and nutrition, not just exercise.
7. MEASURABLE: Every habit should have a clear success criteria.
8. 3 PHASES: Generate exactly 3 phases: Foundation (easy start), Building (growing consistency), Mastery (full integration).
9. 2-5 HABITS PER PHASE: Each phase should have between 2 and 5 habits. Phases can share habits with increased targets.

Output JSON schema:
{
  "name": "string — catchy name for this system, e.g. 'Marathon Ready Plan'",
  "description": "string — 1-2 sentence summary of what this system does",
  "icon": "string — single emoji that represents this goal",
  "category": "fitness | health_wellness | learning_skill | productivity | finance | event_prep | career | relationships | creative | custom",
  "estimatedDuration": { "value": number, "unit": "days | weeks | months" },
  "phases": [
    {
      "name": "string — phase name, e.g. 'Foundation'",
      "order": 0,
      "durationDays": number,
      "description": "string — what this phase achieves",
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
  ]
}

Rules:
- Output ONLY the JSON object. No explanation, no markdown.
- Phase 1 "Foundation": 7-14 days, 2-3 easy habits, build momentum.
- Phase 2 "Building": 14-21 days, 3-4 medium habits, some Phase 1 habits can repeat with higher targets.
- Phase 3 "Mastery": 21+ days or ongoing, 3-5 habits including hard ones, full system.
- "boolean" methodology means simple done/not-done.
- "numeric" means counting (e.g., 8 glasses of water). Set target.value and target.unit.
- "duration" means time-based (e.g., 30 minutes of exercise). Set target.value with unit "minutes" or "hours".
- "rating" means a 1-5 self-assessment. Rarely used.
- For "daily" frequency, omit days and timesPerWeek.
- For "weekly" frequency, set timesPerWeek.
- For "specific_days" frequency, set days array (lowercase 3-letter: mon, tue, wed, thu, fri, sat, sun).
- Phase 1 MUST have at least one "easy" difficulty habit.
- estimatedDuration.value should be the sum of all phase durations.`;

// ── Refinement system prompt ──
const REFINE_SYSTEM_PROMPT = `You are Bito's Transformer Engine — refining an existing phased habit system based on user feedback.

You will receive:
1. The original goal
2. The current system state (JSON with phases and habits)
3. The conversation history (user and assistant messages)
4. A new user message with requested changes

Your job: Output valid JSON with two fields:
- "patches": array of operations to modify the existing system
- "assistantMessage": a brief, friendly reply to the user (1-2 sentences, acknowledge what changed)

Patch operations:
- { "op": "modifyHabit", "phase": phaseIndex, "habitIndex": habitIndex, "fields": { ...fieldsToUpdate } }
- { "op": "addHabit", "phase": phaseIndex, "habit": { full habit object } }
- { "op": "removeHabit", "phase": phaseIndex, "habitIndex": habitIndex }
- { "op": "modifyPhase", "phase": phaseIndex, "fields": { "name"?: str, "durationDays"?: num, "description"?: str } }
- { "op": "addPhase", "afterPhase": phaseIndex, "phase": { "name": str, "order": num, "durationDays": num, "description": str, "habits": [...] } }
- { "op": "removePhase", "phase": phaseIndex }
- { "op": "modifySystem", "fields": { "name"?: str, "description"?: str, "icon"?: str } }
- { "op": "moveHabit", "fromPhase": phaseIndex, "habitIndex": habitIndex, "toPhase": phaseIndex }
- { "op": "scaleHabit", "habitName": str, "scaling": [{ "phase": phaseIndex, "target": { "value": num, "unit": str } }] }

Rules:
- Output ONLY the JSON object. No explanation, no markdown fences.
- MINIMAL changes — only modify what the user asked for. Don't restructure the whole system.
- Keep answers conversational but SHORT.
- If the user asks something vague, make a reasonable interpretation and explain what you did.
- Ensure habit fields match valid enums: methodology (boolean|numeric|duration|rating), difficulty (easy|medium|hard), frequency.type (daily|weekly|specific_days).

Output schema:
{
  "patches": [ ...patch operations... ],
  "assistantMessage": "string — friendly reply"
}`;

/**
 * Parse a goal to extract intent, keywords, and optional target date.
 * Uses a quick LLM call.
 */
async function parseGoal(goalText) {
  const client = getClient();
  if (!client) {
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
 * Generate a phased transformer system from a goal.
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
    max_tokens: 3000,
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
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    system = JSON.parse(cleaned);
  } catch (err) {
    console.error('[TransformerEngine] Failed to parse LLM response:', raw);
    throw new Error('AI returned an invalid response. Please try again.');
  }

  // 5. Normalize: ensure phased structure
  system = normalizeToPhased(system);

  // 6. Sanitize all LLM output
  const safeParsed = sanitizeParsed(parsed);
  const safeSystem = sanitizeSystem(system);

  // 7. Compute estimated duration from phases
  if (safeSystem.phases.length > 0) {
    const totalDays = safeSystem.phases.reduce((sum, p) => sum + (p.durationDays || 14), 0);
    safeSystem.estimatedDuration = {
      value: Math.ceil(totalDays / 7),
      unit: 'weeks',
    };
  }

  // 8. Return preview + metadata
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

/**
 * Normalize LLM output to always have phases[] structure.
 * Handles: phased output (pass-through), flat habits[] (wrap in single phase),
 * or missing/broken structure.
 */
function normalizeToPhased(system) {
  // If phases exist and have habits, use them
  if (Array.isArray(system.phases) && system.phases.length > 0) {
    // Validate each phase has habits
    const validPhases = system.phases.filter(
      (p) => Array.isArray(p.habits) && p.habits.length > 0
    );
    if (validPhases.length > 0) {
      // Clamp to 2-4 phases
      if (validPhases.length > 4) {
        system.phases = validPhases.slice(0, 4);
      } else {
        system.phases = validPhases;
      }
      // Ensure order field
      system.phases.forEach((p, i) => {
        p.order = i;
      });
      // Clear flat habits (phases take precedence)
      system.habits = [];
      return system;
    }
  }

  // Fallback: flat habits[] → wrap in single phase
  if (Array.isArray(system.habits) && system.habits.length > 0) {
    system.phases = [
      {
        name: 'Your Plan',
        order: 0,
        durationDays: 28,
        description: system.description || 'Your personalized habit system',
        habits: system.habits,
      },
    ];
    system.habits = [];
    return system;
  }

  // Nothing valid — throw
  throw new Error('AI generated an incomplete system. Please try again.');
}

/**
 * Refine an existing transformer based on user feedback.
 * Returns patches + assistant message (not saved to DB — caller saves).
 */
async function refine(transformer, userMessage) {
  const client = getClient();
  if (!client) {
    throw new Error('AI refinement is not available. Please try again later.');
  }

  // Build conversation history for context
  const history = (transformer.refinements || []).map((r) => ({
    role: r.role,
    content: r.message,
  }));

  // Build the current system state summary
  const systemState = {
    name: transformer.system.name,
    description: transformer.system.description,
    icon: transformer.system.icon,
    category: transformer.system.category,
    phases: (transformer.system.phases || []).map((p, pi) => ({
      index: pi,
      name: p.name,
      durationDays: p.durationDays,
      description: p.description,
      habits: (p.habits || []).map((h, hi) => ({
        index: hi,
        name: h.name,
        description: h.description,
        methodology: h.methodology,
        frequency: h.frequency,
        target: h.target,
        icon: h.icon,
        difficulty: h.difficulty,
        isRequired: h.isRequired,
      })),
    })),
  };

  const userPrompt = `Original goal: "${transformer.goal.text}"

Current system state:
${JSON.stringify(systemState, null, 2)}

User's change request: "${userMessage}"`;

  const messages = [
    { role: 'system', content: REFINE_SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userPrompt },
  ];

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    max_tokens: 2000,
    messages,
  });

  const raw = response.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  let result;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    result = JSON.parse(cleaned);
  } catch {
    console.error('[TransformerEngine] Failed to parse refine response:', raw);
    throw new Error('AI returned an invalid response. Please try again.');
  }

  if (!result.patches || !Array.isArray(result.patches)) {
    result.patches = [];
  }
  if (!result.assistantMessage || typeof result.assistantMessage !== 'string') {
    result.assistantMessage = "I've updated your plan based on your feedback.";
  }

  // Track token usage
  const tokenUsage = {
    input: response.usage?.prompt_tokens || 0,
    output: response.usage?.completion_tokens || 0,
  };

  return { ...result, tokenUsage };
}

/**
 * Apply patches to a transformer's system in place.
 * Returns an array of { phase, habitIndex } indicating what changed.
 */
function applyPatches(system, patches) {
  const changed = [];

  for (const patch of patches) {
    try {
      switch (patch.op) {
        case 'modifyHabit': {
          const phase = system.phases[patch.phase];
          if (phase?.habits?.[patch.habitIndex]) {
            Object.assign(phase.habits[patch.habitIndex], patch.fields || {});
            changed.push({ phase: patch.phase, habitIndex: patch.habitIndex });
          }
          break;
        }
        case 'addHabit': {
          const phase = system.phases[patch.phase];
          if (phase) {
            const habit = sanitizeHabit(patch.habit || {});
            phase.habits.push(habit);
            changed.push({ phase: patch.phase, habitIndex: phase.habits.length - 1 });
          }
          break;
        }
        case 'removeHabit': {
          const phase = system.phases[patch.phase];
          if (phase?.habits?.[patch.habitIndex]) {
            phase.habits.splice(patch.habitIndex, 1);
            changed.push({ phase: patch.phase, habitIndex: -1 }); // -1 = removal
          }
          break;
        }
        case 'modifyPhase': {
          const phase = system.phases[patch.phase];
          if (phase) {
            const allowed = ['name', 'durationDays', 'description'];
            for (const key of allowed) {
              if (patch.fields?.[key] !== undefined) {
                phase[key] = patch.fields[key];
              }
            }
            changed.push({ phase: patch.phase, habitIndex: -1 });
          }
          break;
        }
        case 'addPhase': {
          if (patch.phase && system.phases.length < 5) {
            const insertAt = (patch.afterPhase ?? system.phases.length - 1) + 1;
            const newPhase = {
              name: patch.phase.name || `Phase ${insertAt + 1}`,
              order: insertAt,
              durationDays: patch.phase.durationDays || 14,
              description: patch.phase.description || '',
              habits: (patch.phase.habits || []).map(sanitizeHabit),
            };
            system.phases.splice(insertAt, 0, newPhase);
            // Reindex orders
            system.phases.forEach((p, i) => { p.order = i; });
            changed.push({ phase: insertAt, habitIndex: -1 });
          }
          break;
        }
        case 'removePhase': {
          if (system.phases.length > 1 && system.phases[patch.phase]) {
            system.phases.splice(patch.phase, 1);
            system.phases.forEach((p, i) => { p.order = i; });
            changed.push({ phase: patch.phase, habitIndex: -1 });
          }
          break;
        }
        case 'modifySystem': {
          const allowed = ['name', 'description', 'icon'];
          for (const key of allowed) {
            if (patch.fields?.[key] !== undefined) {
              system[key] = patch.fields[key];
            }
          }
          break;
        }
        case 'moveHabit': {
          const fromPhase = system.phases[patch.fromPhase];
          const toPhase = system.phases[patch.toPhase];
          if (fromPhase?.habits?.[patch.habitIndex] && toPhase) {
            const [habit] = fromPhase.habits.splice(patch.habitIndex, 1);
            toPhase.habits.push(habit);
            changed.push({ phase: patch.toPhase, habitIndex: toPhase.habits.length - 1 });
          }
          break;
        }
        case 'scaleHabit': {
          if (patch.habitName && Array.isArray(patch.scaling)) {
            for (const scale of patch.scaling) {
              const phase = system.phases[scale.phase];
              if (phase) {
                const hi = phase.habits.findIndex((h) => h.name === patch.habitName);
                if (hi >= 0 && scale.target) {
                  phase.habits[hi].target = scale.target;
                  changed.push({ phase: scale.phase, habitIndex: hi });
                }
              }
            }
          }
          break;
        }
        default:
          console.warn('[TransformerEngine] Unknown patch op:', patch.op);
      }
    } catch (err) {
      console.warn('[TransformerEngine] Patch failed:', patch.op, err.message);
    }
  }

  return changed;
}

// ── Enum sanitizers (match Mongoose schema enums) ──
const VALID_INTENTS = new Set([
  'fitness', 'health_wellness', 'learning_skill', 'productivity',
  'finance', 'event_prep', 'career', 'relationships', 'creative', 'custom',
]);
const VALID_SYSTEM_CATEGORIES = VALID_INTENTS;
const VALID_HABIT_CATEGORIES = new Set([
  'health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social', 'creative', 'other',
]);
const VALID_METHODOLOGIES = new Set(['boolean', 'numeric', 'duration', 'rating']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const VALID_FREQ_TYPES = new Set(['daily', 'weekly', 'specific_days', 'custom']);

function sanitizeParsed(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { intent: 'custom', targetDate: null, constraints: [], keywords: [] };
  }
  if (!VALID_INTENTS.has(parsed.intent)) parsed.intent = 'custom';
  if (parsed.targetDate) {
    const d = new Date(parsed.targetDate);
    parsed.targetDate = isNaN(d.getTime()) ? null : d;
  } else {
    parsed.targetDate = null;
  }
  parsed.constraints = Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [];
  parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [];
  return parsed;
}

/**
 * Sanitize a single habit object.
 */
function sanitizeHabit(h) {
  if (!h || typeof h !== 'object') return { name: 'Untitled Habit', methodology: 'boolean', frequency: { type: 'daily' }, icon: '🎯', category: 'other', difficulty: 'medium', isRequired: true };
  if (!VALID_METHODOLOGIES.has(h.methodology)) h.methodology = 'boolean';
  if (!VALID_HABIT_CATEGORIES.has(h.category)) h.category = 'other';
  if (!VALID_DIFFICULTIES.has(h.difficulty)) h.difficulty = 'medium';
  if (h.frequency && !VALID_FREQ_TYPES.has(h.frequency?.type)) h.frequency = { type: 'daily' };
  if (!h.name || typeof h.name !== 'string') h.name = 'Untitled Habit';
  if (h.name.length > 100) h.name = h.name.slice(0, 100);
  if (h.description && h.description.length > 300) h.description = h.description.slice(0, 300);
  h.icon = h.icon || '🎯';
  h.frequency = h.frequency || { type: 'daily' };
  h.isRequired = h.isRequired !== false;
  return h;
}

function sanitizeSystem(system) {
  if (!VALID_SYSTEM_CATEGORIES.has(system.category)) system.category = 'custom';
  if (system.estimatedDuration) {
    const validUnits = new Set(['days', 'weeks', 'months']);
    if (!validUnits.has(system.estimatedDuration.unit)) system.estimatedDuration.unit = 'weeks';
    if (typeof system.estimatedDuration.value !== 'number' || system.estimatedDuration.value <= 0) system.estimatedDuration.value = 4;
  }

  // Sanitize phases
  if (Array.isArray(system.phases)) {
    for (const phase of system.phases) {
      if (phase.name && phase.name.length > 60) phase.name = phase.name.slice(0, 60);
      if (phase.description && phase.description.length > 200) phase.description = phase.description.slice(0, 200);
      if (typeof phase.durationDays !== 'number' || phase.durationDays <= 0) phase.durationDays = 14;
      // Clamp habits per phase to 2-6
      if (Array.isArray(phase.habits)) {
        if (phase.habits.length > 6) phase.habits = phase.habits.slice(0, 6);
        phase.habits = phase.habits.map(sanitizeHabit);
      } else {
        phase.habits = [];
      }
    }
  }

  // Sanitize flat habits (legacy compat)
  if (Array.isArray(system.habits)) {
    system.habits = system.habits.map(sanitizeHabit);
  }

  if (system.name && system.name.length > 120) system.name = system.name.slice(0, 120);
  if (system.description && system.description.length > 500) system.description = system.description.slice(0, 500);
  system.icon = system.icon || '🎯';
  system.category = system.category || 'custom';
  system.estimatedDuration = system.estimatedDuration || { value: 4, unit: 'weeks' };

  return system;
}

module.exports = { generate, parseGoal, refine, applyPatches, isAvailable };
