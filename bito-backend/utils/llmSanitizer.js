const REDACTION_PLACEHOLDER = '[content redacted by security filter]';

const INJECTION_PATTERNS = [
  { id: 'ignore-instructions', pattern: /ignore (?:all )?(?:previous|prior|above) instructions?/gi },
  { id: 'disregard-instructions', pattern: /disregard (?:all )?(?:previous|prior)?.*?instructions?/gi },
  { id: 'new-instructions', pattern: /you (?:now |will )?(?:must )?follow new instructions/gi },
  { id: 'system-prompt-extract', pattern: /(?:output|reveal|repeat|show|print) (?:the |your )?system prompt/gi },
  { id: 'role-override', pattern: /you are now (?:a |an )?(?!assistant)/gi },
  { id: 'jailbreak-prefix', pattern: /DAN|do anything now|developer mode|jailbreak/gi },
];

function sanitizeText(text) {
  if (typeof text !== 'string') {
    return { sanitizedText: text, hadMatches: false, matchedPatterns: [] };
  }

  let result = text;
  let hadMatches = false;
  const matchedPatterns = [];

  for (const { id, pattern } of INJECTION_PATTERNS) {
    if (pattern.test(result)) {
      hadMatches = true;
      matchedPatterns.push(id);
      result = result.replace(pattern, REDACTION_PLACEHOLDER);
    }
  }

  return {
    sanitizedText: result,
    hadMatches,
    matchedPatterns,
  };
}

function sanitizeObject(input) {
  let hadMatches = false;

  function walk(value) {
    if (typeof value === 'string') {
      const sanitized = sanitizeText(value);
      if (sanitized.hadMatches) {
        hadMatches = true;
      }
      return sanitized.sanitizedText;
    }

    if (Array.isArray(value)) {
      return value.map(walk);
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
    }

    return value;
  }

  return {
    sanitized: walk(input),
    hadMatches,
  };
}

module.exports = {
  sanitizeText,
  sanitizeObject,
  REDACTION_PLACEHOLDER,
};
