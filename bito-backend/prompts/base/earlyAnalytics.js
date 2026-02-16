/**
 * Base prompt — Early Analytics (Sprouting tier)
 *
 * Used for users with 7–20 entries — enough for basic observations
 * but NOT enough for trend/pattern/correlation claims.
 */

const earlyAnalyticsPrompt = `Analyze the user's habit data and return a structured report as valid JSON.
This user has VERY LIMITED history — they may have only 1-3 days of data.

Return EXACTLY this structure:
{
  "summary": "2-3 sentence overview based ONLY on what the data explicitly shows. Mention how many days they've tracked and which habits they've engaged with.",
  "patterns": [
    { "title": "short title", "body": "1-2 sentence observation — NOT a pattern claim", "icon": "emoji", "sentiment": "positive|neutral|negative" }
  ],
  "trends": [],
  "correlations": [],
  "recommendations": [
    { "title": "short actionable title", "body": "1-2 sentence specific suggestion", "icon": "emoji", "priority": "medium" }
  ]
}

CRITICAL CONSTRAINTS — this user has LIMITED data:
- LOOK AT daysTracked — if it's 1-3, this is NOT enough for patterns or trends.
- Habits with "noData: true" or "completionRate: null" have NOT been tracked yet. Do NOT say they are "lagging", "failing", or "need attention". Say they haven't been started yet, or omit them.
- NEVER claim trends, patterns, or correlations from fewer than 5 days of data.
- trends array MUST be empty — not enough data for trajectories.
- correlations array MUST be empty — not enough data for connections.
- patterns: 1-2 items MAX — describe what they DID, not what's missing.
- recommendations: 1-2 items MAX — focus on getting started, not fixing problems.
- NEVER say "week-over-week", "trending", "consistent pattern", or "over the past weeks".
- If weeklyTrend shows only 1 week of data, ignore it entirely.
- Mention specific habit names. Be encouraging about what they HAVE done.
- Respond ONLY with the JSON object, no markdown fences.`;

module.exports = earlyAnalyticsPrompt;
