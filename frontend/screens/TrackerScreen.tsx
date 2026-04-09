import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, onSnapshot } from 'firebase/firestore';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import {
  PrimaryButton,
  ProgressBar,
  ScreenShell,
} from '../components';
import { GlowCard, WeeklyProgressGraph } from '../components/dashboard';
import {
  estimateDailyCalorieTarget,
  estimateMacroTargets,
  getDateKey,
  saveDailyNutritionLog,
  subscribeDailyNutritionLogs,
  type DailyNutritionLog,
} from '../services/nutritionFirestore';
import { db } from '../services/firebase';
import { colors } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Tracker'>;

export function TrackerScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<string[]>([]);
  const [profileWeight, setProfileWeight] = useState<number | null>(null);
  const [logs, setLogs] = useState<DailyNutritionLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [weightKg, setWeightKg] = useState('');

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

  const todayKey = getDateKey();
  const todayLog = logs.find((log) => log.dateKey === todayKey);
  const baseWeight = todayLog?.weightKg ?? profileWeight;

  const suggestedCalories = useMemo(
    () => estimateDailyCalorieTarget({ weightKg: baseWeight ?? null, goals }),
    [baseWeight, goals]
  );
  const macroSuggestion = useMemo(
    () => estimateMacroTargets(suggestedCalories, goals),
    [suggestedCalories, goals]
  );

  useEffect(() => {
    if (!todayLog) return;
    setCalories(String(todayLog.calories));
    setProteinG(String(todayLog.proteinG));
    setCarbsG(String(todayLog.carbsG));
    setFatG(String(todayLog.fatG));
    setWeightKg(todayLog.weightKg ? String(todayLog.weightKg) : '');
  }, [todayLog?.dateKey]);

  const weeklyData = useMemo(() => {
    const recent = [...logs].slice(0, 7).reverse();
    return recent.map((entry) => ({
      label: entry.dateKey.slice(5).replace('-', '/'),
      value: entry.calories,
    }));
  }, [logs]);

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

  const parseNum = (value: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const caloriesNum = parseNum(calories);
  const calProgressPct =
    suggestedCalories > 0
      ? Math.min(100, (caloriesNum / suggestedCalories) * 100)
      : 0;

  const quickAddCalories = (delta: number) => {
    setCalories(String(Math.max(0, Math.round(caloriesNum + delta))));
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveDailyNutritionLog(user.uid, {
        calories: parseNum(calories),
        proteinG: parseNum(proteinG),
        carbsG: parseNum(carbsG),
        fatG: parseNum(fatG),
        weightKg: weightKg.trim() ? parseNum(weightKg) : null,
        calorieGoal: suggestedCalories,
        suggestedCalories,
      });
      Alert.alert('Saved', 'Today\'s nutrition and weight log has been updated.');
    } catch {
      Alert.alert('Could not save', 'Please try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell
      title="Tracker"
      subtitle="One place for today: calories first, then macros & weight. Save when you’re done."
    >
      <GlowCard variant="emerald">
        <Text style={styles.cardLabel}>Your calorie target (estimate)</Text>
        <Text style={styles.suggested}>{suggestedCalories.toLocaleString()} kcal</Text>
        <Text style={styles.muted}>
          From your profile goals{goals.length ? ` · ${goals.join(', ')}` : ''}. Not medical
          advice — adjust with your coach or clinician if needed.
        </Text>
        <Text style={styles.macro}>
          Suggested macros · P {macroSuggestion.proteinG}g · C {macroSuggestion.carbsG}g · F{' '}
          {macroSuggestion.fatG}g
        </Text>
        {caloriesNum > 0 ? (
          <View style={styles.progressBlock}>
            <ProgressBar value={calProgressPct} label="Today vs target" />
            <Text style={styles.progressHint}>
              {caloriesNum.toLocaleString()} / {suggestedCalories.toLocaleString()} kcal logged
            </Text>
          </View>
        ) : null}
      </GlowCard>

      <GlowCard variant="cyan">
        <Text style={styles.cardLabel}>Today · {todayKey}</Text>
        <Text style={styles.stepHint}>Start with total calories — quick-add snacks below.</Text>
        <View style={styles.grid}>
          <Field label="Calories (kcal)" value={calories} onChangeText={setCalories} />
          <Field label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} />
        </View>
        <Text style={styles.quickLabel}>Quick add calories</Text>
        <View style={styles.quickRow}>
          {[100, 200, 300, 500].map((n) => (
            <Pressable
              key={n}
              style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
              onPress={() => quickAddCalories(n)}
            >
              <Text style={styles.quickChipTxt}>+{n}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.expandLabel}>Macros (optional)</Text>
        <View style={styles.grid}>
          <Field label="Protein (g)" value={proteinG} onChangeText={setProteinG} />
          <Field label="Carbs (g)" value={carbsG} onChangeText={setCarbsG} />
        </View>
        <Field label="Fat (g)" value={fatG} onChangeText={setFatG} />
        <PrimaryButton
          label={saving ? 'Saving...' : 'Save today’s log'}
          onPress={onSave}
          disabled={saving}
        />
      </GlowCard>

      <GlowCard variant="violet">
        <Text style={styles.cardLabel}>Progress graph (last 7 logs)</Text>
        {weeklyData.length > 0 ? (
          <WeeklyProgressGraph data={weeklyData} target={suggestedCalories} />
        ) : (
          <Text style={styles.muted}>No logs yet. Save your first entry above.</Text>
        )}
        <Text style={styles.streak}>Current streak: {streakDays} day(s)</Text>
      </GlowCard>

      <View style={styles.navRow}>
        <PrimaryButton
          label="Progress photos"
          variant="ghost"
          onPress={() => navigation.navigate('ProgressPhotos')}
        />
        <PrimaryButton
          label="Profile"
          variant="ghost"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  cardLabel: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
    fontSize: 12,
  },
  suggested: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -1,
  },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  macro: {
    color: colors.success,
    marginTop: 8,
    fontWeight: '700',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldWrap: {
    flex: 1,
    marginBottom: 12,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  streak: {
    color: colors.warning,
    marginTop: 10,
    fontWeight: '700',
  },
  progressBlock: { marginTop: 14 },
  progressHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  stepHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 19,
  },
  quickLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.bgElevated,
  },
  quickChipPressed: { opacity: 0.85 },
  quickChipTxt: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  expandLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  navRow: { gap: 8 },
});

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

function Field({ label, value, onChangeText }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}
