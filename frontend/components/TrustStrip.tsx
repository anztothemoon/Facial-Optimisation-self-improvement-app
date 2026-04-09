import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { productConfig } from '../config/product';
import { colors } from '../theme';

type Props = {
  /** Override default trust line from productConfig */
  message?: string;
  variant?: 'default' | 'compact';
};

/**
 * Lightweight credibility strip — use under headers or before sensitive sections.
 */
export function TrustStrip({ message, variant = 'default' }: Props) {
  const copy = message ?? productConfig.trustTagline;
  return (
    <View style={[styles.wrap, variant === 'compact' && styles.wrapCompact]}>
      <Text style={styles.line} accessibilityRole="text">
        <Text style={styles.dot}>● </Text>
        {copy}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(91, 231, 255, 0.22)',
    backgroundColor: 'rgba(13, 23, 48, 0.85)',
    marginBottom: 14,
  },
  wrapCompact: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  line: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  dot: {
    color: colors.accent,
    fontSize: 11,
    opacity: 0.95,
  },
});
