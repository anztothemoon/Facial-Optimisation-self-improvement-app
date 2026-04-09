# Commercial handoff checklist

Use this when **selling or transferring** the app to another owner, white-labeling, or preparing **App Store / Play** review.

## 1. Product & branding

- Edit `frontend/config/product.ts` or set `EXPO_PUBLIC_*` variables in `frontend/.env` (see `frontend/.env.example`).
- Replace app icon, splash, and adaptive icon under `frontend/assets/`.
- Update `app.json` `name`, `slug`, `scheme`, and iOS `merchantIdentifier` / `@stripe/stripe-react-native` plugin if Stripe merchant changes.

## 2. Legal & store listings

- Host **Privacy Policy** and **Terms of Service** on the buyer’s domain; set `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_TERMS_URL`.
- Fill **Legal & data** screen in-app (`Profile` → Legal & data) — required for many reviewers.
- Disclose **Firebase, Stripe, OpenAI, Sentry** (and any other SDKs) in the privacy policy.
- **Face photos / analysis**: Position as wellness and grooming education, **not** a medical device or identity verification (see copy in `config/product.ts` and `FaceAnalysisDisclaimer`).

## 3. Backend & secrets

- `backend/.env`: `FIREBASE_SERVICE_ACCOUNT_JSON`, `STRIPE_*`, `OPENAI_API_KEY` (if you use server-side AI), `SENTRY_DSN`, optional `CORS_ORIGIN`.
- Rotate all keys before handoff; revoke old service accounts.
- Document **Stripe** webhook URL and **Firebase** project ownership transfer steps for the buyer.

## 4. Face analysis API (acquirers / integrations)

- Endpoint: `POST /api/analysis/face` (authenticated). Response includes `meta.schemaVersion`, `meta.disclaimer`, `meta.hasPhotoInput` for compliance and UI.
- Current engine is **heuristic** (`heuristic-api-v1`); replace `faceAnalysisHandler.js` with a real CV/ML pipeline when ready without breaking clients if you keep `analysis` shape and bump `schemaVersion`.

## 5. Observability

- Set `EXPO_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` for crash reporting in production builds.

## 6. IP & repository

- Confirm **third-party licenses** (fonts, sounds, icons) allow redistribution.
- Remove or replace `frontend/assets/sounds/tick.wav` generator if you change sound asset licensing.

## 7. Build & release

- **iOS**: Apple Developer Program, App Store Connect, signing, push notification keys if used.
- **Android**: Play Console, signing key, `google-services.json` if Firebase.
- Use **EAS Build** or `expo prebuild` workflows; document Node version and Expo SDK (see `package.json`).
