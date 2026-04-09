const { getAdmin } = require('./firebaseAdmin');

/**
 * Express middleware — requires a valid Firebase ID token (Bearer).
 * Sets `req.firebaseUser` to the decoded token payload.
 */
async function requireFirebaseUser(req, res, next) {
  const admin = getAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Server authentication is not configured' });
  }
  const raw =
    req.headers.authorization && String(req.headers.authorization).startsWith('Bearer ')
      ? String(req.headers.authorization).slice(7).trim()
      : null;
  if (!raw) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(raw);
    req.firebaseUser = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireFirebaseUser };
