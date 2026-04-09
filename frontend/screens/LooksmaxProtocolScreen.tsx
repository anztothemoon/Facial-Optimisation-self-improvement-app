import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { ScreenShell } from '../components/ScreenShell';
import { GlowCard } from '../components/dashboard';
import { ProgressBar } from '../components/ProgressBar';
import { colors } from '../theme';
import { buildFaceAnalysis } from '../services/faceAnalysis';

type Props = NativeStackScreenProps<MainStackParamList, 'LooksmaxProtocol'>;

const CHECKLIST = [
  'Morning daylight + hydration within 30 min of waking',
  'Protein target hit (>=1.6g/kg bodyweight)',
  '10 min posture/jaw-neck mobility sequence',
  'No high-sodium late-night meal',
  'AM SPF + PM cleanser/moisturizer',
  'Strength training or conditioning session',
  'Sleep window protected (7.5h+)',
];

export function LooksmaxProtocolScreen(_props: Props) {
  const current = useMemo(() => buildFaceAnalysis(9), []);
  const baseline = useMemo(() => buildFaceAnalysis(3), []);
  const deltas = current.metrics.map((m) => {
    const b = baseline.metrics.find((x) => x.key === m.key)?.score ?? m.score;
    return { label: m.label, delta: m.score - b };
  });
  const done = 3;
  const pct = (done / CHECKLIST.length) * 100;

  return (
    <ScreenShell
      title="Looksmax Protocol"
      subtitle="Weekly execution dashboard with score deltas and high-leverage actions."
    >
      <GlowCard variant="cyan">
        <Text style={styles.title}>Weekly execution</Text>
        <ProgressBar value={pct} label={`${done}/${CHECKLIST.length} habits complete`} />
        <View style={styles.list}>
          {CHECKLIST.map((item, idx) => (
            <Pressable key={item} style={styles.row}>
              <View style={[styles.box, idx < done && styles.boxDone]}>
                <Text style={styles.tick}>{idx < done ? '✓' : ''}</Text>
              </View>
              <Text style={styles.item}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </GlowCard>

      <GlowCard variant="violet">
        <Text style={styles.title}>Score deltas vs baseline</Text>
        {deltas.map((d) => (
          <View key={d.label} style={styles.deltaRow}>
            <Text style={styles.deltaLabel}>{d.label}</Text>
            <Text style={[styles.deltaValue, d.delta >= 0 ? styles.up : styles.down]}>
              {d.delta >= 0 ? '+' : ''}
              {d.delta}
            </Text>
          </View>
        ))}
      </GlowCard>

      <GlowCard variant="emerald">
        <Text style={styles.title}>High-leverage protocol</Text>
        <Text style={styles.note}>- Keep scan angles/lighting constant weekly.</Text>
        <Text style={styles.note}>- Cut liquid calories and late sodium to de-bloat lower face.</Text>
        <Text style={styles.note}>- Progressive overload + sufficient protein preserves facial definition during fat loss.</Text>
        <Text style={styles.note}>- Sleep regularity is a top predictor of eye-area quality.</Text>
      </GlowCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontWeight: '800', fontSize: 17, marginBottom: 10 },
  list: { marginTop: 8, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { borderColor: colors.accent, backgroundColor: colors.accent },
  tick: { color: colors.bg, fontSize: 11, fontWeight: '900' },
  item: { color: colors.textMuted, fontSize: 13, flex: 1 },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 8,
    marginTop: 8,
  },
  deltaLabel: { color: colors.text, fontWeight: '600' },
  deltaValue: { fontWeight: '800' },
  up: { color: colors.success },
  down: { color: colors.danger },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 5 },
});

