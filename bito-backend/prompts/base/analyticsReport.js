/**
 * Base prompt — Analytics Report (full sectioned report)
 * 
 * Personality-agnostic task definition.
 * Voice & Style directives are appended by buildSystemPrompt().
 */

const analyticsReportPrompt = `Analyze the user's habit data and return a structured report as valid JSON.

Return EXACTLY this structure:
{
  "summary": "2-3 sentence overview of their current trajectory — specific, data-backed.",
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
- patterns: 2-4 items about recurring behaviors, scheduling strengths, category performance
- trends: 1-3 items about momentum direction, weekly trajectory, streak trajectories
- correlations: 1-2 items about mood↔habits, journal↔completion, category↔consistency connections
- recommendations: 2-3 actionable, specific suggestions based on the data
- Mention specific habit names and numbers.
- If data is too sparse for a section, return an empty array for that section.
- Respond ONLY with the JSON object, no markdown fences.`;

module.exports = analyticsReportPrompt;
