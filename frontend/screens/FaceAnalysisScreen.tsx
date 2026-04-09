import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import {
  FaceAnalysisDisclaimer,
  FaceScanPreview,
  PhotoTipsCard,
} from '../components/face';
import { PrimaryButton, ScreenShell } from '../components';
import { GlowCard } from '../components/dashboard';
import { productConfig } from '../config/product';
import { buildFaceAnalysis, buildFaceInsights } from '../services/faceAnalysis';
import { fetchFaceAnalysis, type FaceAnalysisMeta } from '../services/api';
import { subscribeProgressPhotos } from '../services/progressPhotosFirestore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { colors } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'FaceAnalysis'>;

export function FaceAnalysisScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(() => buildFaceAnalysis(7));
  const [apiSource, setApiSource] = useState<'api' | 'local'>('local');
  const [apiMeta, setApiMeta] = useState<FaceAnalysisMeta | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [latestFaceUrl, setLatestFaceUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const pulse = useRef(new Animated.Value(0.9)).current;
  const goalsKey = useMemo(() => goals.join('|'), [goals]);
  const insights = useMemo(() => buildFaceInsights(analysis), [analysis]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const profile = snap.data()?.onboardingProfile as { goals?: string[] } | undefined;
      setGoals(Array.isArray(profile?.goals) ? profile.goals : []);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeProgressPhotos(user.uid, 10, (entries) => {
      const latest = entries.find((e) => e.type === 'face');
      setLatestFaceUrl(latest?.url);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!user) return;
      setLoading(true);
      try {
        const idToken = await user.getIdToken();
        const { analysis: remote, meta } = await fetchFaceAnalysis(idToken, {
          photoUrl: latestFaceUrl,
          goals,
        });
        if (!mounted) return;
        setAnalysis(remote);
        setApiMeta(meta ?? null);
        setApiSource('api');
      } catch {
        if (!mounted) return;
        setAnalysis(buildFaceAnalysis(7));
        setApiMeta(null);
        setApiSource('local');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [user, latestFaceUrl, goalsKey]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.95,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <ScreenShell
      title="Face analysis"
      subtitle={productConfig.faceAnalysis.subtitle}
    >
      <FaceAnalysisDisclaimer />

      <FaceScanPreview imageUri={latestFaceUrl} />

      {!latestFaceUrl ? (
        <PrimaryButton
          label="Add a face progress photo"
          onPress={() => navigation.navigate('ProgressPhotos')}
        />
      ) : null}

      <PhotoTipsCard />

      <GlowCard variant="cyan">
        <Text style={styles.kicker}>Overall score</Text>
        <View style={styles.scoreRow}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Text style={styles.score}>{analysis.overallScore}</Text>
          </Animated.View>
          <Text style={styles.outOf}>/ 100</Text>
          <Text style={styles.badge}>{analysis.label}</Text>
        </View>
        <Text style={styles.muted}>
          Max potential: {analysis.maxPotential}/100 · Estimated timeline:{' '}
          {analysis.timelineWeeks} weeks
        </Text>
        <Text style={styles.source}>
          Source:{' '}
          {apiSource === 'api'
            ? `API (${apiMeta?.provider ?? 'connected'})`
            : 'Local fallback model'}
        </Text>
        {apiMeta?.hasPhotoInput === false && apiSource === 'api' ? (
          <Text style={styles.hint}>
            No face image URL was sent — scores are goals-only. Add a face photo for
            tighter alignment.
          </Text>
        ) : null}
        {apiMeta?.disclaimer && apiSource === 'api' ? (
          <Text style={styles.apiDisclaimer}>{apiMeta.disclaimer}</Text>
        ) : null}
        {loading ? <Text style={styles.source}>Refreshing analysis...</Text> : null}
      </GlowCard>

      <GlowCard variant="violet">
        <Text style={styles.kicker}>Priority improvement areas</Text>
        {analysis.priorityImprovementAreas.map((area) => (
          <Text key={area} style={styles.line}>
            • {area}
          </Text>
        ))}
      </GlowCard>

      <GlowCard variant="emerald">
        <Text style={styles.kicker}>Detailed metrics</Text>
        {analysis.metrics.map((metric) => (
          <MetricRow key={metric.key} label={metric.label} score={metric.score} />
        ))}
      </GlowCard>

      <GlowCard variant="cyan">
        <Text style={styles.kicker}>Science-backed breakdown</Text>
        {insights.map((insight) => (
          <View key={insight.area} style={styles.insightBlock}>
            <Text style={styles.insightTitle}>{insight.area}</Text>
            <Text style={styles.insightText}>{insight.finding}</Text>
            <Text style={styles.insightWhy}>{insight.whyItMatters}</Text>
            {insight.actions.map((action) => (
              <Text key={action} style={styles.insightAction}>
                • {action}
              </Text>
            ))}
          </View>
        ))}
      </GlowCard>

      <PrimaryButton
        label="Open looksmax protocol"
        variant="ghost"
        onPress={() => navigation.navigate('LooksmaxProtocol')}
      />
      <PrimaryButton
        label="Open recommendations"
        variant="ghost"
        onPress={() => navigation.navigate('Recommendations')}
      />
      <PrimaryButton
        label="Legal & data"
        variant="ghost"
        onPress={() => navigation.navigate('Legal')}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  score: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  outOf: {
    color: colors.textMuted,
    fontSize: 20,
    marginLeft: 6,
    marginRight: 10,
  },
  badge: {
    color: colors.bg,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '800',
    overflow: 'hidden',
    fontSize: 12,
  },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  source: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  hint: { color: colors.warning, fontSize: 12, marginTop: 8, lineHeight: 17 },
  apiDisclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
  line: { color: colors.text, fontSize: 15, marginBottom: 8, fontWeight: '600' },
  metricRow: {
    marginBottom: 10,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  metricLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  metricScore: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  insightBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 10,
    marginTop: 10,
  },
  insightTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 4,
  },
  insightText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  insightWhy: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  insightAction: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 2,
  },
});

function MetricRow({ label, score }: { label: string; score: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: score,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [anim, score]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.metricRow}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricScore}>{score}/100</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}
