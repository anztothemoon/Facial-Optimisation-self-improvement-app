/**
 * Firebase Admin — used to verify ID tokens and write Firestore from webhooks.
 *
 * Credentials (pick one):
 * - FIREBASE_SERVICE_ACCOUNT_JSON — full JSON string (CI / some hosts)
 * - FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS — absolute or cwd-relative path to the .json file (local dev; never commit that file)
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let initialized = false;

function loadServiceAccount() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline && String(inline).trim()) {
    return JSON.parse(inline);
  }
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath && String(filePath).trim()) {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    const raw = fs.readFileSync(resolved, 'utf8');
    return JSON.parse(raw);
  }
  return null;
}

function init() {
  if (initialized) return true;
  let cred;
  try {
    cred = loadServiceAccount();
  } catch (e) {
    console.error('[firebase-admin] could not load service account', e.message);
    return false;
  }
  if (!cred) {
    console.warn(
      '[firebase-admin] Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH — Stripe webhooks / token verify may fail'
    );
    return false;
  }
  try {
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(cred) });
    }
    initialized = true;
    return true;
  } catch (e) {
    console.error('[firebase-admin] init failed', e);
    return false;
  }
}

function getAdmin() {
  return init() ? admin : null;
}

module.exports = { getAdmin, init };
