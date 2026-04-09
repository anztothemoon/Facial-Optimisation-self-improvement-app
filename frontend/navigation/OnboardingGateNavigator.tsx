import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { OnboardingStackParamList } from './types';
import { OnboardingScreen } from '../screens';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/** Only onboarding — no access to paywall/main until wizard completes (Firestore). */
export function OnboardingGateNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
