import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

type Point = { label: string; value: number };

type Props = {
  data: Point[];
};

/** Last 7 weight check-ins (kg) */
export function WeightMiniGraph({ data }: Props) {
  const vals = data.map((d) => d.value).filter((v) => v > 0);
  const max = Math.max(...vals, 1);
  const min = vals.length ? Math.min(...vals) : 0;
  const span = Math.max(max - min, 0.1);

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {data.map((item) => {
          const h = item.value > 0 ? ((item.value - min) / span) * 88 + 12 : 4;
          return (
            <View key={item.label} style={styles.col}>
              <View style={[styles.bar, { height: Math.max(8, h) }]} />
              <Text style={styles.day}>{item.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>Weight trend (kg)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 110,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingBottom: 8,
  },
  col: { flex: 1, alignItems: 'center' },
  bar: {
    width: 14,
    borderRadius: 999,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  day: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
});
