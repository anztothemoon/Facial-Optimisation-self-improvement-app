import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { saveOnboardingProfile } from '../../services/onboardingFirestore';
import { uploadOnboardingPhoto } from '../../services/uploadOnboardingPhotos';
import { colors } from '../../theme';
import type { OnboardingProfile } from '../../types/onboardingProfile';
import {
  BODY_TYPES,
  FACE_STRUCTURES,
  FITNESS_LEVELS,
  GOALS,
  ONBOARDING_STEPS,
} from '../../types/onboardingProfile';
import { Chip } from '../Chip';
import { PrimaryButton } from '../PrimaryButton';
import { ProgressBar } from '../ProgressBar';
import { SurfaceCard } from '../SurfaceCard';

const STEP_LABELS = ['Age', 'Height', 'Weight', 'Body type', 'Fitness level', 'Goals', 'Face structure', 'Face scan'];
const SCAN_ANGLES = ['front', 'left', 'right'] as const;
type ScanAngle = (typeof SCAN_ANGLES)[number];
type ScanShot = { uri: string; angle: ScanAngle };

function hasAllScanAngles(shots: ScanShot[]): boolean {
  const got = new Set(shots.map((s) => s.angle));
  return SCAN_ANGLES.every((a) => got.has(a));
}
const emptyProfile = (): OnboardingProfile => ({
  age: null,
  heightCm: null,
  weightKg: null,
  bodyType: null,
  fitnessLevel: null,
  goals: [],
  faceStructure: null,
  startingPhotoUrls: [],
});

function validateStep(
  step: number,
  p: OnboardingProfile,
  shots: ScanShot[],
  devBypassEnabled: boolean
): string | null {
  if (step === 0 && (p.age == null || p.age < 13 || p.age > 120)) return 'Enter a valid age (13-120).';
  if (step === 1 && (p.heightCm == null || p.heightCm < 100 || p.heightCm > 250)) return 'Enter height in cm (100-250).';
  if (step === 2 && (p.weightKg == null || p.weightKg < 30 || p.weightKg > 300)) return 'Enter weight in kg (30-300).';
  if (step === 3 && !p.bodyType) return 'Select your body type.';
  if (step === 4 && !p.fitnessLevel) return 'Select your fitness level.';
  if (step === 5 && p.goals.length === 0) return 'Pick at least one goal.';
  if (step === 6 && !p.faceStructure) return 'Select a face structure.';
  if (step === 7) {
    if (__DEV__ && devBypassEnabled) return null;
    if (!hasAllScanAngles(shots)) {
      return __DEV__
        ? 'Capture front, left, and right angles (or enable dev bypass).'
        : 'Capture front, left, and right angles.';
    }
  }
  return null;
}

export function OnboardingWizard() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(emptyProfile);
  const [shots, setShots] = useState<ScanShot[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [devBypassEnabled, setDevBypassEnabled] = useState(false);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView> | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const animateStep = useCallback((next: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -10, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      next();
      translateY.setValue(10);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  }, [opacity, translateY]);

  const goNext = async () => {
    setErr(null);
    const e = validateStep(step, profile, shots, devBypassEnabled);
    if (e) return setErr(e);
    if (!uid) return setErr('You must be signed in.');

    if (step === ONBOARDING_STEPS - 1) {
      setBusy(true);
      try {
        const urls: string[] = [];
        const meta: Array<{ angle: ScanAngle; url: string }> = [];
        for (let i = 0; i < shots.length; i++) {
          const url = await uploadOnboardingPhoto(uid, shots[i].uri, i, shots[i].angle);
          urls.push(url);
          meta.push({ angle: shots[i].angle, url });
        }
        await saveOnboardingProfile(uid, { startingPhotoUrls: urls, startingPhotoMeta: meta }, { markComplete: true });
      } catch (x) {
        setErr(x instanceof Error ? x.message : 'Could not save scan.');
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      if (step === 0) await saveOnboardingProfile(uid, { age: profile.age });
      if (step === 1) await saveOnboardingProfile(uid, { heightCm: profile.heightCm });
      if (step === 2) await saveOnboardingProfile(uid, { weightKg: profile.weightKg });
      if (step === 3) await saveOnboardingProfile(uid, { bodyType: profile.bodyType });
      if (step === 4) await saveOnboardingProfile(uid, { fitnessLevel: profile.fitnessLevel });
      if (step === 5) await saveOnboardingProfile(uid, { goals: profile.goals });
      if (step === 6) await saveOnboardingProfile(uid, { faceStructure: profile.faceStructure });
      animateStep(() => setStep((s) => s + 1));
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const startScanner = async () => {
    const granted = camPerm?.granted ?? (await requestCamPerm()).granted;
    if (!granted) {
      Alert.alert('Camera permission required', 'Face scan is camera-only. Please allow camera access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ...( __DEV__
          ? [
              {
                text: 'Use dev bypass',
                onPress: () => {
                  setDevBypassEnabled(true);
                  setErr(null);
                },
              },
            ]
          : []),
      ]);
      return;
    }
    setScanIndex(Math.min(shots.length, 2));
    setShowScanner(true);
  };

  const capture = async () => {
    if (!cameraRef.current) return;
    let n = 3;
    setCountdown(n);
    const timer = setInterval(() => {
      n -= 1;
      setCountdown(n > 0 ? n : null);
      if (n <= 0) clearInterval(timer);
    }, 650);
    await new Promise((r) => setTimeout(r, 2100));
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) throw new Error('No image');
      setShots((prev) => {
        const next = [...prev];
        next[scanIndex] = { uri: photo.uri, angle: SCAN_ANGLES[scanIndex] };
        return next.slice(0, 3);
      });
      if (scanIndex >= 2) {
        setShowScanner(false);
        setScanIndex(0);
      } else {
        setScanIndex((s) => s + 1);
      }
    } catch {
      Alert.alert('Capture failed', 'Please try that angle again.');
    }
  };

  const toggleGoal = (g: string) =>
    setProfile((p) => ({ ...p, goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g] }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            {step > 0 ? <Pressable onPress={() => animateStep(() => setStep((s) => s - 1))}><Text style={styles.back}>‹ Back</Text></Pressable> : <View />}
            <Text style={styles.meta}>{`Step ${step + 1} of ${ONBOARDING_STEPS}`}</Text>
            <View />
          </View>
          <ProgressBar value={((step + 1) / ONBOARDING_STEPS) * 100} label={STEP_LABELS[step]} />
          <Text style={styles.title}>{STEP_LABELS[step]}</Text>
          {err ? <Text style={styles.error}>{err}</Text> : null}
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {step === 0 ? <SurfaceCard title="How old are you?"><TextInput style={styles.input} keyboardType="number-pad" value={profile.age ? String(profile.age) : ''} onChangeText={(t) => setProfile((p) => ({ ...p, age: t ? Number(t.replace(/[^0-9]/g, '')) : null }))} /></SurfaceCard> : null}
            {step === 1 ? <SurfaceCard title="Height (cm)"><TextInput style={styles.input} keyboardType="decimal-pad" value={profile.heightCm ? String(profile.heightCm) : ''} onChangeText={(t) => setProfile((p) => ({ ...p, heightCm: t ? Number(t.replace(/[^0-9.]/g, '')) : null }))} /></SurfaceCard> : null}
            {step === 2 ? <SurfaceCard title="Weight (kg)"><TextInput style={styles.input} keyboardType="decimal-pad" value={profile.weightKg ? String(profile.weightKg) : ''} onChangeText={(t) => setProfile((p) => ({ ...p, weightKg: t ? Number(t.replace(/[^0-9.]/g, '')) : null }))} /></SurfaceCard> : null}
            {step === 3 ? <SurfaceCard title="Body type"><View style={styles.wrap}>{BODY_TYPES.map((x) => <Chip key={x} label={x} selected={profile.bodyType === x} onPress={() => setProfile((p) => ({ ...p, bodyType: x }))} />)}</View></SurfaceCard> : null}
            {step === 4 ? <SurfaceCard title="Fitness level"><View style={styles.wrap}>{FITNESS_LEVELS.map((x) => <Chip key={x} label={x} selected={profile.fitnessLevel === x} onPress={() => setProfile((p) => ({ ...p, fitnessLevel: x }))} />)}</View></SurfaceCard> : null}
            {step === 5 ? <SurfaceCard title="Goals"><View style={styles.wrap}>{GOALS.map((x) => <Chip key={x} label={x} selected={profile.goals.includes(x)} onPress={() => toggleGoal(x)} />)}</View></SurfaceCard> : null}
            {step === 6 ? <SurfaceCard title="Face structure"><View style={styles.wrap}>{FACE_STRUCTURES.map((x) => <Chip key={x} label={x} selected={profile.faceStructure === x} onPress={() => setProfile((p) => ({ ...p, faceStructure: x }))} />)}</View></SurfaceCard> : null}
            {step === 7 ? (
              <SurfaceCard title="Guided face scan (in-app camera only)">
                <Text style={styles.hint}>
                  Capture front, left, and right angles. Camera-roll upload is disabled for consistency. Photos are used
                  for progress and wellness-style insights in the app — not for bank-grade identity verification.
                </Text>
                {__DEV__ ? (
                  <PrimaryButton
                    label={devBypassEnabled ? 'Dev bypass enabled' : 'Enable dev bypass (no camera)'}
                    variant="ghost"
                    onPress={() => setDevBypassEnabled((v) => !v)}
                    style={styles.devBypassBtn}
                  />
                ) : null}
                <PrimaryButton label={shots.length ? 'Continue guided scan' : 'Start guided scan'} onPress={startScanner} />
                <View style={styles.row}>
                  {shots.map((s) => (
                    <View key={s.uri} style={styles.thumbWrap}>
                      <Image source={{ uri: s.uri }} style={styles.thumb} />
                      <Text style={styles.badge}>{s.angle.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </SurfaceCard>
            ) : null}
          </Animated.View>
          <PrimaryButton label={step === ONBOARDING_STEPS - 1 ? 'Continue to unlock results' : 'Next'} onPress={goNext} loading={busy} disabled={busy} />
        </ScrollView>

        {showScanner ? (
          <View style={styles.overlay}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="front"
              mode="picture"
            />
            <View style={styles.mask}>
              <View style={styles.guide} />
              <Text style={styles.overlayText}>{`Angle ${scanIndex + 1}/3: ${SCAN_ANGLES[scanIndex]}`}</Text>
              <Text style={styles.overlayHint}>
                Frame your face in the guide, then tap Capture. Use good, even lighting.
              </Text>
              {countdown ? <Text style={styles.count}>{countdown}</Text> : null}
              <PrimaryButton
                label={countdown ? 'Capturing...' : 'Capture'}
                onPress={capture}
                disabled={Boolean(countdown)}
              />
              <PrimaryButton label="Close" variant="ghost" onPress={() => { setShowScanner(false); setCountdown(null); }} />
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  back: { color: colors.accent, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginBottom: 10 },
  error: { color: colors.danger, marginBottom: 8 },
  input: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 12, color: colors.text, padding: 12, fontSize: 18, fontWeight: '700' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  hint: { color: colors.textMuted, marginBottom: 10, lineHeight: 20 },
  devBypassBtn: { marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 90, height: 120, borderRadius: 10, backgroundColor: colors.bgElevated },
  badge: { position: 'absolute', left: 6, bottom: 6, color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  mask: { flex: 1, justifyContent: 'flex-end', padding: 20, gap: 8, backgroundColor: 'rgba(0,0,0,0.35)' },
  guide: { position: 'absolute', top: '18%', left: '14%', width: '72%', height: 320, borderRadius: 999, borderWidth: 3, borderColor: colors.accent, borderStyle: 'dashed' },
  overlayText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
  overlayHint: { color: '#dbeafe', textAlign: 'center', marginBottom: 4 },
  count: { color: '#fff', textAlign: 'center', fontSize: 42, fontWeight: '900' },
});

