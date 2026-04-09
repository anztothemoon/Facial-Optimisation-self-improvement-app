/**
 * Express API — run: node server.js (from the backend folder)
 */
require('dotenv').config();
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    integrations: [Sentry.expressIntegration()],
    beforeSend(event) {
      try {
        if (event.request?.headers) {
          const h = { ...event.request.headers };
          if (h.Authorization) h.Authorization = '[redacted]';
          if (h.authorization) h.authorization = '[redacted]';
          event.request.headers = h;
        }
        if (event.request?.cookies) {
          event.request.cookies = '[redacted]';
        }
      } catch {
        /* ignore scrub errors */
      }
      return event;
    },
  });
}
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { handleWebhook } = require('./stripeWebhook');
const stripeRoutes = require('./stripeRoutes');
const { postChat } = require('./chatRoutes');
const { requireFirebaseUser } = require('./authMiddleware');
const { faceAnalysisHandler } = require('./faceAnalysisHandler');
const { securityHeaders } = require('./securityHeaders');
const { getAdmin, init: initFirebaseAdmin } = require('./firebaseAdmin');
initFirebaseAdmin();

const app = express();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_CHAT_PER_MIN ?? 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat requests. Try again shortly.' },
});

const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ANALYSIS_PER_MIN ?? 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Try again shortly.' },
});
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

app.use(securityHeaders());

const corsAllowed = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

app.use(
  cors({
    origin:
      corsAllowed && corsAllowed.length > 0
        ? (origin, cb) => {
            if (!origin || corsAllowed.includes(origin)) {
              cb(null, true);
            } else {
              cb(new Error('Not allowed by CORS'));
            }
          }
        : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '512kb' }));

app.get('/health', (req, res) => {
  const adminOk = Boolean(getAdmin());
  const stripeOk = Boolean(process.env.STRIPE_SECRET_KEY);
  const webhookOk = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  res.json({
    ok: true,
    service: 'api',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    checks: {
      firebaseAdmin: adminOk,
      stripeSecret: stripeOk,
      stripeWebhookSecret: webhookOk,
    },
  });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express' });
});

app.post('/api/analysis/face', analysisLimiter, requireFirebaseUser, faceAnalysisHandler);

app.post('/api/chat', chatLimiter, requireFirebaseUser, postChat);

app.use('/api/stripe', stripeRoutes);

app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  next(err);
});

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use((err, req, res, next) => {
  console.error('[api] unhandled', err);
  if (!res.headersSent) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CORS_ORIGIN) {
      console.warn(
        '[api] WARNING: NODE_ENV=production but CORS_ORIGIN is unset — all origins are allowed. Set CORS_ORIGIN to your app origins.'
      );
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn('[api] WARNING: STRIPE_WEBHOOK_SECRET missing — subscription webhooks will fail.');
    }
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.warn('[api] WARNING: FIREBASE_SERVICE_ACCOUNT_JSON missing — auth and Firestore writes will fail.');
    }
  }
});
