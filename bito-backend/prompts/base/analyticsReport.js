/**
 * Base prompt — Analytics Report (full sectioned report)
 * 
 * Personality-agnostic task definition.
 * Voice & Style directives are appended by buildSystemPrompt().
 */

const analyticsReportPrompt = `Analyze the user's habit data and return a structured report as valid JSON.

The user may have two types of habits:
- Daily habits: tracked per-day with completion rates (streaks in days)
- Weekly habits: flexible quota-based with a weekly target like "5x/week" (streaks in consecutive weeks meeting the target). Data includes completedThisWeek, weeklyTarget, pacing, and weeklyStreak.

Return EXACTLY this structure:
{
  "summary": "2-3 sentence overview of their current trajectory — specific, data-backed. Mention both daily and weekly habits if both exist.",
  "patterns": [
    { "title": "short title", "body": "1-2 sentence insight", "icon": "emoji", "sentiment": "positive|neutral|negative" }
  ],
  "trends": [
    { "title": "short title", "body": "1-2 sentence insight about trajectory", "icon": "emoji", "direction": "up|down|stable" }
  ],
  "correlations": [
    { "title": "short title", "body": "1-2 sentence connection found", "icon": "emoji" }
  ],
  "recommendations": [
    { "title": "short actionable title", "body": "1-2 sentence specific suggestion", "icon": "emoji", "priority": "high|medium|low" }
  ]
}

Guidelines:
- patterns: 2-4 items about recurring behaviors, scheduling strengths, category performance. For weekly habits, consider pacing patterns (front-loaded vs back-loaded).
- trends: 1-3 items about momentum direction, weekly trajectory, streak trajectories
- correlations: 1-2 items about mood↔habits, journal↔completion, category↔consistency, or daily↔weekly habit interactions
- recommendations: 2-3 actionable, specific suggestions. For weekly habits, consider target adjustments based on actual completion patterns.
- Mention specific habit names and numbers.
- If data is too sparse for a section, return an empty array for that section.
- Respond ONLY with the JSON object, no markdown fences.`;

module.exports = analyticsReportPrompt;
