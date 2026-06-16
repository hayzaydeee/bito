/**
 * Kickstart Insights Service
 *
 * Generates personality-aware welcome insights at onboarding completion.
 * Uses the 'kickstart' base prompt with the user's derived personality.
 * Falls back to static capacity-based messages if LLM is unavailable.
 */

const { isLLMAvailable, getLLMClient } = require('./llmClient');
const { buildSystemPrompt, getTemperature, DEFAULT_PERSONALITY } = require('../prompts/buildSystemPrompt');

/**
 * Static fallback kickstart messages keyed by capacity.
 * Used when LLM is unavailable or onboardingData is missing.
 */
const STATIC_KICKSTART = {
  empty: {
    summary: "You're all set up — head to your dashboard and tap + to create your first habit. The wizard will walk you through it.",
    insights: [
      { title: 'Start with one', body: 'Pick the habit that feels most natural and build from there. Daily or weekly — the wizard lets you choose.', icon: '🎯', category: 'kickstart' },
    ],
  },
  light: {
    summary: "You've picked a focused set of habits — starting small is the smartest move. Let's build from here.",
    insights: [
      { title: 'One at a time', body: 'Focus on completing your easiest habit first each day. Early wins build real momentum.', icon: '🎯', category: 'kickstart' },
    ],
  },
  balanced: {
    summary: "Nice setup — you've got a solid mix of habits to work with. The first week is about finding your rhythm.",
    insights: [
      { title: 'Find your anchor', body: 'Pick one habit to do at the same time every day. That consistency will pull the others along.', icon: '⚓', category: 'kickstart' },
    ],
  },
  full: {
    summary: "You're going all-in — respect. The first week will show you which habits stick naturally and which need help.",
    insights: [
      { title: 'Watch for friction', body: "Pay attention to which habits you skip first when life gets busy — that's where to experiment with timing or approach.", icon: '🔍', category: 'kickstart' },
    ],
  },
};

function getClient() {
  if (!isLLMAvailable()) return null;
  return getLLMClient();
}

/**
 * Generate kickstart insights for a newly onboarded user.
 *
 * @param {Object} params
 * @param {Object} params.user       — user doc (needs aiPersonality, onboardingData)
 * @param {Object[]} params.habits   — the habits just created [{name, icon, category}]
 * @returns {Promise<{ summary: string, insights: Object[], generatedAt: Date }>}
 */
async function generateKickstartInsights({ user, habits }) {
  const personality = user.aiPersonality || DEFAULT_PERSONALITY;
  const onboarding = user.onboardingData || {};

  // Try LLM first
  const client = getClient();
  if (client && habits.length > 0) {
    try {
      const systemPrompt = buildSystemPrompt(personality, 'kickstart');
      const temperature = getTemperature(personality);
      const model = process.env.INSIGHTS_LLM_MODEL || 'claude-sonnet-4-6';

      const userMessage = JSON.stringify({
        userName: user.firstName || user.name || 'there',
        goals: onboarding.goals || [],
        capacity: onboarding.capacity || 'balanced',
        preferredTimes: onboarding.preferredTimes || [],
        habits: habits.map(h => ({
          name: h.name,
          icon: h.icon || '',
          category: h.category || '',
          frequency: h.frequency || 'daily',
          ...(h.frequency === 'weekly' && { weeklyTarget: h.weeklyTarget || 3 }),
        })),
      });

      const completion = await client.messages.create({
        model,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: 300,
      });

      const text = completion.content?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const insights = (parsed.additionalInsights || []).slice(0, 2).map(ai => ({
          title: ai.title || 'Getting Started',
          body: ai.body || '',
          icon: ai.icon || '✨',
          category: 'kickstart',
        }));

        return {
          summary: parsed.summary || STATIC_KICKSTART.balanced.summary,
          insights,
          generatedAt: new Date(),
        };
      }
    } catch (err) {
      console.warn('[Kickstart] LLM call failed, falling back to static:', err.message);
    }
  }

  // Fallback: static messages based on capacity or empty state
  if (!habits || habits.length === 0) {
    return {
      summary: STATIC_KICKSTART.empty.summary,
      insights: STATIC_KICKSTART.empty.insights,
      generatedAt: new Date(),
    };
  }
  const capacity = onboarding.capacity || 'balanced';
  const fallback = STATIC_KICKSTART[capacity] || STATIC_KICKSTART.balanced;

  return {
    summary: fallback.summary,
    insights: fallback.insights,
    generatedAt: new Date(),
  };
}

module.exports = { generateKickstartInsights, STATIC_KICKSTART };
