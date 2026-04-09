import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useStripe } from '@stripe/stripe-react-native';
import { PremiumButton } from '../components/PremiumButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  createPaymentSheetSession,
  createCheckoutSession,
  syncSubscriptionFromStripe,
  type PlanKey,
} from '../services/stripeApi';
import { productConfig } from '../config/product';
import { colors } from '../theme';

const PLANS: {
  key: PlanKey;
  title: string;
  price: string;
  hint: string;
}[] = [
  {
    key: 'weekly',
    title: 'Weekly',
    price: '£7 / week',
    hint: 'Intro week is 50% off: pay £3.50 for your first week',
  },
  {
    key: 'monthly',
    title: 'Monthly',
    price: '£20 / month',
    hint: 'Best balance for steady progress',
  },
  {
    key: 'yearly',
    title: 'Yearly',
    price: '£70 / year',
    hint: 'Lowest long-term cost',
  },
];

const isExpoGo = Constants.appOwnership === 'expo';

export function PaywallScreen() {
  const navigation = useNavigation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [busy, setBusy] = useState<PlanKey | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async (key: PlanKey) => {
    setError(null);
    setBusy(key);
    try {
      try {
        const session = await createPaymentSheetSession(key);
        const init = await initPaymentSheet({
          merchantDisplayName: productConfig.paywallMerchantDisplayName,
          customerId: session.customerId,
          customerEphemeralKeySecret: session.ephemeralKey,
          paymentIntentClientSecret: session.paymentIntent,
          allowsDelayedPaymentMethods: true,
          defaultBillingDetails: {
            email: undefined,
          },
        });
        if (init.error) throw new Error(init.error.message);
        const present = await presentPaymentSheet();
        if (present.error) throw new Error(present.error.message);
      } catch (inner) {
        if (isExpoGo) {
          const url = await createCheckoutSession(key);
          const redirectUrl = 'frontend://stripe-success';
          await WebBrowser.openAuthSessionAsync(url, redirectUrl);
        } else {
          throw inner;
        }
      }
      await syncSubscriptionFromStripe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setBusy(null);
    }
  }, []);

  const restore = useCallback(async () => {
    setError(null);
    setRestoreBusy(true);
    try {
      await syncSubscriptionFromStripe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setRestoreBusy(false);
    }
  }, []);

  return (
    <ScreenShell
      title="Premium"
      subtitle="Unlock your face scan results and full coaching. Intro offer: first week is half price."
      showBack={navigation.canGoBack()}
    >
      <View>
        <View style={styles.trialPill}>
          <Text style={styles.trialPillText}>50% off first week</Text>
        </View>
        <Text style={styles.trialNote}>
          Weekly plan starts at £3.50 for week one, then renews at £7/week.
          Monthly is £20 and yearly is £70. Cancel anytime in billing settings.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <SurfaceCard title="What you get">
          <Text style={styles.bullet}>• Unlimited AI coach & face programs</Text>
          <Text style={styles.bullet}>• Progress photos & analytics</Text>
          <Text style={styles.bullet}>• Face & body workouts tailored to you</Text>
        </SurfaceCard>

        {PLANS.map((p) => (
          <View key={p.key} style={styles.planBlock}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{p.title}</Text>
              <Text style={styles.planBadge}>{p.price}</Text>
            </View>
            <Text style={styles.planHint}>{p.hint}</Text>
            <PremiumButton
              label={p.key === 'weekly' ? 'Start for £3.50 this week' : `Choose ${p.title.toLowerCase()}`}
              onPress={() => startCheckout(p.key)}
              loading={busy === p.key}
              disabled={busy !== null || restoreBusy}
            />
          </View>
        ))}

        <PrimaryButton
          label="Restore subscription"
          variant="ghost"
          onPress={restore}
          loading={restoreBusy}
          disabled={busy !== null}
        />
        <Text style={styles.restoreHint}>
          If you subscribed on another device, restore syncs your Stripe
          subscription to this account.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  trialPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginBottom: 10,
  },
  trialPillText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  trialNote: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  error: { color: colors.danger, marginBottom: 12, fontSize: 14 },
  bullet: { color: colors.text, fontSize: 15, marginBottom: 8 },
  planBlock: {
    marginBottom: 22,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  planBadge: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  planHint: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 14,
  },
  restoreHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
});
