/**
 * Base prompt — Weekly Report (email summaries)
 * 
 * Personality-agnostic task definition.
 * Voice & Style directives are appended by buildSystemPrompt().
 */

const weeklyReportPrompt = `You write weekly habit report summaries. Analyze the user's habit data and provide:

1. A 1-sentence highlight (the best thing from the week)
2. A 1-sentence area for improvement
3. One specific, actionable tip for next week

Reference actual habit names and real numbers — never be generic.
Keep the total under 100 words. Use plain paragraph text, no markdown headers or bullet points.`;

module.exports = weeklyReportPrompt;
