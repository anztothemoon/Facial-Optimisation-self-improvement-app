import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { PrimaryButton, ProgressBar, ScreenShell } from '../components';
import { ExerciseVisual } from '../components/ExerciseVisual';
import { GlowCard } from '../components/dashboard';
import {
  type ExerciseDef,
  type ExerciseRegion,
  EXERCISE_LIBRARY,
  filterExercises,
  randomSession,
  regionsForFilter,
} from '../data/exerciseLibrary';
import {
  initTimerSounds,
  playIntervalEnd,
  playSecondTick,
  unloadTimerSounds,
} from '../services/timerSounds';
import {
  computeWorkoutStreak,
  markWorkoutDone,
  subscribeWorkoutSessions,
  type WorkoutSession,
} from '../services/workoutFirestore';
import { colors } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'FaceBodyWorkouts'>;

type Mode = 'session' | 'library';

export function FaceBodyWorkoutsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [mode, setMode] = useState<Mode>('session');
  const [sessionQueue, setSessionQueue] = useState<ExerciseDef[]>(() =>
    randomSession(8)
  );
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [burst, setBurst] = useState(0);
  const [savingDone, setSavingDone] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterRegion, setFilterRegion] = useState<ExerciseRegion | 'all'>('all');
  const [search, setSearch] = useState('');
  const prevSecRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = sessionQueue[exerciseIdx];

  const filteredLibrary = useMemo(
    () => filterExercises(filterRegion, search),
    [filterRegion, search]
  );

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeWorkoutSessions(user.uid, 30, setSessions);
    return unsub;
  }, [user]);

  useEffect(() => {
    void initTimerSounds();
    return () => {
      void unloadTimerSounds();
    };
  }, []);

  useEffect(() => {
    if (!running) {
      prevSecRef.current = null;
      return;
    }
    const prev = prevSecRef.current;
    if (
      prev !== null &&
      secondsLeft < prev &&
      secondsLeft > 0
    ) {
      void playSecondTick(soundEnabled);
    }
    if (prev === 1 && secondsLeft === 0) {
      void playIntervalEnd(soundEnabled);
    }
    prevSecRef.current = secondsLeft;
  }, [secondsLeft, running, soundEnabled]);

  const clearTickInterval = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const stopTimerCompletely = useCallback(() => {
    clearTickInterval();
    setRunning(false);
    setSecondsLeft(0);
    prevSecRef.current = null;
  }, [clearTickInterval]);

  useEffect(() => {
    if (!running) return;
    clearTickInterval();
    tickIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0) return 0;
        if (prev === 1) {
          if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
          }
          setRunning(false);
          setCompletedCount((c) => c + 1);
          setBurst((b) => b + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearTickInterval();
    };
  }, [running, clearTickInterval]);

  const streak = computeWorkoutStreak(sessions);
  const progress =
    sessionQueue.length > 0
      ? (completedCount / sessionQueue.length) * 100
      : 0;

  const startCurrent = () => {
    if (!current) return;
    stopTimerCompletely();
    setSecondsLeft(current.seconds);
    setRunning(true);
  };

  const shuffleSession = useCallback(() => {
    stopTimerCompletely();
    setSessionQueue(randomSession(8));
    setExerciseIdx(0);
    setCompletedCount(0);
  }, [stopTimerCompletely]);

  const nextExercise = async () => {
    setSaveError(null);
    stopTimerCompletely();

    if (exerciseIdx < sessionQueue.length - 1) {
      setExerciseIdx((i) => i + 1);
      return;
    }
    if (user) {
      setSavingDone(true);
      try {
        await markWorkoutDone(user.uid);
      } catch {
        setSaveError('Could not save session. Try again.');
      } finally {
        setSavingDone(false);
      }
    }
    setBurst((b) => b + 1);
  };

  const addToSession = (e: ExerciseDef) => {
    stopTimerCompletely();
    setSessionQueue((q) => [...q, e]);
    setMode('session');
  };

  const replaceWithOne = (e: ExerciseDef) => {
    stopTimerCompletely();
    setSessionQueue([e]);
    setExerciseIdx(0);
    setCompletedCount(0);
    setMode('session');
  };

  return (
    <ScreenShell
      title="Face & body workouts"
      subtitle={`${EXERCISE_LIBRARY.length}+ guided drills • timers • optional ticks`}
    >
      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeChip, mode === 'session' && styles.modeChipOn]}
          onPress={() => setMode('session')}
        >
          <Text style={[styles.modeTxt, mode === 'session' && styles.modeTxtOn]}>
            Session
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeChip, mode === 'library' && styles.modeChipOn]}
          onPress={() => setMode('library')}
        >
          <Text style={[styles.modeTxt, mode === 'library' && styles.modeTxtOn]}>
            Library
          </Text>
        </Pressable>
      </View>

      <ProgressBar value={progress} label="Session completion" />
      <GlowCard variant="amber">
        <Text style={styles.kicker}>Completion streak</Text>
        <Text style={styles.streak}>{streak} day(s)</Text>
      </GlowCard>

      {mode === 'session' ? (
        <>
          <GlowCard variant="cyan">
            <Text style={styles.kicker}>
              Exercise {exerciseIdx + 1} / {sessionQueue.length || 1}
            </Text>
            {current ? (
              <>
                <ExerciseVisual
                  hint={current.visualHint}
                  active={running && secondsLeft > 0}
                  regionLabel={current.region}
                />
                <Text style={styles.exerciseName}>{current.name}</Text>
                <Text style={styles.timer}>
                  {secondsLeft > 0
                    ? `${secondsLeft}s`
                    : `${current.seconds}s`}
                </Text>
                {saveError ? <Text style={styles.err}>{saveError}</Text> : null}
                {current.steps.map((step) => (
                  <Text key={step} style={styles.step}>
                    • {step}
                  </Text>
                ))}
                <Pressable
                  style={styles.soundRow}
                  onPress={() => setSoundEnabled((s) => !s)}
                >
                  <Text style={styles.soundLabel}>
                    Timer ticks: {soundEnabled ? 'on (haptics + soft beep)' : 'haptics only'}
                  </Text>
                </Pressable>
                {running ? (
                  <PrimaryButton
                    label="Stop timer"
                    variant="ghost"
                    onPress={stopTimerCompletely}
                  />
                ) : null}
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <PrimaryButton
                      label={running ? 'Running…' : 'Start timer'}
                      onPress={startCurrent}
                      disabled={running}
                    />
                  </View>
                  <View style={styles.gap} />
                  <View style={styles.flex}>
                    <PrimaryButton
                      label={
                        exerciseIdx < sessionQueue.length - 1
                          ? 'Skip / next'
                          : 'Finish session'
                      }
                      onPress={nextExercise}
                      variant="ghost"
                      loading={savingDone}
                      disabled={savingDone}
                    />
                  </View>
                </View>
                <Text style={styles.hint}>
                  Skip stops the timer immediately. Finish saves when you complete the last move.
                </Text>
              </>
            ) : (
              <Text style={styles.step}>Load a session from Library or shuffle.</Text>
            )}
          </GlowCard>
          <PrimaryButton label="Shuffle new 8-exercise session" onPress={shuffleSession} />
          <ParticleBurst trigger={burst} />
        </>
      ) : (
        <GlowCard variant="cyan">
          <Text style={styles.kicker}>Browse {EXERCISE_LIBRARY.length} exercises</Text>
          <TextInput
            style={styles.search}
            placeholder="Search name or cue..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <View style={styles.filterWrap}>
            {regionsForFilter().map((r) => (
              <Pressable
                key={r}
                style={[
                  styles.filterChip,
                  filterRegion === r && styles.filterChipOn,
                ]}
                onPress={() => setFilterRegion(r)}
              >
                <Text
                  style={[
                    styles.filterTxt,
                    filterRegion === r && styles.filterTxtOn,
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
          {filteredLibrary.length === 0 ? (
            <Text style={styles.step}>No matches — try another filter.</Text>
          ) : (
            filteredLibrary.map((item) => (
              <View key={item.id} style={styles.libRow}>
                <Text style={styles.libEmoji}>{item.visualHint}</Text>
                <View style={styles.libMeta}>
                  <Text style={styles.libName}>{item.name}</Text>
                  <Text style={styles.libSub}>
                    {item.region} · {item.seconds}s
                  </Text>
                </View>
                <View style={styles.libBtns}>
                  <Pressable
                    style={styles.runBtn}
                    onPress={() => replaceWithOne(item)}
                  >
                    <Text style={styles.runBtnTxt}>Run</Text>
                  </Pressable>
                  <Pressable
                    style={styles.queueBtn}
                    onPress={() => addToSession(item)}
                  >
                    <Text style={styles.queueBtnTxt}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </GlowCard>
      )}

      <PrimaryButton
        label="Progress photos"
        variant="ghost"
        onPress={() => navigation.navigate('ProgressPhotos')}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  modeChipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  modeTxt: { color: colors.textMuted, fontWeight: '700' },
  modeTxtOn: { color: colors.accent },
  kicker: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
    fontSize: 12,
  },
  streak: { color: colors.warning, fontWeight: '900', fontSize: 34 },
  exerciseName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  timer: { color: colors.accent, fontSize: 40, fontWeight: '900', marginBottom: 8 },
  step: { color: colors.textMuted, fontSize: 14, marginBottom: 6 },
  row: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  flex: { flex: 1 },
  gap: { width: 10 },
  err: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  soundRow: { marginVertical: 8 },
  soundLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  search: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    marginBottom: 10,
  },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipOn: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  filterTxt: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  filterTxtOn: { color: colors.accent },
  libRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    gap: 8,
  },
  libEmoji: { fontSize: 22, width: 36 },
  libMeta: { flex: 1 },
  libName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  libSub: { color: colors.textMuted, fontSize: 12 },
  libBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  runBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  runBtnTxt: { color: colors.bg, fontWeight: '800', fontSize: 13 },
  queueBtn: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  queueBtnTxt: { color: colors.accent, fontWeight: '900', fontSize: 16 },
  burstWrap: {
    height: 90,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  burstText: { color: colors.success, fontWeight: '800', fontSize: 14 },
});

function ParticleBurst({ trigger }: { trigger: number }) {
  const particles = useRef(
    Array.from({ length: 16 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      o: new Animated.Value(0),
      s: new Animated.Value(0.4),
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p, idx) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.o.setValue(1);
      p.s.setValue(0.6);
      const angle = (Math.PI * 2 * idx) / particles.length;
      const radius = 30 + (idx % 4) * 10;
      Animated.parallel([
        Animated.timing(p.x, {
          toValue: Math.cos(angle) * radius,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: Math.sin(angle) * radius - 8,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(p.o, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(p.s, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [trigger, particles]);

  return (
    <View style={styles.burstWrap}>
      {particles.map((p, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.burstParticle,
            {
              opacity: p.o,
              transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.s }],
            },
          ]}
        />
      ))}
      <Text style={styles.burstText}>Milestone unlocked</Text>
    </View>
  );
}
