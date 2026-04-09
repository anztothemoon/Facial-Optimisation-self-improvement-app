import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  /** Emoji or short symbol */
  hint: string;
  /** Pulse while timer running */
  active: boolean;
  /** face | neck | posture etc. for label */
  regionLabel: string;
};

export function ExerciseVisual({ hint, active, regionLabel }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, scale]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, { transform: [{ scale }] }]}>
        <Text style={styles.emoji}>{hint}</Text>
      </Animated.View>
      <Text style={styles.region}>{regionLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 12 },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 40 },
  region: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
