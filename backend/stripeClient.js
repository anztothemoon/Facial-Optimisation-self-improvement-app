const Stripe = require('stripe');

let cached;

/**
 * Lazy Stripe client so the API can boot without STRIPE_SECRET_KEY (Expo Go / local dev).
 * Stripe routes must still check the key before calling APIs.
 */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !String(key).trim()) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}

module.exports = { getStripe };
