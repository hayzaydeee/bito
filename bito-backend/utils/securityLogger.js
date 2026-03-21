const SENSITIVE_KEYS = new Set([
  'authorization',
  'token',
  'session',
  'password',
  'secret',
  'cookie',
  'apiKey',
]);

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') {
    return {};
  }

  const output = Array.isArray(details) ? [] : {};

  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEYS.has(key)) {
      output[key] = '[redacted]';
      continue;
    }

    if (value && typeof value === 'object') {
      output[key] = sanitizeDetails(value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function createSecurityLogger({ writeLine } = {}) {
  const writer = writeLine || ((line) => console.log(line));

  return {
    append({ type, details = {} }) {
      const safeDetails = sanitizeDetails(details);
      if (!safeDetails.action_taken) {
        safeDetails.action_taken = 'review_prompt';
      }

      const entry = {
        timestamp: new Date().toISOString(),
        type,
        details: safeDetails,
      };

      writer(JSON.stringify(entry));
      return entry;
    },
  };
}

const securityLogger = createSecurityLogger();

module.exports = {
  createSecurityLogger,
  sanitizeDetails,
  securityLogger,
};
