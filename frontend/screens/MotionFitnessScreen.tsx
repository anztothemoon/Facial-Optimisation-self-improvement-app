import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Accelerometer,
  DeviceMotion,
  Gyroscope,
  Pedometer,
} from 'expo-sensors';
import type { MainStackParamList } from '../navigation/types';
import { GlassPanel, PrimaryButton, ScreenShell } from '../components';
import { colors } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'MotionFitness'>;

function magnitude(x: number, y: number, z: number) {
  return Math.sqrt(x * x + y * y + z * z);
}

export function MotionFitnessScreen({ navigation }: Props) {
  const [pedoAvailable, setPedoAvailable] = useState<boolean | null>(null);
  const [stepsToday, setStepsToday] = useState<number | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const [motionOn, setMotionOn] = useState(false);
  const [accelMag, setAccelMag] = useState(0);
  const [gyroMag, setGyroMag] = useState(0);
  const [deviceTilt, setDeviceTilt] = useState<string>('—');

  const refreshSteps = useCallback(async () => {
    setStepError(null);
    try {
      const avail = await Pedometer.isAvailableAsync();
      setPedoAvailable(avail);
      if (!avail) {
        setStepsToday(null);
        setStepError(
          Platform.OS === 'ios'
            ? 'Motion & Fitness not available (try a real iPhone, not all simulators).'
            : 'Step sensor not available on this device.'
        );
        return;
      }
      const perm = await Pedometer.requestPermissionsAsync();
      if (!perm.granted) {
        setStepError('Allow motion access in Settings to see steps.');
        setStepsToday(null);
        return;
      }
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      if (Platform.OS === 'android') {
        setStepsToday(0);
        setStepError(null);
        return;
      }
      const { steps } = await Pedometer.getStepCountAsync(start, end);
      setStepsToday(steps);
    } catch (e) {
      setStepError(e instanceof Error ? e.message : 'Could not read steps.');
      setStepsToday(null);
    }
  }, []);

  useEffect(() => {
    void refreshSteps();
  }, [refreshSteps]);

  useEffect(() => {
    let subStep: { remove: () => void } | undefined;
    let subAccel: { remove: () => void } | undefined;
    let subGyro: { remove: () => void } | undefined;
    let subMotion: { remove: () => void } | undefined;

    if (!motionOn) {
      return () => undefined;
    }

    void (async () => {
      try {
        await DeviceMotion.requestPermissionsAsync?.();
      } catch {
        /* optional on some platforms */
      }
    })();

    Accelerometer.setUpdateInterval(120);
    Gyroscope.setUpdateInterval(120);
    DeviceMotion.setUpdateInterval(120);

    subAccel = Accelerometer.addListener((a) => {
      setAccelMag(magnitude(a.x, a.y, a.z));
    });
    subGyro = Gyroscope.addListener((g) => {
      setGyroMag(magnitude(g.x, g.y, g.z));
    });
    subMotion = DeviceMotion.addListener((dm) => {
      const q = dm.rotation;
      if (q) {
        const betaDeg = (q.beta * 180) / Math.PI;
        const gammaDeg = (q.gamma * 180) / Math.PI;
        setDeviceTilt(`tilt β ${betaDeg.toFixed(0)}° · γ ${gammaDeg.toFixed(0)}°`);
      }
    });

    void (async () => {
      try {
        const avail = await Pedometer.isAvailableAsync();
        if (!avail) return;
        const perm = await Pedometer.getPermissionsAsync();
        if (!perm.granted) return;
        subStep = Pedometer.watchStepCount((result) => {
          setStepsToday(result.steps);
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      subAccel?.remove();
      subGyro?.remove();
      subMotion?.remove();
      subStep?.remove();
    };
  }, [motionOn]);

  return (
    <ScreenShell
      title="Motion & fitness"
      subtitle="Phone sensors in Expo Go — Apple Watch needs a native build."
      showBack
    >
      <GlassPanel style={styles.card}>
        <Text style={styles.kicker}>Today</Text>
        <Text style={styles.bigNum}>
          {stepsToday != null ? stepsToday.toLocaleString() : '—'}
        </Text>
        <Text style={styles.unit}>steps (device)</Text>
        {stepError ? <Text style={styles.warn}>{stepError}</Text> : null}
        {Platform.OS === 'android' && pedoAvailable ? (
          <Text style={styles.muted}>
            On Android in Expo Go, turn on Live sensors below — step stream updates live (today’s
            total query is limited vs iOS).
          </Text>
        ) : null}
        {pedoAvailable === false ? (
          <Text style={styles.muted}>
            Use a physical device for real step data. Simulators often report zero.
          </Text>
        ) : null}
        <PrimaryButton label="Refresh steps" variant="ghost" onPress={() => void refreshSteps()} />
      </GlassPanel>

      <View style={styles.row}>
        <Text style={styles.label}>Live sensors</Text>
        <Switch
          value={motionOn}
          onValueChange={setMotionOn}
          trackColor={{ false: colors.surface, true: colors.accentMuted }}
          thumbColor={motionOn ? colors.accent : colors.textMuted}
        />
      </View>
      <Text style={styles.hint}>
        Accelerometer, gyroscope, and device motion update while enabled. Turn off to save battery.
      </Text>

      {motionOn ? (
        <GlassPanel style={styles.card}>
          <Text style={styles.metric}>Accel magnitude: {accelMag.toFixed(2)} g</Text>
          <Text style={styles.metric}>Gyro magnitude: {gyroMag.toFixed(2)} rad/s</Text>
          <Text style={styles.metric}>Orientation: {deviceTilt}</Text>
        </GlassPanel>
      ) : null}

      <GlassPanel style={styles.card}>
        <Text style={styles.kicker}>Apple Watch</Text>
        <Text style={styles.p}>
          Expo Go cannot install a watchOS app. A production Watch companion uses HealthKit /
          WatchConnectivity, a separate watch target, and an EAS Build or Xcode — not the Expo Go
          client.
        </Text>
        <Text style={styles.p}>
          Next step when you pay for Apple Developer: add a development build (expo-dev-client),
          then native watch module or a bridge to sync workouts from the Watch to this app.
        </Text>
        <PrimaryButton
          label="Back to workouts"
          variant="ghost"
          onPress={() => navigation.navigate('FaceBodyWorkouts')}
        />
      </GlassPanel>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  kicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bigNum: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  unit: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  warn: { color: colors.warning, fontSize: 13, marginBottom: 8 },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: colors.text, fontWeight: '700', fontSize: 16 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  metric: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  p: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
});
