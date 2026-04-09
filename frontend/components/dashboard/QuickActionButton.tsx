import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

type Props = {
  icon: string;
  label: string;
  onPress: () => void;
};

/** Compact glowing action chip for the dashboard row. */
export function QuickActionButton({ icon, label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={styles.shadow}>
        <LinearGradient
          colors={['rgba(56, 189, 248, 0.35)', 'rgba(99, 102, 241, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  shadow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  icon: {
    fontSize: 26,
    marginBottom: 6,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
});
