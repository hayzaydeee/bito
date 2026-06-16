const Anthropic = require('@anthropic-ai/sdk');

let _client = null;

function isLLMAvailable() {
  return !!process.env.CLAUDE_API_KEY;
}

function getLLMClient() {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
      defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
    });
  }
  return _client;
}

module.exports = { isLLMAvailable, getLLMClient };
