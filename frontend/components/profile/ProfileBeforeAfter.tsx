import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

type Props = {
  beforeUrl?: string;
  afterUrl?: string;
  title: string;
};

export function ProfileBeforeAfter({ beforeUrl, afterUrl, title }: Props) {
  if (!beforeUrl || !afterUrl) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Add {title.toLowerCase()} progress photos to compare oldest vs latest.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.half}>
        <Text style={styles.tag}>Before</Text>
        <Image source={{ uri: beforeUrl }} style={styles.img} />
      </View>
      <View style={styles.half}>
        <Text style={styles.tag}>After</Text>
        <Image source={{ uri: afterUrl }} style={styles.img} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  tag: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  img: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  empty: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
