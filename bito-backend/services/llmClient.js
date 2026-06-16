const OpenAI = require('openai');

let _client = null;

function isLLMAvailable() {
  return !!process.env.OPENAI_API_KEY;
}

function getLLMClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

module.exports = { isLLMAvailable, getLLMClient };
