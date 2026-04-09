import React from 'react';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { useAuth } from '../contexts/AuthContext';
import { MainNavigator } from './MainNavigator';
import { OnboardingGateNavigator } from './OnboardingGateNavigator';
import { RevealGateNavigator } from './RevealGateNavigator';
import { colors } from '../theme';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.surfaceBorder,
    notification: colors.accent,
  },
};

export function RootNavigator() {
  const { user, ready, wizardFirestoreComplete, subscribed } = useAuth();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <AuthNavigator />
      ) : !wizardFirestoreComplete ? (
        <OnboardingGateNavigator />
      ) : !subscribed ? (
        <RevealGateNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
