/**
 * Baseline HTTP security headers (no extra dependencies).
 * Apply after the Stripe webhook route so signature verification stays unchanged.
 */

function securityHeaders() {
  return (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    if (process.env.NODE_ENV === 'production') {
      const maxAge = Number(process.env.HSTS_MAX_AGE_SECONDS || 15552000);
      res.setHeader(
        'Strict-Transport-Security',
        `max-age=${maxAge}; includeSubDomains; preload`
      );
    }
    res.setHeader(
      'Cross-Origin-Resource-Policy',
      process.env.CORP_POLICY || 'cross-origin'
    );
    next();
  };
}

module.exports = { securityHeaders };
