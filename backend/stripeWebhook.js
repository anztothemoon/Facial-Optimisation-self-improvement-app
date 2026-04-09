const {
  syncSubscriptionToFirestore,
  clearSubscriptionInFirestore,
} = require('./stripeFirestore');
const { getAdmin } = require('./firebaseAdmin');
const { getStripe } = require('./stripeClient');

/** Days until Firestore may delete the doc (requires TTL policy on `expireAt` in console). */
function webhookEventTtlDays() {
  const n = Number(process.env.STRIPE_WEBHOOK_EVENT_TTL_DAYS);
  if (Number.isFinite(n) && n >= 30 && n <= 365) return Math.floor(n);
  return 90;
}

/**
 * Dedupe Stripe webhook deliveries (retries + rare races).
 * Collection: stripeWebhookEvents/{eventId}
 * Optional TTL field `expireAt` — enable in Firebase Console (see docs/PRODUCTION_CHECKLIST.md).
 */
async function isDuplicateEvent(eventId) {
  const admin = getAdmin();
  if (!admin) return false;
  const snap = await admin.firestore().doc(`stripeWebhookEvents/${eventId}`).get();
  return snap.exists;
}

async function markEventHandled(eventId, eventType) {
  const admin = getAdmin();
  if (!admin) return;
  const ttlMs = webhookEventTtlDays() * 24 * 60 * 60 * 1000;
  const expireAt = admin.firestore.Timestamp.fromMillis(Date.now() + ttlMs);
  await admin.firestore().doc(`stripeWebhookEvents/${eventId}`).set({
    type: eventType,
    handledAt: admin.firestore.FieldValue.serverTimestamp(),
    expireAt,
  });
}

async function resolveUidFromSubscription(subscription) {
  let uid = subscription.metadata?.firebase_uid;
  if (uid) return uid;
  if (!subscription.customer) return null;
  const cid =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const c = await getStripe().customers.retrieve(cid);
  if (c.deleted) return null;
  return c.metadata?.firebase_uid || null;
}

function shouldClearSubscription(subscription, eventType) {
  if (eventType === 'customer.subscription.deleted') return true;
  const s = subscription.status;
  return (
    s === 'canceled' ||
    s === 'unpaid' ||
    s === 'incomplete_expired' ||
    s === 'paused'
  );
}

async function handleSubscriptionObject(subscription, eventType) {
  const uid = await resolveUidFromSubscription(subscription);
  if (!uid) {
    console.warn('[stripe] webhook: no firebase_uid for subscription', subscription.id);
    return;
  }
  if (shouldClearSubscription(subscription, eventType)) {
    await clearSubscriptionInFirestore(uid);
  } else {
    await syncSubscriptionToFirestore(uid, subscription);
  }
}

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET missing');
    return res.status(500).send('Webhook not configured');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[stripe] STRIPE_SECRET_KEY missing (required for webhook handler)');
    return res.status(500).send('Stripe API not configured');
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    console.error('[stripe] webhook signature', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (await isDuplicateEvent(event.id)) {
    console.log('[stripe] webhook duplicate ignored', event.id);
    return res.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.metadata?.firebase_uid || session.client_reference_id;
        const subId = session.subscription;
        if (!uid || !subId) break;
        const sub = await getStripe().subscriptions.retrieve(
          typeof subId === 'string' ? subId : subId.id
        );
        await syncSubscriptionToFirestore(uid, sub);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionObject(subscription, event.type);
        break;
      }
      default:
        break;
    }

    await markEventHandled(event.id, event.type);
  } catch (e) {
    console.error('[stripe] webhook handler', e);
    return res.status(500).json({ error: String(e.message) });
  }

  return res.json({ received: true });
}

module.exports = { handleWebhook };
