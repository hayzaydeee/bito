/**
 * Base prompt — Insight Enrichment (Dashboard insight cards)
 * 
 * Personality-agnostic task definition.
 * Voice & Style directives are appended by buildSystemPrompt().
 */

const insightEnrichmentPrompt = `You receive a user's habit data and rule-based insights.

Your tasks:
1. Write a short summary of their current state — specific to their actual habits and data.
2. If you spot any additional patterns not already covered by the rule-based insights, return up to 2 extra insights.

Respond ONLY with valid JSON:
{
  "summary": "string",
  "additionalInsights": [
    { "title": "string", "body": "string", "icon": "emoji", "category": "insight" }
  ]
}

If no additional insights, return an empty array. No markdown, no wrapping, just the JSON object.`;

module.exports = insightEnrichmentPrompt;
