import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

type Props = {
  /** When false, no back control (e.g. root login). Default: show if stack can go back */
  showBack?: boolean;
};

/** Minimal back affordance for dark screens */
export function TopBar({ showBack }: Props) {
  const navigation = useNavigation();
  const canBack = navigation.canGoBack();
  const visible = showBack !== false && canBack;

  if (!visible) {
    return <View style={styles.spacer} />;
  }

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={12}
      style={styles.wrap}
    >
      <Text style={styles.back}>‹ Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  spacer: { height: 4 },
  wrap: { alignSelf: 'flex-start', marginBottom: 12 },
  back: { color: colors.accent, fontSize: 17, fontWeight: '600' },
});
