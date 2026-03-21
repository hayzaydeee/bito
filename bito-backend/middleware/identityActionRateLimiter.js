const { securityLogger } = require('../utils/securityLogger');

function createIdentityActionRateLimiter({ windowMs, maxRequests, nowFn = Date.now, store = new Map() }) {
  function check(key) {
    const now = nowFn();
    const existing = store.get(key);

    if (!existing || now - existing.windowStart >= windowMs) {
      const next = { windowStart: now, count: 1 };
      store.set(key, next);
      return { allowed: true, remaining: Math.max(0, maxRequests - 1) };
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    existing.count += 1;
    return { allowed: true, remaining: Math.max(0, maxRequests - existing.count) };
  }

  return { check, store };
}

const sharedLimiter = createIdentityActionRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

function buildIdentityActionRateLimitMiddleware({
  action,
  windowMs,
  maxRequests,
  identityFn = (req) => req.user?._id?.toString() || req.ip || 'anonymous',
}) {
  const limiter = createIdentityActionRateLimiter({
    windowMs,
    maxRequests,
    store: sharedLimiter.store,
  });

  return (req, res, next) => {
    const identity = identityFn(req);
    const key = `${identity}:${action}`;
    const result = limiter.check(key);

    if (!result.allowed) {
      securityLogger.append({
        type: 'rate_limit_violation',
        details: {
          action_taken: 'blocked',
          surface: 'api',
          action,
          identity,
          path: req.originalUrl,
        },
      });

      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
    }

    return next();
  };
}

module.exports = {
  createIdentityActionRateLimiter,
  buildIdentityActionRateLimitMiddleware,
};
