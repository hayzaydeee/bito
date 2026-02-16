/**
 * Representative personality combinations to test.
 * Covers: all 4 tones, all 3 accountability levels, both verbosities.
 * Focus varies to avoid redundancy.
 */
const TEST_PERSONALITIES = [
  // The inferred defaults from onboarding
  {
    id: 'default-light',
    label: 'Default (light capacity user)',
    personality: { tone: 'warm', focus: 'balanced', verbosity: 'concise', accountability: 'gentle' }
  },
  {
    id: 'default-full',
    label: 'Default (all-in capacity user)',
    personality: { tone: 'direct', focus: 'patterns', verbosity: 'detailed', accountability: 'tough' }
  },

  // Extremes
  {
    id: 'warmest',
    label: 'Maximum warmth',
    personality: { tone: 'warm', focus: 'wins', verbosity: 'detailed', accountability: 'gentle' }
  },
  {
    id: 'hardest',
    label: 'Maximum toughness',
    personality: { tone: 'direct', focus: 'patterns', verbosity: 'concise', accountability: 'tough' }
  },

  // The playful path
  {
    id: 'playful-gentle',
    label: 'Playful + gentle',
    personality: { tone: 'playful', focus: 'actionable', verbosity: 'concise', accountability: 'gentle' }
  },

  // The neutral path
  {
    id: 'neutral-honest',
    label: 'Neutral + honest',
    personality: { tone: 'neutral', focus: 'patterns', verbosity: 'concise', accountability: 'honest' }
  },

  // Interesting crossover combos
  {
    id: 'warm-tough',
    label: 'Warm tone but tough accountability',
    personality: { tone: 'warm', focus: 'actionable', verbosity: 'concise', accountability: 'tough' }
  },
  {
    id: 'playful-detailed',
    label: 'Playful + detailed (potential cringe test)',
    personality: { tone: 'playful', focus: 'wins', verbosity: 'detailed', accountability: 'honest' }
  },
];

module.exports = { TEST_PERSONALITIES };
