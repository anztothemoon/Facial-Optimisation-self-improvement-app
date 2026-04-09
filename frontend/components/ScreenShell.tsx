import React from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { SmartDock } from './SmartDock';
import { TopBar } from './TopBar';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Props = {
  title?: string;
  subtitle?: string;
  /** Pass false to hide back on screens that are stack roots */
  showBack?: boolean;
  /** Set false for screens that manage their own scroll (e.g. chat). */
  scrollable?: boolean;
  children: React.ReactNode;
};

export function ScreenShell({
  title,
  subtitle,
  children,
  showBack,
  scrollable = true,
}: Props) {
  const reducedMotion = useReducedMotion();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translate = React.useRef(new Animated.Value(10)).current;

  React.useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, reducedMotion, translate]);

  const inner = (
    <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>
      <TopBar showBack={showBack} />
      {title ? <Text style={styles.h1}>{title}</Text> : null}
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </Animated.View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.ambientOrb, styles.orbTop]} />
      <View style={[styles.ambientOrb, styles.orbBottom]} />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.scrollFill}>{inner}</View>
      )}
      <SmartDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  scrollFill: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  h1: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.15,
    marginBottom: 20,
  },
  body: { flex: 1 },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.accentMuted,
  },
  orbTop: {
    width: 260,
    height: 260,
    top: -140,
    right: -90,
    opacity: 0.5,
  },
  orbBottom: {
    width: 220,
    height: 220,
    bottom: 50,
    left: -110,
    opacity: 0.35,
  },
});
