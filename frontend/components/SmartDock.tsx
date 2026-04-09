import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { colors } from '../theme';
import { hapticTap, hapticTapStrong } from '../services/haptics';

const MAIN_ROUTES: Array<keyof MainStackParamList> = [
  'Dashboard',
  'FaceAnalysis',
  'Recommendations',
  'FaceBodyWorkouts',
  'MotionFitness',
  'ProgressPhotos',
  'Tracker',
  'Profile',
  'AICoachChat',
];

const ACTIONS: Array<{
  route: keyof MainStackParamList;
  icon: string;
  label: string;
}> = [
  { route: 'Dashboard', icon: '🏠', label: 'Home' },
  { route: 'Tracker', icon: '🥗', label: 'Tracker' },
  { route: 'AICoachChat', icon: '🤖', label: 'Coach' },
  { route: 'Profile', icon: '👤', label: 'Profile' },
];

type TipAction = {
  text: string;
  target: keyof MainStackParamList;
};

const SCREEN_TIPS: Partial<Record<keyof MainStackParamList, TipAction[]>> = {
  Dashboard: [
    { text: 'Tap to log meals quickly', target: 'Tracker' },
    { text: 'Open Motion & fitness for steps + sensors', target: 'MotionFitness' },
  ],
  Tracker: [
    { text: 'Ask coach: keep calories within +/-10%', target: 'AICoachChat' },
    { text: 'Ask coach: protein-first meal examples', target: 'AICoachChat' },
  ],
  ProgressPhotos: [
    { text: 'Open Face Analysis to compare improvements', target: 'FaceAnalysis' },
    { text: 'Open workouts to support visual changes', target: 'FaceBodyWorkouts' },
  ],
  FaceAnalysis: [
    { text: 'Open recommendations from your weak metrics', target: 'Recommendations' },
    { text: 'Ask coach for 4-week jawline plan', target: 'AICoachChat' },
  ],
  Recommendations: [
    { text: 'Open Tracker and complete today’s log', target: 'Tracker' },
    { text: 'Open workouts for guided timers', target: 'FaceBodyWorkouts' },
  ],
  FaceBodyWorkouts: [
    { text: 'Open progress photos for weekly check-ins', target: 'ProgressPhotos' },
    { text: 'Track steps & motion sensors', target: 'MotionFitness' },
  ],
  MotionFitness: [
    { text: 'Guided workouts with timers', target: 'FaceBodyWorkouts' },
    { text: 'Log nutrition in Tracker', target: 'Tracker' },
  ],
  Profile: [
    { text: 'Update goals in Recommendations plan', target: 'Recommendations' },
    { text: 'Open Tracker and update weight today', target: 'Tracker' },
  ],
  AICoachChat: [
    { text: 'Open Face Analysis before asking details', target: 'FaceAnalysis' },
    { text: 'Open Profile to refine your data', target: 'Profile' },
  ],
};

export function SmartDock() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const tipsAnim = useRef(new Animated.Value(0)).current;

  const visible = useMemo(
    () => MAIN_ROUTES.includes(route.name as keyof MainStackParamList),
    [route.name]
  );
  const tips = SCREEN_TIPS[route.name as keyof MainStackParamList] ?? [];

  if (!visible) return null;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    void (next ? hapticTapStrong() : hapticTap());
    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
    Animated.timing(tipsAnim, {
      toValue: next ? 1 : 0,
      duration: next ? 240 : 140,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {ACTIONS.map((a, idx) => {
        const y = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(idx + 1) * 56],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 1],
          outputRange: [0, 0.2, 1],
        });
        return (
          <Animated.View
            key={a.route}
            style={[styles.actionWrap, { opacity, transform: [{ translateY: y }] }]}
          >
            <Pressable
              style={styles.action}
              onPress={() => {
                void hapticTap();
                setOpen(false);
                Animated.timing(anim, {
                  toValue: 0,
                  duration: 120,
                  useNativeDriver: true,
                }).start();
                navigation.navigate(a.route);
              }}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          </Animated.View>
        );
      })}
      {tips.length > 0 ? (
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            styles.tipsWrap,
            {
              opacity: tipsAnim,
              transform: [
                {
                  translateY: tipsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.tipsTitle}>Smart coach tips</Text>
          {tips.map((tip) => (
            <Pressable
              key={tip.text}
              onPress={() => {
                void hapticTap();
                setOpen(false);
                Animated.timing(anim, {
                  toValue: 0,
                  duration: 120,
                  useNativeDriver: true,
                }).start();
                Animated.timing(tipsAnim, {
                  toValue: 0,
                  duration: 120,
                  useNativeDriver: true,
                }).start();
                navigation.navigate(tip.target);
              }}
              style={styles.tipBtn}
            >
              <Text style={styles.tipLine}>• {tip.text}</Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
      <Pressable style={styles.main} onPress={toggle}>
        <Text style={styles.mainTxt}>{open ? '×' : '⋯'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    alignItems: 'flex-end',
  },
  actionWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 6,
    backgroundColor: 'rgba(22, 29, 44, 0.95)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  actionIcon: { fontSize: 14, marginRight: 6 },
  actionLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  main: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  mainTxt: {
    color: colors.bg,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  tipsWrap: {
    position: 'absolute',
    right: 64,
    bottom: 0,
    width: 230,
    borderRadius: 14,
    padding: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tipsTitle: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tipLine: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
  tipBtn: { marginBottom: 6 },
});
