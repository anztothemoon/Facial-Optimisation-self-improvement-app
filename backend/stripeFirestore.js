const { getAdmin } = require('./firebaseAdmin');

const PLAN_FROM_PRICE = {
  [process.env.STRIPE_PRICE_WEEKLY]: 'weekly',
  [process.env.STRIPE_PRICE_MONTHLY]: 'monthly',
  [process.env.STRIPE_PRICE_YEARLY]: 'yearly',
};

function priceIdToPlan(priceId) {
  return PLAN_FROM_PRICE[priceId] || null;
}

/**
 * @param {import('stripe').Stripe.Subscription} subscription
 */
async function syncSubscriptionToFirestore(uid, subscription) {
  const admin = getAdmin();
  if (!admin) throw new Error('Firebase Admin not configured');

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.id;
  const plan =
    subscription.metadata?.plan ||
    priceIdToPlan(priceId) ||
    null;

  const trialEnd = subscription.trial_end
    ? admin.firestore.Timestamp.fromMillis(subscription.trial_end * 1000)
    : null;
  const currentPeriodEnd = subscription.current_period_end
    ? admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000)
    : null;

  const ref = admin.firestore().doc(`users/${uid}`);
  await ref.set(
    {
      subscription: {
        status: subscription.status,
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id,
        stripeSubscriptionId: subscription.id,
        plan,
        trialEnd,
        currentPeriodEnd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );
}

async function clearSubscriptionInFirestore(uid) {
  const admin = getAdmin();
  if (!admin) return;
  const ref = admin.firestore().doc(`users/${uid}`);
  const snap = await ref.get();
  const prev = snap.exists ? snap.data()?.subscription : null;
  const prevObj = prev && typeof prev === 'object' ? prev : {};
  await ref.set(
    {
      subscription: {
        ...prevObj,
        status: 'canceled',
        trialEnd: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );
}

module.exports = {
  syncSubscriptionToFirestore,
  clearSubscriptionInFirestore,
  priceIdToPlan,
};
