import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  PrimaryButton,
  ProgressBar,
  ScreenShell,
} from '../components';
import { GlowCard } from '../components/dashboard';
import { db } from '../services/firebase';
import { buildFaceAnalysis } from '../services/faceAnalysis';
import { generateActionPlans } from '../services/actionPlans';
import {
  setChecklistItem,
  subscribePlanProgress,
  type PlanProgress,
} from '../services/planProgressFirestore';
import { estimateDailyCalorieTarget } from '../services/nutritionFirestore';
import { colors } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Recommendations'>;

export function RecommendationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<string[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [progress, setProgress] = useState<PlanProgress>({});

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const profile = snap.data()?.onboardingProfile as
        | { goals?: string[]; weightKg?: number | null }
        | undefined;
      setGoals(Array.isArray(profile?.goals) ? profile.goals : []);
      setWeightKg(typeof profile?.weightKg === 'number' ? profile.weightKg : null);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribePlanProgress(user.uid, setProgress);
    return unsub;
  }, [user]);

  const faceAnalysis = useMemo(() => buildFaceAnalysis(7), []);
  const caloriesTarget = estimateDailyCalorieTarget({ weightKg, goals });
  const plans = useMemo(
    () => generateActionPlans({ goals, faceAnalysis, caloriesTarget }),
    [goals.join('|'), faceAnalysis.overallScore, caloriesTarget]
  );

  const completion = useMemo(() => {
    const all = [...plans.daily, ...plans.weekly, ...plans.monthly].flatMap((p) =>
      p.checklist.map((item, idx) => `${p.id}:${idx}:${item}`)
    );
    const done = all.filter((id) => progress[id]).length;
    return all.length ? (done / all.length) * 100 : 0;
  }, [plans, progress]);

  const toggle = async (id: string) => {
    if (!user) return;
    await setChecklistItem(user.uid, id, !progress[id]);
  };

  return (
    <ScreenShell
      title="Recommendations"
      subtitle="Daily, weekly, and monthly plans across face/body/fitness/skin/style/supplements."
    >
      <ProgressBar value={completion} label="Plan completion" />
      <GlowCard variant="cyan">
        <Text style={styles.title}>Daily Plan</Text>
        {plans.daily.map((plan) => (
          <PlanCard key={plan.id} plan={plan} progress={progress} onToggle={toggle} />
        ))}
      </GlowCard>
      <GlowCard variant="violet">
        <Text style={styles.title}>Weekly Plan</Text>
        {plans.weekly.map((plan) => (
          <PlanCard key={plan.id} plan={plan} progress={progress} onToggle={toggle} />
        ))}
      </GlowCard>
      <GlowCard variant="amber">
        <Text style={styles.title}>Monthly Plan</Text>
        {plans.monthly.map((plan) => (
          <PlanCard key={plan.id} plan={plan} progress={progress} onToggle={toggle} />
        ))}
      </GlowCard>
      <PrimaryButton
        label="Face & body workouts"
        variant="ghost"
        onPress={() => navigation.navigate('FaceBodyWorkouts')}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 10,
  },
  planWrap: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  planTitle: { color: colors.text, fontWeight: '700', marginBottom: 8, fontSize: 14 },
  item: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tick: { color: colors.bg, fontWeight: '900', fontSize: 11 },
});

type PlanCardProps = {
  plan: { id: string; title: string; checklist: string[] };
  progress: PlanProgress;
  onToggle: (id: string) => Promise<void>;
};

function PlanCard({ plan, progress, onToggle }: PlanCardProps) {
  return (
    <View style={styles.planWrap}>
      <Text style={styles.planTitle}>{plan.title}</Text>
      {plan.checklist.map((item, idx) => {
        const id = `${plan.id}:${idx}:${item}`;
        const done = Boolean(progress[id]);
        return (
          <Pressable key={id} style={styles.row} onPress={() => onToggle(id)}>
            <View style={[styles.checkbox, done ? styles.checkboxDone : null]}>
              {done ? <Text style={styles.tick}>✓</Text> : null}
            </View>
            <Text style={styles.item}>{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
