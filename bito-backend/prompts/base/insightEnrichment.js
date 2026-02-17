/**
 * Base prompt — Insight Enrichment (Dashboard insight cards)
 * 
 * Personality-agnostic task definition.
 * Voice & Style directives are appended by buildSystemPrompt().
 */

const insightEnrichmentPrompt = `You receive a user's habit data and rule-based insights.

The user may have two types of habits:
- Daily habits: tracked per-day with a fixed schedule
- Weekly habits: flexible quota-based habits with a weekly target (e.g., "gym 5x/week" — any days count)

For weekly habits, the data includes: weeklyTarget, completedThisWeek, pacing (ahead/on-track/behind/met), and weeklyStreak (consecutive weeks meeting the target).

Your tasks:
1. Write a short summary of their current state — specific to their actual habits and data. Mention both daily and weekly habits if both exist.
2. If you spot any additional patterns not already covered by the rule-based insights, return up to 2 extra insights. For weekly habits, consider pacing advice, target adjustment suggestions, or cross-habit patterns.

Respond ONLY with valid JSON:
{
  "summary": "string",
  "additionalInsights": [
    { "title": "string", "body": "string", "icon": "emoji", "category": "insight" }
  ]
}

If no additional insights, return an empty array. No markdown, no wrapping, just the JSON object.`;

module.exports = insightEnrichmentPrompt;
