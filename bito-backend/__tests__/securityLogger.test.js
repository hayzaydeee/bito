const { createSecurityLogger } = require('../utils/securityLogger');

describe('security logger', () => {
  test('writes NDJSON with required fields', () => {
    const lines = [];
    const logger = createSecurityLogger({ writeLine: (line) => lines.push(line) });

    logger.append({
      type: 'auth_failure',
      details: { action_taken: 'blocked', surface: 'api' },
    });

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.type).toBe('auth_failure');
    expect(parsed.details.action_taken).toBe('blocked');
    expect(parsed.timestamp).toBeDefined();
  });

  test('redacts sensitive values in details', () => {
    const lines = [];
    const logger = createSecurityLogger({ writeLine: (line) => lines.push(line) });

    logger.append({
      type: 'auth_failure',
      details: {
        action_taken: 'blocked',
        token: 'secret-token-value',
        authorization: 'Bearer abc',
      },
    });

    const parsed = JSON.parse(lines[0]);
    expect(parsed.details.token).toBe('[redacted]');
    expect(parsed.details.authorization).toBe('[redacted]');
  });
});
