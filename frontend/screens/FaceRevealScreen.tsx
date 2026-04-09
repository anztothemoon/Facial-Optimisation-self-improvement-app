import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, onSnapshot } from 'firebase/firestore';
import type { RevealStackParamList } from '../navigation/types';
import type { OnboardingProfile } from '../types/onboardingProfile';
import { useAuth } from '../contexts/AuthContext';
import { GlassPanel, PrimaryButton, ScreenShell } from '../components';
import { db } from '../services/firebase';
import { fetchFaceAnalysis, type DetailedPreview } from '../services/api';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RevealStackParamList, 'FaceReveal'>;

function pickOnboardingFaceUrl(profile: OnboardingProfile | undefined): string | undefined {
  const meta = profile?.startingPhotoMeta;
  if (Array.isArray(meta)) {
    const front = meta.find((m) => m.angle === 'front');
    if (front?.url?.trim()) return front.url.trim();
  }
  const urls = profile?.startingPhotoUrls;
  if (Array.isArray(urls)) {
    const first = urls.find((u) => String(u).trim());
    if (first) return String(first).trim();
  }
  return undefined;
}

export function FaceRevealScreen({ navigation }: Props) {
  const { user, subscribed } = useAuth();
  const [goals, setGoals] = useState<string[]>([]);
  const [faceUrl, setFaceUrl] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<DetailedPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const raw = snap.data()?.onboardingProfile as OnboardingProfile | undefined;
      setGoals(Array.isArray(raw?.goals) ? raw.goals : []);
      setFaceUrl(pickOnboardingFaceUrl(raw));
    });
    return unsub;
  }, [user]);

  const goalsKey = useMemo(() => goals.join('|'), [goals]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user) return;
      if (subscribed) {
        if (!cancelled) setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const idToken = await user.getIdToken();
        const photoUrl = faceUrl;
        if (!photoUrl) {
          if (!cancelled) {
            setPreview(null);
            setError(
              'No onboarding face photo found. Complete the face scan in onboarding or try again after your profile syncs.'
            );
            setLoading(false);
          }
          return;
        }
        const { detailedPreview } = await fetchFaceAnalysis(idToken, {
          photoUrl,
          goals,
        });
        if (!cancelled) {
          setPreview(detailedPreview ?? null);
          if (!detailedPreview) {
            setError('Analysis did not include a preview. Pull to refresh after a moment.');
          }
        }
      } catch (e) {
        if (!cancelled) {
          setPreview(null);
          setError(e instanceof Error ? e.message : 'Could not load analysis.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user, faceUrl, goalsKey, subscribed]);

  const topStrengths = preview?.strengths?.slice(0, 3) ?? [];

  return (
    <ScreenShell
      title="Your face analysis"
      subtitle="Preview your results — unlock for the full regional breakdown."
      showBack={false}
    >
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Analyzing your scan…</Text>
        </View>
      ) : null}

      {!loading && error && !preview ? (
        <GlassPanel style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton
            label="Unlock full analysis"
            onPress={() => navigation.navigate('Paywall')}
          />
        </GlassPanel>
      ) : null}

      {!loading && preview ? (
        <>
          <GlassPanel style={styles.card}>
            <Text style={styles.headline}>{preview.headline}</Text>
            <Text style={styles.summary}>{preview.summary}</Text>
            {topStrengths.length > 0 ? (
              <View style={styles.strengthBlock}>
                <Text style={styles.sectionLabel}>Top strengths</Text>
                {topStrengths.map((s) => (
                  <Text key={s.key} style={styles.strengthLine}>
                    • {s.label} — {s.score}/100
                  </Text>
                ))}
              </View>
            ) : null}
          </GlassPanel>

          <View style={styles.lockSection}>
            <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.lockInner}>
              <Text style={styles.lockTitle}>Full regional breakdown</Text>
              <Text style={styles.lockCopy}>
                Jawline, eyes, symmetry, and more — unlocked with Premium.
              </Text>
              <View style={styles.metricBlurWrap} pointerEvents="none">
                {(preview.metricTable ?? []).slice(0, 6).map((row) => (
                  <Text key={row.key} style={styles.metricGhost}>
                    {row.label}: {row.score} ({row.band})
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {error ? <Text style={styles.warn}>{error}</Text> : null}

          <PrimaryButton
            label="Unlock full analysis"
            onPress={() => navigation.navigate('Paywall')}
          />
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
  },
  headline: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  summary: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  sectionLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  strengthBlock: {
    marginTop: 4,
  },
  strengthLine: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  lockSection: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    marginBottom: 16,
    minHeight: 140,
  },
  lockInner: {
    padding: 14,
  },
  lockTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  lockCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  metricBlurWrap: {
    opacity: 0.45,
  },
  metricGhost: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  warn: {
    color: colors.warning,
    fontSize: 12,
    marginBottom: 10,
  },
});
