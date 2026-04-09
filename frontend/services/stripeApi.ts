import * as Linking from 'expo-linking';
import { auth } from './firebase';
import { getApiBaseUrl } from './apiBase';

const BASE = getApiBaseUrl();

export type PlanKey = 'weekly' | 'monthly' | 'yearly';
export type PaymentSheetSession = {
  customerId: string;
  ephemeralKey: string;
  paymentIntent: string;
  subscriptionId: string;
};

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();
  return token;
}

export async function createCheckoutSession(priceKey: PlanKey): Promise<string> {
  const idToken = await getIdToken();
  const successUrl = Linking.createURL('stripe-success', {
    queryParams: { session_id: '{CHECKOUT_SESSION_ID}' },
  });
  const cancelUrl = Linking.createURL('stripe-cancel');
  const res = await fetch(`${BASE}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, priceKey, successUrl, cancelUrl }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) throw new Error(data.error || 'Checkout failed');
  if (!data.url) throw new Error('No checkout URL');
  return data.url;
}

export async function createPaymentSheetSession(
  priceKey: PlanKey
): Promise<PaymentSheetSession> {
  const idToken = await getIdToken();
  const res = await fetch(`${BASE}/api/stripe/create-payment-sheet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, priceKey }),
  });
  const data = (await res.json()) as
    | (PaymentSheetSession & { error?: undefined })
    | { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'PaymentSheet setup failed');
  }
  return data as PaymentSheetSession;
}

export async function syncSubscriptionFromStripe(): Promise<void> {
  const idToken = await getIdToken();
  const res = await fetch(`${BASE}/api/stripe/sync-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error || 'Restore failed');
}

export async function createBillingPortalSession(): Promise<string> {
  const idToken = await getIdToken();
  const returnUrl = Linking.createURL('profile');
  const res = await fetch(`${BASE}/api/stripe/billing-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, returnUrl }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) throw new Error(data.error || 'Could not open billing portal');
  if (!data.url) throw new Error('No portal URL');
  return data.url;
}
