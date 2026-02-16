/**
 * Prompt Regression Test Runner
 *
 * Runs each scenario × personality combo against OpenAI and validates output.
 * Imports the production buildSystemPrompt directly — no mocks.
 *
 * Usage:
 *   node bito-backend/prompts/testing/runSuite.js
 *   node bito-backend/prompts/testing/runSuite.js --verbose
 *   node bito-backend/prompts/testing/runSuite.js --scenario=collapse --personality=playful
 */

const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const { buildSystemPrompt, temperatureMap } = require('../buildSystemPrompt');
const { TEST_PERSONALITIES } = require('./personalities');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Config ──────────────────────────────────────────────
const MODEL = process.env.INSIGHTS_LLM_MODEL || 'gpt-4o-mini';
const SCENARIOS_DIR = path.join(__dirname, 'scenarios');
const RESULTS_DIR = path.join(__dirname, 'results');

// CLI flags
const args = process.argv.slice(2);
const scenarioFilter = args.find(a => a.startsWith('--scenario='))?.split('=')[1];
const personalityFilter = args.find(a => a.startsWith('--personality='))?.split('=')[1];
const verbose = args.includes('--verbose');

// ── Load scenarios ──────────────────────────────────────
async function loadScenarios() {
  const files = await fs.readdir(SCENARIOS_DIR);
  const scenarios = [];

  for (const file of files.filter(f => f.endsWith('.json'))) {
    const raw = await fs.readFile(path.join(SCENARIOS_DIR, file), 'utf-8');
    scenarios.push(JSON.parse(raw));
  }

  return scenarioFilter
    ? scenarios.filter(s => s.id.includes(scenarioFilter))
    : scenarios;
}

// ── Format scenario data as the user message ────────────
function formatUserMessage(scenario) {
  return JSON.stringify({
    userName: scenario.userName,
    periodLabel: scenario.periodLabel,
    habits: scenario.habits,
    overallCompletionRate: scenario.overallCompletionRate,
    previousWeekCompletionRate: scenario.previousWeekCompletionRate,
    isFirstWeek: scenario.isFirstWeek || false,
    weeksBefore: scenario.weeksBefore || null,
    ruleBasedInsights: scenario.ruleBasedInsights
  }, null, 2);
}

// ── Call OpenAI ─────────────────────────────────────────
async function generateReport(systemPrompt, userMessage, temperature) {
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

    const latency = Date.now() - startTime;
    const content = response.choices[0].message.content;
    const tokens = response.usage;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { _parseError: true, _raw: content };
    }

    return {
      success: true,
      output: parsed,
      latency,
      tokens: {
        prompt: tokens.prompt_tokens,
        completion: tokens.completion_tokens,
        total: tokens.total_tokens
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      latency: Date.now() - startTime
    };
  }
}

// ── Automated checks ────────────────────────────────────
function runChecks(result, scenario, pConfig) {
  const warnings = [];

  if (!result.success) {
    warnings.push('\u274C API call failed: ' + result.error);
    return warnings;
  }

  const output = result.output;

  // JSON structure check
  if (output._parseError) {
    warnings.push('\u274C Failed to parse JSON response');
    return warnings;
  }

  if (!output.summary || typeof output.summary !== 'string') {
    warnings.push('\u274C Missing or invalid "summary" field');
  }

  if (!Array.isArray(output.additionalInsights)) {
    warnings.push('\u274C Missing or invalid "additionalInsights" array');
  }

  if (output.additionalInsights?.length > 2) {
    warnings.push('\u26A0\uFE0F  More than 2 additional insights returned');
  }

  // Banned phrases
  const banned = [
    'great job', 'keep it up', 'keep up the great work',
    "don't be too hard on yourself", 'consistency is key',
    'remember to prioriti', 'on your journey', 'amazing'
  ];
  const summaryLower = (output.summary || '').toLowerCase();
  const allTextLower = JSON.stringify(output).toLowerCase();

  for (const phrase of banned) {
    if (allTextLower.includes(phrase)) {
      warnings.push(`\u26A0\uFE0F  Banned phrase detected: "${phrase}"`);
    }
  }

  // Starts with "This week"
  if (output.summary?.startsWith('This week')) {
    warnings.push('\u26A0\uFE0F  Summary opens with "This week" (banned)');
  }

  // Verbosity check
  const sentenceCount = (output.summary?.match(/[.!?]+/g) || []).length;
  if (pConfig.personality.verbosity === 'concise' && sentenceCount > 4) {
    warnings.push(`\u26A0\uFE0F  Concise mode but summary has ${sentenceCount} sentences`);
  }

  // Specificity check — should mention at least one habit by name
  const habitNames = scenario.habits.map(h => h.name.toLowerCase());
  const mentionsHabit = habitNames.some(name =>
    summaryLower.includes(name.toLowerCase().split(' ').slice(-1)[0]) // match last word
  );
  if (!mentionsHabit) {
    warnings.push('\u26A0\uFE0F  Summary doesn\'t mention any specific habit by name');
  }

  return warnings;
}

// ── Main runner ─────────────────────────────────────────
async function run() {
  const scenarios = await loadScenarios();
  const personalities = personalityFilter
    ? TEST_PERSONALITIES.filter(p => p.id.includes(personalityFilter))
    : TEST_PERSONALITIES;

  const totalRuns = scenarios.length * personalities.length;
  let completed = 0;
  let totalWarnings = 0;
  let totalErrors = 0;
  let totalTokens = 0;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const runDir = path.join(RESULTS_DIR, timestamp);
  await fs.mkdir(runDir, { recursive: true });

  const summaryRows = [];

  console.log(`\n\uD83E\uDDEA Prompt Regression Suite`);
  console.log(`   ${scenarios.length} scenarios \u00D7 ${personalities.length} personalities = ${totalRuns} runs`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Output: ${runDir}\n`);

  for (const scenario of scenarios) {
    for (const pConfig of personalities) {
      completed++;
      const tag = `[${completed}/${totalRuns}]`;
      const label = `${scenario.id} + ${pConfig.id}`;

      process.stdout.write(`${tag} ${label}...`);

      const systemPrompt = buildSystemPrompt(pConfig.personality, 'weekly-report');
      const userMessage = formatUserMessage(scenario);
      const temperature = temperatureMap[pConfig.personality.tone];

      const result = await generateReport(systemPrompt, userMessage, temperature);
      const warnings = runChecks(result, scenario, pConfig);

      totalWarnings += warnings.filter(w => w.includes('\u26A0\uFE0F')).length;
      totalErrors += warnings.filter(w => w.includes('\u274C')).length;
      if (result.tokens) totalTokens += result.tokens.total;

      // Status line
      const status = warnings.length === 0
        ? ' \u2705'
        : ` ${warnings.some(w => w.includes('\u274C')) ? '\u274C' : '\u26A0\uFE0F'} (${warnings.length})`;
      console.log(`${status}  ${result.latency}ms  ${result.tokens?.total || 0} tokens`);

      // Print warnings if verbose
      if (verbose && warnings.length > 0) {
        warnings.forEach(w => console.log(`     ${w}`));
      }

      // Save individual result
      const resultFile = `${scenario.id}__${pConfig.id}.json`;
      await fs.writeFile(
        path.join(runDir, resultFile),
        JSON.stringify({
          scenario: scenario.id,
          scenarioLabel: scenario.label,
          personality: pConfig.id,
          personalityLabel: pConfig.label,
          config: pConfig.personality,
          temperature,
          model: MODEL,
          result,
          warnings,
          timestamp: new Date().toISOString()
        }, null, 2)
      );

      // Collect for summary
      summaryRows.push({
        scenario: scenario.id,
        personality: pConfig.id,
        success: result.success,
        summary: result.output?.summary?.slice(0, 100) || '(none)',
        insightCount: result.output?.additionalInsights?.length ?? 0,
        warnings: warnings.length,
        latency: result.latency,
        tokens: result.tokens?.total || 0
      });

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // ── Write summary file ────────────────────────────────
  const summaryContent = [
    `# Prompt Regression Results \u2014 ${timestamp}`,
    ``,
    `Model: ${MODEL}`,
    `Scenarios: ${scenarios.length} | Personalities: ${personalities.length} | Total runs: ${totalRuns}`,
    `Total tokens: ${totalTokens.toLocaleString()} | Est. cost: $${(totalTokens * 0.00000015).toFixed(4)} (gpt-4o-mini)`,
    ``,
    `## Health`,
    `- \u2705 Clean: ${summaryRows.filter(r => r.warnings === 0).length}`,
    `- \u26A0\uFE0F  Warnings: ${totalWarnings}`,
    `- \u274C Errors: ${totalErrors}`,
    ``,
    `## Results`,
    ``,
    `| Scenario | Personality | \u2713 | Summary (truncated) | Insights | Warnings | ms |`,
    `|----------|-------------|---|---------------------|----------|----------|----|`,
    ...summaryRows.map(r =>
      `| ${r.scenario} | ${r.personality} | ${r.success ? '\u2705' : '\u274C'} | ${r.summary.replace(/\|/g, '/')} | ${r.insightCount} | ${r.warnings} | ${r.latency} |`
    ),
    ``,
    `## Warnings Detail`,
    ``,
  ];

  // Aggregate warnings by type
  const runsWithWarnings = summaryRows.filter(r => r.warnings > 0);

  if (runsWithWarnings.length === 0) {
    summaryContent.push('No warnings. All outputs passed checks.');
  } else {
    summaryContent.push(`${runsWithWarnings.length} runs had warnings. Check individual result files for details.`);
  }

  await fs.writeFile(
    path.join(runDir, '_SUMMARY.md'),
    summaryContent.join('\n')
  );

  // ── Final output ──────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`\u2705 Clean: ${summaryRows.filter(r => r.warnings === 0).length}/${totalRuns}`);
  console.log(`\u26A0\uFE0F  Warnings: ${totalWarnings}`);
  console.log(`\u274C Errors: ${totalErrors}`);
  console.log(`\uD83D\uDCCA Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`\uD83D\uDCC1 Results: ${runDir}`);
  console.log(`${'─'.repeat(60)}\n`);
}

run().catch(console.error);
