const express = require('express');
const { getAdmin } = require('./firebaseAdmin');
const { syncSubscriptionToFirestore } = require('./stripeFirestore');
const { getStripe } = require('./stripeClient');

const router = express.Router();

const PRICE_MAP = {
  weekly: process.env.STRIPE_PRICE_WEEKLY,
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};
const WEEKLY_INTRO_COUPON = process.env.STRIPE_WEEKLY_INTRO_COUPON;

function extractSubscriptionPaymentClientSecret(subscription) {
  const inv = subscription.latest_invoice;
  if (!inv) return null;
  const pi = typeof inv === 'object' ? inv.payment_intent : null;
  if (typeof pi === 'object' && pi && pi.client_secret) return pi.client_secret;
  return null;
}

function isAllowedReturnUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^(https?:\/\/|exp:\/\/|frontend:\/\/)/i.test(url.trim());
}

async function getOrCreateCustomer({ uid, email }) {
  const search = await getStripe().customers.search({
    query: `metadata['firebase_uid']:'${uid}'`,
    limit: 1,
  });
  if (search.data.length) {
    const customerId = search.data[0].id;
    await getStripe().customers.update(customerId, {
      metadata: { firebase_uid: uid },
      ...(email ? { email } : {}),
    });
    return customerId;
  }
  const c = await getStripe().customers.create({
    email: email || undefined,
    metadata: { firebase_uid: uid },
  });
  return c.id;
}
router.post('/create-checkout-session', async (req, res) => {
  try {
    const admin = getAdmin();
    if (!admin) {
      return res.status(503).json({ error: 'Server missing Firebase Admin credentials' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const {
      idToken,
      priceKey,
      successUrl: clientSuccessUrl,
      cancelUrl: clientCancelUrl,
    } = req.body;
    if (!idToken || !priceKey) {
      return res.status(400).json({ error: 'idToken and priceKey required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;

    const priceId = PRICE_MAP[priceKey];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid priceKey' });
    }

    const customerId = await getOrCreateCustomer({ uid, email });

    const envSuccessUrl =
      process.env.STRIPE_SUCCESS_URL ||
      'http://localhost:8081/stripe-success?session_id={CHECKOUT_SESSION_ID}';
    const envCancelUrl =
      process.env.STRIPE_CANCEL_URL || 'http://localhost:8081/stripe-cancel';
    const successUrl = isAllowedReturnUrl(clientSuccessUrl)
      ? clientSuccessUrl
      : envSuccessUrl;
    const cancelUrl = isAllowedReturnUrl(clientCancelUrl)
      ? clientCancelUrl
      : envCancelUrl;

    const sessionPayload = {
      mode: 'subscription',
      customer: customerId,
      client_reference_id: uid,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { firebase_uid: uid, plan: priceKey },
      },
      metadata: { firebase_uid: uid, plan: priceKey },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (priceKey === 'weekly' && WEEKLY_INTRO_COUPON) {
      sessionPayload.discounts = [{ coupon: WEEKLY_INTRO_COUPON }];
    }

    const session = await getStripe().checkout.sessions.create(sessionPayload);

    res.json({ url: session.url });
  } catch (e) {
    console.error('[stripe] create-checkout-session', e);
    res.status(400).json({ error: e.message || 'Checkout failed' });
  }
});

router.post('/create-payment-sheet', async (req, res) => {
  try {
    const admin = getAdmin();
    if (!admin) {
      return res
        .status(503)
        .json({ error: 'Server missing Firebase Admin credentials' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const { idToken, priceKey } = req.body || {};
    if (!idToken || !priceKey) {
      return res.status(400).json({ error: 'idToken and priceKey required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;

    const priceId = PRICE_MAP[priceKey];
    if (!priceId) return res.status(400).json({ error: 'Invalid priceKey' });

    const customerId = await getOrCreateCustomer({ uid, email });
    const ephemeralKey = await getStripe().ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2026-03-25.dahlia' }
    );

    const subscriptionPayload = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { firebase_uid: uid, plan: priceKey },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    };

    if (priceKey === 'weekly' && WEEKLY_INTRO_COUPON) {
      subscriptionPayload.discounts = [{ coupon: WEEKLY_INTRO_COUPON }];
    }

    const subscription = await getStripe().subscriptions.create(subscriptionPayload, {
      expand: ['latest_invoice.payment_intent'],
    });

    let clientSecret = extractSubscriptionPaymentClientSecret(subscription);

    if (!clientSecret && subscription.latest_invoice) {
      const invId =
        typeof subscription.latest_invoice === 'string'
          ? subscription.latest_invoice
          : subscription.latest_invoice.id;
      const invoice = await getStripe().invoices.retrieve(invId, {
        expand: ['payment_intent'],
      });
      const pi = invoice.payment_intent;
      clientSecret =
        typeof pi === 'object' && pi && pi.client_secret ? pi.client_secret : null;
    }

    if (!clientSecret) {
      return res
        .status(400)
        .json({ error: 'Stripe did not return a payment client secret' });
    }

    return res.json({
      customerId,
      ephemeralKey: ephemeralKey.secret,
      paymentIntent: clientSecret,
      subscriptionId: subscription.id,
    });
  } catch (e) {
    console.error('[stripe] create-payment-sheet', e);
    return res.status(400).json({ error: e.message || 'PaymentSheet failed' });
  }
});

router.post('/billing-portal', async (req, res) => {
  try {
    const admin = getAdmin();
    if (!admin) {
      return res.status(503).json({ error: 'Server missing Firebase Admin credentials' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const { idToken, returnUrl } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: 'idToken required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const userSnap = await admin.firestore().doc(`users/${uid}`).get();
    let customerId = userSnap.data()?.subscription?.stripeCustomerId;

    if (!customerId) {
      const search = await getStripe().customers.search({
        query: `metadata['firebase_uid']:'${uid}'`,
        limit: 1,
      });
      if (search.data.length) {
        customerId = search.data[0].id;
      }
    }

    if (!customerId) {
      return res.status(400).json({
        error: 'No Stripe customer found. Complete a subscription checkout first.',
      });
    }

    const portalReturn =
      returnUrl ||
      process.env.STRIPE_PORTAL_RETURN_URL ||
      'http://localhost:8081';

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: portalReturn,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error('[stripe] billing-portal', e);
    res.status(400).json({ error: e.message || 'Billing portal failed' });
  }
});

router.post('/sync-subscription', async (req, res) => {
  try {
    const admin = getAdmin();
    if (!admin) {
      return res.status(503).json({ error: 'Server missing Firebase Admin credentials' });
    }
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken required' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;

    const userSnap = await admin.firestore().doc(`users/${uid}`).get();
    const storedCustomerId = userSnap.data()?.subscription?.stripeCustomerId;

    let customerId = storedCustomerId;
    if (!customerId) {
      const customers = await getStripe().customers.list({
        email: email || undefined,
        limit: 10,
      });
      const customer =
        customers.data.find((c) => c.metadata?.firebase_uid === uid) ||
        customers.data[0];
      if (!customer) {
        return res.json({ ok: true, updated: false });
      }
      customerId = customer.id;
    }

    const subs = await getStripe().subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    const active = subs.data.find((s) =>
      ['trialing', 'active'].includes(s.status)
    );

    if (!active) {
      const { clearSubscriptionInFirestore } = require('./stripeFirestore');
      await clearSubscriptionInFirestore(uid);
      return res.json({ ok: true, updated: true });
    }

    await syncSubscriptionToFirestore(uid, active);
    res.json({ ok: true, updated: true });
  } catch (e) {
    console.error('[stripe] sync-subscription', e);
    res.status(400).json({ error: e.message || 'Sync failed' });
  }
});

module.exports = router;
