import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { productConfig } from '../../config/product';
import { colors } from '../../theme';

export function PhotoTipsCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Consistent face capture tips</Text>
      {productConfig.faceAnalysis.photoTips.map((tip) => (
        <Text key={tip} style={styles.line}>
          • {tip}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 8,
  },
  line: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});
