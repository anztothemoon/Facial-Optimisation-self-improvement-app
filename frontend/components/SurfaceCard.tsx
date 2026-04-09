import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Props = {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
};

/** Dark surface card with subtle border */
export function SurfaceCard({ title, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
    shadowColor: colors.accent,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 10,
  },
});
