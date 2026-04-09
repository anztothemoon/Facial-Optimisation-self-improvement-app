import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

const GLOW: Record<'cyan' | 'emerald' | 'violet', string> = {
  cyan: '#38bdf8',
  emerald: '#34d399',
  violet: '#818cf8',
};

type Props = {
  value: number;
  label: string;
  variant?: keyof typeof GLOW;
};

export function GlowProgressBar({ value, label, variant = 'cyan' }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [anim, pct]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const glow = GLOW[variant];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width,
              backgroundColor: glow,
              shadowColor: glow,
            },
          ]}
        />
      </View>
      <Text style={styles.pct}>{Math.round(pct)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 3,
  },
  pct: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
