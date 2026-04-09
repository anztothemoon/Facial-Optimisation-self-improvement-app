import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

type Point = {
  label: string;
  value: number;
};

type Props = {
  data: Point[];
  target: number;
};

export function WeeklyProgressGraph({ data, target }: Props) {
  const maxData = data.reduce((acc, p) => Math.max(acc, p.value), 0);
  const max = Math.max(maxData, target, 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {data.map((item) => {
          const ratio = item.value / max;
          const height = Math.max(8, Math.round(ratio * 96));
          const nearTarget = target > 0 && Math.abs(item.value - target) / target < 0.12;

          return (
            <View key={item.label} style={styles.col}>
              <View
                style={[
                  styles.bar,
                  { height },
                  nearTarget ? styles.barNearTarget : null,
                ]}
              />
              <Text style={styles.day}>{item.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>Goal line: {target.toLocaleString()} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 120,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingBottom: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 16,
    borderRadius: 999,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 2,
  },
  barNearTarget: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  day: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
});
