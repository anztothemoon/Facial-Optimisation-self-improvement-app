import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

/** Primary CTA with gradient fill and soft glow (premium paywall). */
export function PremiumButton({
  label,
  onPress,
  disabled,
  loading,
  style,
}: Props) {
  const dim = disabled || loading;
  return (
    <View style={[styles.shadowWrap, style]}>
      <Pressable
        onPress={onPress}
        disabled={dim}
        style={({ pressed }) => [
          styles.pressable,
          pressed && !dim && styles.pressed,
          dim && styles.dimmed,
        ]}
      >
        <LinearGradient
          colors={['#22d3ee', '#38bdf8', '#818cf8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#0b0f17" />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  label: {
    color: '#0b0f17',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  pressed: { opacity: 0.92 },
  dimmed: { opacity: 0.45 },
});
