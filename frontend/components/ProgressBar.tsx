import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** 0–100 */
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.pct}>{Math.round(pct)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  pct: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
