import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Props = {
  children: React.ReactNode;
  delayMs?: number;
  offsetY?: number;
};

/** Lightweight stagger wrapper for premium list entrance choreography. */
export function StaggerIn({ children, delayMs = 0, offsetY = 10 }: Props) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translate = useRef(
    new Animated.Value(reducedMotion ? 0 : offsetY)
  ).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        delay: delayMs,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 260,
        delay: delayMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delayMs, opacity, reducedMotion, translate]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>
      {children}
    </Animated.View>
  );
}
