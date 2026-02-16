/**
 * Composable System Prompt Builder
 * 
 * Assembles a complete system prompt from a base prompt (task-specific)
 * and personality directive blocks (axis-specific).
 * 
 * Used by all AI touchpoints: insight enrichment, analytics reports,
 * weekly reports, and future features.
 */

const { basePrompts } = require('./base/index');
const { toneDirectives } = require('./directives/tone');
const { focusDirectives } = require('./directives/focus');
const { verbosityDirectives } = require('./directives/verbosity');
const { accountabilityDirectives } = require('./directives/accountability');

const BANNED_PHRASES = `Never use these phrases — they sound auto-generated and break trust:
- "Great job!" / "Keep it up!" / "Keep up the great work!"
- "Don't be too hard on yourself"
- "Consistency is key"
- "Remember to prioritise"
- "On your journey"
- "Overall"
- "Amazing"
- Any phrase that could appear in a fortune cookie`;

const DEFAULT_PERSONALITY = {
  tone: 'warm',
  focus: 'balanced',
  verbosity: 'concise',
  accountability: 'gentle',
};

/**
 * Build a complete system prompt for a given personality and feature.
 * 
 * @param {Object} personality - { tone, focus, verbosity, accountability }
 * @param {string} feature     - 'insight-enrichment' | 'weekly-report' | 'analytics-report'
 * @returns {string} Complete system prompt
 */
function buildSystemPrompt(personality = {}, feature = 'insight-enrichment') {
  const p = { ...DEFAULT_PERSONALITY, ...personality };
  const base = basePrompts[feature];

  if (!base) {
    throw new Error(`Unknown feature: "${feature}". Available: ${Object.keys(basePrompts).join(', ')}`);
  }

  const tone       = toneDirectives[p.tone] || toneDirectives.warm;
  const focus      = focusDirectives[p.focus] || focusDirectives.balanced;
  const verbosity  = verbosityDirectives[p.verbosity] || verbosityDirectives.concise;
  const account    = accountabilityDirectives[p.accountability] || accountabilityDirectives.gentle;

  return `${base}

## Voice & Style
${tone}

${focus}

${verbosity}

${account}

## Hard Rules
${BANNED_PHRASES}

Never open with "This week". Find a more specific entry point.
Never end on a forced positive note if the data doesn't support it.
Reference actual habit names and real numbers — never be generic.
Respond ONLY with the JSON object. No markdown fences, no preamble.`;
}

/**
 * Temperature mapping per tone.
 * Higher temperatures give more natural variation for warm/playful voices.
 * Lower temperatures give precision for direct/neutral voices.
 */
const temperatureMap = {
  warm:    0.8,
  direct:  0.6,
  playful: 0.85,
  neutral: 0.5,
};

/**
 * Get the appropriate temperature for a personality config.
 * @param {Object} personality - { tone, ... }
 * @returns {number}
 */
function getTemperature(personality = {}) {
  return temperatureMap[personality.tone] || temperatureMap.warm;
}

module.exports = { buildSystemPrompt, temperatureMap, getTemperature, DEFAULT_PERSONALITY };
