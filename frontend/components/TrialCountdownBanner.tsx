import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

/** Live countdown while subscription status is `trialing`. */
export function TrialCountdownBanner() {
  const { subscriptionStatus, trialEndsAt } = useAuth();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (subscriptionStatus !== 'trialing' || !trialEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [subscriptionStatus, trialEndsAt]);

  if (subscriptionStatus !== 'trialing' || !trialEndsAt) return null;

  const ms = Math.max(0, trialEndsAt.getTime() - now);
  if (ms <= 0) return null;

  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Trial ends in</Text>
      <Text style={styles.time}>
        {h > 0 ? `${h}h ` : ''}
        {m}m {s}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  title: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  time: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
