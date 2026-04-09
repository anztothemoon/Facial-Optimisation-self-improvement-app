import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme';
import { hapticSuccess } from '../../services/haptics';

const MILESTONES = [7, 14, 30, 60];

type Props = {
  /** Use max of logging / workout streaks */
  streakValue: number;
};

export function StreakMilestoneCelebration({ streakValue }: Props) {
  const [milestone, setMilestone] = useState<number | null>(null);
  const prev = useRef(0);
  const seeded = useRef(false);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      prev.current = streakValue;
      return;
    }

    const v = streakValue;
    let crossed: number | null = null;
    for (const m of MILESTONES) {
      if (prev.current < m && v >= m) {
        crossed = m;
        break;
      }
    }

    if (crossed !== null) {
      void hapticSuccess();
      setMilestone(crossed);
      scale.setValue(0.6);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      const t = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setMilestone(null));
      }, 2600);
      prev.current = v;
      return () => clearTimeout(t);
    }

    prev.current = v;
  }, [streakValue, opacity, scale]);

  if (!milestone) return null;

  return (
    <Animated.View style={[styles.banner, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.bannerText}>
        Milestone: {milestone}-day streak! Keep going.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  bannerText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
});
