import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Variant = 'cyan' | 'violet' | 'emerald' | 'amber';

const VARIANTS: Record<
  Variant,
  readonly [string, string, string]
> = {
  cyan: ['#22d3ee', '#38bdf8', '#0ea5e9'],
  violet: ['#818cf8', '#6366f1', '#4f46e5'],
  emerald: ['#34d399', '#10b981', '#059669'],
  amber: ['#fbbf24', '#f59e0b', '#d97706'],
};

const SHADOW: Record<Variant, string> = {
  cyan: '#38bdf8',
  violet: '#818cf8',
  emerald: '#34d399',
  amber: '#fbbf24',
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  style?: ViewStyle;
  /** Padding inside the inner surface */
  padding?: number;
};

/** Card with gradient border + soft outer glow (premium dashboard). */
export function GlowCard({
  children,
  variant = 'cyan',
  style,
  padding = 16,
}: Props) {
  const reducedMotion = useReducedMotion();
  const grad = VARIANTS[variant];
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translate, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();
  }, [opacity, reducedMotion, translate]);

  return (
    <Animated.View
      style={[
        styles.shadowWrap,
        { opacity, transform: [{ translateY: translate }] },
        { shadowColor: SHADOW[variant] },
        style,
      ]}
    >
      <LinearGradient
        colors={[...grad]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientRing}
      >
        <View style={[styles.inner, { padding }]}>{children}</View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 20,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  gradientRing: {
    borderRadius: 20,
    padding: 1.5,
  },
  inner: {
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
});
