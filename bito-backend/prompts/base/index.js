/**
 * Base prompts index — re-exports all base prompts keyed by feature name.
 */

const insightEnrichment = require('./insightEnrichment');
const weeklyReport = require('./weeklyReport');
const analyticsReport = require('./analyticsReport');
const kickstart = require('./kickstart');
const earlyInsight = require('./earlyInsight');

const basePrompts = {
  'insight-enrichment': insightEnrichment,
  'weekly-report': weeklyReport,
  'analytics-report': analyticsReport,
  'kickstart': kickstart,
  'early-insight': earlyInsight,
};

module.exports = { basePrompts };
