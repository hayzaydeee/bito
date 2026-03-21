const { createIdentityActionRateLimiter } = require('../middleware/identityActionRateLimiter');

describe('identity action rate limiter', () => {
  test('blocks when max requests exceeded inside window', () => {
    const limiter = createIdentityActionRateLimiter({ windowMs: 60000, maxRequests: 2 });
    const key = 'user-1:insights';

    expect(limiter.check(key).allowed).toBe(true);
    expect(limiter.check(key).allowed).toBe(true);
    expect(limiter.check(key).allowed).toBe(false);
  });

  test('resets counter after window expires', () => {
    const now = Date.now();
    const limiter = createIdentityActionRateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      nowFn: () => now,
    });

    expect(limiter.check('k').allowed).toBe(true);

    const advancedLimiter = createIdentityActionRateLimiter({
      windowMs: 1000,
      maxRequests: 1,
      nowFn: () => now + 2000,
      store: limiter.store,
    });

    expect(advancedLimiter.check('k').allowed).toBe(true);
  });
});
