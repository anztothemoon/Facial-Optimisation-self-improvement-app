# Production launch — what the codebase does vs what you must do

The app includes API hardening, Stripe webhook idempotency, subscription sync to Firestore, and in-app legal/trust copy. **You** still own accounts, keys, legal documents, and store submissions.

## Already implemented in the repo

- Express: rate limits, JSON size cap, security headers, CORS hook, Sentry scrubbing of auth headers.
- Stripe: Checkout + Payment Sheet routes, `/api/stripe/sync-subscription`, webhook handler with **event deduplication** (`stripeWebhookEvents/{eventId}`), `checkout.session.completed`, `customer.subscription.created|updated|deleted`.
- Firestore: `clearSubscriptionInFirestore` preserves `stripeCustomerId` when canceling so billing portal can still work.
- Health: `GET /health` returns non-secret checks (`firebaseAdmin`, `stripeSecret`, `stripeWebhookSecret`).
- Frontend: optional `EXPO_PUBLIC_SUBSCRIPTION_INCLUDE_PAST_DUE=1` to keep Premium during Stripe `past_due` retries.

## What you must provide

### 1. Accounts and keys

| Item | Action |
|------|--------|
| **Firebase** | Create production project; enable Auth + Firestore + Storage if used; download service account JSON for `FIREBASE_SERVICE_ACCOUNT_JSON` on the server. |
| **Stripe** | Live **secret** key, **webhook signing secret**, price IDs, optional intro coupon; **publishable** key in the app (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`). |
| **API URL** | Deploy backend with HTTPS; set `EXPO_PUBLIC_API_URL` to that origin in the mobile `.env`. |
| **Sentry** (recommended) | Create project; set `SENTRY_DSN` (server) and `EXPO_PUBLIC_SENTRY_DSN` (app). |
| **OpenAI** (optional) | `OPENAI_API_KEY` on server for server-side chat; BYOK remains client-side user key. |

### 2. Stripe Dashboard (production)

1. **Webhook endpoint**: `https://YOUR_API_DOMAIN/api/stripe/webhook`  
2. Subscribe to at least: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.  
3. Copy the **signing secret** (`whsec_...`) into production `STRIPE_WEBHOOK_SECRET`.  
4. Use the **live** webhook secret in production — not the Stripe CLI secret.

### 3. Production server environment

- Set `NODE_ENV=production` (enables HSTS and startup warnings).  
- Set `CORS_ORIGIN` to a comma-separated list of allowed origins (e.g. your Expo web origin if any, or omit mobile-only if you only use native `fetch` without browser CORS — **still recommended** to set explicit origins when you have a known list).  
- TLS termination (reverse proxy or host TLS) in front of Node.

### 4. Legal and product

- Host **Privacy Policy** and **Terms**; set `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_TERMS_URL`.  
- Set `EXPO_PUBLIC_SUPPORT_EMAIL`.  
- Replace placeholder **data retention** bullets in `frontend/config/product.ts` (`dataRetentionSummary`) after counsel review.  
- Complete App Store / Play listings, screenshots, age rating, subscription disclosure.

### 5. App signing and release

- **Apple**: Developer Program, App Store Connect, certificates, provisioning, optional merchant ID for Apple Pay / Stripe.  
- **Google**: Play Console, signing key, Data safety form aligned with your privacy policy.

### 6. Ongoing operations

- Monitor Sentry and Stripe Dashboard for failed payments and webhook delivery errors.  
- Rotate keys on handoff or breach.  
- Plan **account deletion** and data export if you operate in regions that require it — implement flows beyond in-app copy when you scale.

## Firestore TTL for `stripeWebhookEvents` (optional but recommended)

Webhook dedupe documents include an **`expireAt`** timestamp (default ~90 days ahead, overridable with `STRIPE_WEBHOOK_EVENT_TTL_DAYS`). Without a TTL policy, that collection grows forever.

1. Open [Firebase Console](https://console.firebase.google.com/) → your project → **Firestore Database** → **TTL** (or **Indexes** → TTL tab, depending on UI version).  
2. **Add TTL policy**: collection ID **`stripeWebhookEvents`**, TTL field **`expireAt`**.  
3. Deploy the policy. Firestore will delete documents after `expireAt` (not instant; background process).

Dedup only needs IDs for a short window; 90 days is plenty for Stripe retries.

---

## What you can paste to an assistant (and what you must not)

**Do not paste real secrets into any chat** (including this one): they can leak via logs, history, or screenshots. That includes:

- `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON), private keys, refresh tokens  
- `STRIPE_SECRET_KEY` (`sk_live_…` / `sk_test_…`), `STRIPE_WEBHOOK_SECRET` (`whsec_…`)  
- `OPENAI_API_KEY`, `SENTRY_DSN` if you treat them as confidential  
- Firebase ID tokens, session cookies, user passwords  

**Safe to paste** when debugging:

- **Error messages** as plain text (remove URLs that contain tokens)  
- **Redacted** values: e.g. `sk_live_…xxxx` (only last 4 shown), `whsec_…(hidden)`  
- **Public / non-secret IDs**: Firebase **project ID**, Stripe **price** IDs (`price_…`), **publishable** key prefix `pk_test_` / `pk_live_` (still be careful in public forums)  
- **Structure only**: copy your `.env.example` and fill with `REDACTED` or `xxx`  
- **`GET /health` JSON** (no secrets in response)  
- **Stripe Dashboard** webhook “delivery” error text (often no secret)

**Better workflow**: Put real values only in **local** `backend/.env` and `frontend/.env` on your machine (never commit). In Cursor, you can say “variable X is set but I get error Y” without pasting the value.

---

## Quick verification

1. `GET https://YOUR_API/health` — `checks.firebaseAdmin`, `checks.stripeSecret`, `checks.stripeWebhookSecret` should be `true` in production.  
2. Complete a **test** subscription; confirm `users/{uid}.subscription` in Firestore updates within seconds (webhook).  
3. Cancel in Stripe test mode; confirm subscription state updates and app gating behaves as expected.  
4. After webhooks run, open Firestore → `stripeWebhookEvents` → confirm documents have **`expireAt`**; after enabling TTL, old docs disappear over time.
