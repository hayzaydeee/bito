/**
 * TransformerEngine — generates phased habit systems from goals using LLM.
 *
 * v2 scope: generate(goalText, userId) → phased preview data.
 *           refine(transformer, userMessage) → delta patches + assistant reply.
 */

const OpenAIModule = require('openai');
const OpenAI = OpenAIModule.default || OpenAIModule.OpenAI || OpenAIModule;
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const User = require('../models/User');
const HabitEntry = require('../models/HabitEntry');

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

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── User Dossier ──────────────────────────────────────────────────────
/**
 * Build a rich context "dossier" about the user for AI consumption.
 * Assembles: active habits with stats, analytics snapshot, personality,
 * and recent journal themes — allowing the AI to reason about the user's
 * lifestyle, discipline level, and existing routines.
 *
 * @param {string} userId
 * @returns {Promise<Object>} dossier object
 */
async function buildUserDossier(userId) {
  const dossier = {
    habits: [],
    analytics: null,
    personality: null,
    journalThemes: [],
    dataRichness: 'sparse', // sparse | moderate | rich
  };

  try {
    // ── 1. Active habits with stats ──
    const habits = await Habit.find({ userId, isActive: true, isArchived: false })
      .select('name description category frequency weeklyTarget methodology target schedule stats activatedAt source transformerId')
      .lean();

    if (habits.length > 0) {
      dossier.habits = habits.map(h => {
        const entry = {
          name: h.name,
          category: h.category || 'other',
          frequency: h.frequency,
          methodology: h.methodology || 'boolean',
        };
        if (h.description) entry.description = h.description;
        if (h.weeklyTarget && h.frequency === 'weekly') entry.weeklyTarget = h.weeklyTarget;
        if (h.target?.value > 1) entry.target = h.target;
        if (h.schedule?.days?.length > 0) {
          entry.scheduledDays = h.schedule.days.map(d => DAY_NAMES_SHORT[d]).join(', ');
        }
        if (h.source === 'transformer') entry.fromTransformer = true;

        // Stats — only include if meaningful
        const s = h.stats || {};
        if (s.completionRate > 0 || s.currentStreak > 0) {
          entry.stats = {};
          if (s.completionRate > 0) entry.stats.completionRate = `${s.completionRate}%`;
          if (s.currentStreak > 0) entry.stats.currentStreak = s.currentStreak;
          if (s.longestStreak > 0) entry.stats.longestStreak = s.longestStreak;
          if (s.totalChecks > 0) entry.stats.totalChecks = s.totalChecks;
        }
        return entry;
      });
    }

    // ── 2. Analytics snapshot (lightweight — from entries directly) ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeHabitIds = habits.map(h => h._id);

    if (activeHabitIds.length > 0) {
      const entries = await HabitEntry.find({
        userId,
        habitId: { $in: activeHabitIds },
        date: { $gte: thirtyDaysAgo },
      }).lean();

      if (entries.length > 0) {
        const completed = entries.filter(e => e.completed).length;
        const overallRate = Math.round((completed / entries.length) * 100);

        // Day-of-week pattern
        const dayBuckets = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
        for (const e of entries) {
          const dow = new Date(e.date).getDay();
          dayBuckets[dow].total++;
          if (e.completed) dayBuckets[dow].done++;
        }
        const dayRates = dayBuckets.map((b, i) => ({
          day: DAY_NAMES_SHORT[i],
          rate: b.total > 0 ? Math.round((b.done / b.total) * 100) : null,
        })).filter(d => d.rate !== null);

        const bestDay = dayRates.reduce((a, b) => (b.rate > a.rate ? b : a), dayRates[0]);
        const worstDay = dayRates.reduce((a, b) => (b.rate < a.rate ? b : a), dayRates[0]);

        // Consistency trend: this week vs last week
        const today = new Date();
        const oneWeekAgo = new Date(today); oneWeekAgo.setDate(today.getDate() - 7);
        const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14);
        const thisWeekEntries = entries.filter(e => new Date(e.date) >= oneWeekAgo);
        const lastWeekEntries = entries.filter(e => new Date(e.date) >= twoWeeksAgo && new Date(e.date) < oneWeekAgo);
        const thisWeekRate = thisWeekEntries.length > 0 ? Math.round(thisWeekEntries.filter(e => e.completed).length / thisWeekEntries.length * 100) : null;
        const lastWeekRate = lastWeekEntries.length > 0 ? Math.round(lastWeekEntries.filter(e => e.completed).length / lastWeekEntries.length * 100) : null;
        let trend = 'stable';
        if (thisWeekRate !== null && lastWeekRate !== null) {
          if (thisWeekRate > lastWeekRate + 10) trend = 'improving';
          else if (thisWeekRate < lastWeekRate - 10) trend = 'declining';
        }

        dossier.analytics = {
          overallCompletionRate: `${overallRate}%`,
          daysTracked: new Set(entries.map(e => new Date(e.date).toISOString().slice(0, 10))).size,
          bestDay: bestDay?.day,
          worstDay: worstDay?.day,
          trend,
          thisWeekRate: thisWeekRate !== null ? `${thisWeekRate}%` : null,
        };

        dossier.dataRichness = entries.length > 50 ? 'rich' : entries.length > 15 ? 'moderate' : 'sparse';
      }
    }

    // ── 3. User personality preferences ──
    const user = await User.findById(userId).select('aiPersonality preferences').lean();
    if (user?.aiPersonality) {
      dossier.personality = {
        tone: user.aiPersonality.tone || 'warm',
        focus: user.aiPersonality.focus || 'balanced',
        accountability: user.aiPersonality.accountability || 'gentle',
      };
    }

    // ── 4. Recent journal themes (tags from last 2 weeks) ──
    try {
      const JournalEntryV2 = mongoose.model('JournalEntryV2');
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const recentJournals = await JournalEntryV2.find({
        userId,
        date: { $gte: twoWeeksAgo },
        tags: { $exists: true, $ne: [] },
      }).select('tags mood').lean();

      if (recentJournals.length > 0) {
        // Aggregate tags by frequency
        const tagCounts = {};
        for (const j of recentJournals) {
          for (const tag of (j.tags || [])) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
        dossier.journalThemes = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([tag]) => tag);

        // Average mood if available
        const moods = recentJournals.filter(j => j.mood).map(j => j.mood);
        if (moods.length > 0) {
          dossier.recentAverageMood = +(moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1);
        }
      }
    } catch {
      // JournalEntryV2 model may not be registered — non-critical
    }
  } catch (err) {
    console.warn('[TransformerEngine] Dossier build partial failure:', err.message);
  }

  return dossier;
}

/**
 * Format dossier into a text block for prompt injection.
 */
function formatDossierForPrompt(dossier) {
  const sections = [];

  // Habits
  if (dossier.habits.length > 0) {
    sections.push(`USER'S CURRENT HABITS (${dossier.habits.length} active):`);
    sections.push('Reason about what these habits reveal about the user — their lifestyle, discipline level, priorities, and routines. Use this to inform your plan.');
    for (const h of dossier.habits) {
      let line = `- "${h.name}" (${h.category}, ${h.frequency}`;
      if (h.scheduledDays) line += `, on ${h.scheduledDays}`;
      if (h.target) line += `, target: ${h.target.value} ${h.target.unit || ''}`;
      line += ')';
      if (h.description) line += ` — ${h.description}`;
      if (h.stats) {
        const statParts = [];
        if (h.stats.completionRate) statParts.push(`completion: ${h.stats.completionRate}`);
        if (h.stats.currentStreak) statParts.push(`streak: ${h.stats.currentStreak}`);
        line += ` [${statParts.join(', ')}]`;
      }
      if (h.fromTransformer) line += ' [from transformer]';
      sections.push(line);
    }
  } else {
    sections.push('USER HAS NO EXISTING HABITS — this is likely a new user. Start with very accessible habits.');
  }

  // Analytics
  if (dossier.analytics) {
    sections.push(`\nANALYTICS SNAPSHOT (last 30 days):`);
    sections.push(`- Overall completion rate: ${dossier.analytics.overallCompletionRate}`);
    sections.push(`- Days tracked: ${dossier.analytics.daysTracked}`);
    sections.push(`- Best day: ${dossier.analytics.bestDay}, Worst day: ${dossier.analytics.worstDay}`);
    sections.push(`- Trend: ${dossier.analytics.trend}`);
    if (dossier.analytics.thisWeekRate) sections.push(`- This week: ${dossier.analytics.thisWeekRate}`);
  }

  // Journal themes
  if (dossier.journalThemes.length > 0) {
    sections.push(`\nRECENT JOURNAL THEMES: ${dossier.journalThemes.join(', ')}`);
    if (dossier.recentAverageMood) {
      sections.push(`- Recent average mood: ${dossier.recentAverageMood}/5`);
    }
  }

  // Personality
  if (dossier.personality) {
    sections.push(`\nUSER'S COMMUNICATION PREFERENCES:`);
    sections.push(`- Tone: ${dossier.personality.tone}, Focus: ${dossier.personality.focus}, Accountability: ${dossier.personality.accountability}`);
    sections.push('Match this style in your assistantMessage responses.');
  }

  // Data richness note
  if (dossier.dataRichness === 'sparse') {
    sections.push(`\nNOTE: Limited user data available. You should be curious — ask clarifying questions to compensate for what the data doesn't show.`);
  }

  return sections.join('\n');
}

// ── System prompt — phased generation ──
const SYSTEM_PROMPT = `You are Bito's Transformer Engine — an expert life systems designer embedded within a habit tracking app.

You have access to the user's existing habits, analytics data, journal themes, and preferences. USE THIS DATA. You are not a generic planner — you are an AI that KNOWS this user and should reason about their life based on what their data reveals.

Your job: Given a user's goal AND their context dossier, generate a complete PHASED habit tracking system that will help them achieve that goal progressively.

You MUST output valid JSON matching the schema below — nothing else, no markdown fences.

Contextual Intelligence:
- REASON about existing habits: what do their names, categories, completion rates, and streaks tell you about their lifestyle, discipline, and priorities?
- REFERENCE their data: "Your 92% on 'Morning Run' tells me you're a morning person — I'll anchor new habits to that window."
- DON'T duplicate existing habits. Build on them or complement them.
- USE analytics patterns: if they consistently drop off on weekends, schedule lighter habits then. If they're in a declining trend, start even more gently.
- If journal themes suggest stress or low mood, factor that into difficulty calibration.
- Match their communication preferences (tone, accountability level) in your naming and descriptions.

Design Principles:
1. START SMALL: Phase 1 should be easy, achievable habits to build momentum.
2. PROGRESSIVE: Each phase builds on the previous. Habits can repeat across phases with escalating targets (e.g., "Run 1 mile" → "Run 3 miles" → "Run 5K").
3. BE SPECIFIC: "Meditate 5 min" not "Meditate". Include concrete targets.
4. BE REALISTIC: Suggest sustainable habits, not heroic efforts. Calibrate to the user's current discipline level.
5. HABIT SCIENCE: Apply principles from Atomic Habits (identity-based), Tiny Habits (anchor + behavior), and BJ Fogg (motivation wave).
6. INTERCONNECTED: Habits should support each other. A fitness transformer should include recovery and nutrition, not just exercise.
7. MEASURABLE: Every habit should have a clear success criteria.
8. 3 PHASES: Generate exactly 3 phases: Foundation (easy start), Building (growing consistency), Mastery (full integration).
9. 2-5 HABITS PER PHASE: Each phase should have between 2 and 5 habits. Phases can share habits with increased targets.
10. SCHEDULE-AWARE: Use specific_days frequency when it makes sense (e.g., gym on Mon/Wed/Fri, meal prep on Sundays). Don't default everything to daily.

Output JSON schema:
{
  "name": "string — catchy name for this system, e.g. 'Marathon Ready Plan'",
  "description": "string — 1-2 sentence summary that references the user's context (e.g., 'Building on your existing morning routine...')",
  "icon": "string — single emoji that represents this goal",
  "category": "fitness | health_wellness | learning_skill | productivity | finance | event_prep | career | relationships | creative | custom",
  "estimatedDuration": { "value": number, "unit": "days | weeks | months" },
  "contextualReasoning": "string — 2-3 sentences explaining WHY you designed the plan this way based on the user's data. Reference specific habits, stats, or patterns.",
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
- For "specific_days" frequency, set days array (lowercase 3-letter: mon, tue, wed, thu, fri, sat, sun). Use this when specific days make logical sense.
- Phase 1 MUST have at least one "easy" difficulty habit.
- estimatedDuration.value should be the sum of all phase durations.
- contextualReasoning should demonstrate you actually read and understood the user's data.`;

// ── Refinement system prompt ──
const REFINE_SYSTEM_PROMPT = `You are Bito's Transformer Engine — refining an existing phased habit system based on user feedback.

You KNOW this user. You have their habit data, analytics, and preferences. Use this context to make informed decisions, not generic ones.

You will receive:
1. The original goal
2. The current system state (JSON with phases and habits)
3. User context dossier (habits, analytics, personality)
4. The conversation history (user and assistant messages)
5. A new user message with requested changes
6. The REFINEMENT MODE: "blueprint" (pre-apply) or "active" (post-apply, living plan)

Your job: Output valid JSON with two fields:
- "patches": array of operations to modify the existing system
- "assistantMessage": a natural, conversational reply. Reference user data where relevant. Feel like a knowledgeable coach, not a tool. 1-3 sentences.

IMPORTANT — REFINEMENT MODE:
- In "blueprint" mode: patches modify the plan before it's applied. Standard behavior.
- In "active" mode: this transformer has real habits created from it. Your patches will modify LIVE habits.
  - Be more cautious — acknowledge that changes affect habits the user is already tracking.
  - addHabit creates a new real habit. removeHabit archives it (data is preserved).
  - modifyHabit updates the real habit (name, frequency, target, etc.).
  - Let the user know what concrete changes will happen: "This will update your 'Morning Run' habit to 3x/week."
  - You CAN still add/remove/restructure phases and habits — the system is meant to evolve!

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

Habit frequency schema (IMPORTANT — maintain full range during refinement):
- "daily": every day. Omit days and timesPerWeek.
- "weekly": N times per week. Set timesPerWeek (1-7).
- "specific_days": specific days of the week. Set days array with lowercase 3-letter codes (mon, tue, wed, thu, fri, sat, sun).
When a user asks for habits on specific days, use "specific_days" frequency with the days array — NOT "weekly".

Rules:
- Output ONLY the JSON object. No explanation, no markdown fences.
- MINIMAL changes — only modify what the user asked for. Don't restructure the whole system.
- Keep assistantMessage conversational and informed. Reference their data or habits when relevant.
- If the user asks something vague, make a reasonable interpretation and explain what you did.
- Ensure habit fields match valid enums: methodology (boolean|numeric|duration|rating), difficulty (easy|medium|hard), frequency.type (daily|weekly|specific_days).
- In active mode, be more descriptive in assistantMessage about what real changes will happen.

Output schema:
{
  "patches": [ ...patch operations... ],
  "assistantMessage": "string — conversational reply"
}`;

/**
 * Parse a goal to extract intent, keywords, optional target date, AND detect
 * whether the input contains multiple distinct goals (compound/suite).
 *
 * Returns:
 *   Single goal:  { goalType: 'single', intent, targetDate, constraints, keywords }
 *   Multi goal:   { goalType: 'multi', intent: 'custom', targetDate, constraints, keywords,
 *                    subGoals: [{ label, intent, keywords, targetDate }],
 *                    synergies: [string], suiteGroups: [{ name, goalIndices }] }
 */
async function parseGoal(goalText) {
  const fallback = {
    goalType: 'single',
    intent: 'custom',
    targetDate: null,
    constraints: [],
    keywords: goalText.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
  };

  const client = getClient();
  if (!client) return fallback;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are a goal analysis engine. Analyze the user's input and determine:
1. Is this a SINGLE goal or MULTIPLE distinct goals?
2. Extract structured data for each goal.

A goal is "multi" when the user describes 2+ meaningfully different objectives, e.g.:
- "I want to run a 5K and learn Spanish" → multi (fitness + learning)
- "I want to lose weight by running and eating better" → single (one goal, multiple tactics)
- "26 goals for 2026: read more, exercise, meditate, save money..." → multi
- "Get fit and run a marathon" → single (sub-goals of one aim)

Output ONLY valid JSON (no markdown fences):

For a SINGLE goal:
{
  "goalType": "single",
  "intent": "fitness | health_wellness | learning_skill | productivity | finance | event_prep | career | relationships | creative | custom",
  "targetDate": "ISO date string or null",
  "constraints": ["array of constraints mentioned"],
  "keywords": ["key entities/topics"]
}

For MULTIPLE goals:
{
  "goalType": "multi",
  "subGoals": [
    {
      "label": "short summary of this specific goal",
      "intent": "fitness | health_wellness | ...",
      "keywords": ["relevant keywords"],
      "targetDate": "ISO date or null"
    }
  ],
  "synergies": ["ways these goals complement or conflict with each other"],
  "suiteGroups": [
    {
      "name": "descriptive group name",
      "goalIndices": [0, 1]
    }
  ],
  "intent": "custom",
  "targetDate": null,
  "constraints": [],
  "keywords": ["all keywords combined"]
}

suiteGroups clusters related sub-goals that should become one transformer together.
Goals that are independent get their own group. Strongly related goals (e.g., "lose weight" and "eat healthy") should share a group.
Each sub-goal index must appear in exactly one group.`,
        },
        { role: 'user', content: goalText },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    const parsed = JSON.parse(text);

    // Normalize — ensure backward-compat fields exist
    parsed.goalType = parsed.goalType || 'single';
    parsed.intent = parsed.intent || 'custom';
    parsed.targetDate = parsed.targetDate || null;
    parsed.constraints = Array.isArray(parsed.constraints) ? parsed.constraints : [];
    parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];

    // Validate multi-goal structure
    if (parsed.goalType === 'multi') {
      if (!Array.isArray(parsed.subGoals) || parsed.subGoals.length < 2) {
        // Not really multi — downgrade to single
        parsed.goalType = 'single';
      } else {
        // Sanitize subGoals
        parsed.subGoals = parsed.subGoals.map(sg => ({
          label: String(sg.label || '').slice(0, 200),
          intent: VALID_INTENTS.has(sg.intent) ? sg.intent : 'custom',
          keywords: Array.isArray(sg.keywords) ? sg.keywords.map(String) : [],
          targetDate: sg.targetDate || null,
        }));
        parsed.synergies = Array.isArray(parsed.synergies) ? parsed.synergies.map(s => String(s).slice(0, 300)) : [];

        // Validate suiteGroups — every sub-goal index must be covered
        if (Array.isArray(parsed.suiteGroups) && parsed.suiteGroups.length > 0) {
          const covered = new Set();
          parsed.suiteGroups = parsed.suiteGroups.map(g => {
            const indices = Array.isArray(g.goalIndices) ? g.goalIndices.filter(i => typeof i === 'number' && i >= 0 && i < parsed.subGoals.length) : [];
            indices.forEach(i => covered.add(i));
            return { name: String(g.name || '').slice(0, 100), goalIndices: indices };
          }).filter(g => g.goalIndices.length > 0);

          // Put uncovered goals into their own groups
          for (let i = 0; i < parsed.subGoals.length; i++) {
            if (!covered.has(i)) {
              parsed.suiteGroups.push({ name: parsed.subGoals[i].label, goalIndices: [i] });
            }
          }
        } else {
          // No grouping provided — each goal is its own group
          parsed.suiteGroups = parsed.subGoals.map((sg, i) => ({ name: sg.label, goalIndices: [i] }));
        }
      }
    }

    return parsed;
  } catch (err) {
    console.warn('[TransformerEngine] Goal parse failed, using fallback:', err.message);
    return fallback;
  }
}

/**
 * Generate a phased transformer system from a goal.
 * For single goals: returns a single preview.
 * For multi-goals: returns an array of previews (suite).
 *
 * @param {string}  goalText
 * @param {string}  userId
 * @param {Array}   [clarificationAnswers] - answers from the clarification round, if any
 * @param {Object}  [parsedOverride] - pre-parsed goal metadata (from clarify step)
 * @returns {Promise<Object>} { goalType: 'single'|'multi', preview?, previews?, suiteId?, suiteName? }
 */
async function generate(goalText, userId, clarificationAnswers, parsedOverride) {
  const client = getClient();
  if (!client) {
    throw new Error('AI generation is not available. Please try again later.');
  }

  // 1. Parse the goal (or use override from clarify step)
  const parsed = parsedOverride || await parseGoal(goalText);

  // 2. Build rich context dossier
  const dossier = await buildUserDossier(userId);
  const dossierBlock = formatDossierForPrompt(dossier);

  // 3. Route: single vs multi
  if (parsed.goalType === 'multi' && Array.isArray(parsed.subGoals) && parsed.subGoals.length >= 2) {
    return generateSuite(goalText, userId, parsed, dossier, dossierBlock, clarificationAnswers);
  }

  // ── Single goal path ──
  return generateSingle(goalText, userId, parsed, dossier, dossierBlock, clarificationAnswers);
}

/**
 * Generate a single transformer from a goal.
 * @private
 */
async function generateSingle(goalText, userId, parsed, dossier, dossierBlock, clarificationAnswers, suiteContext) {
  const client = getClient();

  // Build the user prompt
  const promptParts = [`Goal: "${goalText}"`];

  // Inject parsed goal metadata
  if (parsed.intent && parsed.intent !== 'custom') {
    promptParts.push(`Detected intent: ${parsed.intent}`);
  }
  if (parsed.targetDate) {
    promptParts.push(`Target date: ${new Date(parsed.targetDate).toISOString().slice(0, 10)}`);
  }
  if (parsed.constraints?.length > 0) {
    promptParts.push(`Constraints: ${parsed.constraints.join(', ')}`);
  }
  if (parsed.keywords?.length > 0) {
    promptParts.push(`Key topics: ${parsed.keywords.join(', ')}`);
  }

  // Suite context — if this is one transformer within a suite, inform the AI about siblings
  if (suiteContext) {
    promptParts.push(`\n--- SUITE CONTEXT ---`);
    promptParts.push(`This transformer is part of a linked suite: "${suiteContext.suiteName}"`);
    promptParts.push(`Other transformers in this suite:`);
    for (const sibling of suiteContext.siblings) {
      promptParts.push(`  - "${sibling.label}" (${sibling.intent})`);
    }
    if (suiteContext.synergies?.length > 0) {
      promptParts.push(`Cross-goal synergies to consider: ${suiteContext.synergies.join('; ')}`);
    }
    promptParts.push(`Design this transformer to complement — not duplicate — the siblings.`);
    promptParts.push(`--- END SUITE CONTEXT ---`);
  }

  // Inject dossier
  promptParts.push(`\n--- USER CONTEXT DOSSIER ---\n${dossierBlock}\n--- END DOSSIER ---`);

  // Inject clarification answers
  if (Array.isArray(clarificationAnswers) && clarificationAnswers.length > 0) {
    promptParts.push(`\n--- CLARIFICATION ANSWERS ---`);
    for (const qa of clarificationAnswers) {
      if (qa.question && qa.answer) {
        promptParts.push(`Q: ${qa.question}\nA: ${qa.answer}`);
      }
    }
    promptParts.push(`--- END CLARIFICATION ---`);
    promptParts.push(`Use these answers to make the plan more precise and personalized.`);
  }

  const userPrompt = promptParts.join('\n');

  // Generate via LLM — with web search tool for grounding when available
  const useWebSearch = process.env.TRANSFORMER_WEB_SEARCH !== 'false';
  const createParams = {
    model: MODEL,
    temperature: 0.7,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  };

  // Enable web search for research-grounded plans (OpenAI Responses API tool)
  if (useWebSearch) {
    createParams.tools = [{ type: 'web_search_preview' }];
  }

  let response;
  try {
    response = await client.chat.completions.create(createParams);
  } catch (wsErr) {
    // If web search tool fails (model doesn't support it), retry without
    if (useWebSearch && wsErr.message?.includes('tool')) {
      console.warn('[TransformerEngine] Web search not supported, retrying without:', wsErr.message);
      delete createParams.tools;
      response = await client.chat.completions.create(createParams);
    } else {
      throw wsErr;
    }
  }

  const raw = response.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  // Parse and validate
  let system;
  try {
    system = extractJSON(raw);
  } catch (err) {
    console.error('[TransformerEngine] Failed to parse LLM response:', raw);
    throw new Error('AI returned an invalid response. Please try again.');
  }

  // Normalize and sanitize
  system = normalizeToPhased(system);
  const safeParsed = sanitizeParsed(parsed);
  const safeSystem = sanitizeSystem(system);

  // Compute estimated duration
  if (safeSystem.phases.length > 0) {
    const totalDays = safeSystem.phases.reduce((sum, p) => sum + (p.durationDays || 14), 0);
    safeSystem.estimatedDuration = {
      value: Math.ceil(totalDays / 7),
      unit: 'weeks',
    };
  }

  return {
    goalType: 'single',
    preview: {
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
    },
  };
}

/**
 * Generate a suite of transformers from a compound goal.
 * Creates one transformer per suiteGroup, linked by suiteId.
 * @private
 */
async function generateSuite(goalText, userId, parsed, dossier, dossierBlock, clarificationAnswers) {
  const crypto = require('crypto');
  const suiteId = crypto.randomUUID();
  const suiteName = `${goalText.slice(0, 80)}${goalText.length > 80 ? '…' : ''}`;

  const previews = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  for (let gi = 0; gi < parsed.suiteGroups.length; gi++) {
    const group = parsed.suiteGroups[gi];
    const groupGoals = group.goalIndices.map(i => parsed.subGoals[i]).filter(Boolean);
    if (groupGoals.length === 0) continue;

    // Build a focused goal text for this group
    const groupGoalText = groupGoals.length === 1
      ? groupGoals[0].label
      : groupGoals.map(g => g.label).join('; ');

    // Build a sub-parsed for this group
    const groupParsed = {
      goalType: 'single',
      intent: groupGoals.length === 1 ? groupGoals[0].intent : 'custom',
      targetDate: groupGoals[0].targetDate || parsed.targetDate,
      constraints: parsed.constraints || [],
      keywords: groupGoals.flatMap(g => g.keywords || []),
    };

    // Suite context — tell the AI about sibling transformers
    const siblings = parsed.suiteGroups
      .filter((_, si) => si !== gi)
      .flatMap(g => g.goalIndices.map(i => parsed.subGoals[i]).filter(Boolean));

    const suiteContext = {
      suiteName: group.name || suiteName,
      siblings,
      synergies: parsed.synergies || [],
    };

    const result = await generateSingle(
      groupGoalText,
      userId,
      groupParsed,
      dossier,
      dossierBlock,
      clarificationAnswers,
      suiteContext
    );

    // Tag with suite metadata and full parsed context
    const preview = result.preview;
    preview.suiteId = suiteId;
    preview.suiteIndex = gi;
    preview.suiteName = group.name || suiteName;
    // Attach multi-goal parsed data so the Transformer model preserves it
    preview.goal.parsed.goalType = 'multi';
    preview.goal.parsed.subGoals = parsed.subGoals;

    totalTokensIn += preview.generation.tokenUsage.input;
    totalTokensOut += preview.generation.tokenUsage.output;

    previews.push(preview);
  }

  if (previews.length === 0) {
    throw new Error('Failed to generate any transformers from the compound goal.');
  }

  return {
    goalType: 'multi',
    suiteId,
    suiteName,
    previews,
    totalTokenUsage: { input: totalTokensIn, output: totalTokensOut },
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
 * Robustly extract JSON from an LLM response that may contain
 * markdown fences, preamble text, or trailing explanation.
 */
function extractJSON(raw) {
  // 1. Strip markdown fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // 2. Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // 3. Find the first { and last } — extract the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch { /* continue */ }
  }

  // 4. Nothing worked
  throw new Error('Could not extract JSON from response');
}

/**
 * Refine an existing transformer based on user feedback.
 * Returns patches + assistant message (not saved to DB — caller saves).
 *
 * @param {Object} transformer - Mongoose transformer document
 * @param {string} userMessage - User's refinement request
 * @param {string} [refinementMode='blueprint'] - 'blueprint' (pre-apply) or 'active' (post-apply, living plan)
 */
async function refine(transformer, userMessage, refinementMode = 'blueprint') {
  const client = getClient();
  if (!client) {
    throw new Error('AI refinement is not available. Please try again later.');
  }

  // Build user context dossier for informed refinement
  const dossier = await buildUserDossier(transformer.userId);
  const dossierBlock = formatDossierForPrompt(dossier);

  // Build conversation history as inline context (NOT as separate chat messages,
  // because the assistant's previous replies are friendly text, not JSON —
  // spreading them as assistant turns confuses the model into outputting prose).
  const refinements = transformer.refinements || [];
  let historyBlock = '';
  if (refinements.length > 0) {
    const turns = [];
    for (let i = 0; i < refinements.length; i += 2) {
      const userTurn = refinements[i];
      const asstTurn = refinements[i + 1];
      if (userTurn) turns.push(`User: ${userTurn.message}`);
      if (asstTurn) turns.push(`Assistant: ${asstTurn.message}`);
    }
    historyBlock = `\n\nPrevious refinement conversation:\n${turns.join('\n')}\n`;
  }

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

REFINEMENT MODE: ${refinementMode}
${refinementMode === 'active' ? 'This transformer is ACTIVE — habits are live. Patches will modify real habits the user is tracking. Be descriptive about concrete changes.\n' : ''}
Current system state:
${JSON.stringify(systemState, null, 2)}

--- USER CONTEXT DOSSIER ---
${dossierBlock}
--- END DOSSIER ---
${historyBlock}
User's NEW change request: "${userMessage}"

Remember: Output ONLY valid JSON with "patches" and "assistantMessage" fields. No markdown, no explanation.`;

  const messages = [
    { role: 'system', content: REFINE_SYSTEM_PROMPT },
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
    result = extractJSON(raw);
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
    return { goalType: 'single', intent: 'custom', targetDate: null, constraints: [], keywords: [] };
  }
  if (!VALID_INTENTS.has(parsed.intent)) parsed.intent = 'custom';
  if (parsed.targetDate) {
    const d = new Date(parsed.targetDate);
    parsed.targetDate = isNaN(d.getTime()) ? null : d;
  } else {
    parsed.targetDate = null;
  }
  parsed.goalType = parsed.goalType === 'multi' ? 'multi' : 'single';
  parsed.constraints = Array.isArray(parsed.constraints) ? parsed.constraints.map(String) : [];
  parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [];
  // Sanitize subGoals if present
  if (Array.isArray(parsed.subGoals)) {
    parsed.subGoals = parsed.subGoals.map(sg => ({
      label: String(sg.label || '').slice(0, 200),
      intent: VALID_INTENTS.has(sg.intent) ? sg.intent : 'custom',
      keywords: Array.isArray(sg.keywords) ? sg.keywords.map(String) : [],
    }));
  }
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

// ── Clarification round prompt ──
const CLARIFY_SYSTEM_PROMPT = `You are Bito's Transformer Engine. Before generating a habit plan, you're assessing whether you have enough context to create a truly personalized plan.

You will receive:
1. The user's goal
2. A context dossier with their existing habits, analytics, and preferences
3. The parsed goal metadata (intent, constraints, keywords)
4. Multi-goal analysis if the goal is compound (subGoals, suiteGroups, synergies)

Your job: Decide if you need to ask clarifying questions OR if you have enough context to proceed.
For compound goals, you MUST acknowledge the structure and explain what transformers will be created.

Output valid JSON — no markdown, no explanation:

If clarification is needed:
{
  "needsClarification": true,
  "questions": [
    {
      "question": "string — a specific, contextual question",
      "why": "string — brief reason this matters for plan design",
      "examples": ["example answer 1", "example answer 2"]
    }
  ],
  "reasoning": "string — 1-2 sentences explaining what you know and what's missing, referencing their data",
  "goalAnalysis": {
    "goalType": "single" or "multi",
    "structureSummary": "string — if multi: '3 transformers: Fitness (goals 1,2), Learning (goal 3), Finance (goal 4)'. If single: null",
    "capacityNote": "string or null — e.g., 'You currently have 4 active habits. Adding 3 transformers is ambitious but doable if phased.' Only include if relevant."
  }
}

If you have enough context:
{
  "needsClarification": false,
  "reasoning": "string — 1-2 sentences confirming what you know about the user that makes you confident",
  "goalAnalysis": {
    "goalType": "single" or "multi",
    "structureSummary": "string or null",
    "capacityNote": "string or null"
  }
}

Guidelines:
- Ask 1-3 questions MAX. Each should unlock meaningful plan differentiation.
- Questions should be CONTEXTUAL — reference what you see in their data and ask about what's missing.
- Good question types: daily schedule/availability, current skill/experience level, real deadlines, preferred times for new activities, constraints (budget, equipment, space).
- If the user's existing habits already tell you a lot, acknowledge that and ask fewer questions.
- If the goal is highly specific AND user data is rich, you may not need any clarification.
- If the user has sparse data (new user), lean towards asking — you need the context.
- Be conversational, not robotic. "I see you already have a gym habit at 85% — are you looking to build on that existing routine or add something separate?" is better than "Do you exercise?"
- For MULTI goals: always include goalAnalysis with structureSummary explaining the plan structure. This is informational — the user doesn't choose the structure, you decide it. But tell them what you're building.
- For capacity advice: reference their current active habit count and active transformer count. Be honest but not blocking — suggest sequencing if needed rather than refusing.`;

/**
 * Assess whether clarification is needed before generating a plan.
 * For multi-goal inputs, also communicates the structural plan to the user.
 * Returns either { needsClarification: true, questions, reasoning, goalAnalysis }
 * or { needsClarification: false, reasoning, goalAnalysis }.
 */
async function clarify(goalText, userId) {
  const client = getClient();
  if (!client) {
    // No LLM available — skip clarification, proceed to generate
    return { needsClarification: false, reasoning: 'LLM unavailable — proceeding with generation.', goalAnalysis: null };
  }

  // Parse goal & build dossier in parallel
  const [parsed, dossier] = await Promise.all([
    parseGoal(goalText),
    buildUserDossier(userId),
  ]);
  const dossierBlock = formatDossierForPrompt(dossier);

  const promptParts = [`Goal: "${goalText}"`];
  if (parsed.intent && parsed.intent !== 'custom') {
    promptParts.push(`Detected intent: ${parsed.intent}`);
  }
  if (parsed.targetDate) {
    promptParts.push(`Target date: ${new Date(parsed.targetDate).toISOString().slice(0, 10)}`);
  }
  if (parsed.constraints?.length > 0) {
    promptParts.push(`Constraints: ${parsed.constraints.join(', ')}`);
  }
  if (parsed.keywords?.length > 0) {
    promptParts.push(`Key topics: ${parsed.keywords.join(', ')}`);
  }

  // Multi-goal metadata
  if (parsed.goalType === 'multi' && Array.isArray(parsed.subGoals)) {
    promptParts.push(`\n--- MULTI-GOAL ANALYSIS ---`);
    promptParts.push(`Goal type: MULTI (${parsed.subGoals.length} distinct goals detected)`);
    promptParts.push(`Sub-goals:`);
    parsed.subGoals.forEach((sg, i) => {
      promptParts.push(`  ${i + 1}. "${sg.label}" (${sg.intent})`);
    });
    if (parsed.synergies?.length > 0) {
      promptParts.push(`Synergies: ${parsed.synergies.join('; ')}`);
    }
    if (parsed.suiteGroups?.length > 0) {
      promptParts.push(`Suggested grouping: ${parsed.suiteGroups.map(g => `"${g.name}" (goals ${g.goalIndices.map(i => i + 1).join(',')})`).join(', ')}`);
    }
    promptParts.push(`--- END MULTI-GOAL ANALYSIS ---`);
  }

  // Count active transformers for capacity context
  try {
    const Transformer = mongoose.model('Transformer');
    const activeTransformerCount = await Transformer.countDocuments({ userId, status: 'active' });
    if (activeTransformerCount > 0) {
      promptParts.push(`\nUser currently has ${activeTransformerCount} active transformer(s).`);
    }
  } catch { /* non-critical */ }

  promptParts.push(`\n--- USER CONTEXT DOSSIER ---\n${dossierBlock}\n--- END DOSSIER ---`);

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: CLARIFY_SYSTEM_PROMPT },
        { role: 'user', content: promptParts.join('\n') },
      ],
    });

    const raw = response.choices?.[0]?.message?.content?.trim();
    if (!raw) return { needsClarification: false, reasoning: 'Empty response — proceeding.', goalAnalysis: null };

    const result = extractJSON(raw);

    // Sanitize goalAnalysis
    result.goalAnalysis = result.goalAnalysis || null;
    if (result.goalAnalysis) {
      result.goalAnalysis.goalType = result.goalAnalysis.goalType || parsed.goalType || 'single';
      result.goalAnalysis.structureSummary = result.goalAnalysis.structureSummary ? String(result.goalAnalysis.structureSummary).slice(0, 500) : null;
      result.goalAnalysis.capacityNote = result.goalAnalysis.capacityNote ? String(result.goalAnalysis.capacityNote).slice(0, 300) : null;
    } else if (parsed.goalType === 'multi') {
      // If LLM didn't return goalAnalysis but we know it's multi, construct one
      result.goalAnalysis = {
        goalType: 'multi',
        structureSummary: `${parsed.suiteGroups?.length || parsed.subGoals?.length} transformers will be created for your ${parsed.subGoals?.length} goals.`,
        capacityNote: null,
      };
    }

    // Attach parsed metadata for downstream use
    result._parsed = parsed;

    // Validate structure
    if (result.needsClarification && Array.isArray(result.questions) && result.questions.length > 0) {
      // Sanitize questions
      result.questions = result.questions.slice(0, 3).map(q => ({
        question: String(q.question || '').slice(0, 300),
        why: String(q.why || '').slice(0, 200),
        examples: Array.isArray(q.examples) ? q.examples.slice(0, 3).map(e => String(e).slice(0, 100)) : [],
      }));
      result.reasoning = String(result.reasoning || '').slice(0, 500);
      return result;
    }

    return { needsClarification: false, reasoning: String(result.reasoning || '').slice(0, 500), goalAnalysis: result.goalAnalysis, _parsed: parsed };
  } catch (err) {
    console.warn('[TransformerEngine] Clarification failed, skipping:', err.message);
    return { needsClarification: false, reasoning: 'Clarification assessment failed — proceeding with generation.', goalAnalysis: null, _parsed: parsed };
  }
}

module.exports = { generate, parseGoal, refine, applyPatches, isAvailable, clarify, buildUserDossier };
