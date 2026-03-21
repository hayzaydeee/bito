const REQUIRED_SECURITY_ENV_VARS = ['JWT_SECRET', 'SESSION_SECRET'];

function assertRequiredSecurityConfig(env = process.env) {
  const missing = REQUIRED_SECURITY_ENV_VARS.filter((key) => !env[key] || !String(env[key]).trim());

  if (missing.length > 0) {
    throw new Error(`Missing required security env vars: ${missing.join(', ')}`);
  }

  return true;
}

function getJwtSecret(env = process.env) {
  if (!env.JWT_SECRET || !String(env.JWT_SECRET).trim()) {
    throw new Error('JWT_SECRET is required');
  }
  return env.JWT_SECRET;
}

function getSessionSecret(env = process.env) {
  if (!env.SESSION_SECRET || !String(env.SESSION_SECRET).trim()) {
    throw new Error('SESSION_SECRET is required');
  }
  return env.SESSION_SECRET;
}

module.exports = {
  REQUIRED_SECURITY_ENV_VARS,
  assertRequiredSecurityConfig,
  getJwtSecret,
  getSessionSecret,
};
