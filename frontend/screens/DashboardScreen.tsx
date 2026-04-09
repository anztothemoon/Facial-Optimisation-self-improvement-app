import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, onSnapshot } from 'firebase/firestore';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import {
  GlassPanel,
  PrimaryButton,
  ProgressBar,
  ScreenShell,
  StaggerIn,
  TrialCountdownBanner,
  TrustStrip,
} from '../components';
import {
  GlowCard,
  QuickActionButton,
  WeeklyProgressGraph,
} from '../components/dashboard';
import { db } from '../services/firebase';
import {
  estimateDailyCalorieTarget,
  getDateKey,
  subscribeDailyNutritionLogs,
  type DailyNutritionLog,
} from '../services/nutritionFirestore';
import { colors } from '../theme';
import { productConfig } from '../config/product';

type Props = NativeStackScreenProps<MainStackParamList, 'Dashboard'>;

const FACE_SCORE_PLACEHOLDER = 84;

const MORE_LINKS: { name: keyof MainStackParamList; label: string }[] = [
  { name: 'FaceAnalysis', label: 'Face Analysis' },
  { name: 'MotionFitness', label: 'Motion & fitness' },
  { name: 'LooksmaxProtocol', label: 'Looksmax Protocol' },
  { name: 'Recommendations', label: 'Recommendations' },
  { name: 'Tracker', label: 'Tracker' },
  { name: 'Profile', label: 'Profile' },
  { name: 'AICoachChat', label: 'AI Coach Chat' },
];

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<string[]>([]);
  const [profileWeight, setProfileWeight] = useState<number | null>(null);
  const [logs, setLogs] = useState<DailyNutritionLog[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const profile = snap.data()?.onboardingProfile as
        | { goals?: string[]; weightKg?: number | null }
        | undefined;
      setGoals(Array.isArray(profile?.goals) ? profile.goals : []);
      setProfileWeight(
        typeof profile?.weightKg === 'number' ? profile.weightKg : null
      );
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDailyNutritionLogs(user.uid, 14, setLogs);
    return unsub;
  }, [user]);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  const todayKey = getDateKey();
  const todayLog = logs.find((log) => log.dateKey === todayKey);
  const lastLog = logs[0];
  const weightKg = todayLog?.weightKg ?? lastLog?.weightKg ?? profileWeight ?? 0;
  const suggestedCalories = estimateDailyCalorieTarget({
    weightKg: weightKg || profileWeight || null,
    goals,
  });
  const currentCalories = todayLog?.calories ?? 0;
  const calorieGoal = todayLog?.calorieGoal ?? suggestedCalories;
  const calPct = calorieGoal > 0 ? Math.min(100, (currentCalories / calorieGoal) * 100) : 0;

  const streakDays = useMemo(() => {
    const dateSet = new Set(logs.map((l) => l.dateKey));
    const cursor = new Date();
    let streak = 0;
    for (;;) {
      const key = getDateKey(cursor);
      if (!dateSet.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [logs]);

  const weeklyData = useMemo(() => {
    const recent = [...logs].slice(0, 7).reverse();
    return recent.map((entry) => ({
      label: entry.dateKey.slice(5).replace('-', '/'),
      value: entry.calories,
    }));
  }, [logs]);

  return (
    <ScreenShell
      title="Dashboard"
      subtitle={dateLabel}
      showBack={false}
    >
      <TrialCountdownBanner />
      <TrustStrip />

      {/* Face score — hero */}
      <GlowCard variant="cyan">
        <Text style={styles.metricLabel}>Face score</Text>
        <View style={styles.faceRow}>
          <Text style={styles.faceScore}>{FACE_SCORE_PLACEHOLDER}</Text>
          <Text style={styles.faceOutOf}>/ 100</Text>
        </View>
        <ProgressBar
          value={FACE_SCORE_PLACEHOLDER}
          label="Symmetry · clarity · posture"
        />
        <Text style={styles.faceHint}>
          You are in the top tier this week.
        </Text>
      </GlowCard>

      {/* Weight + streak */}
      <View style={styles.row}>
        <View style={styles.half}>
          <GlowCard variant="violet" padding={14}>
            <Text style={styles.metricLabel}>Weight</Text>
            <Text style={styles.bigNum}>{weightKg ? weightKg.toFixed(1) : '--'}</Text>
            <Text style={styles.unit}>kg</Text>
            <Text style={styles.delta}>From your latest check-in</Text>
          </GlowCard>
        </View>
        <View style={styles.half}>
          <GlowCard variant="amber" padding={14}>
            <Text style={styles.metricLabel}>Streak</Text>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.bigNum}>{streakDays}</Text>
            <Text style={styles.unit}>days</Text>
            <Text style={styles.delta}>Keep it going</Text>
          </GlowCard>
        </View>
      </View>

      {/* Calories */}
      <GlowCard variant="emerald">
        <Text style={styles.metricLabel}>Daily calories</Text>
        <View style={styles.calorieRow}>
          <Text style={styles.calorieCurrent}>
            {currentCalories.toLocaleString()}
            <Text style={styles.calorieGoal}>
              {' '} / {calorieGoal.toLocaleString()} kcal
            </Text>
          </Text>
        </View>
        <ProgressBar value={calPct} label="Today's intake vs goal" />
        <Text style={styles.goalHint}>
          Suggested target: {suggestedCalories.toLocaleString()} kcal
        </Text>
        <Text style={styles.healthNote}>{productConfig.healthDataNotice}</Text>
      </GlowCard>

      <GlowCard variant="violet">
        <Text style={styles.metricLabel}>Calorie progress</Text>
        {weeklyData.length > 0 ? (
          <WeeklyProgressGraph data={weeklyData} target={calorieGoal} />
        ) : (
          <View>
            <Text style={styles.goalHint}>Start logging to unlock your weekly graph.</Text>
            <Text style={styles.emptyHint}>
              Tap Tracker to log meals — consistency beats perfection.
            </Text>
          </View>
        )}
      </GlowCard>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <StaggerIn delayMs={40}>
        <GlassPanel style={styles.glass}>
          <View style={styles.quickRow}>
            <QuickActionButton
              icon="🥗"
              label="Log calories"
              onPress={() => navigation.navigate('Tracker')}
            />
            <QuickActionButton
              icon="📷"
              label="Upload photo"
              onPress={() => navigation.navigate('ProgressPhotos')}
            />
            <QuickActionButton
              icon="💪"
              label="Start workout"
              onPress={() => navigation.navigate('FaceBodyWorkouts')}
            />
            <QuickActionButton
              icon="⌚"
              label="Motion"
              onPress={() => navigation.navigate('MotionFitness')}
            />
          </View>
        </GlassPanel>
      </StaggerIn>

      <Text style={styles.sectionTitle}>More</Text>
      {MORE_LINKS.map((item, idx) => (
        <StaggerIn key={item.name} delayMs={80 + idx * 28}>
          <PrimaryButton
            label={item.label}
            variant="ghost"
            onPress={() => navigation.navigate(item.name)}
            style={styles.moreBtn}
          />
        </StaggerIn>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metricLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  faceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  faceScore: {
    color: colors.accent,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
  },
  faceOutOf: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 6,
  },
  faceHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 2,
  },
  half: {
    flex: 1,
    paddingHorizontal: 4,
  },
  bigNum: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  streakEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  unit: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  delta: {
    color: colors.success,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  calorieRow: {
    marginBottom: 8,
  },
  calorieCurrent: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  calorieGoal: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  goalHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  healthNote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    opacity: 0.92,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
    marginTop: 6,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  quickRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  glass: { marginBottom: 8 },
  moreBtn: { marginBottom: 10 },
});
