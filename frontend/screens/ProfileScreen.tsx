import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { updateProfile } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import {
  Chip,
  PrimaryButton,
  ScreenShell,
  SkeletonBlock,
  StaggerIn,
  TrustStrip,
} from '../components';
import { GlowCard, WeeklyProgressGraph } from '../components/dashboard';
import {
  GlowProgressBar,
  ProfileBeforeAfter,
  StreakMilestoneCelebration,
  WeightMiniGraph,
} from '../components/profile';
import { db } from '../services/firebase';
import { saveOnboardingProfile } from '../services/onboardingFirestore';
import {
  computeNutritionLogStreak,
  estimateDailyCalorieTarget,
  getDateKey,
  subscribeDailyNutritionLogs,
  type DailyNutritionLog,
} from '../services/nutritionFirestore';
import { subscribeProgressPhotos, type ProgressPhotoEntry } from '../services/progressPhotosFirestore';
import {
  computeWorkoutStreak,
  subscribeWorkoutSessions,
  type WorkoutSession,
} from '../services/workoutFirestore';
import {
  createBillingPortalSession,
  syncSubscriptionFromStripe,
} from '../services/stripeApi';
import {
  clearUserOpenAIKey,
  getByokEnabled,
  getUserOpenAIKey,
  looksLikeOpenAIKey,
  setByokEnabled as persistByokEnabled,
  setUserOpenAIKey,
} from '../services/userOpenAISettings';
import {
  BODY_TYPES,
  FACE_STRUCTURES,
  FITNESS_LEVELS,
  GOALS,
  type OnboardingProfile,
} from '../types/onboardingProfile';
import { colors } from '../theme';
import { hapticError, hapticSuccess } from '../services/haptics';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

function emptyProfile(): OnboardingProfile {
  return {
    age: null,
    heightCm: null,
    weightKg: null,
    bodyType: null,
    fitnessLevel: null,
    goals: [],
    faceStructure: null,
    startingPhotoUrls: [],
  };
}

export function ProfileScreen({ navigation }: Props) {
  const {
    user,
    signOutUser,
    subscriptionStatus,
    subscriptionPlan,
    trialEndsAt,
    subscribed,
  } = useAuth();

  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [heightStr, setHeightStr] = useState('');
  const [weightStr, setWeightStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [logs, setLogs] = useState<DailyNutritionLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [photos, setPhotos] = useState<ProgressPhotoEntry[]>([]);

  const [byokEnabled, setByokEnabled] = useState(false);
  const [openAiKeyDraft, setOpenAiKeyDraft] = useState('');
  const [hasSavedOpenAiKey, setHasSavedOpenAiKey] = useState(false);
  const [byokBusy, setByokBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const on = await getByokEnabled();
      const existing = await getUserOpenAIKey();
      setByokEnabled(on);
      setHasSavedOpenAiKey(Boolean(existing));
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data();
        const ob = data?.onboardingProfile as Partial<OnboardingProfile> | undefined;
        if (ob) {
          setProfile({
            age: ob.age ?? null,
            heightCm: ob.heightCm ?? null,
            weightKg: ob.weightKg ?? null,
            bodyType: ob.bodyType ?? null,
            fitnessLevel: ob.fitnessLevel ?? null,
            goals: Array.isArray(ob.goals) ? ob.goals : [],
            faceStructure: ob.faceStructure ?? null,
            startingPhotoUrls: Array.isArray(ob.startingPhotoUrls)
              ? ob.startingPhotoUrls
              : [],
          });
        } else {
          setProfile(emptyProfile());
        }
        setLoadingProfile(false);
        setProfileError(null);
      },
      () => {
        setLoadingProfile(false);
        setProfileError('Could not load profile. Pull to refresh or reopen screen.');
      }
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  useEffect(() => {
    if (!profile) return;
    setAgeStr(profile.age != null ? String(profile.age) : '');
    setHeightStr(profile.heightCm != null ? String(profile.heightCm) : '');
    setWeightStr(profile.weightKg != null ? String(profile.weightKg) : '');
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeDailyNutritionLogs(user.uid, 21, setLogs);
    const u2 = subscribeWorkoutSessions(user.uid, 40, setWorkouts);
    const u3 = subscribeProgressPhotos(user.uid, 24, setPhotos);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  const goals = profile?.goals ?? [];
  const nutritionStreak = useMemo(
    () => computeNutritionLogStreak(logs),
    [logs]
  );
  const workoutStreak = useMemo(
    () => computeWorkoutStreak(workouts),
    [workouts]
  );
  const maxStreak = Math.max(nutritionStreak, workoutStreak);

  const calorieTarget = estimateDailyCalorieTarget({
    weightKg: profile?.weightKg ?? null,
    goals,
  });

  const weeklyCalorieData = useMemo(() => {
    const recent = [...logs].slice(0, 7).reverse();
    return recent.map((e) => ({
      label: e.dateKey.slice(5).replace('-', '/'),
      value: e.calories,
    }));
  }, [logs]);

  const weightData = useMemo(() => {
    const recent = [...logs].slice(0, 7).reverse();
    return recent.map((e) => ({
      label: e.dateKey.slice(5).replace('-', '/'),
      value: e.weightKg && e.weightKg > 0 ? e.weightKg : 0,
    }));
  }, [logs]);

  const todayLog = logs.find((l) => l.dateKey === getDateKey());
  const calProgress =
    todayLog && calorieTarget > 0
      ? Math.min(100, (todayLog.calories / calorieTarget) * 100)
      : 0;

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    let n = 0;
    const t = 6;
    if (profile.age != null) n += 1;
    if (profile.heightCm != null) n += 1;
    if (profile.weightKg != null) n += 1;
    if (profile.bodyType) n += 1;
    if (profile.fitnessLevel) n += 1;
    if (profile.goals.length) n += 1;
    return (n / t) * 100;
  }, [profile]);

  const facePhotos = useMemo(() => {
    const faces = photos.filter((p) => p.type === 'face');
    const sorted = [...faces].sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    const beforeUrl = sorted[0]?.url;
    const afterUrl = sorted[sorted.length - 1]?.url;
    return { beforeUrl, afterUrl, hasPair: sorted.length >= 2 };
  }, [photos]);

  const bodyPhotos = useMemo(() => {
    const bodies = photos.filter((p) => p.type === 'body');
    const sorted = [...bodies].sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    const beforeUrl = sorted[0]?.url;
    const afterUrl = sorted[sorted.length - 1]?.url;
    return { beforeUrl, afterUrl, hasPair: sorted.length >= 2 };
  }, [photos]);

  const saveProfile = useCallback(async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const age =
        ageStr.trim() === ''
          ? null
          : Math.min(120, Math.max(13, parseInt(ageStr, 10) || 0)) || null;
      const heightCm =
        heightStr.trim() === ''
          ? null
          : parseFloat(heightStr.replace(/[^0-9.]/g, '')) || null;
      const weightKg =
        weightStr.trim() === ''
          ? null
          : parseFloat(weightStr.replace(/[^0-9.]/g, '')) || null;

      if (displayName.trim() && displayName !== user.displayName) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await saveOnboardingProfile(user.uid, {
        age: age && age >= 13 ? age : null,
        heightCm:
          heightCm != null && heightCm >= 100 && heightCm <= 250 ? heightCm : null,
        weightKg:
          weightKg != null && weightKg >= 30 && weightKg <= 300 ? weightKg : null,
        bodyType: profile.bodyType,
        fitnessLevel: profile.fitnessLevel,
        goals: profile.goals,
        faceStructure: profile.faceStructure,
        startingPhotoUrls: profile.startingPhotoUrls,
      });
      void hapticSuccess();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      void hapticError();
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }, [
    user,
    profile,
    ageStr,
    heightStr,
    weightStr,
    displayName,
  ]);

  const toggleGoal = (g: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      goals: profile.goals.includes(g)
        ? profile.goals.filter((x) => x !== g)
        : [...profile.goals, g],
    });
  };

  const openBillingPortal = useCallback(async () => {
    setPortalBusy(true);
    try {
      const url = await createBillingPortalSession();
      await WebBrowser.openAuthSessionAsync(url);
      await syncSubscriptionFromStripe();
      void hapticSuccess();
    } catch (e) {
      void hapticError();
      Alert.alert(
        'Billing',
        e instanceof Error ? e.message : 'Could not open billing portal'
      );
    } finally {
      setPortalBusy(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setRestoreBusy(true);
    try {
      await syncSubscriptionFromStripe();
      void hapticSuccess();
      Alert.alert('Done', 'Subscription synced from Stripe.');
    } catch (e) {
      void hapticError();
      Alert.alert(
        'Restore',
        e instanceof Error ? e.message : 'Restore failed'
      );
    } finally {
      setRestoreBusy(false);
    }
  }, []);

  const subLabel = subscriptionStatus ?? 'unknown';
  const planLabel = subscriptionPlan ?? '—';
  const trialText = trialEndsAt
    ? trialEndsAt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <ScreenShell
      title="Profile"
      subtitle="Your info, subscription, and progress."
    >
      {loadingProfile ? (
        <View style={styles.skeletonWrap}>
          <SkeletonBlock style={styles.skelA} />
          <SkeletonBlock style={styles.skelB} />
          <SkeletonBlock style={styles.skelC} />
        </View>
      ) : null}
      {profileError ? <Text style={styles.error}>{profileError}</Text> : null}
      <StreakMilestoneCelebration streakValue={maxStreak} />

      <StaggerIn delayMs={20}>
        <GlowCard variant="amber" padding={14}>
          <Text style={styles.kicker}>Streaks</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakBox}>
              <Text style={styles.streakEmoji}>🥗</Text>
              <Text style={styles.streakNum}>{nutritionStreak}</Text>
              <Text style={styles.streakLbl}>Log days</Text>
            </View>
            <View style={styles.streakBox}>
              <Text style={styles.streakEmoji}>💪</Text>
              <Text style={styles.streakNum}>{workoutStreak}</Text>
              <Text style={styles.streakLbl}>Workout days</Text>
            </View>
          </View>
        </GlowCard>
      </StaggerIn>

      <StaggerIn delayMs={50}>
        <GlowCard variant="cyan" padding={14}>
          <Text style={styles.kicker}>Profile strength</Text>
          <GlowProgressBar
            value={profileCompletion}
            label="Completion"
            variant="cyan"
          />
          <GlowProgressBar
            value={calProgress}
            label="Today's calories vs target"
            variant="emerald"
          />
        </GlowCard>
      </StaggerIn>

        {weeklyCalorieData.length > 0 ? (
          <GlowCard variant="emerald" padding={14}>
            <Text style={styles.kicker}>Calorie trend</Text>
            <WeeklyProgressGraph
              data={weeklyCalorieData}
              target={calorieTarget}
            />
          </GlowCard>
        ) : null}

        {weightData.some((w) => w.value > 0) ? (
          <GlowCard variant="violet" padding={14}>
            <Text style={styles.kicker}>Weight check-ins</Text>
            <WeightMiniGraph data={weightData} />
          </GlowCard>
        ) : null}

        <GlowCard variant="violet" padding={14}>
          <Text style={styles.kicker}>Before / after</Text>
          <Text style={styles.subKicker}>Face</Text>
          <ProfileBeforeAfter
            beforeUrl={facePhotos.hasPair ? facePhotos.beforeUrl : undefined}
            afterUrl={facePhotos.hasPair ? facePhotos.afterUrl : undefined}
            title="Face"
          />
          <Text style={[styles.subKicker, { marginTop: 14 }]}>Body</Text>
          <ProfileBeforeAfter
            beforeUrl={bodyPhotos.hasPair ? bodyPhotos.beforeUrl : undefined}
            afterUrl={bodyPhotos.hasPair ? bodyPhotos.afterUrl : undefined}
            title="Body"
          />
          <PrimaryButton
            label="Manage progress photos"
            variant="ghost"
            onPress={() => navigation.navigate('ProgressPhotos')}
            style={styles.mt}
          />
        </GlowCard>

        <Text style={styles.section}>AI Coach (optional)</Text>
        <GlowCard variant="cyan" padding={14}>
          <Text style={styles.hint}>
            Use your own OpenAI API key so chat usage bills to your OpenAI account, not
            the app’s servers. Your key is stored only on this device (SecureStore).
          </Text>
          <View style={styles.byokRow}>
            <Text style={styles.byokLabel}>Use my OpenAI key</Text>
            <Switch
              value={byokEnabled}
              onValueChange={(v) => {
                setByokEnabled(v);
                void persistByokEnabled(v);
              }}
              trackColor={{ false: colors.surface, true: colors.accentMuted }}
              thumbColor={byokEnabled ? colors.accent : colors.textMuted}
            />
          </View>
          <Text style={styles.fieldLbl}>OpenAI API key (sk-…)</Text>
          <TextInput
            style={styles.input}
            value={openAiKeyDraft}
            onChangeText={setOpenAiKeyDraft}
            placeholder={
              hasSavedOpenAiKey ? 'Enter new key to replace saved key' : 'Paste sk-…'
            }
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          {hasSavedOpenAiKey ? (
            <Text style={styles.keyHint}>A key is saved on this device.</Text>
          ) : null}
          <PrimaryButton
            label={byokBusy ? 'Saving…' : 'Save key'}
            onPress={async () => {
              const trimmed = openAiKeyDraft.trim();
              if (!trimmed) {
                Alert.alert('Missing key', 'Paste a key starting with sk-');
                return;
              }
              if (!looksLikeOpenAIKey(trimmed)) {
                Alert.alert(
                  'Check format',
                  'OpenAI keys usually look like sk- followed by letters and numbers.'
                );
                return;
              }
              setByokBusy(true);
              try {
                await setUserOpenAIKey(trimmed);
                await persistByokEnabled(true);
                setByokEnabled(true);
                setHasSavedOpenAiKey(true);
                setOpenAiKeyDraft('');
                void hapticSuccess();
              } catch {
                void hapticError();
                Alert.alert('Could not save', 'Try again.');
              } finally {
                setByokBusy(false);
              }
            }}
            disabled={byokBusy}
            loading={byokBusy}
          />
          <PrimaryButton
            label="Remove saved key"
            variant="ghost"
            onPress={async () => {
              setByokBusy(true);
              try {
                await clearUserOpenAIKey();
                await persistByokEnabled(false);
                setByokEnabled(false);
                setHasSavedOpenAiKey(false);
                setOpenAiKeyDraft('');
                void hapticSuccess();
              } catch {
                void hapticError();
              } finally {
                setByokBusy(false);
              }
            }}
            disabled={byokBusy}
          />
        </GlowCard>

        <Text style={styles.section}>Subscription</Text>
        <GlowCard variant="cyan" padding={14}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={styles.rowValue}>
            {subscriptionStatus === 'trialing'
              ? 'Trial'
              : subscriptionStatus === 'active'
                ? 'Active'
                : subscribed
                  ? 'Premium'
                  : subLabel}
            {subscriptionPlan ? ` · ${planLabel}` : ''}
          </Text>
          <Text style={styles.rowLabel}>Trial / renewal</Text>
          <Text style={styles.rowValueMuted}>{trialText}</Text>
          <PrimaryButton
            label="Manage subscription"
            onPress={openBillingPortal}
            loading={portalBusy}
            disabled={restoreBusy}
            style={styles.mt}
          />
          <PrimaryButton
            label="Restore purchases"
            variant="ghost"
            onPress={restore}
            loading={restoreBusy}
            disabled={portalBusy}
            style={styles.mtSm}
          />
          <Text style={styles.hint}>
            Manage opens Stripe Customer Portal (change plan, payment method, or
            cancel). Restore syncs an existing Stripe subscription to this
            account.
          </Text>
        </GlowCard>

        <Text style={styles.section}>Edit your info</Text>
        <GlowCard variant="emerald" padding={14}>
          <Text style={styles.fieldLbl}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLbl}>Age</Text>
          <TextInput
            style={styles.input}
            value={ageStr}
            onChangeText={setAgeStr}
            keyboardType="number-pad"
            placeholder="e.g. 28"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLbl}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={heightStr}
            onChangeText={setHeightStr}
            keyboardType="decimal-pad"
            placeholder="e.g. 175"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLbl}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weightStr}
            onChangeText={setWeightStr}
            keyboardType="decimal-pad"
            placeholder="e.g. 72"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLbl}>Body type</Text>
          <View style={styles.chips}>
            {BODY_TYPES.map((b) => (
              <Chip
                key={b}
                label={b}
                selected={profile?.bodyType === b}
                onPress={() =>
                  profile &&
                  setProfile({ ...profile, bodyType: b })
                }
              />
            ))}
          </View>
          <Text style={styles.fieldLbl}>Fitness level</Text>
          <View style={styles.chips}>
            {FITNESS_LEVELS.map((f) => (
              <Chip
                key={f}
                label={f}
                selected={profile?.fitnessLevel === f}
                onPress={() =>
                  profile &&
                  setProfile({ ...profile, fitnessLevel: f })
                }
              />
            ))}
          </View>
          <Text style={styles.fieldLbl}>Goals</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={profile?.goals.includes(g) ?? false}
                onPress={() => profile && toggleGoal(g)}
              />
            ))}
          </View>
          <Text style={styles.fieldLbl}>Face structure</Text>
          <View style={styles.chips}>
            {FACE_STRUCTURES.map((f) => (
              <Chip
                key={f}
                label={f}
                selected={profile?.faceStructure === f}
                onPress={() =>
                  profile &&
                  setProfile({ ...profile, faceStructure: f })
                }
              />
            ))}
          </View>

          <PrimaryButton
            label={saving ? 'Saving...' : 'Save profile'}
            onPress={saveProfile}
            disabled={saving || !profile}
            loading={saving}
          />
        </GlowCard>

        <TrustStrip variant="compact" />
        <PrimaryButton
          label="AI Coach Chat"
          variant="ghost"
          onPress={() => navigation.navigate('AICoachChat')}
        />
        <PrimaryButton
          label="Legal & data"
          variant="ghost"
          onPress={() => navigation.navigate('Legal')}
        />
        <PrimaryButton label="Sign out" variant="ghost" onPress={signOutUser} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  subKicker: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakBox: { alignItems: 'center' },
  streakEmoji: { fontSize: 28, marginBottom: 4 },
  streakNum: {
    color: colors.warning,
    fontSize: 36,
    fontWeight: '900',
  },
  streakLbl: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  section: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
    marginTop: 8,
    marginBottom: 12,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  rowValueMuted: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
  byokRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  byokLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  keyHint: { color: colors.success, fontSize: 12, marginBottom: 8 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 10,
  },
  fieldLbl: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  mt: { marginTop: 8 },
  mtSm: { marginTop: 8 },
  skeletonWrap: { marginBottom: 12, gap: 10 },
  skelA: { height: 18, width: '52%' },
  skelB: { height: 12, width: '78%' },
  skelC: { height: 82, width: '100%', borderRadius: 14 },
});
