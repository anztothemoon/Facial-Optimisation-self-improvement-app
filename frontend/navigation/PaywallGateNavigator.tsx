import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { PaywallStackParamList } from './types';
import { PaywallScreen } from '../screens';

const Stack = createNativeStackNavigator<PaywallStackParamList>();

/** Subscription required — single screen, no back to main app. */
export function PaywallGateNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Paywall"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.bg },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Paywall" component={PaywallScreen} />
    </Stack.Navigator>
  );
}
