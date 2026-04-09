import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { productConfig } from '../../config/product';
import { colors } from '../../theme';

export function FaceAnalysisDisclaimer() {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={styles.badge}>Wellness & grooming</Text>
        <Text style={styles.not}>Not a medical device</Text>
      </View>
      <Text style={styles.short}>{productConfig.faceAnalysis.subtitle}</Text>
      <Pressable onPress={() => setOpen((v) => !v)} hitSlop={8}>
        <Text style={styles.toggle}>{open ? 'Hide full disclaimer ▲' : 'Full disclaimer ▼'}</Text>
      </Pressable>
      {open ? (
        <Text style={styles.long}>{productConfig.faceAnalysis.longDisclaimer}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.bgElevated,
    marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  not: {
    color: colors.warning,
    fontWeight: '700',
    fontSize: 11,
  },
  short: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  toggle: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
  },
  long: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
