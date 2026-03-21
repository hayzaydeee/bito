const { assertRequiredSecurityConfig } = require('../config/securityConfig');

describe('security config validation', () => {
  test('throws when required secrets are missing', () => {
    expect(() => assertRequiredSecurityConfig({})).toThrow(/JWT_SECRET/);
  });

  test('throws when SESSION_SECRET is missing', () => {
    expect(() => assertRequiredSecurityConfig({ JWT_SECRET: 'jwt-only' })).toThrow(/SESSION_SECRET/);
  });

  test('does not throw when required secrets are present', () => {
    expect(() => assertRequiredSecurityConfig({
      JWT_SECRET: 'jwt-secret',
      SESSION_SECRET: 'session-secret',
    })).not.toThrow();
  });
});
