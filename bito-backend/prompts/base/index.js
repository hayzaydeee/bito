/**
 * Base prompts index — re-exports all base prompts keyed by feature name.
 */

const insightEnrichment = require('./insightEnrichment');
const weeklyReport = require('./weeklyReport');
const analyticsReport = require('./analyticsReport');
const kickstart = require('./kickstart');
const earlyInsight = require('./earlyInsight');
const earlyAnalytics = require('./earlyAnalytics');
const validator = require('./validator');

const basePrompts = {
  'insight-enrichment': insightEnrichment,
  'weekly-report': weeklyReport,
  'analytics-report': analyticsReport,
  'kickstart': kickstart,
  'early-insight': earlyInsight,
  'early-analytics': earlyAnalytics,
  'validator': validator,
};

module.exports = { basePrompts };
