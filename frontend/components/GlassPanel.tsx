import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

/** Subtle glassmorphism surface for premium sections. */
export function GlassPanel({ children, style, intensity = 28 }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(22, 29, 44, 0.35)',
    marginBottom: 12,
  },
  inner: {
    padding: 12,
  },
});
